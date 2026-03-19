import { useEffect, useRef, useCallback } from 'react';
import { Accelerometer } from 'expo-sensors';

const SHAKE_THRESHOLD = 2.5; // g-force magnitude above resting
const DOUBLE_SHAKE_WINDOW_MS = 500; // two shakes within this window = redo
const MIN_SHAKE_INTERVAL_MS = 300; // debounce between shakes

interface ShakeDetectorOptions {
  onShake?: () => void;
  onDoubleShake?: () => void;
  enabled?: boolean;
}

export function useShakeDetector({
  onShake,
  onDoubleShake,
  enabled = true,
}: ShakeDetectorOptions) {
  const lastShakeTimeRef = useRef<number>(0);
  const shakeCountRef = useRef<number>(0);
  const shakeWindowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleShake = useCallback(() => {
    const now = Date.now();
    const timeSinceLast = now - lastShakeTimeRef.current;

    if (timeSinceLast < MIN_SHAKE_INTERVAL_MS) return;

    lastShakeTimeRef.current = now;
    shakeCountRef.current += 1;

    if (shakeWindowTimerRef.current) {
      clearTimeout(shakeWindowTimerRef.current);
    }

    if (shakeCountRef.current >= 2) {
      // Double shake → redo
      shakeCountRef.current = 0;
      onDoubleShake?.();
    } else {
      // Wait to see if second shake comes
      shakeWindowTimerRef.current = setTimeout(() => {
        if (shakeCountRef.current === 1) {
          // Single shake → undo
          onShake?.();
        }
        shakeCountRef.current = 0;
      }, DOUBLE_SHAKE_WINDOW_MS);
    }
  }, [onShake, onDoubleShake]);

  useEffect(() => {
    if (!enabled) return;

    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    let isFirst = true;

    Accelerometer.setUpdateInterval(100); // 10 Hz

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      if (isFirst) {
        lastX = x;
        lastY = y;
        lastZ = z;
        isFirst = false;
        return;
      }

      const deltaX = Math.abs(x - lastX);
      const deltaY = Math.abs(y - lastY);
      const deltaZ = Math.abs(z - lastZ);

      const magnitude = Math.sqrt(deltaX ** 2 + deltaY ** 2 + deltaZ ** 2);

      if (magnitude > SHAKE_THRESHOLD) {
        handleShake();
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    });

    return () => {
      subscription.remove();
      if (shakeWindowTimerRef.current) {
        clearTimeout(shakeWindowTimerRef.current);
      }
    };
  }, [enabled, handleShake]);
}
