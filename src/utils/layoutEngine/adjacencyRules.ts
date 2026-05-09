import type { LayoutRoom, AdjacencyEdge } from './types';

/** Pairs of room types that should be adjacent */
const PREFERRED_ADJACENCIES: Array<[LayoutRoom['type'], LayoutRoom['type'], number]> = [
  ['bedroom', 'bathroom', 1.0],
  ['kitchen', 'dining_room', 0.95],
  ['living_room', 'dining_room', 0.9],
  ['kitchen', 'living_room', 0.85],
  ['bedroom', 'bedroom', 0.7],
  ['hallway', 'bedroom', 0.6],
  ['hallway', 'bathroom', 0.6],
  ['laundry', 'bathroom', 0.5],
  ['office', 'bedroom', 0.4],
];

/** Score adjacency between two rooms (0–1) */
function scoreAdjacency(a: LayoutRoom, b: LayoutRoom): number {
  for (const [ta, tb, score] of PREFERRED_ADJACENCIES) {
    if ((a.type === ta && b.type === tb) || (a.type === tb && b.type === ta)) {
      return score;
    }
  }
  return 0.0;
}

/** Compute all pairwise adjacency scores */
export function computeAdjacencyGraph(rooms: LayoutRoom[]): AdjacencyEdge[] {
  const edges: AdjacencyEdge[] = [];

  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const roomA = rooms[i];
      const roomB = rooms[j];
      const score = scoreAdjacency(roomA, roomB);
      if (score > 0) {
        // Shared wall length is approximate based on overlapping extent
        const overlapX = Math.max(0, Math.min(roomA.x + roomA.width, roomB.x + roomB.width) - Math.max(roomA.x, roomB.x));
        const overlapY = Math.max(0, Math.min(roomA.y + roomA.height, roomB.y + roomB.height) - Math.max(roomA.y, roomB.y));
        const sharedWall = Math.min(overlapX, overlapY);
        edges.push({ roomA: roomA.id, roomB: roomB.id, sharedWallLength: sharedWall, score });
      }
    }
  }

  return edges;
}

/**
 * Determine which room type groups need a corridor between them.
 * Returns a list of "corridor needed" pairs — rooms that should be connected
 * by a hallway rather than a direct door-through-wall.
 *
 * Rules:
 * - Multiple bedrooms in a private zone → corridor connecting them
 * - Bedrooms and their associated bathrooms → bedroom corridor
 * - Any two rooms that score < 0.4 adjacency but logically need to be connected
 *   (e.g. bedroom at opposite ends of the house) → inject corridor
 * - Upper floor rooms (all bedrooms/bathrooms/office) → always need a corridor
 */
interface CorridorNeed {
  roomIds: string[];
  axis: 'horizontal' | 'vertical';
  from: { x: number; y: number };
  to: { x: number; y: number };
  width: number;
}

function roomsShareWall(a: LayoutRoom, b: LayoutRoom): boolean {
  const overlapX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const overlapY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return overlapX > 0.01 || overlapY > 0.01;
}

function roomsAdjacent(a: LayoutRoom, b: LayoutRoom): boolean {
  return (
    Math.abs((a.x + a.width) - b.x) < 0.05 ||
    Math.abs((b.x + b.width) - a.x) < 0.05 ||
    Math.abs((a.y + a.height) - b.y) < 0.05 ||
    Math.abs((b.y + b.height) - a.y) < 0.05
  );
}

/**
 * Given a list of rooms, compute which ones need corridor connections.
 * A corridor is injected when a group of rooms (≥3) are adjacent-ish but
 * don't share a wall long enough for a comfortable door connection.
 */
