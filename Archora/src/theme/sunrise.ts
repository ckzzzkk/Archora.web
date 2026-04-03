// Sunrise Glass design tokens — single source of truth for the warm sunrise palette.
// Import from colors.ts and designSystem.ts, not directly from this file.

export const SUNRISE = {
  // Sky Base
  background: '#0E0B1A',
  surface: '#16122A',
  elevated: '#1F1A38',
  border: 'rgba(180, 130, 220, 0.15)',

  // Sunrise Accent Spectrum
  rose: '#E8758A',
  amber: '#D4844B',
  gold: '#E8B86D',
  peach: '#F2C4A0',

  // Text (warm shift)
  textPrimary: '#F5F0EA',
  textSecondary: '#9A8E8A',
  textDim: '#5A5050',

  // Glass surfaces
  glass: {
    subtleBg: 'rgba(255, 255, 255, 0.04)',
    subtleBorder: 'rgba(255, 200, 150, 0.08)',
    mediumBg: 'rgba(255, 255, 255, 0.08)',
    mediumBorder: 'rgba(255, 180, 120, 0.15)',
    prominentBg: 'rgba(255, 255, 255, 0.12)',
    prominentBorder: 'rgba(255, 160, 80, 0.25)',
    navBg: 'rgba(14, 11, 26, 0.85)',
    navBorder: 'rgba(232, 181, 109, 0.20)',
  },

  // Semantic aliases
  goldBorderDim: 'rgba(232, 181, 109, 0.12)',
  goldBorderPress: 'rgba(232, 181, 109, 0.35)',
  goldBorderFocus: 'rgba(232, 181, 109, 0.50)',
  violetBorder: 'rgba(180, 130, 220, 0.20)',
  toastBg: 'rgba(22, 18, 42, 0.95)',
  sheetHandle: 'rgba(232, 181, 109, 0.30)',
  sheetTopBorder: 'rgba(232, 181, 109, 0.20)',
  separatorLine: 'rgba(232, 181, 109, 0.10)',
  inactiveTint: 'rgba(242, 196, 160, 0.40)',
} as const;
