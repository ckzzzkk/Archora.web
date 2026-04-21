import type {
  BlueprintData, Wall, Room, Opening, FurniturePiece,
  Vector2D, Vector3D, FloorData,
} from '../../types/blueprint';
import type { DetectedPlane } from '../../native/ARCoreModule';
import { snapToGrid } from '../../native/ARCoreModule';

export interface PhotoAnalysisResult {
  wallWidth: number;
  wallHeight: number;
  ceilingHeight: number;
  windows: Array<{ width: number; height: number; positionX: number }>;
  doors: Array<{ width: number; height: number; positionX: number }>;
  roomType: string;
  notes: string;
  confidence?: number;
}

// Simple UUID-like ID generator (no external dependency)
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ARCore coordinate transform:
// ARCore is Y-up right-hand: X=east, Y=up, Z=toward viewer
// Blueprint is top-down: X=east, Y=north (so Blueprint Y = -ARCore Z)
function toBlueprint2D(v: Vector3D): Vector2D {
  return {
    x: snapToGrid(v.x),
    y: snapToGrid(-v.z),
  };
}

// Convert wall point pairs (from hit tests) → Blueprint Wall array
export function arWallsToBlueprintWalls(
  pairs: Array<{ p1: Vector3D; p2: Vector3D }>,
): Wall[] {
  return pairs.map((pair) => ({
    id: generateId(),
    start: toBlueprint2D(pair.p1),
    end: toBlueprint2D(pair.p2),
    thickness: 0.2,
    height: 2.4,
    texture: 'plain_white' as const,
  }));
}

// Convert a detected plane + known wall IDs → Blueprint Room
export function arPlaneToBlueprintRoom(
  plane: DetectedPlane,
  wallIds: string[],
): Room {
  const area = Math.round(plane.extentX * plane.extentZ * 100) / 100;
  return {
    id: generateId(),
    name: 'Scanned Room',
    type: 'living_room',
    wallIds,
    floorMaterial: 'hardwood',
    ceilingHeight: 2.4,
    ceilingType: 'flat_white',
    area,
    centroid: {
      x: snapToGrid(plane.centerX),
      y: snapToGrid(-plane.centerZ),
    },
  };
}

// Convert depth-detected wall planes → wall point pairs
export function wallPlanesToWallPairs(
  planes: DetectedPlane[],
): Array<{ p1: Vector3D; p2: Vector3D }> {
  return planes.map((plane) => {
    const halfX = plane.extentX / 2;
    const halfZ = plane.extentZ / 2;
    // For a vertical plane, extentX is the wall width; use center ± halfX
    return {
      p1: { x: plane.centerX - halfX, y: plane.centerY, z: plane.centerZ },
      p2: { x: plane.centerX + halfX, y: plane.centerY, z: plane.centerZ + halfZ },
    };
  });
}

// Merge 4 wall photo analyses into walls + a single rectangular room
// Convention: front/back walls define depth (Y), left/right define width (X)
export function photoAnalysisToBlueprint(
  results: [PhotoAnalysisResult, PhotoAnalysisResult, PhotoAnalysisResult, PhotoAnalysisResult],
  directions: ['front', 'left', 'back', 'right'] = ['front', 'left', 'back', 'right'],
): { walls: Wall[]; rooms: Room[]; openings: Opening[] } {
  const [front, left, back, right] = results;

  const width = snapToGrid((front.wallWidth + back.wallWidth) / 2);
  const depth = snapToGrid((left.wallWidth + right.wallWidth) / 2);
  const ceilingHeight = snapToGrid(
    (front.ceilingHeight + left.ceilingHeight + back.ceilingHeight + right.ceilingHeight) / 4,
  );

  // Build a rectangular room: origin at (0,0), width along X, depth along Y
  const wallFront: Wall = {
    id: generateId(), start: { x: 0, y: 0 }, end: { x: width, y: 0 },
    thickness: 0.2, height: ceilingHeight, texture: 'plain_white',
  };
  const wallRight: Wall = {
    id: generateId(), start: { x: width, y: 0 }, end: { x: width, y: depth },
    thickness: 0.2, height: ceilingHeight, texture: 'plain_white',
  };
  const wallBack: Wall = {
    id: generateId(), start: { x: width, y: depth }, end: { x: 0, y: depth },
    thickness: 0.2, height: ceilingHeight, texture: 'plain_white',
  };
  const wallLeft: Wall = {
    id: generateId(), start: { x: 0, y: depth }, end: { x: 0, y: 0 },
    thickness: 0.2, height: ceilingHeight, texture: 'plain_white',
  };

  const walls = [wallFront, wallRight, wallBack, wallLeft];

  const roomTypeMap: Record<string, Room['type']> = {
    bedroom: 'bedroom', bathroom: 'bathroom', kitchen: 'kitchen',
    living_room: 'living_room', dining_room: 'dining_room',
    hallway: 'hallway', garage: 'garage', office: 'office',
    laundry: 'laundry', storage: 'storage', balcony: 'balcony',
  };
  const detectedType = front.roomType || 'living_room';
  const roomType: Room['type'] = roomTypeMap[detectedType] ?? 'living_room';

  const room: Room = {
    id: generateId(),
    name: 'Scanned Room',
    type: roomType,
    wallIds: walls.map((w) => w.id),
    floorMaterial: 'hardwood',
    ceilingHeight,
    ceilingType: 'flat_white',
    area: Math.round(width * depth * 100) / 100,
    centroid: { x: width / 2, y: depth / 2 },
  };

  // Convert window/door positions from front wall to Opening objects
  const openings: Opening[] = [];
  const allWallResults: Array<{ result: PhotoAnalysisResult; wall: Wall }> = [
    { result: front, wall: wallFront },
    { result: right, wall: wallRight },
    { result: back, wall: wallBack },
    { result: left, wall: wallLeft },
  ];

  for (const { result, wall } of allWallResults) {
    for (const win of result.windows) {
      openings.push({
        id: generateId(),
        wallId: wall.id,
        type: 'window',
        position: snapToGrid(win.positionX * wall_length(wall)),
        width: snapToGrid(win.width),
        height: snapToGrid(win.height),
        sillHeight: 0.9,
      });
    }
    for (const door of result.doors) {
      openings.push({
        id: generateId(),
        wallId: wall.id,
        type: 'door',
        position: snapToGrid(door.positionX * wall_length(wall)),
        width: snapToGrid(door.width),
        height: snapToGrid(door.height),
        sillHeight: 0,
      });
    }
  }

  return { walls, rooms: [room], openings };
}

function wall_length(wall: Wall): number {
  return Math.sqrt(
    Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2),
  );
}

// Build a complete BlueprintData from AR-derived walls, rooms, furniture
export function buildBlueprintFromAR(
  walls: Wall[],
  rooms: Room[],
  furniture: FurniturePiece[],
  openings: Opening[] = [],
): BlueprintData {
  const now = new Date().toISOString();
  const totalArea = rooms.reduce((sum, r) => sum + r.area, 0);

  const floor: FloorData = {
    id: generateId(),
    label: 'G',
    index: 0,
    walls,
    rooms,
    openings,
    furniture,
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
      generatedFrom: 'ar_scan',
    },
    floors: [floor],
    // Mirror top-level for renderer backward compat
    walls,
    rooms,
    openings,
    furniture,
    customAssets: [],
    chatHistory: [],
    createdAt: now,
    updatedAt: now,
  };
}
