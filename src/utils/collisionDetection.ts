import type { Wall } from '../types/blueprint';

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Converts a wall segment into an axis-aligned bounding box with padding. */
export function wallToAABB(wall: Wall, padding = 0.25): AABB {
  const minX = Math.min(wall.start.x, wall.end.x) - wall.thickness / 2 - padding;
  const maxX = Math.max(wall.start.x, wall.end.x) + wall.thickness / 2 + padding;
  const minZ = Math.min(wall.start.y, wall.end.y) - wall.thickness / 2 - padding;
  const maxZ = Math.max(wall.start.y, wall.end.y) + wall.thickness / 2 + padding;
  return { minX, maxX, minZ, maxZ };
}

/** Returns true if the given point (with radius) overlaps any wall AABB. */
export function checkCollision(
  pos: { x: number; z: number },
  walls: Wall[],
  radius = 0.3,
): boolean {
  for (const wall of walls) {
    const box = wallToAABB(wall);
    if (
      pos.x + radius > box.minX &&
      pos.x - radius < box.maxX &&
      pos.z + radius > box.minZ &&
      pos.z - radius < box.maxZ
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Resolves movement against walls.
 * Tries: full movement → X-only → Z-only → stay.
 * This allows sliding along walls.
 */
export function resolveCollision(
  current: { x: number; z: number },
  desired: { x: number; z: number },
  walls: Wall[],
  radius = 0.3,
): { x: number; z: number } {
  // Try full move
  if (!checkCollision(desired, walls, radius)) return desired;

  // Try X-only
  const xOnly = { x: desired.x, z: current.z };
  if (!checkCollision(xOnly, walls, radius)) return xOnly;

  // Try Z-only
  const zOnly = { x: current.x, z: desired.z };
  if (!checkCollision(zOnly, walls, radius)) return zOnly;

  // Stay
  return current;
}
