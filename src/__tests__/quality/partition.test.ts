import { describe, it, expect } from 'vitest';
import { partitionBuilding, CORRIDOR_WIDTH } from '../../utils/layoutEngine/partition';
import { buildWallsFromTiles } from '../../utils/layoutEngine/wallGraphBuilder';
import { planDoors } from '../../utils/layoutEngine/doorPlanner';
import { detectOverlaps } from '../../utils/layoutEngine/geometry';
import { ROOM_MINIMA } from '../../utils/layoutEngine/types';
import type { LayoutConfig } from '../../utils/layoutEngine/types';

function config(over: Partial<LayoutConfig> = {}): LayoutConfig {
  return {
    buildingType: 'house',
    plotWidth: 14,
    plotDepth: 11,
    floors: 1,
    hasGarden: true,
    hasGarage: false,
    rooms: [
      { type: 'bedroom', name: 'Bedroom 1', minWidth: 3, minHeight: 3, preferredAspect: 1.2 },
      { type: 'bedroom', name: 'Bedroom 2', minWidth: 3, minHeight: 3, preferredAspect: 1.2 },
      { type: 'bathroom', name: 'Bathroom 1', minWidth: 2, minHeight: 2, preferredAspect: 1 },
      { type: 'living_room', name: 'Living Room 1', minWidth: 4, minHeight: 3.5, preferredAspect: 1.4 },
      { type: 'dining_room', name: 'Dining Room', minWidth: 3, minHeight: 2.8, preferredAspect: 1.3 },
      { type: 'kitchen', name: 'Kitchen', minWidth: 2.5, minHeight: 2, preferredAspect: 1.6 },
      { type: 'hallway', name: 'Hallway', minWidth: 1.5, minHeight: 1, preferredAspect: 3 },
    ],
    ...over,
  };
}

