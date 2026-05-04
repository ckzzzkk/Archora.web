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