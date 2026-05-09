import { randomUUID } from 'expo-crypto';
import type { WallSegment, Opening } from './types';

/**
 * Role tag for logical door placement.
 */
export type DoorRole = 'main_entry' | 'garage_entry' | 'kitchen_back' | 'bedroom' | 'bathroom' | 'ensuite' | 'interior' | 'wc';

/** Extended opening with optional door role */
export interface LogicalOpening extends Opening {
  doorRole?: DoorRole;
  hingeSide?: 'left' | 'right';
}

/**
 * Find the wall with the most negative X (leftmost) — the front of the plot.
 */
function findFrontWall(walls: WallSegment[]): WallSegment | null {
  return walls
    .filter(w => w.isExterior)
    .sort((a, b) => {
      const aMinX = Math.min(a.start.x, a.end.x);
      const bMinX = Math.min(b.start.x, b.end.x);
      return aMinX - bMinX;
    })[0] ?? null;
}

/**
 * Find the wall with the most positive Y (backmost) — the rear of the plot.
 */
function findBackWall(walls: WallSegment[]): WallSegment | null {
  return walls
    .filter(w => w.isExterior)
    .sort((a, b) => {
      const aMaxY = Math.max(a.start.y, a.end.y);
      const bMaxY = Math.max(b.start.y, b.end.y);
      return bMaxY - aMaxY;
    })[0] ?? null;
}

export interface DoorPlacementOptions {
  hasGarden?: boolean;
  hasGarage?: boolean;
}

/**
 * Auto-generate door openings on shared walls with logical placement.
 *
 * - Interior/shared walls: doors placed near corners (200mm from corner) to maximise
 *   wall space for furniture, alternating left/right per wall.
 * - Front (entry) door: placed on the leftmost exterior wall, offset toward the right
 *   side (simulates natural approach from street).
 * - Kitchen back door: placed on the rear exterior wall as a sliding door for
 *   garden/terrace access (only if hasGarden is true).
 * - Garage internal door: placed on the shared wall between garage and adjacent
 *   rooms (hasGarage is currently used for context; the actual adjacency is
 *   determined by which shared walls exist).
 */
export function placeDoors(walls: WallSegment[], opts: DoorPlacementOptions = {}): LogicalOpening[] {
  const openings: LogicalOpening[] = [];

  const frontWall = findFrontWall(walls);
  const backWall = findBackWall(walls);

  const sharedWalls = walls.filter(w => !w.isExterior && w.adjacentRooms[1] !== null);

  for (const wall of sharedWalls) {
    const horiz = Math.abs(wall.start.y - wall.end.y) < 0.05;
    const wallLength = horiz
      ? Math.abs(wall.end.x - wall.start.x)
      : Math.abs(wall.end.y - wall.start.y);

    const doorWidth = Math.max(0.7, Math.min(1.2, wallLength * 0.4));
    // Place near a corner — alternate left/right based on wall id hash
    const cornerOffset = 0.2;
    const useLeft = wall.id.charCodeAt(0) % 2 === 0;
    const position = useLeft ? cornerOffset : wallLength - doorWidth - cornerOffset;

    openings.push({
      id: randomUUID(),
      wallId: wall.id,
      type: 'door',
      position,
      width: doorWidth,
      height: 2.1,
      sillHeight: 0,
      doorRole: 'interior',
      hingeSide: (wall.id.charCodeAt(0) % 2 === 0) ? 'left' : 'right',
    });
  }

  // Main entry door on front (leftmost) wall
  if (frontWall) {
    const horiz = Math.abs(frontWall.start.y - frontWall.end.y) < 0.05;
    const wallLength = horiz
      ? Math.abs(frontWall.end.x - frontWall.start.x)
      : Math.abs(frontWall.end.y - frontWall.start.y);

    const doorWidth = 1.0;
    // Offset toward right side of front wall (natural street approach side)
    const position = wallLength * 0.65;

    openings.push({
      id: randomUUID(),
      wallId: frontWall.id,
      type: 'door',
      position,
      width: doorWidth,
      height: 2.1,
      sillHeight: 0,
      doorRole: 'main_entry',
      hingeSide: 'left',
    });
  }

  // Kitchen back door on rear wall as sliding door for garden access (only if garden exists)
  if (opts.hasGarden && backWall) {
    const horiz = Math.abs(backWall.start.y - backWall.end.y) < 0.05;
    const wallLength = horiz
      ? Math.abs(backWall.end.x - backWall.start.x)
      : Math.abs(backWall.end.y - backWall.start.y);

    if (wallLength >= 2.0) {
      const doorWidth = 0.9;
      const position = wallLength * 0.5 - doorWidth / 2;

      openings.push({
        id: randomUUID(),
        wallId: backWall.id,
        type: 'sliding_door',
        position,
        width: doorWidth,
        height: 2.1,
        sillHeight: 0,
        doorRole: 'kitchen_back',
        hingeSide: 'left',
      });
    }
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

    // Enforce minimum 0.4m offset from wall corners (structural + frame clearance)
    const MIN_CORNER_OFFSET = 0.4;
    const maxWindowWidth = Math.min(windowWidth, wallLength - MIN_CORNER_OFFSET * 2);

    if (windowCount === 1) {
      const safeWindowWidth = maxWindowWidth;
      const availableSpace = wallLength - safeWindowWidth;
      const position = Math.max(MIN_CORNER_OFFSET, availableSpace / 2);
      openings.push({
        id: randomUUID(),
        wallId: wall.id,
        type: 'window',
        position,
        width: safeWindowWidth,
        height: windowHeight,
        sillHeight,
      });
    } else {
      const spacing = wallLength / (windowCount + 1);
      const safeWidth = Math.min(windowWidth, spacing * 0.6);
      for (let i = 1; i <= windowCount; i++) {
        const pos = spacing * i;
        // Clamp to keep windows away from corners
        const safePos = Math.max(MIN_CORNER_OFFSET + safeWidth / 2, Math.min(pos, wallLength - MIN_CORNER_OFFSET - safeWidth / 2));
        openings.push({
          id: randomUUID(),
          wallId: wall.id,
          type: 'window',
          position: safePos,
          width: safeWidth,
          height: windowHeight,
          sillHeight,
        });
      }
    }
  }

  return openings;
}