import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  size?: 'small' | 'medium' | 'large';
}

const SIZES = { small: 24, medium: 48, large: 96 };

export function CompassRoseLoader({ size = 'medium' }: Props) {
  const { colors } = useTheme();
  const px = SIZES[size];
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2400, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const c = px / 2;
  const r = px * 0.42;
  const stroke = colors.primary;

  return (
    <Animated.View style={animatedStyle}>
      <Svg width={px} height={px} viewBox={`0 0 ${px} ${px}`}>
        {/* Outer ring */}
        <Circle cx={c} cy={c} r={r} stroke={stroke} strokeWidth={px * 0.04} fill="none" opacity={0.3} />
        {/* N point */}
        <Path
          d={`M ${c} ${c - r * 0.3} L ${c - r * 0.15} ${c - r * 0.9} L ${c} ${c - r * 1.0} L ${c + r * 0.15} ${c - r * 0.9} Z`}
          fill={stroke}
        />
        {/* S point */}
        <Path
          d={`M ${c} ${c + r * 0.3} L ${c - r * 0.15} ${c + r * 0.9} L ${c} ${c + r * 1.0} L ${c + r * 0.15} ${c + r * 0.9} Z`}
          fill={stroke} opacity={0.5}
        />
        {/* E point */}
        <Path
          d={`M ${c + r * 0.3} ${c} L ${c + r * 0.9} ${c - r * 0.15} L ${c + r * 1.0} ${c} L ${c + r * 0.9} ${c + r * 0.15} Z`}
          fill={stroke} opacity={0.5}
        />
        {/* W point */}
        <Path
          d={`M ${c - r * 0.3} ${c} L ${c - r * 0.9} ${c - r * 0.15} L ${c - r * 1.0} ${c} L ${c - r * 0.9} ${c + r * 0.15} Z`}
          fill={stroke} opacity={0.5}
        />
        {/* Center dot */}
        <Circle cx={c} cy={c} r={px * 0.04} fill={stroke} />
        {/* Cross hairs */}
        <Line x1={c} y1={c - r * 0.25} x2={c} y2={c + r * 0.25} stroke={stroke} strokeWidth={px * 0.025} opacity={0.4} />
        <Line x1={c - r * 0.25} y1={c} x2={c + r * 0.25} y2={c} stroke={stroke} strokeWidth={px * 0.025} opacity={0.4} />
      </Svg>
    </Animated.View>
  );
}
