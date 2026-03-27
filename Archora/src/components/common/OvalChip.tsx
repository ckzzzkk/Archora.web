import React from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { DS } from '../../theme/designSystem';

interface Props {
  label:     string;
  selected?: boolean;
  onPress?:  () => void;
  icon?:     string;
  color?:    string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function OvalChip({ label, selected = false, onPress, icon, color }: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: selected
      ? (color ?? DS.colors.primary)
      : DS.colors.surface,
    borderColor: selected
      ? (color ?? DS.colors.primary)
      : DS.colors.border,
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.94, { duration: DS.animation.fast });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 350 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animStyle,
        {
          height: 36,
          paddingHorizontal: 14,
          borderRadius: DS.radius.chip,
          borderWidth: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
      ]}
    >
      {icon ? (
        <Text style={{ fontSize: 14 }}>{icon}</Text>
      ) : null}
      <Text style={{
        fontFamily: DS.font.regular,
        fontSize: DS.fontSize.sm,
        color: selected ? DS.colors.background : DS.colors.primaryGhost,
        includeFontPadding: false,
      }}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}
