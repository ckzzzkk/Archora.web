import { useAppearanceStore } from '../stores/appearanceStore';

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
  background:   '#1A1A1A',
  surface:      '#222222',
  surfaceHigh:  '#2C2C2C',
  surfaceTop:   '#363636',
  border:       '#333333',
  borderLight:  '#3D3D3D',
  primary:      '#F0EDE8',
  primaryDim:   '#9A9590',
  primaryGhost: '#5A5550',
  accent:       '#C8C8C8',
  accentGlow:   'rgba(200,200,200,0.12)',
  success:      '#7AB87A',
  warning:      '#D4A84B',
  error:        '#C0604A',
  overlay:      'rgba(0,0,0,0.85)',
  gridLine:     '#252525',
};

export const LIGHT_THEME_COLORS: ThemeColorSet = {
  background:   '#F5F2EC',
  surface:      '#ECEAE3',
  surfaceHigh:  '#E2DED6',
  surfaceTop:   '#D8D4CB',
  border:       '#C8C4BA',
  borderLight:  '#D4D0C7',
  primary:      '#1A1A1A',
  primaryDim:   '#4A4640',
  primaryGhost: '#8A8680',
  accent:       '#1A1A1A',
  accentGlow:   'rgba(26,26,26,0.08)',
  success:      '#4A8A4A',
  warning:      '#9A6B10',
  error:        '#963030',
  overlay:      'rgba(0,0,0,0.45)',
  gridLine:     '#E0DDD5',
};

export function useThemeColors(): ThemeColorSet {
  const resolved = useAppearanceStore((s) => s.resolved);
  return resolved === 'light' ? LIGHT_THEME_COLORS : DARK_THEME_COLORS;
}
