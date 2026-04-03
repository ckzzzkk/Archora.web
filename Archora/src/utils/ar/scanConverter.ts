import type { Vector3D } from '../../native/ARCoreModule';
import type { Wall, Room, RoomType } from '../../types/blueprint';
import { snapToGrid } from '../../native/ARCoreModule';

// Simple UUID-like ID generator
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Convert ARCore hit test points to Blueprint walls
 * Creates walls connecting consecutive points, closing the loop
 */
export function convertPointsToWalls(
  pointPairs: Array<{ p1: Vector3D; p2: Vector3D }>,
  ceilingHeight = 2.4
): Wall[] {
  return pointPairs.map((pair) => {
    // Convert ARCore 3D to Blueprint 2D (Y = -Z)
    const start = {
      x: snapToGrid(pair.p1.x),
      y: snapToGrid(-pair.p1.z),
    };
    const end = {
      x: snapToGrid(pair.p2.x),
      y: snapToGrid(-pair.p2.z),
    };

    return {
      id: generateId(),
      start,
      end,
      thickness: 0.2, // Standard 200mm wall
      height: ceilingHeight,
      texture: 'plain_white',
    };
  });
}

/**
 * Detect room type from dimensions and area
 */
export function detectRoomTypeFromDimensions(
  area: number,
  width?: number,
  height?: number
): RoomType {
  // Hallway: long narrow, < 8m²
  if (width && height) {
    const ratio = Math.max(width, height) / Math.min(width, height);
    if (ratio > 3 && area < 8) return 'hallway';
  }

  // Bedroom: 9-16m²
  if (area >= 9 && area <= 16) return 'bedroom';

  // Living room: 15-40m²
  if (area >= 15 && area <= 40) return 'living_room';

  // Kitchen: 10-20m²
  if (area >= 10 && area <= 20) return 'kitchen';

  // Bathroom: 4-10m²
  if (area >= 4 && area <= 10) return 'bathroom';

  // Dining room: 12-25m²
  if (area >= 12 && area <= 25) return 'dining_room';

  // Office: 8-20m²
  if (area >= 8 && area <= 20) return 'office';

  // Garage: 15m²+
  if (area >= 15 && area <= 60) return 'garage';

  // Storage: any size
  if (area < 6) return 'storage';

  // Default to living room
  return 'living_room';
}

/**
 * Calculate room area from wall vertices using shoelace formula
 */
export function calculateRoomArea(vertices: Array<{ x: number; y: number }>): number {
  if (vertices.length < 3) return 0;

  let area = 0;
  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }

  return Math.abs(area) / 2;
}

/**
 * Calculate centroid of a polygon
 */
export function calculateCentroid(vertices: Array<{ x: number; y: number }>): { x: number; y: number } {
  if (vertices.length === 0) return { x: 0, y: 0 };

  const sum = vertices.reduce(
    (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }),
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / vertices.length,
    y: sum.y / vertices.length,
  };
}

/**
 * Calculate wall length
 */
export function getWallLength(wall: Wall): number {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if walls form a closed loop (room is enclosed)
 */
export function isRoomEnclosed(walls: Wall[]): boolean {
  if (walls.length < 3) return false;

  // Build adjacency map
  const connections: Map<string, number> = new Map();

  for (const wall of walls) {
    const startKey = `${wall.start.x.toFixed(2)},${wall.start.y.toFixed(2)}`;
    const endKey = `${wall.end.x.toFixed(2)},${wall.end.y.toFixed(2)}`;

    connections.set(startKey, (connections.get(startKey) || 0) + 1);
    connections.set(endKey, (connections.get(endKey) || 0) + 1);
  }

  // For a closed loop, each point should appear exactly twice
  for (const count of connections.values()) {
    if (count !== 2) return false;
  }

  return true;
}

/**
 * Merge adjacent walls that are nearly collinear
 * Useful for cleaning up scan data
 */
export function mergeCollinearWalls(walls: Wall[], tolerance = 0.1): Wall[] {
  if (walls.length < 2) return walls;

  const merged: Wall[] = [];
  let current = walls[0];

  for (let i = 1; i < walls.length; i++) {
    const next = walls[i];

    // Check if walls are collinear
    const angle1 = Math.atan2(
      current.end.y - current.start.y,
      current.end.x - current.start.x
    );
    const angle2 = Math.atan2(
      next.end.y - next.start.y,
      next.end.x - next.start.x
    );

    const angleDiff = Math.abs(angle1 - angle2);
    const isCollinear = angleDiff < tolerance || Math.abs(angleDiff - Math.PI) < tolerance;

    // Check if walls connect
    const connects =
      (Math.abs(current.end.x - next.start.x) < 0.1 &&
        Math.abs(current.end.y - next.start.y) < 0.1) ||
      (Math.abs(current.start.x - next.end.x) < 0.1 &&
        Math.abs(current.start.y - next.end.y) < 0.1);

    if (isCollinear && connects) {
      // Merge walls
      current = {
        ...current,
        end: next.end,
      };
    } else {
      merged.push(current);
      current = next;
    }
  }

  merged.push(current);
  return merged;
}

/**
 * Calculate bounding box from walls
 */
export function getBoundingBox(walls: Wall[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (walls.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }

  const allPoints = walls.flatMap((w) => [w.start, w.end]);
  const xs = allPoints.map((p) => p.x);
  const ys = allPoints.map((p) => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
