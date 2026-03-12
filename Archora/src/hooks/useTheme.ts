import { useCallback } from 'react';
import { useMMKVString } from 'react-native-mmkv';
import { storage } from '../utils/storage';
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
  const [themeName, setThemeName] = useMMKVString(THEME_KEY, storage);
  const [customPrimary] = useMMKVString(CUSTOM_PRIMARY_KEY, storage);

  const currentThemeName = (themeName as ThemeName) ?? 'drafting';
  const themeConfig: ColorTheme = COLOR_THEMES[currentThemeName] ?? COLOR_THEMES.drafting;

  const colors: ThemeColors = {
    ...BASE_COLORS,
    primary: customPrimary ?? themeConfig.primary,
    primaryDim: themeConfig.primaryDim,
    primaryGlow: themeConfig.primaryGlow,
    scratchLine: customPrimary ?? themeConfig.scratchLine,
  };

  const setTheme = useCallback((name: ThemeName) => {
    setThemeName(name);
  }, [setThemeName]);

  return {
    colors,
    themeName: currentThemeName,
    themeConfig,
    setTheme,
    allThemes: COLOR_THEMES,
  };
}
