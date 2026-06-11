import { describe, it, expect } from 'vitest';
import { placeDoors, placeWindows } from '../../utils/layoutEngine/openingPlacer';
import type { WallSegment } from '../../utils/layoutEngine/types';

// Regression anchors pinned before the layout-engine rewrite: the door/window
// invariants below must hold for any future wall-graph the engine produces.

function seg(
  id: string,
  sx: number, sy: number, ex: number, ey: number,
  isExterior: boolean,
  adjacentRooms: [string, string | null],
): WallSegment {
  return { id, start: { x: sx, y: sy }, end: { x: ex, y: ey }, isExterior, adjacentRooms };
}

// 10×8 footprint, one interior wall splitting two rooms
const WALLS: WallSegment[] = [
  seg('ext-n', 0, 0, 10, 0, true, ['room-a', null]),
  seg('ext-e', 10, 0, 10, 8, true, ['room-b', null]),
  seg('ext-s', 10, 8, 0, 8, true, ['room-b', null]),
  seg('ext-w', 0, 8, 0, 0, true, ['room-a', null]),
  seg('int-1', 5, 0, 5, 8, false, ['room-a', 'room-b']),
];

describe('placeDoors', () => {
  it('places a door on every shared interior wall', () => {
    const doors = placeDoors(WALLS);
    const interiorDoors = doors.filter((d) => d.wallId === 'int-1');
    expect(interiorDoors).toHaveLength(1);
  });

  it('door widths stay within 0.7–1.2m', () => {
    for (const d of placeDoors(WALLS, { hasGarden: true })) {
      expect(d.width).toBeGreaterThanOrEqual(0.7);
      expect(d.width).toBeLessThanOrEqual(1.2);
    }
  });

  it('doors fit inside their wall with a corner offset', () => {
    const byId = new Map(WALLS.map((w) => [w.id, w]));
    for (const d of placeDoors(WALLS, { hasGarden: true })) {
      const w = byId.get(d.wallId)!;
      const len = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y);
      expect(d.position).toBeGreaterThanOrEqual(0);
      expect(d.position + d.width).toBeLessThanOrEqual(len + 1e-6);
    }
  });

  it('always places exactly one main entry on an exterior wall', () => {
    const doors = placeDoors(WALLS);
    const entries = doors.filter((d) => d.doorRole === 'main_entry');
    expect(entries).toHaveLength(1);
    const w = WALLS.find((x) => x.id === entries[0].wallId)!;
    expect(w.isExterior).toBe(true);
  });

  it('adds a garden sliding door only when hasGarden is set', () => {
    const without = placeDoors(WALLS);
    const withGarden = placeDoors(WALLS, { hasGarden: true });
    expect(without.some((d) => d.type === 'sliding_door')).toBe(false);
    expect(withGarden.some((d) => d.type === 'sliding_door')).toBe(true);
  });
});

describe('placeWindows', () => {
  it('places windows only on exterior walls', () => {
    const windows = placeWindows(WALLS);
    expect(windows.length).toBeGreaterThan(0);
    const exteriorIds = new Set(WALLS.filter((w) => w.isExterior).map((w) => w.id));
    for (const win of windows) {
      expect(exteriorIds.has(win.wallId)).toBe(true);
    }
  });

  it('roughly one window per 4m of exterior wall', () => {
    const windows = placeWindows(WALLS);
    const onNorth = windows.filter((w) => w.wallId === 'ext-n'); // 10m wall
    expect(onNorth.length).toBe(2);
    const onWest = windows.filter((w) => w.wallId === 'ext-w'); // 8m wall
    expect(onWest.length).toBe(2);
  });

  it('windows keep ≥0.4m clearance from wall corners', () => {
    const byId = new Map(WALLS.map((w) => [w.id, w]));
    for (const win of placeWindows(WALLS)) {
      const w = byId.get(win.wallId)!;
      const len = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y);
      // `position` may be a left edge (single) or centre (multiple) — both
      // must leave the structural corner clearance on each side.
      expect(win.position).toBeGreaterThanOrEqual(0.4 - 1e-6);
      expect(win.position + win.width).toBeLessThanOrEqual(len - 0.4 + win.width / 2 + 1e-6);
    }
  });

  it('window sills sit at 0.9m with 1.2m height', () => {
    for (const win of placeWindows(WALLS)) {
      expect(win.sillHeight).toBe(0.9);
      expect(win.height).toBe(1.2);
    }
  });
});
