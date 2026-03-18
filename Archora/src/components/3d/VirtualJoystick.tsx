import React, { useCallback } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface Props {
  onMove: (x: number, y: number) => void;
  onRelease: () => void;
  size?: number;
}

export function VirtualJoystick({ onMove, onRelease, size = 96 }: Props) {
  const knobX = useSharedValue(0);
  const knobY = useSharedValue(0);
  const maxRadius = size * 0.35;

  const emitMove = useCallback(
    (tx: number, ty: number) => {
      const dist = Math.sqrt(tx * tx + ty * ty);
      if (dist === 0) {
        onMove(0, 0);
        return;
      }
      const clamp = Math.min(dist, maxRadius);
      onMove((tx / dist) * (clamp / maxRadius), (ty / dist) * (clamp / maxRadius));
    },
    [onMove, maxRadius],
  );

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const dist = Math.sqrt(e.translationX ** 2 + e.translationY ** 2);
      const clamp = Math.min(dist, maxRadius);
      const ratio = clamp / (dist || 1);
      knobX.value = e.translationX * ratio;
      knobY.value = e.translationY * ratio;
      runOnJS(emitMove)(e.translationX, e.translationY);
    })
    .onEnd(() => {
      knobX.value = withSpring(0, { damping: 12, stiffness: 200 });
      knobY.value = withSpring(0, { damping: 12, stiffness: 200 });
      runOnJS(onRelease)();
    });

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: knobX.value }, { translateY: knobY.value }],
  }));

  const knobSize = size * 0.4;

  return (
    <GestureDetector gesture={panGesture}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.25)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={[
            knobStyle,
            {
              width: knobSize,
              height: knobSize,
              borderRadius: knobSize / 2,
              backgroundColor: 'rgba(255,255,255,0.35)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.5)',
            },
          ]}
        />
      </View>
    </GestureDetector>
  );
}
