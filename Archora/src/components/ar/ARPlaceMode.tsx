import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { BASE_COLORS, withAlpha } from '../../theme/colors';
import { TierGate } from '../common/TierGate';

// ARPlaceMode gates on arScansPerMonth — 0 for Starter, 15 for Creator+
export function ARPlaceMode() {
  return (
    <TierGate feature="arScansPerMonth" featureLabel="AR furniture placement">
      <ARPlaceModeContent />
    </TierGate>
  );
}

function ARPlaceModeContent() {
  const [surfaceDetected, setSurfaceDetected] = useState(false);
  const [placedItems, setPlacedItems] = useState<{ label: string; x: number; y: number }[]>([]);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    const sub = Accelerometer.addListener(({ z }) => {
      // Phone held upright (camera pointing forward at floor): z near 0
      const isFlat = Math.abs(z) < 0.3;
      setSurfaceDetected(isFlat);
    });
    Accelerometer.setUpdateInterval(500);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (surfaceDetected) {
      pulseScale.value = withRepeat(withTiming(1.15, { duration: 800 }), -1, true);
    } else {
      pulseScale.value = 1;
    }
  }, [surfaceDetected, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleTap = (e: any) => {
    if (!surfaceDetected) return;
    setPlacedItems(prev => [
      ...prev,
      { label: 'Furniture', x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }
    ]);
  };

  return (
    <Pressable style={{ flex: 1 }} onPress={handleTap}>
      {/* Surface detected indicator */}
      {surfaceDetected && (
        <Animated.View style={[{
          position: 'absolute', top: 130, left: 0, right: 0, alignItems: 'center',
        }, pulseStyle]}>
          <View style={{
            backgroundColor: withAlpha(BASE_COLORS.surface, 0.85), borderRadius: 50,
            paddingHorizontal: 20, paddingVertical: 10,
            borderWidth: 1, borderColor: BASE_COLORS.border,
          }}>
            <Text style={{ color: BASE_COLORS.textPrimary, fontSize: 14 }}>Surface detected — tap to place furniture</Text>
          </View>
        </Animated.View>
      )}

      {!surfaceDetected && (
        <View style={{ position: 'absolute', top: 130, left: 20, right: 20, alignItems: 'center' }}>
          <View style={{ backgroundColor: withAlpha(BASE_COLORS.surface, 0.85), borderRadius: 50, paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ color: BASE_COLORS.textSecondary, fontSize: 14 }}>Point camera at a flat surface</Text>
          </View>
        </View>
      )}

      {/* Placed items as 2D symbols */}
      {placedItems.map((item, i) => (
        <View key={i} style={{
          position: 'absolute', left: item.x, top: item.y,
          backgroundColor: withAlpha(BASE_COLORS.surface, 0.85), borderRadius: 8,
          padding: 8, borderWidth: 1, borderColor: BASE_COLORS.border,
        }}>
          <Text style={{ color: BASE_COLORS.textPrimary, fontSize: 12 }}>{item.label}</Text>
        </View>
      ))}
    </Pressable>
  );
}
