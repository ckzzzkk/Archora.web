import { SUNRISE } from './sunrise';

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
    label: 'Drafting',
    primary: '#C8C8C8',
    primaryDim: '#8A8A8A',
    primaryGlow: '#E8E8E8',
    secondary: '#1A1A1A',
    scratchLine: '#D4D4D4',
  },
  blueprint: {
    name: 'blueprint',
    label: 'Blueprint',
    primary: '#4A90D9',
    primaryDim: '#2E6BA8',
    primaryGlow: '#6AAFF0',
    secondary: '#1E3A5F',
    scratchLine: '#4A90D9',
  },
  sketchbook: {
    name: 'sketchbook',
    label: 'Sketchbook',
    primary: '#C4853A',
    primaryDim: '#8A5E28',
    primaryGlow: '#E0A050',
    secondary: '#2E2118',
    scratchLine: '#C4853A',
  },
  studio: {
    name: 'studio',
    label: 'Studio',
    primary: '#C06050',
    primaryDim: '#8A4038',
    primaryGlow: '#E07868',
    secondary: '#1E1510',
    scratchLine: '#C06050',
  },
  night_shift: {
    name: 'night_shift',
    label: 'Night Shift',
    primary: '#8B6BC8',
    primaryDim: '#614898',
    primaryGlow: '#A888E8',
    secondary: '#12101A',
    scratchLine: '#8B6BC8',
  },
  copper: {
    name: 'copper',
    label: 'Copper',
    primary: '#B87040',
    primaryDim: '#885020',
    primaryGlow: '#D89060',
    secondary: '#1A1208',
    scratchLine: '#B87040',
  },
};

// Base colors — sunrise glass palette
export const BASE_COLORS = {
  background:    SUNRISE.background,
  surface:       SUNRISE.surface,
  surfaceHigh:   SUNRISE.elevated,
  border:        SUNRISE.border,
  textPrimary:   SUNRISE.textPrimary,
  textSecondary: SUNRISE.textSecondary,
  textDim:       SUNRISE.textDim,
  success:       '#7AB87A',
  warning:       SUNRISE.amber,
  error:         SUNRISE.rose,
} as const;

/** Add alpha to a hex color. Usage: withAlpha(BASE_COLORS.surface, 0.85) */
export function withAlpha(hexColor: string, alpha: number): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
