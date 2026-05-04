import { randomUUID } from 'expo-crypto';
import type { LayoutRoom, LayoutConfig, Rectangle } from './types';
import { ROOM_MINIMA } from './types';

/** Split a rectangle along a horizontal or vertical line */
function splitRectangle(rect: Rectangle, horizontal: boolean, splitAt: number): [Rectangle, Rectangle] {
  if (horizontal) {
    const a: Rectangle = { x: rect.x, y: rect.y, width: rect.width, height: splitAt };
    const b: Rectangle = { x: rect.x, y: rect.y + splitAt, width: rect.width, height: rect.height - splitAt };
    return [a, b];
  } else {
    const a: Rectangle = { x: rect.x, y: rect.y, width: splitAt, height: rect.height };
    const b: Rectangle = { x: rect.x + splitAt, y: rect.y, width: rect.width - splitAt, height: rect.height };
    return [a, b];
  }
}

/** Check if a room fits inside a rectangle respecting minima */
function roomFits(rect: Rectangle, minW: number, minH: number): boolean {
  return rect.width >= minW && rect.height >= minH;
}

/** Compute how many rooms of given type can fit in a free space */
function countFitting(rect: Rectangle, roomW: number, roomH: number): number {
  const cols = Math.floor(rect.width / roomW);
  const rows = Math.floor(rect.height / roomH);
  return cols * rows;
}

interface BSPNode {
  rect: Rectangle;
  room: LayoutRoom | null;
  children: [BSPNode | null, BSPNode | null];
  horizontal: boolean;
  splitAt: number;
}

/** Build a BSP tree by recursively splitting space for each room requirement */
function buildBSPTree(
  rect: Rectangle,
  roomReqs: Array<{ type: LayoutRoom['type']; name: string; minW: number; minH: number; count: number; aspect: number }>,
  depth: number,
): BSPNode {
  if (roomReqs.length === 0) {
    return { rect, room: null, children: [null, null], horizontal: false, splitAt: 0 };
  }

  const [req, ...rest] = roomReqs;
  const min = ROOM_MINIMA[req.type] ?? { minWidth: 2.0, minHeight: 2.0 };
  const minW = Math.max(req.minW, min.minWidth);
  const minH = Math.max(req.minH, min.minHeight);

  if (!roomFits(rect, minW, minH)) {
    return buildBSPTree(rect, rest, depth + 1);
  }

  // Choose split direction based on aspect ratio preference
  const preferHorizontal = req.aspect < 1;
  const horizontal = rect.width > rect.height ? !preferHorizontal : preferHorizontal;

  let splitAt: number;
  let attempts = 0;

  do {
    if (horizontal) {
      const minSplit = minH * req.count;
      const maxSplit = rect.height - minH;
      splitAt = minSplit + Math.random() * (maxSplit - minSplit);
      splitAt = Math.max(minH, Math.min(splitAt, rect.height - minH));
    } else {
      const minSplit = minW * req.count;
      const maxSplit = rect.width - minW;
      splitAt = minSplit + Math.random() * (maxSplit - minSplit);
      splitAt = Math.max(minW, Math.min(splitAt, rect.width - minW));
    }
    attempts++;
  } while (attempts < 10 && (splitAt < minH || splitAt > rect.height - minH || rect.height - splitAt < minH));

  const [left, right] = splitRectangle(rect, horizontal, splitAt);

  // Assign room to the first (larger) split
  const targetRect = horizontal ? left : (left.width >= right.width ? left : right);
  const otherRect = horizontal ? right : (left.width >= right.width ? right : left);

  const layoutRoom: LayoutRoom = {
    id: randomUUID(),
    type: req.type,
    name: req.name,
    x: targetRect.x,
    y: targetRect.y,
    width: targetRect.width,
    height: targetRect.height,
    floorIndex: 0,
  };

  if (!roomFits(targetRect, minW, minH)) {
    return buildBSPTree(rect, rest, depth + 1);
  }

  const node: BSPNode = {
    rect,
    room: layoutRoom,
    horizontal,
    splitAt,
    children: [
      buildBSPTree(targetRect, [], depth + 1),
      buildBSPTree(otherRect, rest, depth + 1),
    ],
  };

  return node;
}

/** Flatten BSP tree into a list of rooms */
function flattenBSP(node: BSPNode): LayoutRoom[] {
  const rooms: LayoutRoom[] = [];
  if (node.room) rooms.push(node.room);
  for (const child of node.children) {
    if (child) rooms.push(...flattenBSP(child));
  }
  return rooms;
}

/** Main packing function: pack all rooms into the plot using BSP */
export function packRooms(config: LayoutConfig): LayoutRoom[] {
  const plotRect: Rectangle = { x: 0, y: 0, width: config.plotWidth, height: config.plotDepth };

  // Expand room requirements with individual rooms
  const roomReqs: Array<{ type: LayoutRoom['type']; name: string; minW: number; minH: number; count: number; aspect: number }> = [];

  for (const room of config.rooms) {
    const count = room.count ?? 1;
    for (let i = 0; i < count; i++) {
      roomReqs.push({
        type: room.type,
        name: room.name,
        minW: room.minWidth,
        minH: room.minHeight,
        count: 1,
        aspect: room.preferredAspect,
      });
    }
  }

  const tree = buildBSPTree(plotRect, roomReqs, 0);
  return flattenBSP(tree);
}

/** Check for overlapping rooms */
export function detectOverlaps(rooms: LayoutRoom[]): boolean {
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i];
      const b = rooms[j];
      const overlaps = !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
      if (overlaps) return true;
    }
  }
  return false;
}