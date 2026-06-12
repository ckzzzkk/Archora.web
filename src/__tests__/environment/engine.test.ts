import { describe, it, expect } from 'vitest';
import { generateFloorPlan } from '../../utils/layoutEngine';
import { simulateEnvironment, toSimulationReport } from '../../utils/environment';
import type { GenerationPayload } from '../../types/generation';

const payload: GenerationPayload = {
  buildingType: 'house',
  plotSize: 140,
  plotUnit: 'm2',
  bedrooms: 3,
  bathrooms: 2,
  livingAreas: 1,
  hasGarage: false,
  hasGarden: true,
  hasPool: false,
  hasHomeOffice: false,
  hasUtilityRoom: false,
  style: 'modern',
  additionalNotes: '',
  climateZone: 'temperate',
  hemisphere: 'north',
  orientation: 'S',
};

describe('simulateEnvironment on a procedural blueprint', () => {
  it('produces a fully-populated, deterministic report', () => {
    const bp = generateFloorPlan(payload);
    const a = simulateEnvironment(bp);
    const b = simulateEnvironment(bp);
    expect(a).toEqual(b);

    expect(a.solar.perRoom.length).toBeGreaterThan(0);
    expect(a.ventilation.perRoom.length).toBeGreaterThan(0);
    expect(a.score).toBeGreaterThanOrEqual(0);
    expect(a.score).toBeLessThanOrEqual(100);
  });

  it('applies defaults when metadata is absent (old blueprints)', () => {
    const bp = generateFloorPlan(payload);
    const meta = bp.metadata as unknown as Record<string, unknown>;
    delete meta.climateZone;
    delete meta.hemisphere;
    delete meta.orientation;

    const report = simulateEnvironment(bp);
    expect(report.zone).toBe('temperate');
    expect(report.hemisphere).toBe('north');
    expect(report.orientation).toBe('S');
    // Missing roofPitch/eaveDepth must score neutral, not zero.
    expect(report.exposure.score).toBeGreaterThanOrEqual(50);
  });
});

describe('toSimulationReport', () => {
  it('fills every SimulationReport field deterministically', () => {
    const bp = generateFloorPlan(payload);
    const report = toSimulationReport(simulateEnvironment(bp), bp);

    expect(report.available).toBe(true);
    expect(report.overall).toBeGreaterThan(0);
    expect(['A', 'B', 'C', 'D', 'F']).toContain(report.grade);
    expect(report.summary.length).toBeGreaterThan(20);
    for (const v of Object.values(report.weatherProfile)) {
      expect(['excellent', 'good', 'fair', 'poor']).toContain(v);
    }
    for (const v of Object.values(report.structuralProfile)) {
      expect(['excellent', 'good', 'fair', 'poor']).toContain(v);
    }
  });

  it('a baseline procedural plan never rates poor on any weather axis', () => {
    const bp = generateFloorPlan(payload);
    const report = toSimulationReport(simulateEnvironment(bp), bp);
    for (const [axis, v] of Object.entries(report.weatherProfile)) {
      expect(v, `weatherProfile.${axis}`).not.toBe('poor');
    }
  });
});
