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

// Base colors — grey-first dark mode palette
export const BASE_COLORS = {
  background:    '#1A1A1A',
  surface:       '#222222',
  surfaceHigh:   '#2C2C2C',
  border:        '#333333',
  textPrimary:   '#F0EDE8',
  textSecondary: '#9A9590',
  textDim:       '#5A5550',
  success:       '#7AB87A',
  warning:       '#D4A84B',
  error:         '#C0604A',
} as const;

/** Add alpha to a hex color. Usage: withAlpha(BASE_COLORS.surface, 0.85) */
export function withAlpha(hexColor: string, alpha: number): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
