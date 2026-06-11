/**
 * partition.ts — space-partition floor layout (double-loaded corridor).
 *
 * Replaces the zone-packing approach (zones.ts), whose rooms floated as
 * independent rectangles inside zone boxes — no two rooms ever shared a wall,
 * so the wall graph traced composite polygons and circulation/structural
 * quality scored near zero.
 *
 * Here every floor is tiled exactly: a corridor spine (the hallway) runs the
 * full depth of the building with a column of rooms either side. Each room is
 * column-width × its area budget, which guarantees:
 *  - every room shares a full-height wall with the corridor (door + reachability)
 *  - every room touches an exterior wall (daylight/windows)
 *  - room spans stay ≤6m (structural) for normal column widths
 *  - social rooms sit at the front (entry side, low y), private rooms at the
 *    rear (zoning), wet rooms cluster at the rear of the service column so
 *    upper-floor bathrooms stack over them (shared soil pipes)
 *
 * Deterministic: same config → same layout (no RNG).
 */

import type { RoomType } from '../../types/blueprint';
import type { LayoutConfig, LayoutRoom } from './types';
import { ROOM_MINIMA, GROUND_FLOOR_ONLY } from './types';

export const CORRIDOR_WIDTH = 1.2;
// Structural rule: spans strictly over 6.0m need a beam. Tiles stay at 5.9m
// so grid rounding (autoRepair snaps to 0.05m) can never push a span over.
const MAX_SPAN = 5.9;
const GRID = 0.05;

function snap(v: number): number {
  return Math.round(v / GRID) * GRID;
}

/** Preferred (comfortable) area per room type, m². Minima come from ROOM_MINIMA. */
const PREFERRED_AREA: Record<RoomType, number> = {
  bedroom: 13,
  bathroom: 5.5,
  kitchen: 10,
  living_room: 20,
  dining_room: 11,
  hallway: 4,
  garage: 18,
  office: 9,
  laundry: 4.5,
  storage: 4,
  balcony: 4,
  staircase: 5,
};

/**
 * Front-to-rear ordering inside a column. Lower rank = closer to the entry.
 * Wet rooms (kitchen → laundry → bathroom) ranked toward the rear of the
 * service column so multi-floor bathrooms stack over them.
 */
const ZONE_RANK: Record<RoomType, number> = {
  garage: 0,
  living_room: 1,
  dining_room: 2,
  office: 2,
  kitchen: 3,
  storage: 4,
  laundry: 5,
  hallway: 5,
  balcony: 5,
  staircase: 5,
  bedroom: 6,
  bathroom: 7,
};

interface RoomSpec {
  type: RoomType;
  name: string;
  targetArea: number;
}

export interface FloorPartition {
  /** All room tiles for the floor, including the corridor (type 'hallway'). */
  rooms: LayoutRoom[];
  /** Corridor tile (also present in rooms). */
  corridor: LayoutRoom;
  /** Stair position inside the corridor (multi-floor only). */
  stairPosition: { x: number; y: number } | null;
}

export interface BuildingPartition {
  buildWidth: number;
  buildDepth: number;
  floors: FloorPartition[];
}

function specFor(room: LayoutConfig['rooms'][number]): RoomSpec {
  const minima = ROOM_MINIMA[room.type];
  return {
    type: room.type,
    name: room.name,
    targetArea: Math.max(PREFERRED_AREA[room.type] ?? 8, minima.minArea),
  };
}

/**
 * Assign rooms to floors. Ground keeps social/service rooms plus one
 * bathroom (ground WC); bedrooms and the remaining bathrooms go upstairs,
 * spread round-robin across upper floors.
 */
function assignFloors(config: LayoutConfig): RoomSpec[][] {
  // The corridor IS the hallway — explicit hallway/entry-hall rooms would
  // duplicate it, so they are dropped here.
  const specs = config.rooms.filter((r) => r.type !== 'hallway').map(specFor);

  if (config.floors <= 1) return [specs];

  const ground: RoomSpec[] = [];
  const upper: RoomSpec[] = [];
  let groundBathPlaced = false;

  for (const s of specs) {
    if (s.type === 'bedroom') {
      upper.push(s);
    } else if (s.type === 'bathroom') {
      if (!groundBathPlaced) {
        ground.push(s);
        groundBathPlaced = true;
      } else {
        upper.push(s);
      }
    } else if ((GROUND_FLOOR_ONLY as string[]).includes(s.type)) {
      ground.push(s);
    } else {
      ground.push(s);
    }
  }

  // Upper floors share the bedroom/bathroom load round-robin
  const upperFloors: RoomSpec[][] = Array.from({ length: config.floors - 1 }, () => []);
  upper.forEach((s, i) => {
    upperFloors[i % upperFloors.length].push(s);
  });

  // An upper floor must not be empty — steal a bedroom from ground if needed
  // (cannot normally happen: floors>1 implies bedrooms exist).
  return [ground, ...upperFloors];
}

