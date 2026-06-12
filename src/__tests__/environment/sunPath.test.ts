import { describe, it, expect } from 'vitest';
import { sunAltitude, facadeIrradiance, planDirectionToCompass } from '../../utils/environment/sunPath';
import { CLIMATE_BRIEFS } from '../../utils/environment/climateData';

describe('sunAltitude', () => {
  it('summer noon sun is higher than winter at every latitude band', () => {
    for (const brief of Object.values(CLIMATE_BRIEFS)) {
      expect(sunAltitude(brief.latitudeBand, 'summer')).toBeGreaterThan(
        sunAltitude(brief.latitudeBand, 'winter'),
      );
    }
  });

  it('altitude decreases with latitude in winter', () => {
    const tropics = sunAltitude({ min: 0, max: 15 }, 'winter');
    const temperate = sunAltitude({ min: 35, max: 55 }, 'winter');
    const cold = sunAltitude({ min: 50, max: 65 }, 'winter');
    expect(tropics).toBeGreaterThan(temperate);
    expect(temperate).toBeGreaterThan(cold);
  });

  it('clamps to the 0–90 range', () => {
    expect(sunAltitude({ min: 64, max: 70 }, 'winter')).toBeGreaterThanOrEqual(0);
    expect(sunAltitude({ min: 0, max: 10 }, 'summer')).toBeLessThanOrEqual(90);
  });
});

describe('facadeIrradiance', () => {
  it('in the north hemisphere, S facade beats N facade in winter; flipped in the south', () => {
    const nhSouth = facadeIrradiance('S', 'winter', 'north', 'temperate');
    const nhNorth = facadeIrradiance('N', 'winter', 'north', 'temperate');
    expect(nhSouth).toBeGreaterThan(nhNorth);

    const shNorth = facadeIrradiance('N', 'winter', 'south', 'temperate');
    const shSouth = facadeIrradiance('S', 'winter', 'south', 'temperate');
    expect(shNorth).toBeGreaterThan(shSouth);
  });

  it('equator facade receives MORE in winter than summer (low sun penetrates)', () => {
    expect(facadeIrradiance('S', 'winter', 'north', 'temperate'))
      .toBeGreaterThan(facadeIrradiance('S', 'summer', 'north', 'temperate'));
  });

  it('all values stay within 0–1', () => {
    for (const facing of ['N', 'S', 'E', 'W'] as const) {
      for (const season of ['summer', 'winter', 'equinox'] as const) {
        const v = facadeIrradiance(facing, season, 'north', 'cold');
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('planDirectionToCompass', () => {
  it('south-facing entry matches map convention', () => {
    expect(planDirectionToCompass('yminus', 'S')).toBe('S'); // front
    expect(planDirectionToCompass('yplus', 'S')).toBe('N');  // rear
    expect(planDirectionToCompass('xplus', 'S')).toBe('E');
    expect(planDirectionToCompass('xminus', 'S')).toBe('W');
  });

  it('north-facing entry flips front/rear', () => {
    expect(planDirectionToCompass('yminus', 'N')).toBe('N');
    expect(planDirectionToCompass('yplus', 'N')).toBe('S');
  });

  it('east-facing entry rotates the frame', () => {
    expect(planDirectionToCompass('yminus', 'E')).toBe('E');
    expect(planDirectionToCompass('yplus', 'E')).toBe('W');
    expect(planDirectionToCompass('xplus', 'E')).toBe('N');
    expect(planDirectionToCompass('xminus', 'E')).toBe('S');
  });
});
