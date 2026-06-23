import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { CompassRoseLoader } from './CompassRoseLoader';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  label, onPress, variant = 'primary', loading = false, disabled = false, fullWidth = false,
}: Props) {
  const { colors } = useTheme();
  const { light } = useHaptics();
  const scale = useSharedValue(1);
  const pressOpacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: pressOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 14, stiffness: 380 });
    pressOpacity.value = withSpring(0.82, { damping: 14, stiffness: 380 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 320 });
    pressOpacity.value = withSpring(1, { damping: 14, stiffness: 320 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    light();
    onPress();
  };

  const bgColor = {
    primary: colors.primary,
    secondary: 'transparent',
    ghost: 'transparent',
    danger: colors.error,
  }[variant];

  const textColor = {
    primary: colors.background,
    secondary: colors.primary,
    ghost: colors.textSecondary,
    danger: '#FFFFFF',
  }[variant];

  const borderColor = variant === 'secondary' ? 'rgba(240, 237, 232, 0.16)' : 'transparent';
  const hasFill = variant === 'primary' || variant === 'danger';

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderRadius: 14,
          paddingHorizontal: 24,
          paddingVertical: 13,
          minHeight: 48,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          // soft real depth on filled buttons only
          ...(hasFill ? {
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
          } : null),
        },
      ]}
      disabled={disabled || loading}
    >
      {loading ? (
        <CompassRoseLoader size="small" />
      ) : (
        <Text style={{
          color: textColor,
          fontFamily: variant === 'primary' ? 'Inter_600SemiBold' : 'Inter_500Medium',
          fontSize: 15,
          letterSpacing: 0,
        }}>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}
