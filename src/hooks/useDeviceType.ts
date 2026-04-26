import { useWindowDimensions } from 'react-native';

export type LayoutType = 'compact' | 'standard' | 'expanded';

export interface DeviceContext {
  width: number;
  height: number;
  shortestSide: number;
  isLandscape: boolean;
  isPhone: boolean;
  isTablet: boolean;
  layout: LayoutType;
  fontScale: number;
  horizontalPadding: number;
  cardGap: number;
  gridColumns: number;
  tabBarHeight: number;
  fabSize: number;
  iconSize: number;
  touchTarget: number;
}

const LAYOUT_CONFIG: Record<LayoutType, Omit<DeviceContext, 'width' | 'height' | 'shortestSide' | 'isLandscape' | 'isPhone' | 'isTablet' | 'layout'>> = {
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

function getLayout(shortestSide: number): LayoutType {
  if (shortestSide >= 900) return 'expanded';
  if (shortestSide >= 600) return 'standard';
  return 'compact';
}

export function useDeviceType(): DeviceContext {
  const { width, height } = useWindowDimensions();

  const shortestSide = Math.min(width, height);
  const isLandscape = width > height;
  const layout = getLayout(shortestSide);
  const base = LAYOUT_CONFIG[layout];

  return {
    width,
    height,
    shortestSide,
    isLandscape,
    isPhone: layout === 'compact',
    isTablet: layout !== 'compact',
    layout,
    ...base,
  };
}
