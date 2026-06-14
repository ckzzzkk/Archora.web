// src/hooks/useThemeColors.ts
import { useAppearanceStore } from '../stores/appearanceStore';
import {
  resolveThemeColors,
  type ThemeColorSet,
  DARK_THEME_COLORS,
  LIGHT_THEME_COLORS,
} from '../theme/resolveTheme';

export type { ThemeColorSet };
export { DARK_THEME_COLORS, LIGHT_THEME_COLORS };

export function useThemeColors(): ThemeColorSet {
  const resolved      = useAppearanceStore((s) => s.resolved);
  const themeName     = useAppearanceStore((s) => s.themeName);
  const customPalette = useAppearanceStore((s) => s.customPalette);
  return resolveThemeColors(resolved, themeName, customPalette);
}
