// src/theme/__tests__/resolveTheme.test.ts
import { describe, it, expect } from 'vitest';
import { resolveThemeColors, hslToHex, DARK_THEME_COLORS, LIGHT_THEME_COLORS } from '../resolveTheme';

describe('hslToHex', () => {
  it('converts pure red', () => expect(hslToHex(0, 1, 0.5)).toBe('#ff0000'));
  it('converts pure green', () => expect(hslToHex(120, 1, 0.5)).toBe('#00ff00'));
  it('produces 7-char hex', () => expect(hslToHex(210, 0.5, 0.3)).toMatch(/^#[0-9a-f]{6}$/));
  it('hue 360 wraps to same as hue 0', () => expect(hslToHex(360, 1, 0.5)).toBe(hslToHex(0, 1, 0.5)));
});

describe('resolveThemeColors', () => {
  it('uses preset accent when no custom palette (dark)', () => {
    const c = resolveThemeColors('dark', 'forest', null);
    expect(c.accent).toBe('#7AB87A');
    expect(c.background).toBe(DARK_THEME_COLORS.background);
    expect(c.border).toBe(DARK_THEME_COLORS.border);
  });
  it('uses light base in light mode', () => {
    const c = resolveThemeColors('light', 'forest', null);
    expect(c.background).toBe(LIGHT_THEME_COLORS.background);
    expect(c.border).toBe(LIGHT_THEME_COLORS.border);
  });
  it('custom accent overrides preset in both modes', () => {
    expect(resolveThemeColors('dark', 'forest', { accent: '#FF8800', bgTint: null }).accent).toBe('#FF8800');
    expect(resolveThemeColors('light', 'forest', { accent: '#FF8800', bgTint: null }).accent).toBe('#FF8800');
  });
  it('bgTint shifts surfaces but keeps border/text fixed (dark stays dark)', () => {
    const c = resolveThemeColors('dark', 'drafting', { accent: '#FF8800', bgTint: { hue: 210, warmth: 0.5 } });
    expect(c.background).not.toBe(DARK_THEME_COLORS.background);
    expect(c.border).toBe(DARK_THEME_COLORS.border);       // identity preserved
    expect(c.primary).toBe(DARK_THEME_COLORS.primary);     // text preserved
    // dark band: background must stay dark (luminance low) — first hex pair < 0x60
    expect(parseInt(c.background.slice(1, 3), 16)).toBeLessThan(0x60);
  });
  it('bgTint in light mode stays light', () => {
    const c = resolveThemeColors('light', 'drafting', { accent: '#FF8800', bgTint: { hue: 30, warmth: 0.5 } });
    expect(parseInt(c.background.slice(1, 3), 16)).toBeGreaterThan(0xC0);
  });
  it('out-of-range hue (400) still produces valid dark hex', () => {
    const c = resolveThemeColors('dark', 'drafting', { accent: '#FF8800', bgTint: { hue: 400, warmth: 0.5 } });
    expect(c.background).toMatch(/^#[0-9a-f]{6}$/);
    expect(parseInt(c.background.slice(1, 3), 16)).toBeLessThan(0x60);
  });
  it('NaN hue and warmth still produce valid hex (no NaN substring)', () => {
    const c = resolveThemeColors('dark', 'drafting', { accent: '#FF8800', bgTint: { hue: NaN, warmth: NaN } });
    expect(c.background).toMatch(/^#[0-9a-f]{6}$/);
    expect(c.background).not.toContain('NaN');
  });
});
