import { randomUUID } from 'expo-crypto';
import type { WallSegment, Opening } from './types';

/** Auto-generate door openings on shared walls */
export function placeDoors(walls: WallSegment[]): Opening[] {
  const openings: Opening[] = [];

  // Group walls by being shared (adjacentRooms[1] !== null)
  const sharedWalls = walls.filter(w => !w.isExterior && w.adjacentRooms[1] !== null);

  for (const wall of sharedWalls) {
    const horiz = Math.abs(wall.start.y - wall.end.y) < 0.05;
    const wallLength = horiz
      ? Math.abs(wall.end.x - wall.start.x)
      : Math.abs(wall.end.y - wall.start.y);

    // Door width ≤ 40% of wall length, min 0.7m, max 1.2m
    const doorWidth = Math.max(0.7, Math.min(1.2, wallLength * 0.4));
    const position = wallLength * 0.5; // midpoint

    openings.push({
      id: randomUUID(),
      wallId: wall.id,
      type: 'door',
      position,
      width: doorWidth,
      height: 2.1,
      sillHeight: 0,
    });
  }

  return openings;
}

/** Auto-generate windows on exterior walls (one per 4m) */
export function placeWindows(walls: WallSegment[]): Opening[] {
  const openings: Opening[] = [];
  const windowWidth = 1.0;
  const windowHeight = 1.2;
  const sillHeight = 0.9;

  const exteriorWalls = walls.filter(w => w.isExterior);

  for (const wall of exteriorWalls) {
    const horiz = Math.abs(wall.start.y - wall.end.y) < 0.05;
    const wallLength = horiz
      ? Math.abs(wall.end.x - wall.start.x)
      : Math.abs(wall.end.y - wall.start.y);

    // One window per 4m of exterior wall, centered
    const windowCount = Math.max(1, Math.floor(wallLength / 4));

    if (windowCount === 1) {
      openings.push({
        id: randomUUID(),
        wallId: wall.id,
        type: 'window',
        position: wallLength * 0.5,
        width: Math.min(windowWidth, wallLength * 0.5),
        height: windowHeight,
        sillHeight,
      });
    } else {
      const spacing = wallLength / (windowCount + 1);
      for (let i = 1; i <= windowCount; i++) {
        openings.push({
          id: randomUUID(),
          wallId: wall.id,
          type: 'window',
          position: spacing * i,
          width: Math.min(windowWidth, spacing * 0.6),
          height: windowHeight,
          sillHeight,
        });
      }
    }
  }

  return openings;
}