/**
 * ASORIA Design System — muted editorial
 * Import as: import { DS } from '../../theme/designSystem'
 *
 * Theme: dark drafting board (#1A1A1A) with ink text (#F0EDE8) and a rare amber spark (#D4A84B).
 * Calm, content-first, premium-dark. Soft corners, hairline borders, soft real depth,
 * Inter typography. Amber is a spark (active states, "live", progress) — never a fill.
 */
export const DS = {
  colors: {
    background:   '#1A1A1A',  // black drafting board (master plan spec)
    surface:      '#222222',  // card bg
    surfaceHigh:  '#2C2C2C',  // elevated
    surfaceTop:   '#2C2C2C',
    border:       'rgba(240, 237, 232, 0.08)',  // hairline — calm, near-invisible
    borderStrong: 'rgba(240, 237, 232, 0.16)',  // rare emphasis / focus rings
    borderLight:  'rgba(240, 237, 232, 0.06)',
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
    oval:    50,   // legacy pill — kept for chips / tab bar / avatars
    card:    18,   // cards, sheets, list tiles
    input:   14,   // text inputs
    chip:    50,   // filter chips stay pill
    modal:   24,   // bottom-sheet top corners
    button:  14,   // buttons — soft rect, not a pill
    pill:    999,  // true pill (tab bar, badges)
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
    heading:  'Inter_600SemiBold',            // headings are clean now
    display:  'ArchitectsDaughter_400Regular', // rare: logo / wordmark only
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
    // Legacy "sketch" keys — retired to soft black depth so any stray
    // reference inherits the muted-editorial look instead of hard ink offsets.
    sketch: {
      shadowColor:   '#000',
      shadowOffset:  { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius:  12,
      elevation:     6,
    },
    sketchSm: {
      shadowColor:   '#000',
      shadowOffset:  { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius:  6,
      elevation:     3,
    },
    sketchLg: {
      shadowColor:   '#000',
      shadowOffset:  { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius:  20,
      elevation:     12,
    },
  },

  // Motion tokens — keep animation consistent and calm across the app.
  motion: {
    auraDrift:  12000,  // ms — ambient background glow drift cycle
    stagger:    60,     // ms — per-item delay for list/feed entrances
    pulse:      1600,   // ms — "live" dot pulse cycle
    press: { damping: 16, stiffness: 360 }, // spring for press-scale feedback
  },
} as const;
