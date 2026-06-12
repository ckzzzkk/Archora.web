/**
 * collision.ts — pure placement math for AR furniture: rotation snapping and
 * footprint overlap detection. Extracted from ARPlaceMode so it is
 * vitest-testable (no AR runtime in tests).
 */

/** Snap an angle to the nearest step (default 15°), normalised to [0, 360). */
export function snapAngle(deg: number, step = 15): number {
  const snapped = Math.round(deg / step) * step;
  return ((snapped % 360) + 360) % 360;
}

export interface Footprint {
  /** Centre position on the floor plane (metres). */
  x: number;
  z: number;
  /** Unrotated dimensions (metres). */
  width: number;
  depth: number;
  /** Yaw rotation in degrees. */
  rotationDeg: number;
}

interface AABB {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}

/** Axis-aligned bounding box of a rotated rectangular footprint. */
export function footprintAABB(f: Footprint): AABB {
  const rad = (f.rotationDeg * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  const hw = (f.width * c + f.depth * s) / 2;
  const hd = (f.width * s + f.depth * c) / 2;
  return { x0: f.x - hw, z0: f.z - hd, x1: f.x + hw, z1: f.z + hd };
}

/** Whether two placed footprints overlap (AABB of their rotated rects). */
export function footprintsCollide(a: Footprint, b: Footprint, clearance = 0): boolean {
  const A = footprintAABB(a);
  const B = footprintAABB(b);
  return (
    A.x0 < B.x1 + clearance &&
    A.x1 > B.x0 - clearance &&
    A.z0 < B.z1 + clearance &&
    A.z1 > B.z0 - clearance
  );
}

/** True when the footprint overlaps ANY of the placed footprints. */
export function collidesWithAny(f: Footprint, placed: readonly Footprint[], clearance = 0): boolean {
  return placed.some((p) => footprintsCollide(f, p, clearance));
}
