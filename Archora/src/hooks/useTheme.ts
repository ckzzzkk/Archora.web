import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    AsyncStorage.getItem(THEME_KEY).then((v) => {
      if (v) setThemeNameState(v as ThemeName);
    });
    AsyncStorage.getItem(CUSTOM_PRIMARY_KEY).then((v) => {
      setCustomPrimary(v);
    });
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
    void AsyncStorage.setItem(THEME_KEY, name);
    const cfg = COLOR_THEMES[name] ?? COLOR_THEMES.drafting;
    setPrimaryColor(customPrimary ?? cfg.primary);
  }, [customPrimary, setPrimaryColor]);

  const setCustomPrimaryColor = useCallback((color: string | null) => {
    setCustomPrimary(color);
    if (color !== null) {
      void AsyncStorage.setItem(CUSTOM_PRIMARY_KEY, color);
      setPrimaryColor(color);
    } else {
      void AsyncStorage.removeItem(CUSTOM_PRIMARY_KEY);
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
