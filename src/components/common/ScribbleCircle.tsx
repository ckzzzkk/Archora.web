import React from 'react';
import { View } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useSharedValue,
} from 'react-native-reanimated';
import { DS } from '../../theme/designSystem';

interface ScribbleCircleProps {
  size?: number;
  color?: string;
}

export function ScribbleCircle({ size = 56, color = DS.colors.ink }: ScribbleCircleProps) {
  const rotation = useSharedValue(-0.6);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(0.6, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Two overlapping wobbly circles
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          inset: 0,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
      pointerEvents="none"
      aria-hidden
    >
      <Svg width={size} height={size} viewBox="0 0 60 60">
        <G fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
          {/* Outer wobbly circle */}
          <Path
            d="M30 6 C 46 7 54 18 54 30 C 54 44 44 54 30 54 C 16 54 6 44 6 30 C 6 17 15 7 30 6 Z"
            strokeDasharray="3 4"
          />
          {/* Inner offset wobbly circle */}
          <Path
            d="M30 9 C 45 11 52 20 52 31 C 52 43 42 52 30 52 C 17 52 8 42 9 30 C 10 18 18 10 30 9"
            opacity={0.5}
          />
        </G>
      </Svg>
    </Animated.View>
  );
}
