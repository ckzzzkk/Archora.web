import { SUNRISE } from './sunrise';

/**
 * ASORIA Design System — single source of truth for all visual decisions.
 * Import as: import { DS } from '../../theme/designSystem'
 *
 * BASE_COLORS in colors.ts remain the authoritative colour tokens for existing code.
 * DS.colors mirrors and extends them for new components.
 */
export const DS = {
  colors: {
    background:   SUNRISE.background,
    surface:      SUNRISE.surface,
    surfaceHigh:  SUNRISE.elevated,
    surfaceTop:   '#193535',
    border:       SUNRISE.border,
    borderLight:  'rgba(201, 255, 253, 0.20)',
    primary:      SUNRISE.gold,      // #C9FFFD cyan
    primaryDim:   SUNRISE.textSecondary,
    primaryGhost: SUNRISE.inactiveTint,
    accent:       SUNRISE.amber,     // #FFEE8C yellow
    accentGlow:   'rgba(201, 255, 253, 0.12)',
    success:      '#7AB87A',
    warning:      SUNRISE.amber,
    error:        SUNRISE.rose,
    overlay:      'rgba(0,0,0,0.85)',
    gridLine:     '#0A2020',
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
  },
} as const;
