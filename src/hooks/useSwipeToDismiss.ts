import { useCallback } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

interface UseSwipeToDismissOptions {
  onDismiss: () => void;
  enabled?: boolean;
}

/**
 * Vertical swipe-down gesture to dismiss a modal/sheet.
 * Detects a downward swipe past threshold and calls onDismiss.
 * Shows a backdrop dimming effect and a subtle overlay translate during drag.
 */
export function useSwipeToDismiss({ onDismiss, enabled = true }: UseSwipeToDismissOptions) {
  const { height: SCREEN_H } = useWindowDimensions();
  const DISMISS_THRESHOLD = SCREEN_H * 0.25; // 25% of screen height
  const translateY = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const isActive = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetY([10, 20])
    .failOffsetX([-15, 15])
    .onStart(() => {
      isActive.value = true;
    })
    .onUpdate((event) => {
      // Only allow downward drag
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        overlayOpacity.value = interpolate(
          event.translationY,
          [0, DISMISS_THRESHOLD * 2],
          [0, 0.4],
          Extrapolation.CLAMP,
        );
      }
    })
    .onEnd((event) => {
      isActive.value = false;
      if (event.translationY > DISMISS_THRESHOLD || event.velocityY > 500) {
        // Fast dismiss
        translateY.value = withTiming(SCREEN_H * 0.5, { duration: 180 });
        overlayOpacity.value = withTiming(0, { duration: 180 });
        runOnJS(onDismiss)();
      } else {
        // Snap back
        translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
        overlayOpacity.value = withSpring(0, { damping: 18, stiffness: 200 });
      }
    });

  const dismissStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return { panGesture, dismissStyle, overlayStyle, isActive };
}
