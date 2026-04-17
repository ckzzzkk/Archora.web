import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { DS } from '../../theme/designSystem';
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
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);

  const borderColors: Record<ToastType, string> = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: DS.colors.accent,
  };

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
    const dismissed = { current: false };
    const timer2 = { current: null as ReturnType<typeof setTimeout> | null };
    const timer1 = setTimeout(() => {
      translateY.value = withTiming(-120, { duration: 250 });
      timer2.current = setTimeout(() => {
        if (!dismissed.current) {
          dismissed.current = true;
          onDismiss();
        }
      }, 260);
    }, duration);
    return () => {
      clearTimeout(timer1);
      if (timer2.current !== null) clearTimeout(timer2.current);
      dismissed.current = true;
    };
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
            top: insets.top + 8,
            left: 16,
            right: 16,
            backgroundColor: 'rgba(26, 26, 26, 0.96)',
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
