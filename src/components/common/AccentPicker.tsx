// src/components/common/AccentPicker.tsx
import React from 'react';
import { View, Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { hslToHex } from '../../theme/resolveTheme';
import { useThemeColors } from '../../hooks/useThemeColors';

const SWATCHES = ['#D4A84B','#C9FFFD','#4A90D9','#FFEE8C','#FF8C9A','#A888E8','#FFB870','#7AB87A','#E89AB0','#8FB3D9'];
const TRACK_WIDTH = 260;

function hueFromHex(hex: string): number {
  const h = hex.replace('#', '');
  if (h.length !== 6) return 0;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  let hue: number;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue *= 60;
  return hue < 0 ? hue + 360 : hue;
}

export function AccentPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const C = useThemeColors();
  const knobX = useSharedValue((hueFromHex(value) / 360) * TRACK_WIDTH);

  const setFromX = (x: number) => {
    const clamped = Math.max(0, Math.min(TRACK_WIDTH, x));
    const hue = (clamped / TRACK_WIDTH) * 360;
    onChange(hslToHex(hue, 0.7, 0.6));
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => { knobX.value = Math.max(0, Math.min(TRACK_WIDTH, e.x)); runOnJS(setFromX)(e.x); })
    .onEnd((e) => {
      const clamped = Math.max(0, Math.min(TRACK_WIDTH, e.x));
      knobX.value = clamped;
      runOnJS(setFromX)(clamped);
    });

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
        <View style={{ height: 28, justifyContent: 'center', width: TRACK_WIDTH, alignSelf: 'center' }}>
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
