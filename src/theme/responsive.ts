import type { LayoutType } from '../hooks/useDeviceType';

export interface ResponsiveTokens {
  fontScale: number;
  horizontalPadding: number;
  cardGap: number;
  gridColumns: number;
  tabBarHeight: number;
  fabSize: number;
  iconSize: number;
  touchTarget: number;
}

export const RESPONSIVE_TOKENS: Record<LayoutType, ResponsiveTokens> = {
  compact: {
    fontScale: 1.0,
    horizontalPadding: 16,
    cardGap: 12,
    gridColumns: 2,
    tabBarHeight: 56,
    fabSize: 48,
    iconSize: 18,
    touchTarget: 44,
  },
  standard: {
    fontScale: 1.15,
    horizontalPadding: 32,
    cardGap: 20,
    gridColumns: 3,
    tabBarHeight: 64,
    fabSize: 56,
    iconSize: 22,
    touchTarget: 48,
  },
  expanded: {
    fontScale: 1.25,
    horizontalPadding: 48,
    cardGap: 24,
    gridColumns: 4,
    tabBarHeight: 64,
    fabSize: 60,
    iconSize: 24,
    touchTarget: 48,
  },
};

export function getResponsiveTokens(layout: LayoutType): ResponsiveTokens {
  return RESPONSIVE_TOKENS[layout];
}