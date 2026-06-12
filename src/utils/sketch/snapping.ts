/**
 * snapping.ts — smart snapping pipeline for the sketch canvas.
 *
 * One resolution order covers smart-snap, auto-close and right-angle assist:
 *   close-loop  → the point is near the active polyline's origin (closing a room)
 *   endpoint    → attracted to an existing wall endpoint (chaining walls)
 *   midpoint    → attracted to an existing wall midpoint
 *   axis        → the active segment is nearly horizontal/vertical → clamp square
 *   grid        → plain grid rounding (always succeeds)
 *
 * Pure module — vitest-tested, no React/Skia imports.
 */
import type { Vector2D } from '../../types/blueprint';

export interface SnapStroke {
  start: Vector2D;
  end: Vector2D;
}

export type SnapKind = 'close-loop' | 'endpoint' | 'midpoint' | 'axis' | 'grid';

export interface SnapResult {
  point: Vector2D;
  kind: SnapKind;
}

export interface SnapOptions {
  /** Attraction radius for endpoints/midpoints (metres). */
  attractRadius: number;
  /** Larger radius for closing the active polyline back to its origin. */
  closeRadius: number;
  /** Grid step (metres). */
  gridStep: number;
  /** Max angular deviation (degrees) for the orthogonal clamp. */
  axisToleranceDeg: number;
}

export const DEFAULT_SNAP_OPTIONS: SnapOptions = {
  attractRadius: 0.3,
  closeRadius: 0.5,
  gridStep: 0.1,
  axisToleranceDeg: 7,
};

function dist(a: Vector2D, b: Vector2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function snapGrid(v: number, step: number): number {
  return Math.round(v / step) * step;
}

/**
 * Resolve where a raw pointer position should land.
 *
 * @param raw          pointer position in metres
 * @param strokes      committed strokes (their endpoints/midpoints attract)
 * @param activeStart  origin of the polyline being drawn (close-loop target), or null
 * @param opts         radii/grid configuration
 */
export function smartSnap(
  raw: Vector2D,
  strokes: readonly SnapStroke[],
  activeStart: Vector2D | null,
  opts: SnapOptions = DEFAULT_SNAP_OPTIONS,
): SnapResult {
  // 1. Close the loop — wins even over endpoint snap, with a larger radius.
  if (activeStart && dist(raw, activeStart) <= opts.closeRadius) {
    return { point: { x: activeStart.x, y: activeStart.y }, kind: 'close-loop' };
  }

  // 2./3. Endpoint then midpoint attraction — nearest candidate wins its tier.
  let bestEndpoint: Vector2D | null = null;
  let bestEndpointD = opts.attractRadius;
  let bestMidpoint: Vector2D | null = null;
  let bestMidpointD = opts.attractRadius;
  for (const s of strokes) {
    for (const p of [s.start, s.end]) {
      const d = dist(raw, p);
      if (d < bestEndpointD) { bestEndpointD = d; bestEndpoint = p; }
    }
    const mid = { x: (s.start.x + s.end.x) / 2, y: (s.start.y + s.end.y) / 2 };
    const dm = dist(raw, mid);
    if (dm < bestMidpointD) { bestMidpointD = dm; bestMidpoint = mid; }
  }
  if (bestEndpoint) return { point: { x: bestEndpoint.x, y: bestEndpoint.y }, kind: 'endpoint' };
  if (bestMidpoint) return { point: { x: bestMidpoint.x, y: bestMidpoint.y }, kind: 'midpoint' };

  // 4. Orthogonal assist — only meaningful while a segment is being drawn.
  if (activeStart) {
    const dx = raw.x - activeStart.x;
    const dy = raw.y - activeStart.y;
    const len = Math.hypot(dx, dy);
    if (len > 1e-9) {
      const angle = (Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI; // 0 = horizontal, 90 = vertical
      if (angle <= opts.axisToleranceDeg) {
        return { point: { x: snapGrid(raw.x, opts.gridStep), y: activeStart.y }, kind: 'axis' };
      }
      if (angle >= 90 - opts.axisToleranceDeg) {
        return { point: { x: activeStart.x, y: snapGrid(raw.y, opts.gridStep) }, kind: 'axis' };
      }
    }
  }

  // 5. Grid fallback.
  return {
    point: { x: snapGrid(raw.x, opts.gridStep), y: snapGrid(raw.y, opts.gridStep) },
    kind: 'grid',
  };
}
