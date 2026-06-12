/**
 * Rain & wind exposure heuristics: roof pitch and eave depth against climate
 * ideals, west-facing glazing load, and footprint aspect ratio (long thin
 * buildings catch more wind). Missing metadata scores NEUTRAL (75-band), never
 * zero — old blueprints must not be punished for fields that didn't exist.
 */
import type { BlueprintData } from '../../types/blueprint';
import { floorViews } from '../geometry/architecturalQuality';
import { resolveWallFacades } from './facades';
import type { Compass } from './sunPath';
import { CLIMATE_BRIEFS, type ClimateZoneId } from './climateData';
import type { Rating } from './solarGain';

const WINDOW_TYPES = new Set(['window', 'skylight', 'sliding_door', 'french_door']);

export interface ExposureAnalysis {
  rain: { rating: Rating; issues: string[] };
  wind: { rating: Rating; issues: string[] };
  score: number;
}

function toRating(score: number): Rating {
  return score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor';
}

export function computeExposure(
  bp: BlueprintData,
  zone: ClimateZoneId,
  orientation: Compass,
): ExposureAnalysis {
  const brief = CLIMATE_BRIEFS[zone] ?? CLIMATE_BRIEFS.temperate;
  const rainIssues: string[] = [];
  const windIssues: string[] = [];

  // ── Rain: roof pitch + eaves vs climate ideals (neutral when unknown) ──────
  let rainScore = 75;
  const pitch = bp.metadata?.roofPitch;
  if (typeof pitch === 'number' && Number.isFinite(pitch)) {
    if (pitch < brief.roofPitchDeg.min) {
      rainIssues.push(`Roof pitch ${pitch}° is below the ${brief.roofPitchDeg.min}° minimum for a ${brief.label.toLowerCase()} climate`);
      rainScore = 40;
    } else if (pitch >= brief.roofPitchDeg.ideal - 5) {
      rainScore = 95;
    } else {
      rainScore = 80;
    }
  }
  const eaves = bp.metadata?.eaveDepth;
  if (typeof eaves === 'number' && Number.isFinite(eaves)) {
    if (eaves < brief.eaveDepthM.min) {
      rainIssues.push(`Eave depth ${eaves}m is below the ${brief.eaveDepthM.min}m minimum — walls and openings get weather-exposed`);
      rainScore = Math.min(rainScore, 50);
    } else if (eaves >= brief.eaveDepthM.ideal) {
      rainScore = Math.min(100, rainScore + 5);
    }
  }

  // ── Wind: aspect ratio + west-facade glazing share ──────────────────────────
  let windScore = 85;
  const ground = floorViews(bp)[0];
  if (ground && ground.walls.length >= 3) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const w of ground.walls) {
      for (const p of [w.start, w.end]) {
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      }
    }
    const width = maxX - minX;
    const depth = maxY - minY;
    if (width > 0 && depth > 0) {
      const aspect = Math.max(width, depth) / Math.min(width, depth);
      if (aspect > 3) {
        windIssues.push(`Long thin footprint (${aspect.toFixed(1)}:1) presents a large face to wind — consider compacting or bracing`);
        windScore -= 15;
      }
    }

    const facades = resolveWallFacades(ground.walls, orientation);
    let westGlazing = 0;
    let totalGlazing = 0;
    for (const op of ground.openings) {
      if (!WINDOW_TYPES.has(op.type)) continue;
      const area = (op.width || 0) * (op.height || 1.2);
      totalGlazing += area;
      if (facades.get(op.wallId)?.compass === 'W') westGlazing += area;
    }
    const westBand = brief.glazingRatioByOrientation.west;
    if (totalGlazing > 0 && westGlazing / totalGlazing > Math.max(0.35, westBand.max * 2)) {
      windIssues.push('A large share of glazing faces west — afternoon heat and driving rain exposure');
      windScore -= 10;
    }
  }

  const score = Math.max(0, Math.min(100, Math.round(rainScore * 0.5 + windScore * 0.5)));

  return {
    rain: { rating: toRating(rainScore), issues: rainIssues },
    wind: { rating: toRating(windScore), issues: windIssues },
    score,
  };
}
