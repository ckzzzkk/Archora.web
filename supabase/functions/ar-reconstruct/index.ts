import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { checkQuota } from '../_shared/quota.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { logAudit, extractRequestMeta } from '../_shared/audit.ts';

// Mirrors BlueprintData Vector3D
interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface Wall {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  thickness: number;
  height: number;
  texture: string;
}

interface Room {
  id: string;
  name: string;
  type: string;
  wallIds: string[];
  floorMaterial: string;
  ceilingHeight: number;
  ceilingType: string;
  area: number;
  centroid: { x: number; y: number };
}

const RequestSchema = z.object({
  frameUrls: z.array(z.string().url()).min(1).max(30).optional(),
  meshVertices: z.array(z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  })).optional(),
  meshFaces: z.array(z.array(z.number().int().nonnegative())).optional(),
});

interface RoboflowDetection {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

async function runRoboflowDetection(imageUrl: string): Promise<RoboflowDetection[]> {
  const apiKey = Deno.env.get('ROBOFLOW_API_KEY');
  const modelId = Deno.env.get('ROBOFLOW_MODEL_ID') ?? 'room-objects/1';
  const url = `https://detect.roboflow.com/${modelId}?api_key=${apiKey}&image=${encodeURIComponent(imageUrl)}`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json() as { predictions?: RoboflowDetection[] };
  return data.predictions ?? [];
}

async function requestMeshyReconstruction(frameUrls: string[]): Promise<string> {
  const apiKey = Deno.env.get('MESHY_API_KEY');
  const response = await fetch('https://api.meshy.ai/v1/image-to-3d', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ image_urls: frameUrls, mode: 'preview' }),
  });

  if (!response.ok) throw new Error('Meshy API error');
  const data = await response.json() as { result: string };
  return data.result; // task ID
}

// Simple UUID-like ID generator (no external dependency)
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Snap to 0.05m grid (matches blueprintStore grid)
function snapToGrid(v: number): number {
  return Math.round(v / 0.05) * 0.05;
}

// ARCore Y-up right-hand → Blueprint top-down: Blueprint_Y = -ARCore_Z
function toBlueprint2D(v: Vector3D): { x: number; y: number } {
  return { x: snapToGrid(v.x), y: snapToGrid(-v.z) };
}

