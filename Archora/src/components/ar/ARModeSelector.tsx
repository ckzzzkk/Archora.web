import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { BASE_COLORS, withAlpha } from '../../theme/colors';

export type ARMode = 'scan' | 'place' | 'measure';

interface Props {
  current: ARMode;
  onChange: (mode: ARMode) => void;
}

const MODES: { key: ARMode; label: string }[] = [
  { key: 'scan', label: 'Scan' },
  { key: 'place', label: 'Place' },
  { key: 'measure', label: 'Measure' },
];

export function ARModeSelector({ current, onChange }: Props) {
  return (
    <View style={{
      position: 'absolute', top: 60, left: 0, right: 0,
      flexDirection: 'row', justifyContent: 'center',
      gap: 8,
    }}>
      {MODES.map(({ key, label }) => (
        <Pressable
          key={key}
          onPress={() => onChange(key)}
          style={{
            paddingHorizontal: 20, paddingVertical: 8, borderRadius: 50,
            backgroundColor: current === key ? BASE_COLORS.textPrimary : withAlpha(BASE_COLORS.surface, 0.8),
            borderWidth: 1, borderColor: BASE_COLORS.border,
          }}
        >
          <Text style={{ color: current === key ? BASE_COLORS.background : BASE_COLORS.textPrimary, fontSize: 14, fontWeight: '500' }}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
