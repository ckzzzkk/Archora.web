/**
 * animationPresets.ts — the app's shared motion vocabulary.
 *
 * Components were each re-declaring spring configs (damping 14/16/20,
 * stiffness 160–600…) which made motion subtly inconsistent across screens.
 * Import from here instead:
 *
 *   import { SPRING, EASE, DUR, enterUp } from '../utils/animationPresets';
 *   pressScale.value = withSpring(0.97, SPRING.snappy);
 *   <Animated.View entering={enterUp(index)} … />
 */
import { Easing, FadeInUp, FadeInDown, FadeIn } from 'react-native-reanimated';
import { DS } from '../theme/designSystem';

/** Spring configs, gentle → punchy. */
export const SPRING = {
  /** Press feedback, snap indicators, small UI reactions. */
  snappy: { damping: 18, stiffness: 220, mass: 0.6 },
  /** Default for entrances, indicator slides, layout shifts. */
  standard: { damping: 16, stiffness: 160, mass: 0.8 },
  /** Large surfaces: sheets, panels, hero elements. */
  soft: { damping: 20, stiffness: 90, mass: 1 },
} as const;

/** Easing curves for withTiming. */
export const EASE = {
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
} as const;

/** Duration tokens (re-exported from the design system: 150/250/400/600). */
export const DUR = DS.animation;

/** Per-item stagger delay used by the entrance helpers. */
export const STAGGER_MS = 60;

/** Staggered rise-in entrance: `entering={enterUp(index)}`. */
export const enterUp = (index = 0) =>
  FadeInUp.duration(DUR.normal).delay(index * STAGGER_MS).easing(EASE.out);

/** Staggered drop-in entrance (headers, top bars). */
export const enterDown = (index = 0) =>
  FadeInDown.duration(DUR.normal).delay(index * STAGGER_MS).easing(EASE.out);

/** Plain staggered fade. */
export const enterFade = (index = 0) =>
  FadeIn.duration(DUR.normal).delay(index * STAGGER_MS);
