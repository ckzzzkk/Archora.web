import { useEffect } from 'react';
import { Dimensions } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTabDirection } from '../navigation/TabDirectionContext';

const SCREEN_W = Dimensions.get('window').width;

export function useScreenSlideIn() {
  const { direction } = useTabDirection();
  const initialX =
    direction === 'right' ? SCREEN_W * 0.3 : direction === 'left' ? -SCREEN_W * 0.3 : 0;
  const translateX = useSharedValue(initialX);
  const opacity = useSharedValue(direction === 'none' ? 1 : 0);

  useEffect(() => {
    translateX.value = withSpring(0, { damping: 20, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 220 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));
}
