/**
 * polygonUtils.ts — Core 2D geometry math for architectural validation.
 *
 * All units in metres. Coordinate system: X = east, Y = north, (0,0) = bottom-left.
 */

import type { Vector2D } from '../../types/blueprint';

/** Euclidean distance between two points. */
export function distance(a: Vector2D, b: Vector2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Check if two points are within tolerance (default 0.05m = 5cm). */
export function pointsEqual(a: Vector2D, b: Vector2D, tolerance = 0.05): boolean {
  return distance(a, b) <= tolerance;
}

/**
 * Shoelace formula — signed area of a polygon defined by ordered vertices.
 * Positive = counter-clockwise, negative = clockwise.
 * Returns absolute area in m².
 */
export function polygonArea(vertices: Vector2D[]): number {
  const n = vertices.length;
  if (n < 3) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const curr = vertices[i];
    const next = vertices[(i + 1) % n];
    sum += curr.x * next.y - next.x * curr.y;
  }
  return Math.abs(sum) / 2;
}

/** Centroid of a polygon (geometric average of vertices). */
export function polygonCentroid(vertices: Vector2D[]): Vector2D {
  const n = vertices.length;
  if (n === 0) return { x: 0, y: 0 };
  let cx = 0;
  let cy = 0;
  for (const v of vertices) {
    cx += v.x;
    cy += v.y;
  }
  return { x: cx / n, y: cy / n };
}

/**
 * Point-in-polygon test using ray casting algorithm.
 * Returns true if point is inside or on the boundary of the polygon.
 */
export function pointInPolygon(point: Vector2D, polygon: Vector2D[]): boolean {
  const n = polygon.length;
  if (n < 3) return false;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if (
      (yi > point.y) !== (yj > point.y) &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Axis-aligned bounding box of a set of points.
 * Returns { minX, minY, maxX, maxY, width, height } in metres.
 */
export function boundingBox(points: Vector2D[]): {
  minX: number; minY: number; maxX: number; maxY: number;
  width: number; height: number;
} {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Snap a value to a grid.
 * @param value — value in metres
 * @param gridSize — grid cell size in metres (default 0.05m = 5cm)
 */
export function snapToGrid(value: number, gridSize = 0.05): number {
  return Math.round(value / gridSize) * gridSize;
}

/** Snap a Vector2D to grid. */
export function snapPointToGrid(p: Vector2D, gridSize = 0.05): Vector2D {
  return {
    x: snapToGrid(p.x, gridSize),
    y: snapToGrid(p.y, gridSize),
  };
}

/**
 * Check if an axis-aligned rectangle (defined by position + dimensions)
 * fits entirely within a polygon.
 * Tests the 4 corners of the rectangle.
 */
export function rectangleFitsInPolygon(
  center: Vector2D,
  width: number,
  depth: number,
  rotationY: number,
  polygon: Vector2D[],
): boolean {
  // Generate 4 corners of the rotated rectangle
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);
  const hw = width / 2;
  const hd = depth / 2;
  const corners: Vector2D[] = [
    { x: center.x + hw * cos - hd * sin, y: center.y + hw * sin + hd * cos },
    { x: center.x - hw * cos - hd * sin, y: center.y - hw * sin + hd * cos },
    { x: center.x - hw * cos + hd * sin, y: center.y - hw * sin - hd * cos },
    { x: center.x + hw * cos + hd * sin, y: center.y + hw * sin - hd * cos },
  ];
  return corners.every(c => pointInPolygon(c, polygon));
}

/**
 * Minimum distance from a point to a line segment.
 */
export function pointToSegmentDistance(
  point: Vector2D,
  segStart: Vector2D,
  segEnd: Vector2D,
): number {
  const dx = segEnd.x - segStart.x;
  const dy = segEnd.y - segStart.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distance(point, segStart);

  let t = ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  return distance(point, {
    x: segStart.x + t * dx,
    y: segStart.y + t * dy,
  });
}

/**
 * Check if two line segments intersect (not just touch at endpoints).
 */
export function segmentsIntersect(
  a1: Vector2D, a2: Vector2D,
  b1: Vector2D, b2: Vector2D,
): boolean {
  const d1 = direction(b1, b2, a1);
  const d2 = direction(b1, b2, a2);
  const d3 = direction(a1, a2, b1);
  const d4 = direction(a1, a2, b2);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  if (d1 === 0 && onSegment(b1, b2, a1)) return true;
  if (d2 === 0 && onSegment(b1, b2, a2)) return true;
  if (d3 === 0 && onSegment(a1, a2, b1)) return true;
  if (d4 === 0 && onSegment(a1, a2, b2)) return true;

  return false;
}

function direction(a: Vector2D, b: Vector2D, c: Vector2D): number {
  return (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
}

function onSegment(a: Vector2D, b: Vector2D, c: Vector2D): boolean {
  return (
    Math.min(a.x, b.x) <= c.x && c.x <= Math.max(a.x, b.x) &&
    Math.min(a.y, b.y) <= c.y && c.y <= Math.max(a.y, b.y)
  );
}
