/**
 * Seasonal noon sun-path approximation. Deliberately coarse: climate zones map
 * to latitude bands, and seasonal noon altitudes drive facade irradiance. That
 * fidelity is enough to rank orientations and size eaves — per-hour sun paths
 * would be false precision without real site coordinates.
 */
import { CLIMATE_BRIEFS, resolveFacing, type ClimateZoneId, type Hemisphere, type RelativeFacing } from './climateData';

export type Season = 'summer' | 'winter' | 'equinox';
export type Compass = 'N' | 'S' | 'E' | 'W';

const SOLAR_DECLINATION = 23.5;

/** Noon sun altitude (degrees above horizon) for a latitude band and season. */
export function sunAltitude(
  latitudeBand: { min: number; max: number },
  season: Season,
): number {
  const midLat = (latitudeBand.min + latitudeBand.max) / 2;
  const declination = season === 'summer' ? SOLAR_DECLINATION : season === 'winter' ? -SOLAR_DECLINATION : 0;
  const altitude = 90 - Math.abs(midLat - declination);
  return Math.max(0, Math.min(90, altitude));
}

/**
 * Relative irradiance (0–1) received by a vertical facade facing a compass
 * direction, for a season/zone/hemisphere. Physics-flavoured heuristic:
 *  - the equator-facing facade receives ∝ cos(noon altitude) — low winter sun
 *    floods it, high summer sun grazes it (which is exactly why eaves work);
 *  - east/west receive moderate morning/afternoon sun year-round;
 *  - the pole-facing facade sees diffuse light only.
 */
export function facadeIrradiance(
  facing: Compass,
  season: Season,
  hemisphere: Hemisphere,
  zone: ClimateZoneId,
): number {
  const brief = CLIMATE_BRIEFS[zone] ?? CLIMATE_BRIEFS.temperate;
  const equator = resolveFacing('equator', hemisphere);
  const pole = resolveFacing('pole', hemisphere);

  if (facing === equator) {
    const altDeg = season === 'summer'
      ? brief.summerSunAltitude
      : season === 'winter'
        ? brief.winterSunAltitude
        : (brief.summerSunAltitude + brief.winterSunAltitude) / 2;
    return Math.max(0.05, Math.cos((altDeg * Math.PI) / 180));
  }
  if (facing === pole) return 0.1;
  // East/West: low-angle sun for part of the day in every season.
  return 0.45;
}

/**
 * Map a plan-space direction to a compass direction given the building's entry
 * orientation. Convention (matches the layout engine + adjacency scorer):
 * plan -y is the front/street side, which faces `orientation`. With a
 * south-facing entry, plan coordinates therefore match a map (+y = N, +x = E).
 */
export function planDirectionToCompass(
  dir: 'xplus' | 'xminus' | 'yplus' | 'yminus',
  orientation: Compass,
): Compass {
  const COMPASS_ANGLE: Record<Compass, number> = { N: 0, E: 90, S: 180, W: 270 };
  const ANGLE_COMPASS: Record<number, Compass> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
  const front = COMPASS_ANGLE[orientation];
  const offset = dir === 'yminus' ? 0 : dir === 'yplus' ? 180 : dir === 'xplus' ? -90 : 90;
  return ANGLE_COMPASS[(((front + offset) % 360) + 360) % 360];
}

export { resolveFacing };
export type { RelativeFacing };
