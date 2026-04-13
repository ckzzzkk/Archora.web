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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.97); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 10, stiffness: 200 }); };

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

  const borderColor = variant === 'secondary' ? colors.primary : 'transparent';

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
          borderWidth: variant === 'secondary' ? 1.5 : 0,
          borderRadius: 24,
          paddingHorizontal: 24,
          paddingVertical: 13,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
      ]}
      disabled={disabled || loading}
    >
      {loading ? (
        <CompassRoseLoader size="small" />
      ) : (
        <Text style={{
          color: textColor,
          fontFamily: variant === 'primary' ? 'ArchitectsDaughter_400Regular' : 'Inter_500Medium',
          fontSize: 15,
          letterSpacing: variant === 'primary' ? 0.5 : 0,
        }}>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}