// Process LiDAR mesh: extract axis-aligned walls by analyzing triangle normals
// and finding vertical surfaces within the wall height band.
function processMeshToBlueprint(
  vertices: Vector3D[],
  faces: number[][],
): {
  walls: Wall[];
  rooms: Room[];
  dimensions: { width: number; height: number; depth: number };
} {
  if (vertices.length === 0 || faces.length === 0) {
    return { walls: [], rooms: [], dimensions: { width: 0, height: 0, depth: 0 } };
  }

  // Compute bounding box
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (const v of vertices) {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
    if (v.z < minZ) minZ = v.z;
    if (v.z > maxZ) maxZ = v.z;
  }

  const width = snapToGrid(maxX - minX);
  const depth = snapToGrid(maxZ - minZ);
  const roomHeight = snapToGrid(maxY - minY);

  // Collect vertical wall boundary edges (edge shared with floor/ceiling, or on mesh boundary)
  // Simple approach: collect all unique horizontal edges at wall height band
  const yMinThresh = minY + (maxY - minY) * 0.05;
  const yMaxThresh = maxY - (maxY - minY) * 0.05;

  // Collect all horizontal-ish edges (both endpoints at similar Y within wall band)
  interface Edge { p1: Vector3D; p2: Vector3D }
  const wallEdges: Edge[] = [];

  for (const face of faces) {
    if (face.length < 3) continue;
    const v0 = vertices[face[0]];
    const v1 = vertices[face[1]];
    const v2 = vertices[face[2]];

    // Skip floor/ceiling triangles (all verts near minY or maxY)
    const allNearMin = [v0, v1, v2].every((v) => Math.abs(v.y - minY) < 0.3);
    const allNearMax = [v0, v1, v2].every((v) => Math.abs(v.y - maxY) < 0.3);
    if (allNearMin || allNearMax) continue;

    // Compute face normal
    const ax = v1.x - v0.x, ay = v1.y - v0.y, az = v1.z - v0.z;
    const bx = v2.x - v0.x, by = v2.y - v0.y, bz = v2.z - v0.z;
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;
    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (nLen === 0) continue;

    // Is face vertical? (normal's Y component is small relative to X/Z)
    if (Math.abs(ny) / nLen >= 0.3) continue;

    // Is face in wall height band?
    const avgY = (v0.y + v1.y + v2.y) / 3;
    if (avgY < yMinThresh || avgY > yMaxThresh) continue;

    // Extract 3 edges of this wall triangle
    const triEdges: [number, number, number][] = [[face[0], face[1]], [face[1], face[2]], [face[2], face[0]]];
    for (const [i, j] of triEdges) {
      const vi = vertices[i];
      const vj = vertices[j];
      // Only keep edges that are mostly horizontal (Y difference small)
      if (Math.abs(vi.y - vj.y) < 0.2) {
        wallEdges.push(vi.y <= vj.y
          ? { p1: { x: vi.x, y: vi.y, z: vi.z }, p2: { x: vj.x, y: vj.y, z: vj.z } }
          : { p1: { x: vj.x, y: vj.y, z: vj.z }, p2: { x: vi.x, y: vi.y, z: vi.z } });
      }
    }
  }

  // Cluster by direction: X-aligned edges vs Z-aligned edges
  const xAligned: Edge[] = [];
  const zAligned: Edge[] = [];
  for (const edge of wallEdges) {
    const dy = Math.abs(edge.p1.y - edge.p2.y);
    const dx = Math.abs(edge.p1.x - edge.p2.x);
    const dz = Math.abs(edge.p1.z - edge.p2.z);
    if (dx > dz) {
      xAligned.push(edge);
    } else {
      zAligned.push(edge);
    }
  }

  // Snap endpoints to 0.05m grid and deduplicate edges
  function snapEdge(e: Edge): Edge {
    return {
      p1: { x: snapToGrid(e.p1.x), y: snapToGrid(e.p1.y), z: snapToGrid(e.p1.z) },
      p2: { x: snapToGrid(e.p2.x), y: snapToGrid(e.p2.y), z: snapToGrid(e.p2.z) },
    };
  }

  function dedupEdges(edges: Edge[]): Edge[] {
    const seen = new Set<string>();
    return edges.map(snapEdge).filter((e) => {
      const key = `${e.p1.x},${e.p1.y},${e.p1.z}-${e.p2.x},${e.p2.y},${e.p2.z}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const xEdges = dedupEdges(xAligned);
  const zEdges = dedupEdges(zAligned);

  // Build axis-aligned walls: each unique X is a Z-running wall, each unique Z is an X-running wall
  const walls: Wall[] = [];
  const wallThickness = 0.2;
  const ceilingHeight = roomHeight || 2.4;

  // For X-aligned walls: they run in Z direction at constant X
  const xPositions = [...new Set(xEdges.map((e) => e.p1.x))].sort((a, b) => a - b);
  for (const xPos of xPositions) {
    const segsAtX = xEdges.filter((e) => e.p1.x === xPos);
    if (segsAtX.length === 0) continue;
    // Merge overlapping Z segments
    const zCoords: number[] = [];
    for (const seg of segsAtX) {
      zCoords.push(seg.p1.z, seg.p2.z);
    }
    const minZ = Math.min(...zCoords);
    const maxZ = Math.max(...zCoords);
    const segLen = maxZ - minZ;
    if (segLen < 0.3) continue; // Skip noise
    walls.push({
      id: generateId(),
      start: toBlueprint2D({ x: xPos, y: 0, z: minZ }),
      end: toBlueprint2D({ x: xPos, y: 0, z: maxZ }),
      thickness: wallThickness,
      height: ceilingHeight,
      texture: 'plain_white',
    });
  }

  // For Z-aligned walls: they run in X direction at constant Z
  const zPositions = [...new Set(zEdges.map((e) => e.p1.z))].sort((a, b) => a - b);
  for (const zPos of zPositions) {
    const segsAtZ = zEdges.filter((e) => e.p1.z === zPos);
    if (segsAtZ.length === 0) continue;
    const xCoords: number[] = [];
    for (const seg of segsAtZ) {
      xCoords.push(seg.p1.x, seg.p2.x);
    }
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const segLen = maxX - minX;
    if (segLen < 0.3) continue;
    walls.push({
      id: generateId(),
      start: toBlueprint2D({ x: minX, y: 0, z: zPos }),
      end: toBlueprint2D({ x: maxX, y: 0, z: zPos }),
      thickness: wallThickness,
      height: ceilingHeight,
      texture: 'plain_white',
    });
  }

  // Build a single rectangular room from bounding box
  const room: Room = {
    id: generateId(),
    name: 'Scanned Room',
    type: 'living_room',
    wallIds: walls.map((w) => w.id),
    floorMaterial: 'hardwood',
    ceilingHeight,
    ceilingType: 'flat_white',
    area: Math.round(width * depth * 100) / 100,
    centroid: { x: width / 2, y: depth / 2 },
  };

  return {
    walls,
    rooms: [room],
    dimensions: { width, height: roomHeight, depth },
  };
}

// Build BlueprintData from mesh-derived walls/rooms
function buildBlueprintFromMesh(
  walls: Wall[],
  rooms: Room[],
  detectedObjects: Array<{ label: string; confidence: number; boundingBox: number[] }>,
): Record<string, unknown> {
  const now = new Date().toISOString();
  const totalArea = rooms.reduce((sum, r) => sum + r.area, 0);

  const floor = {
    id: generateId(),
    label: 'G',
    index: 0,
    walls: walls.map((w) => w.id),
    rooms: rooms.map((r) => r.id),
    openings: [],
    furniture: [],
    staircases: [],
    elevators: [],
    slabs: [],
    ceilings: [],
    roofs: [],
    roofSegments: [],
  };

  return {
    id: generateId(),
    version: 1,
    metadata: {
      style: 'minimalist',
      buildingType: 'apartment',
      totalArea: Math.round(totalArea * 100) / 100,
      roomCount: rooms.length,
      generatedFrom: 'ar_scan_lidar',
    },
    floors: [floor],
    walls,
    rooms,
    openings: [],
    furniture: [],
    customAssets: [],
    chatHistory: [],
    createdAt: now,
    updatedAt: now,
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);

    const limited = await checkRateLimit(`ar:${user.id}`, 5, 3600);
    if (limited) return Errors.rateLimited('AR scan rate limit exceeded');

    const quotaOk = await checkQuota(user.id, 'ar_scan');
    if (!quotaOk) return Errors.quotaExceeded('AR scan quota exceeded');

    const body = await req.json() as unknown;
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) return Errors.validation('Invalid request', parsed.error.issues);

    const { frameUrls, meshVertices, meshFaces } = parsed.data;

    const hasMeshInput = meshVertices != null && meshVertices.length > 0;
    const hasFrameInput = frameUrls != null && frameUrls.length > 0;

    if (!hasMeshInput && !hasFrameInput) {
      return Errors.validation('Request must include frameUrls or meshVertices+meshFaces', []);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let detections: RoboflowDetection[] = [];
    let meshTaskId: string | null = null;
    let blueprintData: Record<string, unknown> | null = null;
    let roomDimensions = { width: 0, height: 0, depth: 0 };
    let status: string = 'failed';

    if (hasMeshInput) {
      // LiDAR mesh path: extract walls directly from mesh
      const meshResult = processMeshToBlueprint(meshVertices!, meshFaces ?? []);
      blueprintData = buildBlueprintFromMesh(
        meshResult.walls,
        meshResult.rooms,
        [],
      );
      roomDimensions = meshResult.dimensions;
      status = 'completed';
    } else {
      // CV path: Roboflow + Meshy (existing behaviour)
      detections = await runRoboflowDetection(frameUrls![0]).catch(() => []);
      try {
        meshTaskId = await requestMeshyReconstruction(frameUrls!);
        status = meshTaskId ? 'processing' : 'failed';
      } catch {
        status = 'failed';
      }
    }

    // Persist scan record
    const { data: scan, error } = await supabase
      .from('ar_scans')
      .insert({
        user_id: user.id,
        frame_urls: hasFrameInput ? frameUrls : [],
        detected_objects: detections.map((d) => ({
          label: d.class,
          confidence: d.confidence,
          boundingBox: [d.x, d.y, d.width, d.height],
        })),
        meshy_task_id: meshTaskId,
        mesh_url: null,
        room_dimensions: roomDimensions,
        status,
      })
      .select()
      .single();

    if (error) throw error;

    // Increment AR quota
    await supabase.rpc('increment_quota', { p_user_id: user.id, p_field: 'ar_scans_used', p_amount: 1 });

    const meta = extractRequestMeta(req);
    await logAudit({
      user_id: user.id,
      action: 'ar_reconstruct',
      resource_id: (scan as Record<string, unknown>).id as string,
      resource_type: 'ar_scan',
      metadata: {
        inputType: hasMeshInput ? 'mesh' : 'cv',
        frameCount: hasFrameInput ? frameUrls!.length : 0,
        detectionCount: detections.length,
      },
      ip_address: meta.ip ?? undefined,
      user_agent: meta.userAgent ?? undefined,
    });

    const row = scan as Record<string, unknown>;
    return new Response(
      JSON.stringify({
        scanId: row.id,
        meshUrl: row.mesh_url,
        roomDimensions: row.room_dimensions,
        detectedObjects: row.detected_objects,
        status: row.status,
        blueprintData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[ar-reconstruct]', err);
    return Errors.internal();
  }
});
