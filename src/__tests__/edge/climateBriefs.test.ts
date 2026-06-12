import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CLIMATE_BRIEFS,
  buildClimatePromptSection,
  resolveFacing,
  toRelativeFacing,
  type ClimateZoneId,
  type Hemisphere,
} from '../../../supabase/functions/_shared/climateBriefs';

const ZONES = Object.keys(CLIMATE_BRIEFS) as ClimateZoneId[];
const HEMIS: Hemisphere[] = ['north', 'south'];

describe('CLIMATE_BRIEFS data sanity', () => {
  it('covers all six climate zones', () => {
    expect(ZONES.sort()).toEqual(
      ['alpine', 'arid', 'cold', 'subtropical', 'temperate', 'tropical'].sort(),
    );
  });

  it('every brief has sane numeric bounds', () => {
    for (const zone of ZONES) {
      const b = CLIMATE_BRIEFS[zone];
      expect(b.latitudeBand.min).toBeGreaterThanOrEqual(0);
      expect(b.latitudeBand.max).toBeLessThanOrEqual(70);
      expect(b.latitudeBand.min).toBeLessThan(b.latitudeBand.max);
      expect(b.summerSunAltitude).toBeGreaterThan(b.winterSunAltitude);
      expect(b.summerSunAltitude).toBeLessThanOrEqual(90);
      expect(b.winterSunAltitude).toBeGreaterThan(0);
      expect(b.roofPitchDeg.min).toBeLessThanOrEqual(b.roofPitchDeg.ideal);
      expect(b.eaveDepthM.min).toBeLessThanOrEqual(b.eaveDepthM.ideal);
      for (const facing of ['equator', 'pole', 'east', 'west'] as const) {
        const g = b.glazingRatioByOrientation[facing];
        expect(g.min).toBeGreaterThanOrEqual(0);
        expect(g.max).toBeLessThanOrEqual(0.7);
        expect(g.min).toBeLessThanOrEqual(g.max);
      }
      expect(b.promptRules.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('higher latitude zones see lower winter sun', () => {
    expect(CLIMATE_BRIEFS.cold.winterSunAltitude).toBeLessThan(
      CLIMATE_BRIEFS.temperate.winterSunAltitude,
    );
    expect(CLIMATE_BRIEFS.temperate.winterSunAltitude).toBeLessThan(
      CLIMATE_BRIEFS.tropical.winterSunAltitude,
    );
  });
});

describe('resolveFacing / toRelativeFacing', () => {
  it('equator-facing is S in north hemisphere and N in south', () => {
    expect(resolveFacing('equator', 'north')).toBe('S');
    expect(resolveFacing('equator', 'south')).toBe('N');
    expect(resolveFacing('pole', 'north')).toBe('N');
    expect(resolveFacing('pole', 'south')).toBe('S');
  });

  it('east/west are hemisphere-independent', () => {
    for (const h of HEMIS) {
      expect(resolveFacing('east', h)).toBe('E');
      expect(resolveFacing('west', h)).toBe('W');
    }
  });

  it('toRelativeFacing inverts resolveFacing', () => {
    for (const h of HEMIS) {
      for (const rel of ['equator', 'pole', 'east', 'west'] as const) {
        expect(toRelativeFacing(resolveFacing(rel, h), h)).toBe(rel);
      }
    }
  });
});

describe('buildClimatePromptSection', () => {
  it('produces a non-empty numeric section for every zone × hemisphere', () => {
    for (const zone of ZONES) {
      for (const h of HEMIS) {
        const s = buildClimatePromptSection(zone, h);
        expect(s.length).toBeGreaterThan(300);
        expect(s).toContain('CLIMATE-SPECIFIC DESIGN RULES');
        expect(s).toContain('Roof pitch');
        expect(s).toContain('Glazing ratio');
        expect(s).toMatch(/\d+°/);
      }
    }
  });

  it('hemisphere flips the sun side: north → S-facing, south → N-facing', () => {
    const north = buildClimatePromptSection('temperate', 'north');
    const south = buildClimatePromptSection('temperate', 'south');
    expect(north).toContain('The sun side is S');
    expect(south).toContain('The sun side is N');
    // Rule text containing 'equator-facing' must be resolved, never leaked raw.
    expect(north).not.toMatch(/equator-facing/i);
    expect(south).not.toMatch(/equator-facing/i);
    expect(north).not.toMatch(/pole-facing/i);
    expect(south).not.toMatch(/pole-facing/i);
  });

  it('falls back to temperate for an unknown zone string', () => {
    const s = buildClimatePromptSection('lunar', 'north');
    expect(s).toContain('Temperate');
  });
});

describe('module purity (dual-import contract)', () => {
  it('contains no import statements and no Deno globals', () => {
    const src = readFileSync(
      resolve(__dirname, '../../../supabase/functions/_shared/climateBriefs.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/^\s*import\s/m);
    expect(src).not.toMatch(/\bDeno\./);
  });
});
