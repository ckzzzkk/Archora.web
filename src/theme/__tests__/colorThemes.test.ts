// src/theme/__tests__/colorThemes.test.ts
import { describe, it, expect } from 'vitest';
import { COLOR_THEMES } from '../colors';

describe('COLOR_THEMES', () => {
  it('includes the original 6 plus 4 new presets', () => {
    const keys = Object.keys(COLOR_THEMES);
    expect(keys).toEqual(expect.arrayContaining([
      'drafting','blueprint','sketchbook','studio','night_shift','copper',
      'charcoal','forest','rose','slate',
    ]));
    expect(keys.length).toBe(10);
  });
  it('every preset has the full ColorTheme shape', () => {
    for (const t of Object.values(COLOR_THEMES)) {
      for (const k of ['name','label','primary','primaryDim','primaryGlow','secondary','scratchLine']) {
        expect(t).toHaveProperty(k);
      }
    }
  });
});
