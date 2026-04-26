import { useCallback } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

interface UseSwipeToBackOptions {
  onSwipeBack: () => void;
  enabled?: boolean;
}

/**
 * Horizontal swipe-left gesture to go back.
 * Detects a left swipe past threshold and calls onSwipeBack.
 * Also shows a subtle rightward translate during the drag.
 */
export function useSwipeToBack({ onSwipeBack, enabled = true }: UseSwipeToBackOptions) {
  const { width: SCREEN_W } = useWindowDimensions();
  const SWIPE_THRESHOLD = SCREEN_W * 0.25; // 25% of screen width
  const translateX = useSharedValue(0);
  const isSwiping = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onStart(() => {
      isSwiping.value = true;
    })
    .onUpdate((event) => {
      // Only allow rightward swipe (negative delta = dragging left)
      translateX.value = event.translationX < 0 ? event.translationX * 0.3 : 0;
    })
    .onEnd((event) => {
      isSwiping.value = false;
      if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(0);
        runOnJS(onSwipeBack)();
      } else {
        translateX.value = withSpring(0, { damping: 16, stiffness: 200 });
      }
    });

  const swipeBackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { panGesture, swipeBackStyle, isSwiping };
}
