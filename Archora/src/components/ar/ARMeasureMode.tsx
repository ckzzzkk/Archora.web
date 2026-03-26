import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { BASE_COLORS, withAlpha } from '../../theme/colors';
import { TierGate } from '../common/TierGate';

interface Point { x: number; y: number; }

export function ARMeasureMode() {
  return (
    <TierGate feature="arMeasure" featureLabel="AR measurements">
      <ARMeasureModeContent />
    </TierGate>
  );
}

function ARMeasureModeContent() {
  const [point1, setPoint1] = useState<Point | null>(null);
  const [point2, setPoint2] = useState<Point | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  const handleTap = (x: number, y: number) => {
    if (!point1) {
      setPoint1({ x, y });
    } else if (!point2) {
      setPoint2({ x, y });
      // Estimate distance: 100px ≈ 1m (rough approximation for demo)
      const px = Math.sqrt(Math.pow(x - point1.x, 2) + Math.pow(y - point1.y, 2));
      setDistance(Math.round((px / 100) * 10) / 10);
    } else {
      // Reset
      setPoint1({ x, y });
      setPoint2(null);
      setDistance(null);
    }
  };

  return (
    <Pressable
      style={{ flex: 1 }}
      onPress={(e) => handleTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}
    >
      {/* Instruction */}
      <View style={{ position: 'absolute', top: 130, left: 0, right: 0, alignItems: 'center' }}>
        <View style={{ backgroundColor: withAlpha(BASE_COLORS.surface, 0.85), borderRadius: 50, paddingHorizontal: 20, paddingVertical: 10 }}>
          <Text style={{ color: BASE_COLORS.textSecondary, fontSize: 14 }}>
            {!point1 ? 'Tap to set first point' : !point2 ? 'Tap to set second point' : 'Tap anywhere to reset'}
          </Text>
        </View>
      </View>

      {/* Point indicators */}
      {point1 && (
        <View style={{ position: 'absolute', left: point1.x - 6, top: point1.y - 6,
          width: 12, height: 12, borderRadius: 6,
          backgroundColor: BASE_COLORS.textPrimary }} />
      )}
      {point2 && (
        <View style={{ position: 'absolute', left: point2.x - 6, top: point2.y - 6,
          width: 12, height: 12, borderRadius: 6,
          backgroundColor: BASE_COLORS.textPrimary }} />
      )}

      {/* Distance label */}
      {distance !== null && point1 && point2 && (
        <View style={{
          position: 'absolute',
          left: (point1.x + point2.x) / 2 - 40,
          top: (point1.y + point2.y) / 2 - 20,
          backgroundColor: withAlpha(BASE_COLORS.surface, 0.9), borderRadius: 50,
          paddingHorizontal: 12, paddingVertical: 6,
          borderWidth: 1, borderColor: BASE_COLORS.border,
        }}>
          <Text style={{ color: BASE_COLORS.textPrimary, fontSize: 14, fontFamily: 'JetBrainsMono_400Regular' }}>
            {distance}m / {Math.round(distance * 3.281 * 10) / 10}ft
          </Text>
        </View>
      )}
    </Pressable>
  );
}
