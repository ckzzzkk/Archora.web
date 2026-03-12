import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Props {
  message: string;
  title?: string;
  type?: ToastType;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, title, type = 'info', onDismiss, duration = 3000 }: Props) {
  const { colors } = useTheme();
  const translateY = useSharedValue(-100);

  const borderColors: Record<ToastType, string> = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.primary,
  };

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
    const timer = setTimeout(() => {
      translateY.value = withTiming(-120, { duration: 250 }, () => {
        // onDismiss would need to run on JS thread
      });
      setTimeout(onDismiss, 260);
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  const swipeUp = Gesture.Pan()
    .onEnd((e) => {
      if (e.translationY < -30) onDismiss();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <GestureDetector gesture={swipeUp}>
      <Animated.View
        style={[
          animatedStyle,
          {
            position: 'absolute',
            top: 60,
            left: 16,
            right: 16,
            backgroundColor: colors.surfaceHigh,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: borderColors[type],
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 16,
            zIndex: 9999,
          },
        ]}
      >
        {title && (
          <Text style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 15,
            color: colors.textPrimary,
            marginBottom: 4,
          }}>
            {title}
          </Text>
        )}
        <Text style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 13,
          color: colors.textSecondary,
        }}>
          {message}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}
