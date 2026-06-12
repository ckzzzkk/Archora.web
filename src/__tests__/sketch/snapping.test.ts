import { describe, it, expect } from 'vitest';
import { smartSnap, DEFAULT_SNAP_OPTIONS, type SnapStroke } from '../../utils/sketch/snapping';

const strokes: SnapStroke[] = [
  { start: { x: 0, y: 0 }, end: { x: 4, y: 0 } },
  { start: { x: 4, y: 0 }, end: { x: 4, y: 3 } },
];

describe('smartSnap', () => {
  it('attracts to an existing endpoint inside the radius', () => {
    const r = smartSnap({ x: 4.2, y: 0.15 }, strokes, null);
    expect(r.kind).toBe('endpoint');
    expect(r.point).toEqual({ x: 4, y: 0 });
  });

  it('falls back to grid outside the attraction radius', () => {
    const r = smartSnap({ x: 2.04, y: 1.31 }, strokes, null);
    expect(r.kind).toBe('grid');
    expect(r.point.x).toBeCloseTo(2.0);
    expect(r.point.y).toBeCloseTo(1.3);
  });

  it('attracts to a midpoint when no endpoint is closer', () => {
    // Midpoint of first stroke is (2, 0)
    const r = smartSnap({ x: 2.1, y: 0.12 }, strokes, null);
    expect(r.kind).toBe('midpoint');
    expect(r.point).toEqual({ x: 2, y: 0 });
  });

  it('close-loop beats endpoint snap and uses the larger radius', () => {
    // activeStart at (0,0); point 0.45m away — outside attractRadius (0.3),
    // inside closeRadius (0.5). The (0,0) endpoint also exists in strokes.
    const r = smartSnap({ x: 0.45, y: 0 }, strokes, { x: 0, y: 0 });
    expect(r.kind).toBe('close-loop');
    expect(r.point).toEqual({ x: 0, y: 0 });
  });

  it('clamps a nearly-horizontal segment square (axis snap)', () => {
    // From (0,2): drawing to (3, 2.2) — ~3.8° off horizontal, within 7°.
    const r = smartSnap({ x: 3, y: 2.2 }, [], { x: 0, y: 2 });
    expect(r.kind).toBe('axis');
    expect(r.point.y).toBe(2);
    expect(r.point.x).toBeCloseTo(3);
  });

  it('clamps a nearly-vertical segment square', () => {
    const r = smartSnap({ x: 1.1, y: 4 }, [], { x: 1, y: 0 });
    expect(r.kind).toBe('axis');
    expect(r.point.x).toBe(1);
    expect(r.point.y).toBeCloseTo(4);
  });

  it('does not axis-clamp a clearly diagonal segment', () => {
    const r = smartSnap({ x: 3, y: 3.02 }, [], { x: 0, y: 0 });
    expect(r.kind).toBe('grid');
  });

  it('endpoint snap takes priority over axis clamp', () => {
    // Near the (4,0) endpoint AND nearly horizontal from (0,0.1).
    const r = smartSnap({ x: 4.1, y: 0.1 }, strokes, { x: 0, y: 0.1 });
    expect(r.kind).toBe('endpoint');
    expect(r.point).toEqual({ x: 4, y: 0 });
  });

  it('respects custom options', () => {
    const r = smartSnap({ x: 4.4, y: 0 }, strokes, null, { ...DEFAULT_SNAP_OPTIONS, attractRadius: 0.5 });
    expect(r.kind).toBe('endpoint');
  });
});
