import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Polygon,
  Line,
  Text as SvgText,
  G,
  Defs,
  FeOffset,
  FeTurbulence,
  FeDisplacementMap,
} from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';
import { DS } from '../../theme/designSystem';

const AnimatedG = Animated.createAnimatedComponent(G);

// Wobble turbulence filter for hand-drawn effect
function WobbleFilter() {
  return (
    <Defs>
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.02"
        numOctaves="3"
        result="noise"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="noise"
        scale="1.5"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </Defs>
  );
}

interface CompassRoseProps {
  size?: number;
  spin?: boolean;
  color?: string;
}

export function CompassRose({ size = 64, spin = false, color = DS.colors.ink }: CompassRoseProps) {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (spin) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 14000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [spin, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const cx = 50;
  const cy = 50;

  return (
    <Animated.View style={spin ? animatedStyle : undefined}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <WobbleFilter />
        <G
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Outer circle */}
          <Circle cx={cx} cy={cy} r={42} />
          {/* Inner dashed circle */}
          <Circle cx={cx} cy={cy} r={32} strokeDasharray="2 4" />
          {/* N spike — filled */}
          <Polygon points={`${cx},8 ${cx + 6},${cy} ${cx},${cy - 8} ${cx - 6},${cy}`} fill={color} />
          {/* S spike — outline */}
          <Polygon points={`${cx},92 ${cx + 6},${cy} ${cx},${cy + 8} ${cx - 6},${cy}`} />
          {/* E spike */}
          <Polygon points={`92,${cy} ${cx},${cy + 6} ${cx + 8},${cy} ${cx},${cy - 6}`} />
          {/* W spike */}
          <Polygon points={`8,${cy} ${cx},${cy + 6} ${cx - 8},${cy} ${cx},${cy - 6}`} />
          {/* Diagonal crosshairs */}
          <Line x1="22" y1="22" x2="78" y2="78" strokeDasharray="3 3" />
          <Line x1="78" y1="22" x2="22" y2="78" strokeDasharray="3 3" />
          {/* Center dot */}
          <Circle cx={cx} cy={cy} r={4} fill={color} />
          {/* N label */}
          <SvgText
            x={cx}
            y={20}
            textAnchor="middle"
            fontSize="9"
            fontFamily="ArchitectsDaughter"
            fill={color}
            stroke="none"
          >
            N
          </SvgText>
        </G>
      </Svg>
    </Animated.View>
  );
}
