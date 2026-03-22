import type { Vector2D } from '../types/blueprint';

export const PIXELS_PER_METRE = 40; // 40px = 1 metre
export const SNAP_INTERVAL = 0.1;   // snap to 0.1m

export function snap(value: number): number {
  return Math.round(value / SNAP_INTERVAL) * SNAP_INTERVAL;
}

export function metreToPixel(m: number, scale: number, offset: number): number {
  return m * PIXELS_PER_METRE * scale + offset;
}

export function pixelToMetre(px: number, scale: number, offset: number): number {
  return (px - offset) / (PIXELS_PER_METRE * scale);
}

export function wallLengthMetres(start: Vector2D, end: Vector2D): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function perpendicularOffset(
  start: Vector2D,
  end: Vector2D,
  offsetM: number,
): { start: Vector2D; end: Vector2D } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { start, end };
  // Perpendicular unit vector (rotated 90° CCW)
  const nx = -dy / len;
  const ny = dx / len;
  return {
    start: { x: start.x + nx * offsetM, y: start.y + ny * offsetM },
    end:   { x: end.x   + nx * offsetM, y: end.y   + ny * offsetM },
  };
}
