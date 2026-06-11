// Pure curve/arc tessellation for the freehand sketch canvas.
// Extracted from SketchScreen so the geometry is unit-testable; SketchScreen
// maps the returned segments onto SketchWall objects (id, isPreview).

import type { Vector2D } from '../../types/blueprint';

export interface CurveSegment {
  start: Vector2D;
  end: Vector2D;
}

function dist2D(a: Vector2D, b: Vector2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Consecutive point pairs as segments, dropping zero-length ones. */
function pointsToSegments(pts: Vector2D[]): CurveSegment[] {
  const segments: CurveSegment[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    if (dist2D(pts[i], pts[i + 1]) > 1e-9) {
      segments.push({ start: pts[i], end: pts[i + 1] });
    }
  }
  return segments;
}

/** Catmull-Rom cubic Bezier spline through points — returns array of {cp1, cp2, end} for Skia cubicTo */
export function catmullRomToBezier(
  pts: Vector2D[],
  tension = 0.5,
): Array<{ cp1: Vector2D; cp2: Vector2D; end: Vector2D }> {
  if (pts.length < 2) return [];
  if (pts.length === 2) {
    return [{ cp1: pts[0], cp2: pts[1], end: pts[1] }];
  }
  const result: Array<{ cp1: Vector2D; cp2: Vector2D; end: Vector2D }> = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[0];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i < pts.length - 2 ? pts[i + 2] : pts[pts.length - 1];
    const cp1: Vector2D = { x: p1.x + (p2.x - p0.x) * tension / 3, y: p1.y + (p2.y - p0.y) * tension / 3 };
    const cp2: Vector2D = { x: p2.x - (p3.x - p1.x) * tension / 3, y: p2.y - (p3.y - p1.y) * tension / 3 };
    result.push({ cp1, cp2, end: p2 });
  }
  return result;
}

function cubicBezierPoint(p0: Vector2D, cp1: Vector2D, cp2: Vector2D, p3: Vector2D, t: number): Vector2D {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * mt * p0.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t2 * t * p3.x,
    y: mt2 * mt * p0.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t2 * t * p3.y,
  };
}

/**
 * Tessellate a smooth Catmull-Rom curve through `pts` into wall segments.
 * The chain starts exactly at pts[0], ends exactly at pts[last], and each
 * segment's start equals the previous segment's end.
 */
export function curveToSegments(pts: Vector2D[], resolution = 0.1): CurveSegment[] {
  if (pts.length < 2) return [];
  const beziers = catmullRomToBezier(pts);
  const sampled: Vector2D[] = [pts[0]];
  beziers.forEach((seg, i) => {
    const p0 = pts[i]; // Bezier i runs from pts[i] to pts[i+1]
    const approxLen = dist2D(p0, seg.cp1) + dist2D(seg.cp1, seg.cp2) + dist2D(seg.cp2, seg.end);
    const steps = Math.max(4, Math.ceil(approxLen / resolution));
    for (let s = 1; s <= steps; s++) {
      sampled.push(cubicBezierPoint(p0, seg.cp1, seg.cp2, seg.end, s / steps));
    }
  });
  return pointsToSegments(sampled);
}

/** Signed sagitta: how far bulgeDir reaches perpendicular to the start→end chord. */
function signedSagitta(start: Vector2D, end: Vector2D, bulgeDir: Vector2D): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const chord = Math.sqrt(dx * dx + dy * dy);
  if (chord === 0) return 0;
  // Unit perpendicular to the chord
  const perpX = -dy / chord;
  const perpY = dx / chord;
  return bulgeDir.x * perpX + bulgeDir.y * perpY;
}

/**
 * Centre/radius/angles of the circular arc from start to end whose apex is
 * displaced from the chord midpoint by the perpendicular component of
 * bulgeDir (the drag vector). Standard chord/sagitta relation:
 * r = (c²/4 + s²) / 2s.
 */
export function circularArcPoints(
  start: Vector2D,
  end: Vector2D,
  bulgeDir: Vector2D,
): { cx: number; cy: number; r: number; startAngle: number; endAngle: number } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const chord = Math.sqrt(dx * dx + dy * dy);
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const sag = signedSagitta(start, end, bulgeDir);
  if (chord === 0 || Math.abs(sag) < 1e-9) {
    // Degenerate — no usable arc; callers treat this as a straight line.
    return { cx: midX, cy: midY, r: chord / 2, startAngle: 0, endAngle: Math.PI };
  }
  const perpX = -dy / chord;
  const perpY = dx / chord;
  const s = Math.abs(sag);
  const r = (chord * chord / 4 + s * s) / (2 * s);
  const side = sag >= 0 ? 1 : -1;
  // Apex sits at mid + perp·sag; the centre lies on the apex→mid line at
  // distance r from the apex, i.e. offset (s − r) from the midpoint.
  const cx = midX + perpX * side * (s - r);
  const cy = midY + perpY * side * (s - r);
  const startAngle = Math.atan2(start.y - cy, start.x - cx);
  const endAngle = Math.atan2(end.y - cy, end.x - cx);
  return { cx, cy, r, startAngle, endAngle };
}

const TWO_PI = Math.PI * 2;

/** Sweep from startAngle to endAngle that passes through viaAngle (CCW positive). */
function sweepThrough(startAngle: number, endAngle: number, viaAngle: number): number {
  const norm = (a: number) => ((a % TWO_PI) + TWO_PI) % TWO_PI;
  const ccwSweep = norm(endAngle - startAngle);
  const viaOffset = norm(viaAngle - startAngle);
  return viaOffset <= ccwSweep ? ccwSweep : ccwSweep - TWO_PI;
}

/**
 * Tessellate a circular arc into wall segments. The chain starts exactly at
 * `start`, ends exactly at `end`, and sweeps through the bulge apex (so
 * major arcs >180° go the right way around). A near-zero bulge degrades to
 * a straight line. (The previous implementation skipped the first segment
 * and computed the sagitta from the wrong dot product.)
 */
export function arcToSegments(
  start: Vector2D,
  end: Vector2D,
  bulgeDir: Vector2D,
  resolution = 0.1,
): CurveSegment[] {
  const sag = signedSagitta(start, end, bulgeDir);
  if (Math.abs(sag) < 1e-3) {
    // Effectively straight — subdivide the chord at the same resolution.
    const steps = Math.max(1, Math.ceil(dist2D(start, end) / resolution));
    const sampledLine: Vector2D[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      sampledLine.push({ x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t });
    }
    return pointsToSegments(sampledLine);
  }

  const { cx, cy, r, startAngle, endAngle } = circularArcPoints(start, end, bulgeDir);
  // The apex is the point the user dragged to — the arc must pass through it.
  const apexAngle = Math.atan2(
    (start.y + end.y) / 2 + ((end.x - start.x) / dist2D(start, end)) * sag - cy,
    (start.x + end.x) / 2 + (-(end.y - start.y) / dist2D(start, end)) * sag - cx,
  );
  const sweep = sweepThrough(startAngle, endAngle, apexAngle);
  const arcLen = Math.abs(r * sweep);
  const steps = Math.max(4, Math.ceil(arcLen / resolution));
  const sampled: Vector2D[] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + sweep * (i / steps);
    sampled.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  return pointsToSegments(sampled);
}
