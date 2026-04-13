// Teal Sketch design tokens — teal + white sketchy palette replacing SUNRISE glass.
// Deep teal backgrounds, cyan accents (#C9FFFD), yellow highlights (#FFEE8C), near-white text (#FEFFFD).

export const SUNRISE = {
  // Dark teal base
  background: '#061A1A',
  surface:    '#0C2424',
  elevated:   '#122E2E',
  border:     'rgba(201, 255, 253, 0.12)',

  // Accent spectrum
  rose:  '#FF8C9A',
  amber: '#FFEE8C',
  gold:  '#C9FFFD',
  peach: '#E0FFFE',

  // Text
  textPrimary:   '#FEFFFD',
  textSecondary: '#8ADEDD',
  textDim:       '#4A8080',

  // Glass surfaces — teal-tinted
  glass: {
    subtleBg:        'rgba(201, 255, 253, 0.03)',
    subtleBorder:    'rgba(201, 255, 253, 0.07)',
    mediumBg:        'rgba(201, 255, 253, 0.06)',
    mediumBorder:    'rgba(201, 255, 253, 0.12)',
    prominentBg:     'rgba(201, 255, 253, 0.10)',
    prominentBorder: 'rgba(201, 255, 253, 0.20)',
    navBg:           'rgba(6, 26, 26, 0.90)',
    navBorder:       'rgba(201, 255, 253, 0.18)',
  },

  // Semantic aliases
  goldBorderDim:   'rgba(201, 255, 253, 0.10)',
  goldBorderPress: 'rgba(201, 255, 253, 0.30)',
  goldBorderFocus: 'rgba(201, 255, 253, 0.50)',
  violetBorder:    'rgba(201, 255, 253, 0.12)',
  toastBg:         'rgba(6, 26, 26, 0.96)',
  sheetHandle:     'rgba(201, 255, 253, 0.25)',
  sheetTopBorder:  'rgba(201, 255, 253, 0.15)',
  separatorLine:   'rgba(201, 255, 253, 0.08)',
  inactiveTint:    'rgba(201, 255, 253, 0.30)',
} as const;