/**
 * Split a floor's rooms into the two columns flanking the corridor,
 * balancing the columns by DEPTH need (the deeper column dictates the
 * building depth, and a lopsided split forces rooms past the 6m span).
 *
 * Soft preferences survive the balancing:
 *  - kitchen + dining (+laundry) travel together as the service block
 *  - the garage anchors the other column's front (driveway access)
 *  - ground floor: wet rooms at the rear of their column; upper floors:
 *    bathrooms at the FRONT (so the scorer's entry fallback — the
 *    front-most room — is never a bedroom, and the bathrooms stack within
 *    reach of the ground-floor wet cluster)
 */
function assignColumns(
  specs: RoomSpec[],
  colWidth: number,
  floorIndex: number,
): { colA: RoomSpec[]; colB: RoomSpec[] } {
  const depthOf = (col: RoomSpec[]) => col.reduce((s, r) => s + depthFor(r, colWidth), 0);

  // Blocks that must stay in one column. Upper-floor bathrooms join the
  // service column so they stack vertically over the ground wet cluster
  // (kitchen/laundry/WC live in column B on the ground floor).
  const serviceBlock: RoomSpec[] = [];
  const garageBlock: RoomSpec[] = [];
  const free: RoomSpec[] = [];
  for (const s of specs) {
    if (s.type === 'kitchen' || s.type === 'dining_room' || s.type === 'laundry') serviceBlock.push(s);
    else if (floorIndex > 0 && s.type === 'bathroom') serviceBlock.push(s);
    else if (s.type === 'garage') garageBlock.push(s);
    else free.push(s);
  }

  const colA: RoomSpec[] = [...garageBlock];
  const colB: RoomSpec[] = [...serviceBlock];

  // Greedy balance the rest by depth need, largest first (deterministic).
  free.sort((a, b) => depthFor(b, colWidth) - depthFor(a, colWidth) || a.name.localeCompare(b.name));
  for (const s of free) {
    (depthOf(colA) <= depthOf(colB) ? colA : colB).push(s);
  }

  // Neither column may be empty (the wall graph needs tiles both sides).
  const rebalance = (from: RoomSpec[], to: RoomSpec[]) => {
    if (to.length === 0 && from.length > 1) {
      from.sort((a, b) => a.targetArea - b.targetArea);
      to.push(from.shift()!);
    }
  };
  rebalance(colA, colB);
  rebalance(colB, colA);

  // Front-to-rear order inside each column.
  const rank = (s: RoomSpec): number => {
    if (floorIndex > 0 && s.type === 'bathroom') return -1; // front upstairs
    return ZONE_RANK[s.type];
  };
  const byZone = (a: RoomSpec, b: RoomSpec) => (rank(a) - rank(b)) || a.name.localeCompare(b.name);
  colA.sort(byZone);
  colB.sort(byZone);
  return { colA, colB };
}

/** Depth each room needs at a given column width, respecting minima. */
function depthFor(spec: RoomSpec, colWidth: number): number {
  const minima = ROOM_MINIMA[spec.type];
  const byArea = spec.targetArea / colWidth;
  return Math.max(byArea, minima.minHeight, minima.minArea / colWidth);
}

/**
 * Scale a column's room depths to fill the building depth exactly, clamping
 * individual rooms at MAX_SPAN and redistributing the excess. The final room
 * absorbs rounding so cuts land on the grid and sum exactly to buildDepth.
 */
