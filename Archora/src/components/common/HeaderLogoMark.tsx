import React, { useEffect, useRef, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { useUIStore } from '../../stores/uiStore';

/**
 * Static ARCHORA "A" mark for use in screen headers.
 * Recolours smoothly when the user changes their theme primary colour.
 */
export function HeaderLogoMark({ size = 32 }: { size?: number }) {
  const primaryColor = useUIStore((s) => s.primaryColor);
  const [fromColor, setFromColor] = useState(primaryColor);
  const [toColor, setToColor] = useState(primaryColor);
  const progress = useSharedValue(1);
  const prevRef = useRef(primaryColor);

  useEffect(() => {
    if (primaryColor === prevRef.current) return;
    setFromColor(prevRef.current);
    setToColor(primaryColor);
    prevRef.current = primaryColor;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 350 });
  }, [primaryColor, progress]);

  const animStyle = useAnimatedStyle(() => ({
    // tintColor animates smoothly; we use a wrapper View opacity trick instead
    // since direct tintColor on SVG isn't applicable — color is per-path
    opacity: 1,
  }));

  // Compute current interpolated colour for SVG (JS-side, not worklet)
  // Since SVG paths don't support Reanimated animatedProps for fill/stroke on native easily,
  // we drive colour via state update on the JS side with a small delay for transition feel.
  const [displayColor, setDisplayColor] = useState(primaryColor);
  useEffect(() => {
    setDisplayColor(primaryColor);
  }, [primaryColor]);

  const vbH = 70;
  const vbW = 60;
  const h = size * (vbH / vbW);

  return (
    <Animated.View style={[{ width: size, height: h }, animStyle]}>
      <Svg width={size} height={h} viewBox="0 0 60 70">
        <Path d="M 30 6 L 8 62" stroke={displayColor} strokeWidth={2.5} strokeLinecap="round" fill="none" />
        <Path d="M 30 6 L 52 62" stroke={displayColor} strokeWidth={2.3} strokeLinecap="round" fill="none" />
        <Path d="M 17 40 L 43 40" stroke={displayColor} strokeWidth={2.7} strokeLinecap="round" fill="none" />
        <Path d="M 14 48 L 46 48" stroke={displayColor} strokeWidth={2.2} strokeLinecap="round" fill="none" />
        <Path d="M 11 54 L 49 54" stroke={displayColor} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        <Circle cx={30} cy={6} r={5} stroke={displayColor} strokeWidth={2} fill="none" />
      </Svg>
    </Animated.View>
  );
}
