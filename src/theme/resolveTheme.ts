// src/theme/resolveTheme.ts
import { COLOR_THEMES, withAlpha, type ThemeName } from './colors';

export interface ThemeColorSet {
  background:   string;
  surface:      string;
  surfaceHigh:  string;
  surfaceTop:   string;
  border:       string;
  borderLight:  string;
  primary:      string;
  primaryDim:   string;
  primaryGhost: string;
  accent:       string;
  accentGlow:   string;
  success:      string;
  warning:      string;
  error:        string;
  overlay:      string;
  gridLine:     string;
}

export const DARK_THEME_COLORS: ThemeColorSet = {
  background: '#1A1A1A', surface: '#222222', surfaceHigh: '#2C2C2C', surfaceTop: '#363636',
  border: '#333333', borderLight: '#3D3D3D',
  primary: '#F0EDE8', primaryDim: '#9A9590', primaryGhost: '#5A5550',
  accent: '#C8C8C8', accentGlow: 'rgba(200,200,200,0.12)',
  success: '#7AB87A', warning: '#D4A84B', error: '#C0604A',
  overlay: 'rgba(0,0,0,0.85)', gridLine: '#252525',
};

export const LIGHT_THEME_COLORS: ThemeColorSet = {
  background: '#F5F2EC', surface: '#ECEAE3', surfaceHigh: '#E2DED6', surfaceTop: '#D8D4CB',
  border: '#C8C4BA', borderLight: '#D4D0C7',
  primary: '#1A1A1A', primaryDim: '#4A4640', primaryGhost: '#8A8680',
  accent: '#1A1A1A', accentGlow: 'rgba(26,26,26,0.08)',
  success: '#4A8A4A', warning: '#9A6B10', error: '#963030',
  overlay: 'rgba(0,0,0,0.45)', gridLine: '#E0DDD5',
};

export interface BgTint { hue: number; warmth: number; }            // hue 0..360, warmth 0..1
export interface CustomPalette { accent: string; bgTint: BgTint | null; }

export function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

// Lightness steps per mode keep surfaces inside a legible band.
const DARK_L  = { background: 0.10, surface: 0.13, surfaceHigh: 0.17, surfaceTop: 0.21 };
const LIGHT_L = { background: 0.95, surface: 0.92, surfaceHigh: 0.88, surfaceTop: 0.84 };

function deriveSurfaces(mode: 'dark' | 'light', tint: BgTint) {
  const L = mode === 'dark' ? DARK_L : LIGHT_L;
  const sat = 0.05 + Math.max(0, Math.min(1, tint.warmth)) * 0.10; // 0.05..0.15
  return {
    background:  hslToHex(tint.hue, sat, L.background),
    surface:     hslToHex(tint.hue, sat, L.surface),
    surfaceHigh: hslToHex(tint.hue, sat, L.surfaceHigh),
    surfaceTop:  hslToHex(tint.hue, sat, L.surfaceTop),
  };
}

export function resolveThemeColors(
  mode: 'dark' | 'light',
  themeName: ThemeName,
  customPalette: CustomPalette | null,
): ThemeColorSet {
  const base = mode === 'light' ? LIGHT_THEME_COLORS : DARK_THEME_COLORS;
  const presetAccent = COLOR_THEMES[themeName]?.primary ?? base.accent;
  const accent = customPalette?.accent ?? presetAccent;
  const surfaces = customPalette?.bgTint
    ? deriveSurfaces(mode, customPalette.bgTint)
    : { background: base.background, surface: base.surface, surfaceHigh: base.surfaceHigh, surfaceTop: base.surfaceTop };
  return {
    ...base,
    ...surfaces,
    accent,
    accentGlow: withAlpha(accent, mode === 'dark' ? 0.15 : 0.10),
  };
}
