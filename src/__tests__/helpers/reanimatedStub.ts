/**
 * Minimal react-native-reanimated stub for the node test environment —
 * react-native-reanimated imports react-native (Flow syntax) which Vite's
 * parser cannot read. Provides just enough surface for pure modules like
 * animationPresets.ts; tests exercise the data, not the animations.
 */

type EasingFn = (t: number) => number;

const identity: EasingFn = (t) => t;

export const Easing = {
  cubic: identity,
  ease: identity,
  linear: identity,
  out: (fn: EasingFn) => fn,
  in: (fn: EasingFn) => fn,
  inOut: (fn: EasingFn) => fn,
};

class EnteringBuilder {
  duration(_ms: number): this {
    return this;
  }
  delay(_ms: number): this {
    return this;
  }
  easing(_fn: EasingFn): this {
    return this;
  }
  springify(): this {
    return this;
  }
}

function makeEntering(): { duration(ms: number): EnteringBuilder } & EnteringBuilder {
  return new EnteringBuilder() as ReturnType<typeof makeEntering>;
}

export const FadeIn = makeEntering();
export const FadeInUp = makeEntering();
export const FadeInDown = makeEntering();
export const FadeOut = makeEntering();
export const SlideInRight = makeEntering();
export const SlideInLeft = makeEntering();
export const SlideOutLeft = makeEntering();
export const SlideOutRight = makeEntering();

export default {};