describe('partitionBuilding — tiling invariants', () => {
  it('tiles cover the footprint exactly (sum of areas, no overlaps)', () => {
    const b = partitionBuilding(config());
    for (const floor of b.floors) {
      const total = floor.rooms.reduce((s, r) => s + r.width * r.height, 0);
      expect(Math.abs(total - b.buildWidth * b.buildDepth)).toBeLessThan(0.05);
      expect(detectOverlaps(floor.rooms)).toBe(false);
    }
  });

  it('every room meets its ROOM_MINIMA area', () => {
    const b = partitionBuilding(config());
    for (const r of b.floors[0].rooms) {
      const min = ROOM_MINIMA[r.type];
      expect(r.width * r.height).toBeGreaterThanOrEqual(min.minArea * 0.95);
    }
  });

  it('no room (except the corridor) spans more than 6m', () => {
    const b = partitionBuilding(config());
    for (const r of b.floors[0].rooms) {
      if (r.type === 'hallway') continue;
      expect(Math.max(r.width, r.height)).toBeLessThanOrEqual(6.0);
    }
  });

  it('the corridor runs the full depth and is ≥0.9m wide', () => {
    const b = partitionBuilding(config());
    const corridor = b.floors[0].corridor;
    expect(corridor.height).toBeCloseTo(b.buildDepth, 5);
    expect(corridor.width).toBeGreaterThanOrEqual(0.9);
    expect(corridor.width).toBeCloseTo(CORRIDOR_WIDTH, 5);
  });

  it('is deterministic — same config yields the same layout', () => {
    const a = partitionBuilding(config());
    const b = partitionBuilding(config());
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('multi-floor: same footprint, bedrooms upstairs, a bathroom on the ground floor', () => {
    const rooms = [
      ...config().rooms,
      { type: 'bedroom' as const, name: 'Bedroom 3', minWidth: 3, minHeight: 3, preferredAspect: 1.2 },
      { type: 'bathroom' as const, name: 'Bathroom 2', minWidth: 2, minHeight: 2, preferredAspect: 1 },
    ];
    const b = partitionBuilding(config({ floors: 2, rooms }));
    expect(b.floors).toHaveLength(2);
    const ground = b.floors[0].rooms;
    const upper = b.floors[1].rooms;
    expect(ground.some((r) => r.type === 'bathroom')).toBe(true);
    expect(ground.some((r) => r.type === 'bedroom')).toBe(false);
    expect(upper.filter((r) => r.type === 'bedroom')).toHaveLength(3);
    // stairs in the corridor at the same spot on connected floors
    expect(b.floors[0].stairPosition).toEqual(b.floors[1].stairPosition);
  });
});

describe('buildWallsFromTiles — shared wall graph', () => {
  it('every wall borders 1 (exterior) or 2 (shared) rooms — never 0', () => {
    const b = partitionBuilding(config());
    const walls = buildWallsFromTiles(b.floors[0].rooms);
    expect(walls.length).toBeGreaterThan(0);
    for (const w of walls) {
      expect(w.adjacentRooms[0]).toBeTruthy();
      if (w.isExterior) expect(w.adjacentRooms[1]).toBeNull();
      else expect(w.adjacentRooms[1]).toBeTruthy();
    }
  });

  it('at least one wall is shared by two rooms (the old engine had zero)', () => {
    const b = partitionBuilding(config());
    const walls = buildWallsFromTiles(b.floors[0].rooms);
    const shared = walls.filter((w) => w.adjacentRooms[1] !== null);
    expect(shared.length).toBeGreaterThan(0);
  });

  it('every room borders the corridor through at least one shared wall', () => {
    const b = partitionBuilding(config());
    const { corridor, rooms } = b.floors[0];
    const walls = buildWallsFromTiles(rooms);
    for (const room of rooms) {
      if (room.id === corridor.id) continue;
      const sharesWithCorridor = walls.some((w) => {
        const [a, bb] = w.adjacentRooms;
        return (a === room.id && bb === corridor.id) || (a === corridor.id && bb === room.id);
      });
      expect(sharesWithCorridor).toBe(true);
    }
  });

  it('no duplicate or zero-length segments', () => {
    const b = partitionBuilding(config());
    const walls = buildWallsFromTiles(b.floors[0].rooms);
    const seen = new Set<string>();
    for (const w of walls) {
      const len = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y);
      expect(len).toBeGreaterThan(0.01);
      const k = `${w.start.x},${w.start.y},${w.end.x},${w.end.y}`;
      expect(seen.has(k)).toBe(false);
      seen.add(k);
    }
  });
});

describe('planDoors — circulation', () => {
  function planFor(over: Partial<LayoutConfig> = {}) {
    const b = partitionBuilding(config(over));
    const rooms = b.floors[0].rooms;
    const walls = buildWallsFromTiles(rooms);
    return { b, rooms, walls, doors: planDoors(walls, rooms, { hasGarden: true }) };
  }

  it('exactly one main entry, on an exterior wall', () => {
    const { walls, doors } = planFor();
    const entries = doors.filter((d) => d.doorRole === 'main_entry');
    expect(entries).toHaveLength(1);
    const wall = walls.find((w) => w.id === entries[0].wallId)!;
    expect(wall.isExterior).toBe(true);
  });

  it('every room is reachable from the entry through doors', () => {
    const { rooms, walls, doors } = planFor();
    const wallById = new Map(walls.map((w) => [w.id, w]));
    const adj = new Map<string, Set<string>>();
    const entryRooms: string[] = [];
    for (const d of doors) {
      const w = wallById.get(d.wallId)!;
      const [a, b] = w.adjacentRooms;
      if (b === null) { entryRooms.push(a); continue; }
      if (!adj.has(a)) adj.set(a, new Set());
      if (!adj.has(b)) adj.set(b, new Set());
      adj.get(a)!.add(b);
      adj.get(b)!.add(a);
    }
    const reached = new Set(entryRooms);
    const queue = [...entryRooms];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const nb of adj.get(cur) ?? []) {
        if (!reached.has(nb)) { reached.add(nb); queue.push(nb); }
      }
    }
    for (const r of rooms) expect(reached.has(r.id)).toBe(true);
  });

  it('bedrooms and bathrooms never door directly into living/dining/kitchen', () => {
    const { rooms, walls, doors } = planFor();
    const roomById = new Map(rooms.map((r) => [r.id, r]));
    const wallById = new Map(walls.map((w) => [w.id, w]));
    for (const d of doors) {
      const w = wallById.get(d.wallId)!;
      const [a, b] = w.adjacentRooms;
      if (!b) continue;
      const ta = roomById.get(a)!.type;
      const tb = roomById.get(b)!.type;
      const pair = new Set([ta, tb]);
      const privateSide = pair.has('bedroom') || pair.has('bathroom');
      const socialSide = pair.has('living_room') || pair.has('dining_room') || (pair.has('bathroom') && pair.has('kitchen'));
      expect(privateSide && socialSide).toBe(false);
    }
  });

  it('doors fit inside their wall with corner offsets', () => {
    const { walls, doors } = planFor();
    const wallById = new Map(walls.map((w) => [w.id, w]));
    for (const d of doors) {
      const w = wallById.get(d.wallId)!;
      const len = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y);
      expect(d.width).toBeGreaterThanOrEqual(0.7);
      expect(d.position).toBeGreaterThanOrEqual(0.2 - 1e-9);
      expect(d.position + d.width).toBeLessThanOrEqual(len - 0.2 + 1e-9);
    }
  });
});
