import { describe, it, expect } from 'vitest';
import { assessArchitecturalQuality } from '../../utils/geometry/architecturalQuality';
import type { BlueprintData, Wall, Room, Opening, RoomType, OpeningType } from '../../types/blueprint';

/**
 * Layout builder: lays out axis-aligned rectangular rooms, deduplicating shared
 * edges into single walls (so the wall-graph traces closed room polygons exactly
 * like real blueprints). Returns a lookup to attach doors/windows to a given edge.
 */
interface RoomSpec { id: string; type: RoomType; x: number; y: number; w: number; h: number; }

function buildLayout(specs: RoomSpec[]) {
  const wallByKey = new Map<string, Wall>();
  let n = 0;
  const edge = (x1: number, y1: number, x2: number, y2: number): Wall => {
    const key = [[x1, y1], [x2, y2]].sort().toString();
    let w = wallByKey.get(key);
    if (!w) {
      w = { id: `w${n++}`, start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.1, height: 2.7, isLoadbearing: true };
      wallByKey.set(key, w);
    }
    return w;
  };
  const rooms: Room[] = [];
  for (const s of specs) {
    edge(s.x, s.y, s.x + s.w, s.y);             // bottom
    edge(s.x + s.w, s.y, s.x + s.w, s.y + s.h); // right
    edge(s.x + s.w, s.y + s.h, s.x, s.y + s.h); // top
    edge(s.x, s.y + s.h, s.x, s.y);             // left
    rooms.push({
      id: s.id, name: s.id, type: s.type, wallIds: [],
      floorMaterial: 'hardwood' as Room['floorMaterial'], ceilingHeight: 2.7,
      area: s.w * s.h, centroid: { x: s.x + s.w / 2, y: s.y + s.h / 2 },
    });
  }
  const walls = [...wallByKey.values()];
  const wallIdForEdge = (x1: number, y1: number, x2: number, y2: number): string => {
    const key = [[x1, y1], [x2, y2]].sort().toString();
    const w = wallByKey.get(key);
    if (!w) throw new Error(`no wall for edge ${x1},${y1}-${x2},${y2}`);
    return w.id;
  };
  return { walls, rooms, wallIdForEdge };
}

let oc = 0;
function O(wallId: string, type: OpeningType): Opening {
  return { id: `o${oc++}`, wallId, type, position: 0.5, width: 0.9, height: 2.1, sillHeight: type === 'window' ? 0.9 : 0 };
}
function blueprint(walls: Wall[], rooms: Room[], openings: Opening[], buildingType = 'house'): BlueprintData {
  return {
    id: 'test', version: 1,
    metadata: { style: 'modern', buildingType, totalArea: 100, roomCount: rooms.length, generatedFrom: 'test' } as BlueprintData['metadata'],
    floors: [], walls, rooms, openings, furniture: [], customAssets: [], chatHistory: [], createdAt: '', updatedAt: '',
  } as BlueprintData;
}

describe('architecturalQuality — circulation', () => {
  it('flags a walk-through bedroom (H → B1 → B2 in a row)', () => {
    // Three rooms in a row sharing vertical dividers at x=3 and x=6.
    const { walls, rooms, wallIdForEdge } = buildLayout([
      { id: 'H', type: 'hallway', x: 0, y: 0, w: 3, h: 4 },
      { id: 'B1', type: 'bedroom', x: 3, y: 0, w: 3, h: 4 },
      { id: 'B2', type: 'bedroom', x: 6, y: 0, w: 3, h: 4 },
    ]);
    const openings = [
      O(wallIdForEdge(0, 0, 0, 4), 'door'),  // exterior entry on H's left edge
      O(wallIdForEdge(3, 0, 3, 4), 'door'),  // H ↔ B1 divider
      O(wallIdForEdge(6, 0, 6, 4), 'door'),  // B1 ↔ B2 divider
    ];
    const report = assessArchitecturalQuality(blueprint(walls, rooms, openings));
    expect(report.circulation.issues.some((i) => /walk through bedroom/i.test(i))).toBe(true);
    expect(report.circulation.score).toBeLessThan(100);
  });

  it('does not flag bedrooms that each open off a central hallway', () => {
    // B1 | H | B2 — hallway in the middle, a bedroom each side.
    const { walls, rooms, wallIdForEdge } = buildLayout([
      { id: 'B1', type: 'bedroom', x: 0, y: 0, w: 3, h: 4 },
      { id: 'H', type: 'hallway', x: 3, y: 0, w: 3, h: 4 },
      { id: 'B2', type: 'bedroom', x: 6, y: 0, w: 3, h: 4 },
    ]);
    const openings = [
      O(wallIdForEdge(3, 4, 6, 4), 'door'),  // exterior entry on H's top edge
      O(wallIdForEdge(3, 0, 3, 4), 'door'),  // B1 ↔ H
      O(wallIdForEdge(6, 0, 6, 4), 'door'),  // H ↔ B2
    ];
    const report = assessArchitecturalQuality(blueprint(walls, rooms, openings));
    expect(report.circulation.issues.some((i) => /walk through/i.test(i))).toBe(false);
  });
});

