/**
 * doorPlanner.ts — adjacency-driven door placement on genuine shared walls.
 *
 * Works on the shared wall graph from wallGraphBuilder: every door sits on a
 * wall segment that two rooms actually share (or an exterior wall for the
 * entry/garden doors). Rules mirror the circulation scorer:
 *  - every room gets a door to the hallway it borders (full reachability)
 *  - bedrooms/bathrooms connect ONLY to the hallway (never directly into
 *    living/dining/kitchen) — a bathroom bordering exactly one bedroom and
 *    no hallway becomes an ensuite instead
 *  - one main entry on the hallway's front exterior wall
 *  - optional garden sliding door on a rear exterior wall
 *  - BFS post-check: any still-unreachable room gets a rescue door through
 *    its best non-private neighbour
 */

import type { LayoutRoom, WallSegment } from './types';
import type { LogicalOpening, DoorRole } from './openingPlacer';

const DOOR_WIDTH = 0.9;
const ENTRY_WIDTH = 1.0;
const CORNER_OFFSET = 0.2;
const MIN_SHARED = DOOR_WIDTH + 2 * CORNER_OFFSET;

export interface DoorPlanOptions {
  hasGarden?: boolean;
}

function segLength(w: WallSegment): number {
  return Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y);
}

let doorCounter = 0;
function door(wall: WallSegment, width: number, type: 'door' | 'sliding_door', role: DoorRole): LogicalOpening {
  const len = segLength(wall);
  const usable = Math.min(width, len - 2 * CORNER_OFFSET);
  return {
    id: `door-${wall.id}-${doorCounter++}`,
    wallId: wall.id,
    type,
    position: Math.max(CORNER_OFFSET, (len - usable) / 2),
    width: usable,
    height: 2.1,
    sillHeight: 0,
    doorRole: role,
    hingeSide: 'left',
  };
}

/** Longest shared wall between two specific rooms (≥ MIN_SHARED), or null. */
function sharedWall(walls: WallSegment[], a: string, b: string): WallSegment | null {
  let best: WallSegment | null = null;
  for (const w of walls) {
    const [ra, rb] = w.adjacentRooms;
    if (rb === null) continue;
    if ((ra === a && rb === b) || (ra === b && rb === a)) {
      if (segLength(w) >= MIN_SHARED && (!best || segLength(w) > segLength(best))) best = w;
    }
  }
  return best;
}

