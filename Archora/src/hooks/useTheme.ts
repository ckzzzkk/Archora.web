import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_COLORS, COLOR_THEMES, type ThemeName, type ColorTheme } from '../theme/colors';

const THEME_KEY = 'archora_theme';
const CUSTOM_PRIMARY_KEY = 'archora_custom_primary';

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

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => {
      if (v) setThemeNameState(v as ThemeName);
    });
    AsyncStorage.getItem(CUSTOM_PRIMARY_KEY).then((v) => {
      setCustomPrimary(v);
    });
  }, []);

  const themeConfig: ColorTheme = COLOR_THEMES[themeName] ?? COLOR_THEMES.drafting;

  const colors: ThemeColors = {
    ...BASE_COLORS,
    primary: customPrimary ?? themeConfig.primary,
    primaryDim: themeConfig.primaryDim,
    primaryGlow: themeConfig.primaryGlow,
    scratchLine: customPrimary ?? themeConfig.scratchLine,
  };

  const setTheme = useCallback((name: ThemeName) => {
    setThemeNameState(name);
    void AsyncStorage.setItem(THEME_KEY, name);
  }, []);

  return {
    colors,
    themeName,
    themeConfig,
    setTheme,
    allThemes: COLOR_THEMES,
  };
}