describe('architecturalQuality — daylight & code', () => {
  it('flags a habitable room with no window', () => {
    const { walls, rooms, wallIdForEdge } = buildLayout([
      { id: 'H', type: 'hallway', x: 0, y: 0, w: 3, h: 4 },
      { id: 'L', type: 'living_room', x: 3, y: 0, w: 4, h: 4 },
    ]);
    const openings = [
      O(wallIdForEdge(0, 0, 0, 4), 'door'),
      O(wallIdForEdge(3, 0, 3, 4), 'door'),  // door, no window anywhere
    ];
    const report = assessArchitecturalQuality(blueprint(walls, rooms, openings));
    expect(report.daylightCode.issues.some((i) => /no window/i.test(i))).toBe(true);
  });

  it('passes when the habitable room has a window', () => {
    const { walls, rooms, wallIdForEdge } = buildLayout([
      { id: 'H', type: 'hallway', x: 0, y: 0, w: 3, h: 4 },
      { id: 'L', type: 'living_room', x: 3, y: 0, w: 4, h: 4 },
    ]);
    const openings = [
      O(wallIdForEdge(0, 0, 0, 4), 'door'),
      O(wallIdForEdge(3, 0, 3, 4), 'door'),
      O(wallIdForEdge(7, 0, 7, 4), 'window'),  // window on L's outer (right) wall
    ];
    const report = assessArchitecturalQuality(blueprint(walls, rooms, openings));
    expect(report.daylightCode.issues.some((i) => /"L" has no window/i.test(i))).toBe(false);
  });
});

describe('architecturalQuality — adjacency', () => {
  it('flags a kitchen and dining placed far apart', () => {
    const { walls, rooms } = buildLayout([
      { id: 'K', type: 'kitchen', x: 0, y: 0, w: 3, h: 3 },
      { id: 'D', type: 'dining_room', x: 20, y: 20, w: 3, h: 3 },  // disjoint, far
    ]);
    const report = assessArchitecturalQuality(blueprint(walls, rooms, []));
    expect(report.adjacency.issues.some((i) => /kitchen and dining/i.test(i))).toBe(true);
  });
});

describe('architecturalQuality — structural', () => {
  it('flags an oversized clear span needing a beam', () => {
    const { walls, rooms } = buildLayout([{ id: 'Big', type: 'living_room', x: 0, y: 0, w: 8, h: 7 }]);
    const report = assessArchitecturalQuality(blueprint(walls, rooms, []));
    expect(report.structural.issues.some((i) => /spans|beam/i.test(i))).toBe(true);
  });
});

describe('architecturalQuality — overall', () => {
  it('rates a sensible plan higher than a walk-through plan', () => {
    const good = buildLayout([
      { id: 'B1', type: 'bedroom', x: 0, y: 0, w: 3, h: 4 },
      { id: 'H', type: 'hallway', x: 3, y: 0, w: 3, h: 4 },
      { id: 'B2', type: 'bedroom', x: 6, y: 0, w: 3, h: 4 },
    ]);
    const goodBp = blueprint(good.walls, good.rooms, [
      O(good.wallIdForEdge(3, 4, 6, 4), 'door'),
      O(good.wallIdForEdge(3, 0, 3, 4), 'door'),
      O(good.wallIdForEdge(6, 0, 6, 4), 'door'),
      O(good.wallIdForEdge(0, 0, 0, 4), 'window'),
      O(good.wallIdForEdge(9, 0, 9, 4), 'window'),
    ]);

    const bad = buildLayout([
      { id: 'H', type: 'hallway', x: 0, y: 0, w: 3, h: 4 },
      { id: 'B1', type: 'bedroom', x: 3, y: 0, w: 3, h: 4 },
      { id: 'B2', type: 'bedroom', x: 6, y: 0, w: 3, h: 4 },
    ]);
    const badBp = blueprint(bad.walls, bad.rooms, [
      O(bad.wallIdForEdge(0, 0, 0, 4), 'door'),
      O(bad.wallIdForEdge(3, 0, 3, 4), 'door'),
      O(bad.wallIdForEdge(6, 0, 6, 4), 'door'),
    ]);

    expect(assessArchitecturalQuality(goodBp).overall).toBeGreaterThan(assessArchitecturalQuality(badBp).overall);
  });
});
