import * as THREE from 'three';

/**
 * Build slab BufferGeometry from polygon + holes.
 * Uses THREE.Shape with hole sub-paths and ExtrudeGeometry.
 * After extrusion, rotates to orient from Y-up to Z-up.
 */
export function buildSlabGeometry(
  polygon: [number, number][],
  holes: [number, number][][],
  elevation: number,
): THREE.BufferGeometry {
  if (polygon.length < 3) return new THREE.BufferGeometry();

  // 1. Create shape from polygon (X = first coord, Z = second coord)
  // Y = -polygon[i][1] for correct orientation (Three.js Y-up → Z-up conversion)
  const shape = new THREE.Shape();
  shape.moveTo(polygon[0]![0], -polygon[0]![1]);
  for (let i = 1; i < polygon.length; i++) {
    shape.lineTo(polygon[i]![0], -polygon[i]![1]);
  }
  shape.closePath();

  // 2. Add hole sub-paths (holes are wound counter-clockwise vs polygon clockwise)
  for (const holePolygon of holes) {
    if (holePolygon.length < 3) continue;
    const holePath = new THREE.Path();
    holePath.moveTo(holePolygon[0]![0], -holePolygon[0]![1]);
    for (let i = 1; i < holePolygon.length; i++) {
      holePath.lineTo(holePolygon[i]![0], -holePolygon[i]![1]);
    }
    holePath.closePath();
    shape.holes.push(holePath);
  }

  // 3. Extrude with depth = elevation, no bevel
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: elevation,
    bevelEnabled: false,
  });

  // 4. Rotate: -PI/2 around X to orient from Y-up to Z-up
  geometry.rotateX(-Math.PI / 2);

  // 5. Position at Y = elevation (floor sits at its elevation height)
  geometry.translate(0, elevation, 0);

  geometry.computeVertexNormals();
  return geometry;
}

// ---------------------------------------------------------------------------
// autoFromWalls — detect enclosing wall loop for a room
// ---------------------------------------------------------------------------

const LOOP_TOLERANCE = 0.05; // metres — snap threshold for endpoint matching

interface WallEndpoint {
  x: number;
  z: number;
  wallId: string;
}

/**
 * Compute a closed polygon [x, z][] from an enclosing wall loop.
 * If targetRoomId is provided, only walls belonging to that room are used.
 */
export function computePolygonFromWalls(
  walls: Array<{ id: string; start: { x: number; y: number }; end: { x: number; y: number } }>,
  targetRoomId?: string,
): [number, number][] {
  if (walls.length === 0) return [];

  // Build endpoint index for quick lookup
  const wallEndpoints: WallEndpoint[] = walls.map((w) => ({
    x: w.start.x,
    z: w.start.y,
    wallId: w.id,
  }));

  const findAdjacent = (x: number, z: number, excludeWallId: string): WallEndpoint | undefined => {
    for (const ep of wallEndpoints) {
      if (ep.wallId === excludeWallId) continue;
      if (Math.abs(ep.x - x) < LOOP_TOLERANCE && Math.abs(ep.z - z) < LOOP_TOLERANCE) {
        return ep;
      }
    }
    return undefined;
  };

  // Start from the first wall
  const sorted: Array<{ id: string; start: { x: number; y: number }; end: { x: number; y: number } }> = [];
  const used = new Set<string>();

  // Sort walls so we can start from any wall and trace the loop
  const startWall = walls[0]!;
  sorted.push(startWall);
  used.add(startWall.id);

  let currentX = startWall.end.x;
  let currentZ = startWall.end.y;
  let currentWallId = startWall.id;

  // Trace forward until we return to start point or can't find adjacent wall
  let iterations = 0;
  const maxIterations = walls.length * 2;

  while (iterations < maxIterations) {
    iterations++;
    const adjacent = findAdjacent(currentX, currentZ, currentWallId);
    if (!adjacent) break;

    // Find the wall this endpoint belongs to
    const nextWall = walls.find((w) => w.id === adjacent.wallId);
    if (!nextWall || used.has(nextWall.id)) break;

    sorted.push(nextWall);
    used.add(nextWall.id);

    // Determine which endpoint of the next wall is our current point
    const nextStartMatches =
      Math.abs(nextWall.start.x - currentX) < LOOP_TOLERANCE &&
      Math.abs(nextWall.start.y - currentZ) < LOOP_TOLERANCE;

    if (nextStartMatches) {
      currentX = nextWall.end.x;
      currentZ = nextWall.end.y;
    } else {
      // Must be the end point matching
      currentX = nextWall.start.x;
      currentZ = nextWall.start.y;
    }
    currentWallId = nextWall.id;

    // Check if we've closed the loop (returned to first wall's start)
    if (
      Math.abs(currentX - startWall.start.x) < LOOP_TOLERANCE &&
      Math.abs(currentZ - startWall.start.y) < LOOP_TOLERANCE
    ) {
      break;
    }
  }

  // Extract polygon from traced wall sequence
  const polygon: [number, number][] = sorted.map((w) => [w.start.x, w.start.y]);

  // Close the polygon by appending the final point (same as start)
  if (sorted.length > 0) {
    const last = sorted[sorted.length - 1]!;
    polygon.push([last.end.x, last.end.y]);
  }

  // Sort vertices in clockwise order for correct winding
  return sortClockwise(polygon);
}

/**
 * Sort polygon vertices in clockwise order by computing centroid and cross product sign.
 */
export function sortClockwise(polygon: [number, number][]): [number, number][] {
  if (polygon.length < 3) return polygon;

  // Compute centroid
  let cx = 0;
  let cz = 0;
  for (const [x, z] of polygon) {
    cx += x;
    cz += z;
  }
  cx /= polygon.length;
  cz /= polygon.length;

  // Sort by angle around centroid
  const angles = polygon.map(([x, z]) => ({
    point: [x, z] as [number, number],
    angle: Math.atan2(z - cz, x - cx),
  }));

  angles.sort((a, b) => a.angle - b.angle);
  return angles.map((a) => a.point);
}