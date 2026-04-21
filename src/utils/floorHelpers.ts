import type { BlueprintData, FloorData } from '../types/blueprint';

/** Returns a human-readable floor label. 0 → 'G', 1 → '1', -1 → 'B1', -2 → 'B2' */
export function getFloorLabel(index: number): string {
  if (index === 0) return 'G';
  if (index > 0) return String(index);
  return `B${Math.abs(index)}`;
}

/** Returns Y offset in metres for stacking floors in 3D. */
export function getFloorYOffset(index: number, floorHeight = 3): number {
  return index * floorHeight;
}

/**
 * Migrates legacy single-floor BlueprintData (no floors field) to multi-floor format.
 * If data already has a floors array, returns it unchanged.
 */
export function migrateToMultiFloor(data: BlueprintData): BlueprintData {
  if (Array.isArray(data.floors) && data.floors.length > 0) return data;
  const groundFloor: FloorData = {
    id: 'floor_0',
    label: 'G',
    index: 0,
    walls: data.walls ?? [],
    rooms: data.rooms ?? [],
    openings: data.openings ?? [],
    furniture: data.furniture ?? [],
    staircases: [],
    elevators: [],
    slabs: [],
  };
  return { ...data, floors: [groundFloor] };
}

/** Derives the flat top-level wall/room/opening/furniture fields from the active floor. */
export function deriveTopLevel(
  floors: FloorData[],
  index: number,
): Pick<BlueprintData, 'walls' | 'rooms' | 'openings' | 'furniture'> {
  const floor = floors[index] ?? floors[0];
  return {
    walls: floor?.walls ?? [],
    rooms: floor?.rooms ?? [],
    openings: floor?.openings ?? [],
    furniture: floor?.furniture ?? [],
  };
}
