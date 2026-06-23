import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { DS } from '../../theme/designSystem';

/**
 * AmbientAura — a barely-there glow (warm amber + cool blue) that slowly drifts
 * behind a dark screen so the background never reads as flat/dead.
 *
 * Pure atmosphere: it's non-interactive and sits at the very back. Drop it as the
 * first child of a screen's root view. Motion only — adds no visible "color".
 */
interface Props {
  /** dim the whole effect (0–1). Default 1. */
  intensity?: number;
}

export function AmbientAura({ intensity = 1 }: Props) {
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: DS.motion.auraDrift, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [t]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: -width * 0.06 + t.value * width * 0.12 },
      { translateY: -height * 0.03 + t.value * height * 0.06 },
      { scale: 1 + t.value * 0.12 },
    ],
    opacity: intensity,
  }));

  // Oversize the canvas so the drift never exposes a hard edge.
  const W = width * 1.4;
  const H = height * 0.85;

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width={W} height={H} style={{ position: 'absolute', top: -H * 0.18, left: -W * 0.14 }}>
        <Defs>
          <RadialGradient id="warm" cx="32%" cy="22%" r="46%">
            <Stop offset="0" stopColor={DS.colors.amber} stopOpacity={0.1} />
            <Stop offset="1" stopColor={DS.colors.amber} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="cool" cx="82%" cy="10%" r="42%">
            <Stop offset="0" stopColor="#7C8CB4" stopOpacity={0.1} />
            <Stop offset="1" stopColor="#7C8CB4" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={W} height={H} fill="url(#warm)" />
        <Rect x="0" y="0" width={W} height={H} fill="url(#cool)" />
      </Svg>
    </Animated.View>
  );
}
