import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ROOM_STANDARDS,
  CIRCULATION_STANDARDS,
  EGRESS_STANDARDS,
  STRUCTURAL_STANDARDS,
  buildStandardsPromptSection,
} from '../../../supabase/functions/_shared/buildingStandards';
import { ROOM_MINIMA } from '../../utils/layoutEngine/types';

describe('ROOM_STANDARDS ⇄ layoutEngine ROOM_MINIMA consistency', () => {
  it('covers exactly the same room types', () => {
    expect(Object.keys(ROOM_STANDARDS).sort()).toEqual(Object.keys(ROOM_MINIMA).sort());
  });

  it('area and minimum dimension values match the layout engine', () => {
    for (const [type, minima] of Object.entries(ROOM_MINIMA)) {
      const std = ROOM_STANDARDS[type];
      expect(std, `ROOM_STANDARDS missing ${type}`).toBeDefined();
      expect(std.minAreaM2, `${type} minArea drift`).toBe(minima.minArea);
      expect(std.minDimM, `${type} minDim drift`).toBe(minima.minWidth);
    }
  });
});

describe('standards sanity', () => {
  it('habitable rooms need windows, service rooms do not', () => {
    for (const t of ['bedroom', 'living_room', 'dining_room', 'kitchen', 'office']) {
      expect(ROOM_STANDARDS[t].needsWindow, t).toBe(true);
      expect(ROOM_STANDARDS[t].minWindowRatio).toBeGreaterThan(0);
    }
    for (const t of ['bathroom', 'hallway', 'garage', 'storage', 'staircase']) {
      expect(ROOM_STANDARDS[t].needsWindow, t).toBe(false);
    }
  });

  it('circulation values are within sane residential bounds', () => {
    expect(CIRCULATION_STANDARDS.corridorMinWidthM).toBeGreaterThanOrEqual(0.9);
    expect(CIRCULATION_STANDARDS.doorClearWidthM).toBeGreaterThanOrEqual(0.7);
    expect(CIRCULATION_STANDARDS.ceilingMinM).toBeGreaterThanOrEqual(2.3);
    expect(CIRCULATION_STANDARDS.stairMaxRiserM).toBeLessThanOrEqual(0.2);
    expect(EGRESS_STANDARDS.bedroomEgressWindowM2).toBeGreaterThan(0.4);
    expect(STRUCTURAL_STANDARDS.maxClearSpanM).toBe(6.0);
  });
});

describe('buildStandardsPromptSection', () => {
  it('produces a numeric section mentioning every standard group', () => {
    const s = buildStandardsPromptSection('house');
    expect(s).toContain('INTERNATIONAL RESIDENTIAL STANDARDS');
    expect(s).toContain('house');
    expect(s).toContain('Habitable rooms');
    expect(s).toContain('Circulation');
    expect(s).toContain('Stairs');
    expect(s).toContain('Egress');
    expect(s).toContain('Structure');
    expect(s).toMatch(/≥\d+(\.\d+)?m²/);
  });
});

describe('module purity (dual-import contract)', () => {
  it('contains no import statements and no Deno globals', () => {
    const src = readFileSync(
      resolve(__dirname, '../../../supabase/functions/_shared/buildingStandards.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/^\s*import\s/m);
    expect(src).not.toMatch(/\bDeno\./);
  });
});
