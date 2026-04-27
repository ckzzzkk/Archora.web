/**
 * ASORIA Design System — ink blueprint aesthetic
 * Import as: import { DS } from '../../theme/designSystem'
 *
 * Theme: Chalkboard dark (#1A1A1A) with pure white ink (#F0EDE8) and amber (#D4A84B)
 * All hand-drawn, wobbly, sketchy aesthetic throughout.
 */
export const DS = {
  colors: {
    background:   '#1A1A1A',  // chalkboard
    surface:      '#222222',  // card bg
    surfaceHigh:  '#2C2C2C',  // elevated
    surfaceTop:   '#2C2C2C',
    border:       '#F0EDE8',  // pure white ink border
    borderLight:  'rgba(240, 237, 232, 0.18)',
    primary:      '#F0EDE8',  // ink white
    primaryDim:   '#9A9590',
    primaryGhost: '#5A5550',
    accent:       '#D4A84B',  // amber
    accentGlow:   'rgba(212, 168, 75, 0.15)',
    success:      '#7AB87A',
    warning:      '#D4A84B',
    error:        '#C0604A',
    overlay:      'rgba(0,0,0,0.85)',
    gridLine:     'rgba(240, 237, 232, 0.18)',
    // Aliases matching reference
    ink:          '#F0EDE8',
    paper:        '#1A1A1A',
    amber:        '#D4A84B',
    card:         '#222222',
    cardForeground:'#F0EDE8',
    muted:        '#2C2C2C',
    mutedForeground:'#9A9590',
  },

  radius: {
    oval:    50,
    card:    24,
    input:   50,
    chip:    50,
    modal:   24,
    button:  50,
    small:   12,
    medium:  16,
    large:   24,
  },

  spacing: {
    xxs:  2,
    xs:   4,
    sm:   8,
    md:   16,
    lg:   24,
    xl:   32,
    xxl:  48,
    xxxl: 64,
  },

  font: {
    heading:  'ArchitectsDaughter_400Regular',
    regular:  'Inter_400Regular',
    medium:   'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold:     'Inter_700Bold',
    mono:     'JetBrainsMono_400Regular',
    monoBold: 'JetBrainsMono_700Bold',
  },

  fontSize: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   17,
    xl:   20,
    xxl:  24,
    xxxl: 32,
    hero: 40,
  },

  animation: {
    fast:     150,
    normal:   250,
    slow:     400,
    verySlow: 600,
  },

  shadow: {
    // Blurred shadows (for elevated elements)
    small: {
      shadowColor:   '#000',
      shadowOffset:  { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius:  4,
      elevation:     4,
    },
    medium: {
      shadowColor:   '#000',
      shadowOffset:  { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius:  8,
      elevation:     8,
    },
    large: {
      shadowColor:   '#000',
      shadowOffset:  { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius:  16,
      elevation:     16,
    },
    // Sketch-style ink shadows (hand-drawn aesthetic)
    // Uses hardcoded ink color #F0EDE8 to avoid circular reference
    sketch: {
      shadowColor:   '#F0EDE8',
      shadowOffset:  { width: 3, height: 4 },
      shadowOpacity: 1,
      shadowRadius:  0,
      elevation:     0,
    },
    sketchSm: {
      shadowColor:   '#F0EDE8',
      shadowOffset:  { width: 2, height: 2 },
      shadowOpacity: 1,
      shadowRadius:  0,
      elevation:     0,
    },
    sketchLg: {
      shadowColor:   '#F0EDE8',
      shadowOffset:  { width: 5, height: 6 },
      shadowOpacity: 1,
      shadowRadius:  0,
      elevation:     0,
    },
  },
} as const;