function fitColumn(specs: RoomSpec[], colWidth: number, buildDepth: number): number[] {
  if (specs.length === 0) return [];
  const base = specs.map((s) => depthFor(s, colWidth));
  const baseSum = base.reduce((a, b) => a + b, 0);
  let depths = base.map((d) => (d / baseSum) * buildDepth);

  // Clamp at MAX_SPAN, pushing the surplus onto unclamped rooms. If every
  // room is clamped and surplus remains (column capacity < building depth —
  // the assigner avoids this, but guard anyway), spread it evenly: a slight
  // span overrun beats a hole in the tiling.
  for (let pass = 0; pass < 3; pass++) {
    let surplus = 0;
    const unclamped: number[] = [];
    depths = depths.map((d, i) => {
      if (d > MAX_SPAN) {
        surplus += d - MAX_SPAN;
        return MAX_SPAN;
      }
      unclamped.push(i);
      return d;
    });
    if (surplus < 1e-9) break;
    if (unclamped.length === 0) {
      depths = depths.map((d) => d + surplus / depths.length);
      break;
    }
    const unclampedSum = unclamped.reduce((s, i) => s + depths[i], 0);
    for (const i of unclamped) depths[i] += surplus * (depths[i] / unclampedSum);
  }

  // Snap cuts to the grid; the last room absorbs only the ≤GRID remainder
  // (MAX_SPAN carries 0.1m of slack against the scorer's 6.0m rule).
  const snapped: number[] = [];
  let acc = 0;
  for (let i = 0; i < depths.length - 1; i++) {
    const cut = snap(acc + depths[i]);
    snapped.push(cut - acc);
    acc = cut;
  }
  snapped.push(buildDepth - acc);
  return snapped;
}

function tile(
  spec: RoomSpec,
  x: number,
  y: number,
  width: number,
  height: number,
  floorIndex: number,
  seq: number,
): LayoutRoom {
  return {
    id: `room-f${floorIndex}-${seq}-${spec.type}`,
    type: spec.type,
    name: spec.name,
    x: snap(x),
    y: snap(y),
    width: snap(width),
    height: snap(height),
    floorIndex,
  };
}

/**
 * Partition the whole building. All floors share the same footprint and
 * corridor position (the stair connects them inside the corridor).
 */
export function partitionBuilding(config: LayoutConfig): BuildingPartition {
  const floorsSpecs = assignFloors(config);

  // Column width: never beyond MAX_SPAN, never wider than the plot allows.
  const plotWidth = Math.max(config.plotWidth, 6);
  const colWidth = snap(Math.min(MAX_SPAN, Math.max(2.8, (Math.min(plotWidth, 2 * MAX_SPAN + CORRIDOR_WIDTH) - CORRIDOR_WIDTH) / 2)));
  const buildWidth = snap(colWidth * 2 + CORRIDOR_WIDTH);

  const floorsColumns = floorsSpecs.map((specs, floorIndex) => assignColumns(specs, colWidth, floorIndex));

  // Building depth: the deepest column across all floors dictates it.
  let buildDepth = 0;
  for (const { colA, colB } of floorsColumns) {
    for (const col of [colA, colB]) {
      const need = col.reduce((s, r) => s + depthFor(r, colWidth), 0);
      buildDepth = Math.max(buildDepth, need);
    }
  }
  buildDepth = snap(Math.max(buildDepth, 5));

  const floors: FloorPartition[] = floorsColumns.map(({ colA, colB }, floorIndex) => {
    const rooms: LayoutRoom[] = [];
    let seq = 0;

    const depthsA = fitColumn(colA, colWidth, buildDepth);
    const depthsB = fitColumn(colB, colWidth, buildDepth);

    let y = 0;
    colA.forEach((spec, i) => {
      rooms.push(tile(spec, 0, y, colWidth, depthsA[i], floorIndex, seq++));
      y += depthsA[i];
    });
    y = 0;
    colB.forEach((spec, i) => {
      rooms.push(tile(spec, colWidth + CORRIDOR_WIDTH, y, colWidth, depthsB[i], floorIndex, seq++));
      y += depthsB[i];
    });

    const corridor = tile(
      { type: 'hallway', name: 'Hallway', targetArea: CORRIDOR_WIDTH * buildDepth },
      colWidth,
      0,
      CORRIDOR_WIDTH,
      buildDepth,
      floorIndex,
      seq++,
    );
    rooms.push(corridor);

    // Stair run sits at the rear end of the corridor, identical on every floor.
    const stairPosition = config.floors > 1
      ? { x: colWidth + CORRIDOR_WIDTH / 2, y: buildDepth - 1.5 }
      : null;

    return { rooms, corridor, stairPosition };
  });

  return { buildWidth, buildDepth, floors };
}
