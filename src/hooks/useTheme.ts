// src/hooks/useTheme.ts
import { useEffect } from 'react';
import { COLOR_THEMES, withAlpha, type ThemeName, type ColorTheme } from '../theme/colors';
import { useAppearanceStore } from '../stores/appearanceStore';
import { useThemeColors } from './useThemeColors';
import { useUIStore } from '../stores/uiStore';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHigh: string;
  border: string;
  primary: string;
  primaryDim: string;
  primaryGlow: string;
  scratchLine: string;
  textPrimary: string;
  textSecondary: string;
  textDim: string;
  success: string;
  warning: string;
  error: string;
}

export function useTheme() {
  const cset          = useThemeColors();
  const themeName     = useAppearanceStore((s) => s.themeName);
  const customPalette = useAppearanceStore((s) => s.customPalette);
  const setThemeStore     = useAppearanceStore((s) => s.setTheme);
  const setPaletteStore   = useAppearanceStore((s) => s.setCustomPalette);
  const clearPaletteStore = useAppearanceStore((s) => s.clearCustomPalette);
  const setPrimaryColor   = useUIStore((s) => s.actions.setPrimaryColor);

  const themeConfig: ColorTheme = COLOR_THEMES[themeName] ?? COLOR_THEMES.drafting;

  // Accent dim/glow: preset values when no custom palette, else derived from accent.
  const primaryDim  = customPalette ? withAlpha(cset.accent, 0.7) : themeConfig.primaryDim;
  const primaryGlow = customPalette ? withAlpha(cset.accent, 0.4) : themeConfig.primaryGlow;

  const colors: ThemeColors = {
    background: cset.background,
    surface: cset.surface,
    surfaceHigh: cset.surfaceHigh,
    // Ink Blueprint border IS the ink color (ink-white on dark, near-black on light),
    // NOT cset.border (#333). Mapping to cset.primary preserves the legacy look in both modes.
    border: cset.primary,
    primary: cset.accent,
    primaryDim,
    primaryGlow,
    scratchLine: cset.accent,
    textPrimary: cset.primary,
    textSecondary: cset.primaryDim,
    textDim: cset.primaryGhost,
    success: cset.success,
    warning: cset.warning,
    error: cset.error,
  };

  useEffect(() => { setPrimaryColor(cset.accent); }, [cset.accent, setPrimaryColor]);

  const setTheme = (name: ThemeName) => setThemeStore(name);
  const setCustomPrimaryColor = (color: string | null) => {
    if (color !== null) setPaletteStore({ accent: color, bgTint: customPalette?.bgTint ?? null });
    else clearPaletteStore();
  };

  return { colors, themeName, themeConfig, setTheme, setCustomPrimaryColor, allThemes: COLOR_THEMES };
}
