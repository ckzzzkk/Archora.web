import React from 'react';
import { Pressable, Text } from 'react-native';
import { BASE_COLORS } from '../../theme/colors';

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
        backgroundColor: 'rgba(34,34,34,0.85)',
        borderWidth: 1, borderColor: BASE_COLORS.border,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text style={{ color: BASE_COLORS.textPrimary, fontSize: 20 }}>←</Text>
    </Pressable>
  );
}
