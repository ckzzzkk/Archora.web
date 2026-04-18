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
  const shadowOpacity = useSharedValue(elevated ? 0.3 : 0);
  const shadowY = useSharedValue(elevated ? 2 : 0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: shadowOpacity.value,
    shadowOffset: { width: 0, height: shadowY.value },
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
      if (elevated) {
        shadowOpacity.value = withSpring(0.6, { damping: 20, stiffness: 300 });
        shadowY.value = withSpring(8, { damping: 20, stiffness: 300 });
      }
    }
  };
  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      if (elevated) {
        shadowOpacity.value = withSpring(0.3, { damping: 20, stiffness: 300 });
        shadowY.value = withSpring(2, { damping: 20, stiffness: 300 });
      }
    }
  };

  const containerStyle = [
    {
      backgroundColor: DS.colors.surface,
      borderRadius: DS.radius.card, // 24px — oval-first design system
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
        style={[animStyle, shadowStyle, containerStyle]}
      >
        {children}
      </AnimatedTouchable>
    );
  }

  return (
    <Animated.View testID={testID} style={[animStyle, shadowStyle, containerStyle]}>
      {children}
    </Animated.View>
  );
}
