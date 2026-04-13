import { useState, useEffect, useCallback } from 'react';
import { Storage } from '../utils/storage';
import { BASE_COLORS, COLOR_THEMES, type ThemeName, type ColorTheme } from '../theme/colors';
import { useUIStore } from '../stores/uiStore';

const THEME_KEY = 'asoria_theme';
const CUSTOM_PRIMARY_KEY = 'asoria_custom_primary';

export interface ThemeColors {
  // Base
  background: string;
  surface: string;
  surfaceHigh: string;
  border: string;
  // Accent
  primary: string;
  primaryDim: string;
  primaryGlow: string;
  scratchLine: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textDim: string;
  // Semantic
  success: string;
  warning: string;
  error: string;
}

export function useTheme() {
  const [themeName, setThemeNameState] = useState<ThemeName>('drafting');
  const [customPrimary, setCustomPrimary] = useState<string | null>(null);
  const setPrimaryColor = useUIStore((s) => s.actions.setPrimaryColor);

  useEffect(() => {
    const v = Storage.getString(THEME_KEY);
    if (v) setThemeNameState(v as ThemeName);
    const cp = Storage.getString(CUSTOM_PRIMARY_KEY);
    setCustomPrimary(cp);
  }, []);

  const themeConfig: ColorTheme = COLOR_THEMES[themeName] ?? COLOR_THEMES.drafting;

  const resolvedPrimary = customPrimary ?? themeConfig.primary;

  const colors: ThemeColors = {
    ...BASE_COLORS,
    primary: resolvedPrimary,
    primaryDim: themeConfig.primaryDim,
    primaryGlow: themeConfig.primaryGlow,
    scratchLine: customPrimary ?? themeConfig.scratchLine,
  };

  // Keep uiStore in sync whenever resolved primary changes
  useEffect(() => {
    setPrimaryColor(resolvedPrimary);
  }, [resolvedPrimary, setPrimaryColor]);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeNameState(name);
    Storage.set(THEME_KEY, name);
    const cfg = COLOR_THEMES[name] ?? COLOR_THEMES.drafting;
    setPrimaryColor(customPrimary ?? cfg.primary);
  }, [customPrimary, setPrimaryColor]);

  const setCustomPrimaryColor = useCallback((color: string | null) => {
    setCustomPrimary(color);
    if (color !== null) {
      Storage.set(CUSTOM_PRIMARY_KEY, color);
      setPrimaryColor(color);
    } else {
      Storage.delete(CUSTOM_PRIMARY_KEY);
      setPrimaryColor(themeConfig.primary);
    }
  }, [themeConfig.primary, setPrimaryColor]);

  return {
    colors,
    themeName,
    themeConfig,
    setTheme,
    setCustomPrimaryColor,
    allThemes: COLOR_THEMES,
  };
}