export function planDoors(
  walls: WallSegment[],
  rooms: LayoutRoom[],
  opts: DoorPlanOptions = {},
): LogicalOpening[] {
  doorCounter = 0;
  const openings: LogicalOpening[] = [];
  const roomById = new Map(rooms.map((r) => [r.id, r]));
  const hallways = rooms.filter((r) => r.type === 'hallway');

  // Adjacency map: room → neighbours via shared walls
  const neighbours = new Map<string, Set<string>>();
  for (const w of walls) {
    const [a, b] = w.adjacentRooms;
    if (!b) continue;
    if (!neighbours.has(a)) neighbours.set(a, new Set());
    if (!neighbours.has(b)) neighbours.set(b, new Set());
    neighbours.get(a)!.add(b);
    neighbours.get(b)!.add(a);
  }

  const connected = new Set<string>(); // "a|b" pairs that already have a door
  const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

  const connect = (a: string, b: string, role: DoorRole): boolean => {
    if (connected.has(pairKey(a, b))) return true;
    const wall = sharedWall(walls, a, b);
    if (!wall) return false;
    openings.push(door(wall, DOOR_WIDTH, 'door', role));
    connected.add(pairKey(a, b));
    return true;
  };

  const roleFor = (r: LayoutRoom): DoorRole =>
    r.type === 'bedroom' ? 'bedroom'
    : r.type === 'bathroom' ? 'bathroom'
    : r.type === 'garage' ? 'garage_entry'
    : 'interior';

  // 1. Door from the hallway to every room that borders it
  for (const hall of hallways) {
    for (const nb of neighbours.get(hall.id) ?? []) {
      const room = roomById.get(nb);
      if (!room || room.type === 'hallway') continue;
      connect(hall.id, nb, roleFor(room));
    }
  }

  // 2. Rooms with no hallway connection: bathrooms bordering exactly one
  //    bedroom become ensuites; everything else doors through its best
  //    non-private neighbour (never THROUGH a bedroom unless it is the only
  //    option, and never bathroom↔kitchen).
  const hasHallDoor = (id: string) =>
    hallways.some((h) => connected.has(pairKey(h.id, id)));

  const PRIVATE = new Set(['bedroom', 'bathroom']);
  for (const room of rooms) {
    if (room.type === 'hallway' || hasHallDoor(room.id)) continue;
    const nbs = [...(neighbours.get(room.id) ?? [])]
      .map((id) => roomById.get(id)!)
      .filter(Boolean);

    if (room.type === 'bathroom') {
      const bedrooms = nbs.filter((n) => n.type === 'bedroom');
      if (bedrooms.length === 1 && connect(room.id, bedrooms[0].id, 'ensuite')) continue;
    }

    // Preference: hallway (longer wall may have been missed) → social
    // non-kitchen → kitchen (not for bathrooms) → bedroom (last resort)
    const ranked = [...nbs].sort((a, b) => doorHostRank(room, a) - doorHostRank(room, b));
    for (const host of ranked) {
      if (connect(room.id, host.id, roleFor(room))) break;
    }
  }

  // 3. Main entry: hallway's front (min-y) exterior wall; fall back to any
  //    exterior wall of the most social front room. The 1.2m corridor face
  //    qualifies: door() shrinks to the usable width (≥0.7m after offsets).
  const MIN_EXTERIOR_DOOR = 0.7 + 2 * CORNER_OFFSET;
  const exteriorOf = (roomId: string) =>
    walls.filter((w) => w.isExterior && w.adjacentRooms[0] === roomId && segLength(w) >= MIN_EXTERIOR_DOOR);
  let entryWall: WallSegment | null = null;
  for (const hall of hallways) {
    for (const w of exteriorOf(hall.id)) {
      const midY = (w.start.y + w.end.y) / 2;
      if (!entryWall || midY < (entryWall.start.y + entryWall.end.y) / 2) entryWall = w;
    }
  }
  if (!entryWall) {
    const socials = rooms
      .filter((r) => r.type === 'living_room' || r.type === 'hallway')
      .sort((a, b) => a.y - b.y);
    for (const s of socials) {
      const ext = exteriorOf(s.id);
      if (ext.length > 0) { entryWall = ext[0]; break; }
    }
  }
  if (entryWall) openings.push(door(entryWall, ENTRY_WIDTH, 'door', 'main_entry'));

  // 4. Garden sliding door — ONLY on a horizontal rear wall (the building's
  //    back face). A side wall is often a room's sole exterior wall, and a
  //    door there would displace its window (windows skip door walls).
  if (opts.hasGarden) {
    const gardenHosts = rooms.filter((r) => r.type === 'kitchen' || r.type === 'living_room' || r.type === 'dining_room');
    const maxY = Math.max(...walls.flatMap((w) => [w.start.y, w.end.y]));
    let rear: WallSegment | null = null;
    for (const host of gardenHosts) {
      for (const w of exteriorOf(host.id)) {
        const isRearFace = Math.abs(w.start.y - maxY) < 0.01 && Math.abs(w.end.y - maxY) < 0.01;
        if (isRearFace && segLength(w) >= 2.0 && (!rear || segLength(w) > segLength(rear))) rear = w;
      }
    }
    if (rear) openings.push(door(rear, DOOR_WIDTH, 'sliding_door', 'kitchen_back'));
  }

  // 5. Reachability rescue: BFS over door-connected pairs from the entry side
  const adj = new Map<string, Set<string>>();
  for (const k of connected) {
    const [a, b] = k.split('|');
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  }
  const entryRoom = entryWall ? entryWall.adjacentRooms[0] : (hallways[0]?.id ?? rooms[0]?.id);
  const reached = new Set<string>([entryRoom]);
  const queue = [entryRoom];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const nb of adj.get(cur) ?? []) {
      if (!reached.has(nb)) { reached.add(nb); queue.push(nb); }
    }
  }
  for (const room of rooms) {
    if (reached.has(room.id)) continue;
    const hosts = [...(neighbours.get(room.id) ?? [])]
      .filter((id) => reached.has(id))
      .map((id) => roomById.get(id)!)
      .sort((a, b) => doorHostRank(room, a) - doorHostRank(room, b));
    for (const host of hosts) {
      if (connect(room.id, host.id, roleFor(room))) {
        reached.add(room.id);
        break;
      }
    }
  }

  return openings;

  function doorHostRank(room: LayoutRoom, host: LayoutRoom): number {
    if (host.type === 'hallway') return 0;
    if (PRIVATE.has(host.type)) return 10; // through a bedroom/bathroom = last resort
    if (room.type === 'bathroom' && host.type === 'kitchen') return 9; // scorer: -8
    if (PRIVATE.has(room.type) && (host.type === 'living_room' || host.type === 'dining_room')) return 8; // scorer: -8
    if (host.type === 'living_room') return 1;
    return 2;
  }
}
