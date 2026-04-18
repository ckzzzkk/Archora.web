import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../common/ArchText';

interface ARScanRingProps {
  isScanning: boolean;
  onCapture: () => void;
  canCapture: boolean; // enabled when at least one wall detected
}

const RING_SIZE = 88;

export function ARScanRing({ isScanning, onCapture, canCapture }: ARScanRingProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (isScanning) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 900, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 600, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        false,
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 900 }),
          withTiming(0.6, { duration: 600 }),
        ),
        -1,
        false,
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(0.6, { duration: 200 });
    }
  }, [isScanning, scale, opacity]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: RING_SIZE,
          height: RING_SIZE,
          borderRadius: RING_SIZE / 2,
          borderWidth: 2.5,
          borderColor: isScanning ? DS.colors.error : DS.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        ringStyle,
      ]}
    >
      <Pressable
        onPress={canCapture ? onCapture : undefined}
        style={{
          width: RING_SIZE - 8,
          height: RING_SIZE - 8,
          borderRadius: (RING_SIZE - 8) / 2,
          backgroundColor: isScanning ? DS.colors.error : DS.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: canCapture ? 1 : 0.5,
        }}
      >
        <ArchText
          variant="body"
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 12,
            color: DS.colors.background,
            textAlign: 'center',
          }}
        >
          {isScanning ? 'CAPTURE' : 'SCAN'}
        </ArchText>
      </Pressable>
    </Animated.View>
  );
}