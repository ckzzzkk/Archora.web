/**
 * Deterministic environment simulation engine. Pure TypeScript, no network —
 * computes how a blueprint behaves in its climate (sun, ventilation, rain,
 * wind, thermal) and emits both an EnvironmentReport (for the quality scorer
 * and ARIA edit context) and a SimulationReport (for the workspace panel).
 */
import type { BlueprintData, SimulationReport } from '../../types/blueprint';
import {
  assessArchitecturalQuality,
  type ArchitecturalQualityReport,
  type CategoryScore,
} from '../geometry/architecturalQuality';
import { CLIMATE_BRIEFS, type ClimateZoneId, type Hemisphere } from './climateData';
import { computeSolarGain, type SolarAnalysis, type Rating } from './solarGain';
import { computeCrossVentilation, type VentilationAnalysis } from './ventilation';
import { computeExposure, type ExposureAnalysis } from './exposure';
import { computeThermalFit, type ThermalAnalysis } from './thermal';
import type { Compass } from './sunPath';

export type { Rating, RoomSolar, SolarAnalysis } from './solarGain';
export type { VentilationAnalysis } from './ventilation';
export type { ExposureAnalysis } from './exposure';
export type { ThermalAnalysis } from './thermal';

export interface EnvironmentReport {
  zone: ClimateZoneId;
  hemisphere: Hemisphere;
  orientation: Compass;
  solar: SolarAnalysis;
  ventilation: VentilationAnalysis;
  exposure: ExposureAnalysis;
  thermal: ThermalAnalysis;
  /** 0–100 aggregate used as the 5th architectural-quality dimension. */
  score: number;
  recommendations: SimulationReport['recommendations'];
}

function resolveContext(bp: BlueprintData): { zone: ClimateZoneId; hemisphere: Hemisphere; orientation: Compass } {
  const meta = bp.metadata ?? ({} as BlueprintData['metadata']);
  const zone = (meta.climateZone && meta.climateZone in CLIMATE_BRIEFS ? meta.climateZone : 'temperate') as ClimateZoneId;
  const hemisphere: Hemisphere = meta.hemisphere === 'south' ? 'south' : 'north';
  const orientation: Compass = meta.orientation === 'N' || meta.orientation === 'E' || meta.orientation === 'W' ? meta.orientation : 'S';
  return { zone, hemisphere, orientation };
}

export function simulateEnvironment(bp: BlueprintData): EnvironmentReport {
  const { zone, hemisphere, orientation } = resolveContext(bp);

  const solar = computeSolarGain(bp, zone, hemisphere, orientation);
  const ventilation = computeCrossVentilation(bp, zone, orientation);
  const exposure = computeExposure(bp, zone, orientation);
  const thermal = computeThermalFit(bp, zone, hemisphere, orientation);

  // Solar + ventilation are layout-driven (the engine/AI fully controls them);
  // exposure + thermal partly depend on optional metadata, so they weigh less.
  const score = Math.max(0, Math.min(100, Math.round(
    solar.score * 0.35 + ventilation.score * 0.3 + exposure.score * 0.175 + thermal.score * 0.175,
  )));

  const recommendations: SimulationReport['recommendations'] = [];
  for (const issue of solar.issues) {
    recommendations.push({ category: 'weather', severity: 'major', issue, fix: 'Reorient or enlarge glazing toward the winter sun side; keep eaves at the climate ideal so summer sun stays out.' });
  }
  for (const issue of ventilation.issues) {
    recommendations.push({ category: 'weather', severity: 'minor', issue, fix: 'Add an opening on an opposing or adjacent facade to create a cross-breeze path.' });
  }
  for (const issue of exposure.rain.issues) {
    recommendations.push({ category: 'weather', severity: 'major', issue, fix: `Aim for roof pitch ≈${CLIMATE_BRIEFS[zone].roofPitchDeg.ideal}° and eaves ≈${CLIMATE_BRIEFS[zone].eaveDepthM.ideal}m for this climate.` });
  }
  for (const issue of exposure.wind.issues) {
    recommendations.push({ category: 'weather', severity: 'minor', issue, fix: 'Compact the footprint or add sheltered transition spaces on the exposed side.' });
  }
  for (const issue of thermal.issues) {
    recommendations.push({ category: 'weather', severity: 'minor', issue, fix: `Match wall construction to the zone strategy (${CLIMATE_BRIEFS[zone].thermalMass} thermal mass) and keep glazing inside the climate band.` });
  }

  return { zone, hemisphere, orientation, solar, ventilation, exposure, thermal, score, recommendations };
}

/** The environment engine packaged as a 5th quality dimension. */
export function assessEnvironmentQuality(bp: BlueprintData): CategoryScore {
  const env = simulateEnvironment(bp);
  const issues = [
    ...env.solar.issues,
    ...env.ventilation.issues,
    ...env.exposure.rain.issues,
    ...env.exposure.wind.issues,
    ...env.thermal.issues,
  ];
  return { score: env.score, issues };
}

