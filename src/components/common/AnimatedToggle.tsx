/**
 * AnimatedToggle — oval-first toggle switch with spring thumb animation.
 * Wraps React Native Switch with a Reanimated thumb overlay.
 * No worklet callbacks needed; uses pure RN state sync.
 */
import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { DS } from '../../theme/designSystem';

interface AnimatedToggleProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  trackColor?: { false: string; true: string };
  thumbColor?: { off: string; on: string };
  disabled?: boolean;
}

export function AnimatedToggle({
  value,
  onValueChange,
  trackColor = { false: DS.colors.border, true: DS.colors.accent },
  thumbColor = { off: DS.colors.primaryDim, on: DS.colors.primary },
  disabled = false,
}: AnimatedToggleProps) {
  const thumbPos = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    thumbPos.value = withSpring(value ? 1 : 0, { damping: 14, stiffness: 300 });
  }, [value, thumbPos]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: thumbPos.value > 0.5 ? trackColor.true : trackColor.false,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbPos.value * 18 }],
  }));

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      hitSlop={8}
    >
      <Animated.View
        style={[
          {
            width: 48,
            height: 28,
            borderRadius: 14,
            padding: 3,
            justifyContent: 'center',
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: value ? thumbColor.on : thumbColor.off,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4,
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
