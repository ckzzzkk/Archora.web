// src/components/common/AccentPicker.tsx
import React from 'react';
import { View, Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { hslToHex } from '../../theme/resolveTheme';
import { useThemeColors } from '../../hooks/useThemeColors';

const SWATCHES = ['#D4A84B','#C9FFFD','#4A90D9','#FFEE8C','#FF8C9A','#A888E8','#FFB870','#7AB87A','#E89AB0','#8FB3D9'];
const TRACK_WIDTH = 260;

export function AccentPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const C = useThemeColors();
  const knobX = useSharedValue(0);

  const setFromX = (x: number) => {
    const clamped = Math.max(0, Math.min(TRACK_WIDTH, x));
    const hue = (clamped / TRACK_WIDTH) * 360;
    onChange(hslToHex(hue, 0.7, 0.6));
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => { knobX.value = Math.max(0, Math.min(TRACK_WIDTH, e.x)); })
    .onEnd((e) => { runOnJS(setFromX)(e.x); });

  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: knobX.value }] }));

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {SWATCHES.map((hex) => (
          <Pressable
            key={hex}
            onPress={() => onChange(hex)}
            style={{
              width: 36, height: 36, borderRadius: 999, backgroundColor: hex,
              borderWidth: value.toLowerCase() === hex.toLowerCase() ? 3 : 1.5,
              borderColor: value.toLowerCase() === hex.toLowerCase() ? C.primary : C.border,
            }}
          />
        ))}
      </View>

      <GestureDetector gesture={pan}>
        <View style={{ height: 28, justifyContent: 'center' }}>
          <View style={{ height: 10, borderRadius: 999, overflow: 'hidden', flexDirection: 'row' }}>
            {Array.from({ length: 36 }).map((_, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: hslToHex((i / 36) * 360, 0.7, 0.6) }} />
            ))}
          </View>
          <Animated.View
            style={[
              { position: 'absolute', width: 18, height: 18, borderRadius: 999,
                backgroundColor: value, borderWidth: 2, borderColor: C.primary, top: 5 },
              knobStyle,
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  );
}
