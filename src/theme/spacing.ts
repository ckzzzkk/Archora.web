// Base unit: 4px. All spacing and radius values must come from here.
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

// RADIUS must match DS.radius in designSystem.ts — oval-first, never sharp
export const RADIUS = {
  input:   50,  // oval pill inputs
  card:    24,  // content cards
  button:  50,  // oval pill buttons
  chip:    50,  // filter chips
  pill:    999, // full round
  small:   12,  // small elements (badges, tags)
  medium:  16,  // medium elements
  large:   24,  // large cards, modals
} as const;

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  display: 48,
} as const;

export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// Minimum touch target
export const MIN_TOUCH_TARGET = 44;
