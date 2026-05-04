import { randomUUID } from 'expo-crypto';
import type { LayoutRoom, WallSegment } from './types';

interface RectWall {
  room: LayoutRoom;
  side: 'top' | 'right' | 'bottom' | 'left';
  wall: WallSegment;
}

/** Extract all wall segments from placed rooms, classifying exterior vs interior */
export function buildWalls(rooms: LayoutRoom[]): WallSegment[] {
  const walls: WallSegment[] = [];

  for (const room of rooms) {
    const sides: Array<{ side: 'top' | 'right' | 'bottom' | 'left'; x1: number; y1: number; x2: number; y2: number }> = [
      { side: 'top',    x1: room.x,         y1: room.y,          x2: room.x + room.width, y2: room.y },
      { side: 'right',  x1: room.x + room.width, y1: room.y,    x2: room.x + room.width, y2: room.y + room.height },
      { side: 'bottom',x1: room.x,         y1: room.y + room.height, x2: room.x + room.width, y2: room.y + room.height },
      { side: 'left',   x1: room.x,         y1: room.y,          x2: room.x,              y2: room.y + room.height },
    ];

    for (const s of sides) {
      const isExterior = isExteriorWall(room, s.side, rooms);
      walls.push({
        id: randomUUID(),
        start: { x: s.x1, y: s.y1 },
        end: { x: s.x2, y: s.y2 },
        isExterior,
        adjacentRooms: isExterior
          ? [room.id, null]
          : findAdjacentRoom(room, s.side, rooms),
      });
    }
  }

  // Deduplicate: merge collinear adjacent walls and remove exact duplicates
  const merged = mergeCollinearWalls(walls);
  return merged;
}

function isExteriorWall(room: LayoutRoom, side: 'top' | 'right' | 'bottom' | 'left', allRooms: LayoutRoom[]): boolean {
  const eps = 0.05;
  for (const other of allRooms) {
    if (other.id === room.id) continue;
    if (side === 'top'    && Math.abs(other.y + other.height - room.y) < eps && rangesOverlap(other.x, other.x + other.width, room.x, room.x + room.width)) return false;
    if (side === 'bottom' && Math.abs(other.y - (room.y + room.height)) < eps && rangesOverlap(other.x, other.x + other.width, room.x, room.x + room.width)) return false;
    if (side === 'left'   && Math.abs(other.x + other.width - room.x) < eps && rangesOverlap(other.y, other.y + other.height, room.y, room.y + room.height)) return false;
    if (side === 'right'  && Math.abs(other.x - (room.x + room.width)) < eps && rangesOverlap(other.y, other.y + other.height, room.y, room.y + room.height)) return false;
  }
  return true;
}

function rangesOverlap(a1: number, a2: number, b1: number, b2: number): boolean {
  return a1 < b2 && a2 > b1;
}

function findAdjacentRoom(room: LayoutRoom, side: 'top' | 'right' | 'bottom' | 'left', allRooms: LayoutRoom[]): [string, string | null] {
  const eps = 0.05;
  for (const other of allRooms) {
    if (other.id === room.id) continue;
    let adjacent = false;
    if (side === 'top'    && Math.abs(other.y + other.height - room.y) < eps && rangesOverlap(other.x, other.x + other.width, room.x, room.x + room.width)) adjacent = true;
    if (side === 'bottom' && Math.abs(other.y - (room.y + room.height)) < eps && rangesOverlap(other.x, other.x + other.width, room.x, room.x + room.width)) adjacent = true;
    if (side === 'left'   && Math.abs(other.x + other.width - room.x) < eps && rangesOverlap(other.y, other.y + other.height, room.y, room.y + room.height)) adjacent = true;
    if (side === 'right'  && Math.abs(other.x - (room.x + room.width)) < eps && rangesOverlap(other.y, other.y + other.height, room.y, room.y + room.height)) adjacent = true;
    if (adjacent) return [room.id, other.id];
  }
  return [room.id, null];
}

function mergeCollinearWalls(walls: WallSegment[]): WallSegment[] {
  // Simple merge: group walls by orientation + proximity, keep longest spans
  const groups: Map<string, WallSegment[]> = new Map();

  for (const w of walls) {
    const horiz = Math.abs(w.start.y - w.end.y) < 0.05;
    const key = horiz ? `H_${w.start.y.toFixed(2)}` : `V_${w.start.x.toFixed(2)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(w);
  }

  const merged: WallSegment[] = [];

  for (const [, group] of groups) {
    // Sort by start coordinate along the axis
    group.sort((a, b) => (Math.abs(a.start.x - b.start.x) < 0.05 ? a.start.y - b.start.y : a.start.x - b.start.x));
    for (const w of group) merged.push(w);
  }

  return merged;
}