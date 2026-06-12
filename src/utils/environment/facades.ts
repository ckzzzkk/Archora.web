/**
 * Wall → facade-direction resolution shared by the solar and ventilation
 * analyses. The outward normal of a wall (the side pointing away from the
 * building's centre) determines which compass facade it belongs to.
 */
import type { Wall, Vector2D } from '../../types/blueprint';
import { planDirectionToCompass, type Compass } from './sunPath';

export interface FacadeInfo {
  /** Dominant plan-space outward direction of the wall. */
  planDir: 'xplus' | 'xminus' | 'yplus' | 'yminus';
  compass: Compass;
  /** Wall length in metres. */
  length: number;
}

function centreOfWalls(walls: Wall[]): Vector2D {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const w of walls) {
    sx += (w.start.x + w.end.x) / 2;
    sy += (w.start.y + w.end.y) / 2;
    n++;
  }
  return n ? { x: sx / n, y: sy / n } : { x: 0, y: 0 };
}

/**
 * Resolve every wall's outward facade direction. Outward = the wall normal
 * that points away from the building centre (good enough for the convex-ish
 * footprints both the AI and the layout engine produce).
 */
export function resolveWallFacades(
  walls: Wall[],
  orientation: Compass,
): Map<string, FacadeInfo> {
  const centre = centreOfWalls(walls);
  const out = new Map<string, FacadeInfo>();

  for (const w of walls) {
    const dx = w.end.x - w.start.x;
    const dy = w.end.y - w.start.y;
    const length = Math.hypot(dx, dy);
    if (length < 1e-9) continue;

    // Two unit normals; pick the one pointing away from the building centre.
    const mid = { x: (w.start.x + w.end.x) / 2, y: (w.start.y + w.end.y) / 2 };
    const n1 = { x: dy / length, y: -dx / length };
    const toMid = { x: mid.x - centre.x, y: mid.y - centre.y };
    const outward = n1.x * toMid.x + n1.y * toMid.y >= 0 ? n1 : { x: -n1.x, y: -n1.y };

    const planDir: FacadeInfo['planDir'] = Math.abs(outward.x) >= Math.abs(outward.y)
      ? (outward.x >= 0 ? 'xplus' : 'xminus')
      : (outward.y >= 0 ? 'yplus' : 'yminus');

    out.set(w.id, { planDir, compass: planDirectionToCompass(planDir, orientation), length });
  }
  return out;
}

/** Angle (degrees, 0–180) between the outward normals of two plan directions. */
export function planDirAngle(a: FacadeInfo['planDir'], b: FacadeInfo['planDir']): number {
  const ANGLE: Record<FacadeInfo['planDir'], number> = { yminus: 0, xplus: 90, yplus: 180, xminus: 270 };
  const diff = Math.abs(ANGLE[a] - ANGLE[b]) % 360;
  return diff > 180 ? 360 - diff : diff;
}
