import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line, G } from 'react-native-svg';

interface Props {
  size?: 'small' | 'medium' | 'large';
}

const SIZES = { small: 24, medium: 48, large: 96 };

const COLORS = {
  letterform: '#C5D4B8',
  compassAccent: '#89B4C8',
  compassRing: '#7A9AAA',
};

export function CompassRoseLoader({ size = 'medium' }: Props) {
  const px = SIZES[size];
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Svg width={px} height={px} viewBox="0 0 40 40">
        {/* Shadow layer */}
        <G opacity="0.25" transform="translate(1, 1)">
          <Path
            d="M12,6 C14,10 16,14 18,18 C19,20 20,22 20,24"
            stroke="#1A1A1A"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M28,6 C26,10 24,14 22,18 C21,20 20,22 20,24"
            stroke="#1A1A1A"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <Line x1="11" y1="18" x2="29" y2="18" stroke="#1A1A1A" strokeWidth="1.2" strokeLinecap="round" />
        </G>

        {/* Layered A (faint) */}
        <Path
          d="M13,7 L8,23 M27,7 L32,23 M11,18 L29,18"
          stroke={COLORS.compassAccent}
          strokeWidth="0.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.2"
        />

        {/* Main Wave A */}
        <Path
          d="M12,6 C14,10 16,14 18,18 C19,20 20,22 20,24"
          stroke={COLORS.letterform}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M28,6 C26,10 24,14 22,18 C21,20 20,22 20,24"
          stroke={COLORS.letterform}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <Line x1="11" y1="18" x2="29" y2="18" stroke={COLORS.letterform} strokeWidth="1.2" strokeLinecap="round" />

        {/* Compass ring */}
        <Circle cx="20" cy="18" r="6" stroke={COLORS.compassRing} strokeWidth="0.6" fill="none" opacity="0.8" />

        {/* Compass star */}
        <Line x1="20" y1="12" x2="20" y2="24" stroke={COLORS.letterform} strokeWidth="0.6" strokeLinecap="round" opacity="0.9" />
        <Line x1="14" y1="18" x2="26" y2="18" stroke={COLORS.letterform} strokeWidth="0.6" strokeLinecap="round" opacity="0.9" />

        {/* Center dot */}
        <Circle cx="20" cy="18" r="1.2" fill={COLORS.compassAccent} />
      </Svg>
    </Animated.View>
  );
}