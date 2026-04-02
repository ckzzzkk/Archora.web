import { DS } from '../../theme/designSystem';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SHADOW } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  className?: string;
  padded?: boolean;
  elevated?: boolean;
  testID?: string;
  style?: ViewStyle | ViewStyle[];
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Card({
  children,
  onPress,
  onLongPress,
  padded = true,
  elevated = true,
  testID,
  style,
}: CardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => {
    if (onPress) scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  };
  const handlePressOut = () => {
    if (onPress) scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const containerStyle = [
    {
      backgroundColor: DS.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: DS.colors.border,
    },
    elevated ? SHADOW.card : undefined,
    padded ? { padding: 16 } : undefined,
    ...(Array.isArray(style) ? style : style ? [style] : []),
  ];

  if (onPress || onLongPress) {
    return (
      <AnimatedTouchable
        testID={testID}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[animStyle, containerStyle]}
      >
        {children}
      </AnimatedTouchable>
    );
  }

  return (
    <Animated.View testID={testID} style={[animStyle, containerStyle]}>
      {children}
    </Animated.View>
  );
}
