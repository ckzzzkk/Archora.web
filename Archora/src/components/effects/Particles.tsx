import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

type ParticleShape = 'floor_plan' | 'compass' | 'ruler' | 'arrow';

interface ParticlesProps {
  triggered: boolean;
  count?: number;
  radius?: number;
  shapes?: ParticleShape[];
}

const SHAPE_PATHS: Record<ParticleShape, string> = {
  floor_plan: 'M5,5 L35,5 L35,25 L20,25 L20,35 L5,35 Z',
  compass:
    'M20,3 L23,17 L20,20 L17,17 Z M20,37 L17,23 L20,20 L23,23 Z M3,20 L17,17 L20,20 L17,23 Z M37,20 L23,23 L20,20 L23,17 Z',
  ruler:
    'M2,10 H38 V18 H2 Z M6,10 V14 M12,10 V16 M18,10 V14 M24,10 V16 M30,10 V14 M36,10 V16',
  arrow:
    'M2,20 H32 M26,12 L34,20 L26,28',
};

interface ParticleProps {
  triggered: boolean;
  angle: number;
  distance: number;
  delay: number;
  shape: ParticleShape;
  size: number;
}

function Particle({ triggered, angle, distance, delay, shape, size }: ParticleProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    if (triggered) {
      const rad = (angle * Math.PI) / 180;
      const tx = Math.cos(rad) * distance;
      const ty = Math.sin(rad) * distance;

      opacity.value = withDelay(delay, withSequence(
        withTiming(0.85, { duration: 150 }),
        withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }),
      ));
      translateX.value = withDelay(delay, withTiming(tx, { duration: 650, easing: Easing.out(Easing.quad) }));
      translateY.value = withDelay(delay, withTiming(ty, { duration: 650, easing: Easing.out(Easing.quad) }));
      scale.value = withDelay(delay, withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.4, { duration: 450 }),
      ));
    }
  }, [triggered]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={style} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Path d={SHAPE_PATHS[shape]} fill="none" stroke="#C8C8C8" strokeWidth={2.5} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

export function Particles({
  triggered,
  count = 12,
  radius = 120,
  shapes = ['floor_plan'],
}: ParticlesProps) {
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i + (i % 3) * 7;
    const distance = radius * (0.7 + (i % 4) * 0.1);
    const delay = (i % 5) * 15;
    const shape = shapes[i % shapes.length];
    const size = 14 + (i % 3) * 6;
    return { angle, distance, delay, shape, size };
  });

  return (
    <View
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
      pointerEvents="none"
    >
      {particles.map((p, i) => (
        <Particle
          key={i}
          triggered={triggered}
          angle={p.angle}
          distance={p.distance}
          delay={p.delay}
          shape={p.shape}
          size={p.size}
        />
      ))}
    </View>
  );
}
