/**
 * Thermal fit: wall material mass class vs the zone's thermal-mass strategy,
 * and equator-facade glazing ratio vs the zone's band. Unknown materials and
 * missing data score neutral.
 */
import type { BlueprintData } from '../../types/blueprint';
import { floorViews } from '../geometry/architecturalQuality';
import { resolveWallFacades } from './facades';
import { resolveFacing, type Compass } from './sunPath';
import { CLIMATE_BRIEFS, type ClimateZoneId, type Hemisphere } from './climateData';
import type { Rating } from './solarGain';

const WINDOW_TYPES = new Set(['window', 'skylight', 'sliding_door', 'french_door']);
const DEFAULT_WALL_HEIGHT = 2.7;

type MassClass = 'high' | 'medium' | 'low';

/** Coarse material → thermal-mass mapping; substring match against material ids. */
function massClassOf(material: string | undefined): MassClass | null {
  if (!material) return null;
  const m = material.toLowerCase();
  if (/(concrete|stone|brick|masonry|adobe|rammed|earth|block)/.test(m)) return 'high';
  if (/(timber|wood|drywall|plaster|panel|frame|log)/.test(m)) return 'low';
  return 'medium';
}

export interface ThermalAnalysis {
  rating: Rating;
  issues: string[];
  score: number;
  /** Share of wall length whose material matches the zone strategy (0–1, null when unknowable). */
  massMatch: number | null;
}

export function computeThermalFit(
  bp: BlueprintData,
  zone: ClimateZoneId,
  hemisphere: Hemisphere,
  orientation: Compass,
): ThermalAnalysis {
  const brief = CLIMATE_BRIEFS[zone] ?? CLIMATE_BRIEFS.temperate;
  const issues: string[] = [];
  let score = 75; // neutral baseline

  const ground = floorViews(bp)[0];
  if (!ground || ground.walls.length === 0) {
    return { rating: 'fair', issues, score, massMatch: null };
  }

  // ── Wall mass vs zone strategy ─────────────────────────────────────────────
  let matched = 0;
  let classified = 0;
  let totalLen = 0;
  for (const w of ground.walls) {
    const len = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y);
    totalLen += len;
    const cls = massClassOf(w.material);
    if (cls === null) continue;
    classified += len;
    if (cls === brief.thermalMass) matched += len;
    // One step away (medium vs high/low) counts half.
    else if (cls === 'medium' || brief.thermalMass === 'medium') matched += len * 0.5;
  }
  const massMatch = classified > 0.3 * totalLen ? matched / classified : null;
  if (massMatch !== null) {
    score = Math.round(40 + massMatch * 55); // 0→40, 1→95
    if (massMatch < 0.4) {
      issues.push(
        brief.thermalMass === 'high'
          ? `This ${brief.label.toLowerCase()} climate wants high-thermal-mass walls (masonry/concrete) — most walls are lightweight`
          : brief.thermalMass === 'low'
            ? `This ${brief.label.toLowerCase()} climate wants lightweight walls that cool overnight — most walls are heavy masonry`
            : 'Wall construction is poorly matched to the climate’s thermal strategy',
      );
    }
  }

  // ── Equator-facade glazing ratio vs zone band ───────────────────────────────
  const equator = resolveFacing('equator', hemisphere);
  const facades = resolveWallFacades(ground.walls, orientation);
  let eqWallArea = 0;
  let eqGlassArea = 0;
  for (const w of ground.walls) {
    const f = facades.get(w.id);
    if (!f || f.compass !== equator) continue;
    eqWallArea += f.length * (w.height || DEFAULT_WALL_HEIGHT);
  }
  for (const op of ground.openings) {
    if (!WINDOW_TYPES.has(op.type)) continue;
    if (facades.get(op.wallId)?.compass !== equator) continue;
    eqGlassArea += (op.width || 0) * (op.height || 1.2);
  }
  if (eqWallArea > 0) {
    const ratio = eqGlassArea / eqWallArea;
    const band = brief.glazingRatioByOrientation.equator;
    if (ratio < band.min * 0.6) {
      issues.push(`Sun-side (${equator}) glazing is only ${(ratio * 100).toFixed(0)}% of the facade — the climate band is ${(band.min * 100).toFixed(0)}–${(band.max * 100).toFixed(0)}%`);
      score -= 10;
    } else if (ratio > band.max * 1.4) {
      issues.push(`Sun-side (${equator}) glazing is ${(ratio * 100).toFixed(0)}% of the facade — above the ${(band.max * 100).toFixed(0)}% climate band, expect overheating/heat loss`);
      score -= 10;
    } else if (ratio >= band.min && ratio <= band.max) {
      score += 5;
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const rating: Rating = score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor';
  return { rating, issues, score, massMatch };
}