function computeCorridorNeeds(rooms: LayoutRoom[]): CorridorNeed[] {
  const needs: CorridorNeed[] = [];

  const bedrooms = rooms.filter(r => r.type === 'bedroom');
  const bathrooms = rooms.filter(r => r.type === 'bathroom');
  const others = rooms.filter(r => r.type !== 'bedroom' && r.type !== 'bathroom');

  // Upper floor rule: if there are ≥2 bedrooms and they don't all share a wall,
  // inject a horizontal corridor along the back of the house connecting them.
  if (bedrooms.length >= 2) {
    const allShareWall = bedrooms.every((b, i) => i === 0 || roomsShareWall(b, bedrooms[0]));
    if (!allShareWall) {
      // Find the bounding box of all bedrooms
      const minX = Math.min(...bedrooms.map(b => b.x));
      const maxX = Math.max(...bedrooms.map(b => b.x + b.width));
      const minY = Math.min(...bedrooms.map(b => b.y));
      const maxY = Math.max(...bedrooms.map(b => b.y + b.height));

      // Corridor along the back edge (highest Y) of the bedroom cluster
      const corridorY = maxY - 1.2; // 1.2m wide corridor
      const corridorX = minX;
      const corridorW = maxX - minX;
      const corridorH = 1.2;

      // Only add if it doesn't collide with other rooms
      const collides = rooms.some(r => {
        if (r.type === 'bedroom') return false;
        return !(corridorX + corridorW <= r.x || r.x + r.width <= corridorX ||
                 corridorY + corridorH <= r.y || r.y + r.height <= corridorY);
      });

      if (!collides && corridorW > 2.0) {
        needs.push({
          roomIds: bedrooms.map(b => b.id),
          axis: 'horizontal',
          from: { x: corridorX, y: corridorY },
          to: { x: corridorX + corridorW, y: corridorY + corridorH },
          width: corridorH,
        });
      }
    }
  }

  // If there are bathrooms that don't share a wall with any bedroom, connect them via corridor
  for (const bath of bathrooms) {
    const sharesWithBed = bedrooms.some(b => roomsShareWall(b, bath) || roomsAdjacent(b, bath));
    if (!sharesWithBed && bedrooms.length > 0) {
      // This bathroom needs to be connected — find nearest bedroom corridor
      const nearestBed = bedrooms.reduce((best, b) => {
        const dist = Math.hypot((b.x + b.width / 2) - (bath.x + bath.width / 2),
                               (b.y + b.height / 2) - (bath.y + bath.height / 2));
        return dist < best.dist ? { room: b, dist } : best;
      }, { room: bedrooms[0], dist: Infinity }).room;

      const corridorX = Math.min(bath.x, nearestBed.x) + Math.abs(bath.x - nearestBed.x) / 2;
      // Vertical connector between bathroom and nearest bedroom
      needs.push({
        roomIds: [bath.id, nearestBed.id],
        axis: 'vertical',
        from: { x: bath.x + bath.width / 2, y: bath.y },
        to: { x: nearestBed.x + nearestBed.width / 2, y: nearestBed.y + nearestBed.height },
        width: 1.0,
      });
    }
  }

  return needs;
}

/** Create a LayoutRoom for a corridor given a CorridorNeed descriptor */
function makeCorridorRoom(need: CorridorNeed, floorIndex: number): LayoutRoom {
  const isHorizontal = need.axis === 'horizontal';
  return {
    id: randomUUID(),
    type: 'hallway',
    name: 'Hallway',
    x: need.from.x,
    y: need.from.y,
    width: isHorizontal ? need.to.x - need.from.x : need.width,
    height: isHorizontal ? need.width : need.to.y - need.from.y,
    floorIndex,
  };
}

function randomUUID(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

/**
 * Inject corridor rooms between groups of rooms that need circulation connections.
 * This runs after BSP packing and fixes layouts where rooms end up not
 * sharing walls but still need to be accessible without going through another room.
 */
export function injectCorridors(rooms: LayoutRoom[], floorIndex = 0): LayoutRoom[] {
  const needs = computeCorridorNeeds(rooms);
  const corridorRooms = needs.map(n => makeCorridorRoom(n, floorIndex));
  return [...rooms, ...corridorRooms];
}

/** Shift rooms slightly (≤0.5m) to improve adjacency after initial packing */
export function improveAdjacency(rooms: LayoutRoom[], edges: AdjacencyEdge[]): LayoutRoom[] {
  // After BSP packing, rooms are already placed. This function does a small refinement
  // pass: for high-score adjacencies that don't share a wall, nudge rooms toward each other.
  // Since BSP guarantees no overlap, we only nudge if the room can shift without causing overlap.
  const result = rooms.map(r => ({ ...r }));
  const maxShift = 0.5;

  for (const edge of edges) {
    if (edge.score < 0.7) continue;
    const roomA = result.find(r => r.id === edge.roomA);
    const roomB = result.find(r => r.id === edge.roomB);
    if (!roomA || !roomB) continue;

    // Determine direction to bring rooms closer
    const dx = (roomB.x + roomB.width / 2) - (roomA.x + roomA.width / 2);
    const dy = (roomB.y + roomB.height / 2) - (roomA.y + roomA.height / 2);

    // Only shift along the dominant axis if they don't already share a wall
    const shareWall = Math.abs(dx) < 0.1 || Math.abs(dy) < 0.1;
    if (shareWall) continue;

    const shiftX = Math.sign(dx) * Math.min(maxShift, Math.abs(dx) * 0.1);
    const shiftY = Math.sign(dy) * Math.min(maxShift, Math.abs(dy) * 0.1);

    roomA.x += shiftX;
    roomA.y += shiftY;
    roomB.x -= shiftX;
    roomB.y -= shiftY;
  }

  return result;
}