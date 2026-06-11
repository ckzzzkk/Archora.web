import { describe, it, expect } from 'vitest';
import {
  curveToSegments,
  arcToSegments,
  catmullRomToBezier,
  circularArcPoints,
} from '../../utils/sketch/curves';
import type { Vector2D } from '../../types/blueprint';

function dist(a: Vector2D, b: Vector2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function expectChainContinuity(segments: Array<{ start: Vector2D; end: Vector2D }>) {
  for (let i = 1; i < segments.length; i++) {
    expect(dist(segments[i].start, segments[i - 1].end)).toBeLessThan(1e-9);
  }
}

describe('curveToSegments', () => {
  const PTS: Vector2D[] = [
    { x: 0, y: 0 },
    { x: 2, y: 1 },
    { x: 4, y: 0.5 },
    { x: 6, y: 2 },
    { x: 8, y: 1 },
  ];

  it('returns empty for fewer than 2 points', () => {
    expect(curveToSegments([])).toEqual([]);
    expect(curveToSegments([{ x: 1, y: 1 }])).toEqual([]);
  });

  it('starts exactly at the first point and ends exactly at the last', () => {
    const segments = curveToSegments(PTS);
    expect(segments.length).toBeGreaterThan(0);
    expect(dist(segments[0].start, PTS[0])).toBeLessThan(1e-9);
    expect(dist(segments[segments.length - 1].end, PTS[PTS.length - 1])).toBeLessThan(1e-6);
  });

  it('forms a continuous chain (each start = previous end)', () => {
    expectChainContinuity(curveToSegments(PTS));
  });

  it('passes through every input point', () => {
    const segments = curveToSegments(PTS);
    const sampled = [segments[0].start, ...segments.map((s) => s.end)];
    for (const p of PTS) {
      const nearest = Math.min(...sampled.map((q) => dist(p, q)));
      expect(nearest).toBeLessThan(1e-6);
    }
  });

  it('respects the resolution bound (no segment wildly longer than resolution)', () => {
    const segments = curveToSegments(PTS, 0.1);
    for (const s of segments) {
      // Bezier arc-length estimate is approximate; allow 2x slack.
      expect(dist(s.start, s.end)).toBeLessThan(0.2);
    }
  });

  it('keeps a straight-line input straight', () => {
    const line: Vector2D[] = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 4, y: 0 },
    ];
    const segments = curveToSegments(line);
    for (const s of segments) {
      expect(Math.abs(s.start.y)).toBeLessThan(1e-9);
      expect(Math.abs(s.end.y)).toBeLessThan(1e-9);
    }
  });

  it('handles the 2-point degenerate case as a straight chain', () => {
    const segments = curveToSegments([{ x: 0, y: 0 }, { x: 1, y: 1 }]);
    expect(segments.length).toBeGreaterThan(0);
    expect(dist(segments[0].start, { x: 0, y: 0 })).toBeLessThan(1e-9);
    expect(dist(segments[segments.length - 1].end, { x: 1, y: 1 })).toBeLessThan(1e-6);
    expectChainContinuity(segments);
  });
});

describe('arcToSegments', () => {
  const START: Vector2D = { x: 0, y: 0 };
  const END: Vector2D = { x: 4, y: 0 };
  const BULGE: Vector2D = { x: 0, y: 1.5 };

  it('starts at the arc start point (regression: first segment was skipped)', () => {
    const segments = arcToSegments(START, END, BULGE);
    expect(segments.length).toBeGreaterThan(0);
    expect(dist(segments[0].start, START)).toBeLessThan(1e-6);
  });

  it('ends at the arc end point', () => {
    const segments = arcToSegments(START, END, BULGE);
    expect(dist(segments[segments.length - 1].end, END)).toBeLessThan(1e-6);
  });

  it('forms a continuous chain', () => {
    expectChainContinuity(arcToSegments(START, END, BULGE));
  });

  it('major arcs (>180°) sweep through the bulge apex, not the short way round', () => {
    const bigBulge: Vector2D = { x: 0, y: 3 }; // sagitta 3 > chord/2 = 2 → major arc
    const segments = arcToSegments(START, END, bigBulge);
    const apex: Vector2D = { x: 2, y: 3 };
    const nearestToApex = Math.min(...segments.map((s) => dist(s.end, apex)));
    expect(nearestToApex).toBeLessThan(0.1);
  });

  it('near-zero bulge degrades to a straight subdivided line', () => {
    const segments = arcToSegments(START, END, { x: 0, y: 0.0001 });
    expect(segments.length).toBeGreaterThan(0);
    expect(dist(segments[0].start, START)).toBeLessThan(1e-9);
    expect(dist(segments[segments.length - 1].end, END)).toBeLessThan(1e-9);
    for (const s of segments) expect(Math.abs(s.start.y)).toBeLessThan(1e-3);
  });

  it('all sampled points lie on the circle', () => {
    const { cx, cy, r } = circularArcPoints(START, END, BULGE);
    const segments = arcToSegments(START, END, BULGE);
    for (const s of segments) {
      expect(Math.abs(dist(s.start, { x: cx, y: cy }) - Math.abs(r))).toBeLessThan(1e-6);
      expect(Math.abs(dist(s.end, { x: cx, y: cy }) - Math.abs(r))).toBeLessThan(1e-6);
    }
  });
});

describe('catmullRomToBezier', () => {
  it('returns one bezier per consecutive point pair', () => {
    const pts: Vector2D[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 0 },
      { x: 3, y: 1 },
    ];
    expect(catmullRomToBezier(pts)).toHaveLength(3);
  });

  it('each bezier ends at the next input point', () => {
    const pts: Vector2D[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 0 },
    ];
    const beziers = catmullRomToBezier(pts);
    beziers.forEach((b, i) => {
      expect(b.end).toEqual(pts[i + 1]);
    });
  });
});
