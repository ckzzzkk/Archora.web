import { useEffect, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { useSharedValue, withSpring, runOnUI } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

interface UseGyroscopeReturn {
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
}

/**
 * Returns tiltX / tiltY SharedValues in the range -1..1 driven by the device
 * accelerometer. Falls back to 0 if the sensor is unavailable or reduce-motion
 * is enabled. Safe to use in useAnimatedStyle directly.
 *
 * Max physical tilt mapped to ±1 is ±0.4g (roughly 24°).
 */
export function useGyroscope(): UseGyroscopeReturn {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      if (reduceMotion || cancelled) return;

      const available = await Accelerometer.isAvailableAsync();
      if (!available || cancelled) return;

      Accelerometer.setUpdateInterval(60);

      subscriptionRef.current = Accelerometer.addListener(({ x, y }) => {
        // Clamp to ±0.4g range then normalise to -1..1
        const MAX = 0.4;
        const nx = Math.max(-1, Math.min(1, x / MAX));
        const ny = Math.max(-1, Math.min(1, -y / MAX)); // invert Y so tilt toward you = positive

        runOnUI(() => {
          'worklet';
          tiltX.value = withSpring(nx, { damping: 20, stiffness: 100 });
          tiltY.value = withSpring(ny, { damping: 20, stiffness: 100 });
        })();
      });
    })();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [tiltX, tiltY]);

  return { tiltX, tiltY };
}
