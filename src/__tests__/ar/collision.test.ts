import { describe, it, expect } from 'vitest';
import { snapAngle, footprintAABB, footprintsCollide, collidesWithAny, type Footprint } from '../../utils/ar/collision';

describe('snapAngle', () => {
  it('snaps to the nearest 15° step', () => {
    expect(snapAngle(7)).toBe(0);    // below the 7.5 midpoint
    expect(snapAngle(7.5)).toBe(15); // at the midpoint rounds up
    expect(snapAngle(8)).toBe(15);
    expect(snapAngle(3)).toBe(0);
    expect(snapAngle(52)).toBe(45);
    expect(snapAngle(98)).toBe(105);
  });

  it('normalises to [0, 360)', () => {
    expect(snapAngle(-15)).toBe(345);
    expect(snapAngle(365)).toBe(0);
    expect(snapAngle(360)).toBe(0);
  });

  it('honours a custom step', () => {
    expect(snapAngle(40, 90)).toBe(0);
    expect(snapAngle(50, 90)).toBe(90);
  });
});

describe('footprintAABB', () => {
  it('matches the raw rect at 0°', () => {
    const bb = footprintAABB({ x: 0, z: 0, width: 2, depth: 1, rotationDeg: 0 });
    expect(bb).toEqual({ x0: -1, z0: -0.5, x1: 1, z1: 0.5 });
  });

  it('swaps extents at 90°', () => {
    const bb = footprintAABB({ x: 0, z: 0, width: 2, depth: 1, rotationDeg: 90 });
    expect(bb.x1 - bb.x0).toBeCloseTo(1);
    expect(bb.z1 - bb.z0).toBeCloseTo(2);
  });

  it('expands at 45° (rotated rect needs a bigger box)', () => {
    const bb = footprintAABB({ x: 0, z: 0, width: 2, depth: 1, rotationDeg: 45 });
    const expected = (2 * Math.SQRT1_2 + 1 * Math.SQRT1_2);
    expect(bb.x1 - bb.x0).toBeCloseTo(expected);
    expect(bb.z1 - bb.z0).toBeCloseTo(expected);
  });
});

describe('footprintsCollide / collidesWithAny', () => {
  const sofa: Footprint = { x: 0, z: 0, width: 2.2, depth: 0.95, rotationDeg: 0 };

  it('detects overlap', () => {
    const table: Footprint = { x: 1, z: 0, width: 1.2, depth: 0.6, rotationDeg: 0 };
    expect(footprintsCollide(sofa, table)).toBe(true);
  });

  it('clears non-overlapping items', () => {
    const table: Footprint = { x: 3, z: 0, width: 1.2, depth: 0.6, rotationDeg: 0 };
    expect(footprintsCollide(sofa, table)).toBe(false);
  });

  it('rotation can create an overlap that 0° would not have', () => {
    // A long thin item placed beside the sofa: fine at 0°, collides at 90°.
    const shelf: Footprint = { x: 1.2, z: 0.8, width: 2.4, depth: 0.3, rotationDeg: 0 };
    expect(footprintsCollide(sofa, shelf)).toBe(false);
    expect(footprintsCollide(sofa, { ...shelf, rotationDeg: 90 })).toBe(true);
  });

  it('collidesWithAny scans a set', () => {
    const placed: Footprint[] = [
      { x: 5, z: 5, width: 1, depth: 1, rotationDeg: 0 },
      { x: 0.5, z: 0.2, width: 1, depth: 1, rotationDeg: 0 },
    ];
    expect(collidesWithAny(sofa, placed)).toBe(true);
    expect(collidesWithAny({ ...sofa, x: 10 }, placed)).toBe(false);
  });
});
