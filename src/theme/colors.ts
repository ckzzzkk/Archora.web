/**
 * ASORIA — Ink Blueprint Design System
 * Based on the ink-blueprint-magic reference aesthetic.
 * Pure chalkboard dark = oklch(0.12 0 0), Pure paper light = oklch(0.99 0 0)
 * All ink-like, scribbly, wobbly. Amber accent throughout.
 */

// ─── Ink/Paper palette (CSS custom-property equivalents) ───────────────────
// Dark theme = chalkboard
export const INK = '#F0EDE8';   // pure white ink (oklch 0.99)
export const PAPER = '#1A1A1A'; // chalkboard dark (oklch 0.12)

// Base colors — ink-on-chalkboard dark mode
export const BASE_COLORS = {
  background:    '#1A1A1A',  // chalkboard
  surface:       '#222222',  // card background
  surfaceHigh:   '#2C2C2C',  // elevated surfaces
  border:        '#F0EDE8',  // ink border (pure white, not grey)
  textPrimary:   '#F0EDE8',  // ink white
  textSecondary: '#9A9590',  // dim ink
  textDim:       '#5A5550',  // very dim
  // Semantic
  ink:           '#F0EDE8',  // alias for border/primary
  amber:         '#D4A84B',  // warm gold accent
  success:       '#7AB87A',  // unchanged
  warning:       '#D4A84B',  // same as amber
  error:         '#C0604A',  // unchanged
  // Additional reference tokens
  card:          '#222222',
  cardForeground:'#F0EDE8',
  muted:         '#2C2C2C',
  mutedForeground:'#9A9590',
  accent:        '#F0EDE8',
  accentForeground:'#1A1A1A',
  destructive:   '#F0EDE8',
  destructiveForeground:'#1A1A1A',
  input:         '#2C2C2C',
  ring:          '#F0EDE8',
} as const;

// ─── Legacy theme color maps (for useTheme / ThemeCustomiser) ─────────────────
// Re-exports for backward compatibility
export type ThemeName = 'drafting' | 'blueprint' | 'sketchbook' | 'studio' | 'night_shift' | 'copper';

export interface ColorTheme {
  name: ThemeName;
  label: string;
  primary: string;
  primaryDim: string;
  primaryGlow: string;
  secondary: string;
  scratchLine: string;
}

export const COLOR_THEMES: Record<ThemeName, ColorTheme> = {
  drafting: {
    name: 'drafting',
    label: 'Teal Sketch',
    primary: '#C9FFFD',
    primaryDim: '#8ADEDD',
    primaryGlow: '#E0FFFE',
    secondary: '#061A1A',
    scratchLine: '#C9FFFD',
  },
  blueprint: {
    name: 'blueprint',
    label: 'Blueprint',
    primary: '#4A90D9',
    primaryDim: '#2E6BA8',
    primaryGlow: '#6AAFF0',
    secondary: '#0A1E30',
    scratchLine: '#4A90D9',
  },
  sketchbook: {
    name: 'sketchbook',
    label: 'Sketchbook',
    primary: '#FFEE8C',
    primaryDim: '#D4C440',
    primaryGlow: '#FFF5B0',
    secondary: '#1A1800',
    scratchLine: '#FFEE8C',
  },
  studio: {
    name: 'studio',
    label: 'Studio',
    primary: '#FF8C9A',
    primaryDim: '#C05060',
    primaryGlow: '#FFB0BC',
    secondary: '#1A080C',
    scratchLine: '#FF8C9A',
  },
  night_shift: {
    name: 'night_shift',
    label: 'Night Shift',
    primary: '#A888E8',
    primaryDim: '#6848A8',
    primaryGlow: '#C8A8FF',
    secondary: '#0A0814',
    scratchLine: '#A888E8',
  },
  copper: {
    name: 'copper',
    label: 'Copper',
    primary: '#FFB870',
    primaryDim: '#C08040',
    primaryGlow: '#FFD4A0',
    secondary: '#1A1000',
    scratchLine: '#FFB870',
  },
};

/** Add alpha to a hex color. Usage: withAlpha(BASE_COLORS.surface, 0.85) */
export function withAlpha(hexColor: string, alpha: number): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
