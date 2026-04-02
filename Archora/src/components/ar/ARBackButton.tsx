import { DS } from '../../theme/designSystem';
import React from 'react';
import { Pressable, Text } from 'react-native';
import { BASE_COLORS, withAlpha } from '../../theme/colors';

interface Props {
  onPress: () => void;
}

export function ARBackButton({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: 'absolute', top: 56, left: 20,
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: withAlpha(DS.colors.surface, 0.85),
        borderWidth: 1, borderColor: DS.colors.border,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text style={{ color: DS.colors.primary, fontSize: 20 }}>←</Text>
    </Pressable>
  );
}