export interface FullQualityReport extends ArchitecturalQualityReport {
  environment: CategoryScore;
}

/**
 * The complete architect-grade assessment: the four geometric dimensions plus
 * the environment dimension; overall becomes the average of five. Lives here
 * (not in architecturalQuality.ts) so the import graph stays acyclic —
 * the environment engine builds ON the geometric scorer.
 */
export function assessFullQuality(bp: BlueprintData): FullQualityReport {
  const base = assessArchitecturalQuality(bp);
  const environment = assessEnvironmentQuality(bp);
  const overall = Math.round(
    (base.circulation.score + base.daylightCode.score + base.structural.score + base.adjacency.score + environment.score) / 5,
  );
  return { ...base, environment, overall };
}

function gradeOf(overall: number): SimulationReport['grade'] {
  return overall >= 90 ? 'A' : overall >= 80 ? 'B' : overall >= 70 ? 'C' : overall >= 60 ? 'D' : 'F';
}

function ratingFromScore(score: number): Rating {
  return score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor';
}

/**
 * Produce the full SimulationReport consumed by SimulationPanel — weather from
 * the environment engine, structural/flow/code from the deterministic
 * architectural-quality scorer. Entirely offline and reproducible.
 */
export function toSimulationReport(env: EnvironmentReport, bp: BlueprintData): SimulationReport {
  const quality = assessArchitecturalQuality(bp);
  const brief = CLIMATE_BRIEFS[env.zone];

  const weather = env.score;
  const structural = quality.structural.score;
  const flow = quality.circulation.score;
  const codeCompliance = quality.daylightCode.score;
  const overall = Math.round(weather * 0.3 + structural * 0.3 + flow * 0.2 + codeCompliance * 0.2);

  const strengths: string[] = [];
  if (env.solar.score >= 85) strengths.push('Habitable rooms capture winter sun well');
  if (env.ventilation.score >= 85) strengths.push('Cross-ventilation paths through the main rooms');
  if (env.exposure.score >= 85) strengths.push(`Roof and eaves suit the ${brief.label.toLowerCase()} climate`);
  if (structural >= 90) strengths.push('Sound spans and load paths');
  if (flow >= 90) strengths.push('Clear, hallway-first circulation');

  const recommendations: SimulationReport['recommendations'] = [
    ...env.recommendations,
    ...quality.structural.issues.map((issue) => ({ category: 'structural' as const, severity: 'major' as const, issue, fix: 'Add a beam callout or align loadbearing walls across floors.' })),
    ...quality.circulation.issues.map((issue) => ({ category: 'flow' as const, severity: 'major' as const, issue, fix: 'Route the room off a hallway and ensure a door path from the entrance.' })),
    ...quality.daylightCode.issues.map((issue) => ({ category: 'code' as const, severity: 'minor' as const, issue, fix: 'Meet the minimum window/width requirement for the room.' })),
  ];

  const summary = `${brief.label}, ${env.hemisphere}ern hemisphere, entry facing ${env.orientation}. ` +
    `Weather fit ${weather}/100 — solar ${env.solar.rating}, ventilation ${env.ventilation.rating}, ` +
    `rain ${env.exposure.rain.rating}, thermal ${env.thermal.rating}. ` +
    (recommendations.length === 0 ? 'No environmental issues found.' : `${recommendations.length} recommendation${recommendations.length === 1 ? '' : 's'} below.`);

  const ventByRoom = new Map(env.ventilation.perRoom.map((r) => [r.roomId, r.hasOpposedOpenings]));
  const roomEnvironment = env.solar.perRoom.map((r) => ({
    roomName: r.roomName,
    floorIndex: r.floorIndex,
    facade: r.facade,
    winterSun: r.winter,
    summerSun: r.summer,
    crossVentilation: ventByRoom.get(r.roomId) ?? false,
    habitable: r.habitable,
  }));

  return {
    overall,
    structural,
    weather,
    flow,
    codeCompliance,
    grade: gradeOf(overall),
    summary,
    strengths,
    recommendations,
    roomEnvironment,
    weatherProfile: {
      solarGain: env.solar.rating,
      windResistance: env.exposure.wind.rating,
      rainProtection: env.exposure.rain.rating,
      thermalMass: env.thermal.rating,
    },
    structuralProfile: {
      loadPath: ratingFromScore(structural),
      spanIntegrity: ratingFromScore(structural),
      foundationFit: bp.metadata?.foundationType ? 'good' : 'fair',
      shearWalls: ratingFromScore(structural),
    },
    generatedAt: new Date().toISOString(),
    available: true,
  };
}
