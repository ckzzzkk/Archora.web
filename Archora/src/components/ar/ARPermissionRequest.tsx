import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { BASE_COLORS } from '../../theme/colors';

interface Props {
  onRequest: () => void;
}

export function ARPermissionRequest({ onRequest }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: BASE_COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ color: BASE_COLORS.textPrimary, fontSize: 20, fontFamily: 'ArchitectsDaughter_400Regular', textAlign: 'center', marginBottom: 12 }}>
        Camera Access Needed
      </Text>
      <Text style={{ color: BASE_COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
        ASORIA needs your camera to use AR features — scan rooms, place furniture, and measure spaces.
      </Text>
      <Pressable
        onPress={onRequest}
        style={{ backgroundColor: BASE_COLORS.textPrimary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 50 }}
      >
        <Text style={{ color: BASE_COLORS.background, fontWeight: '600', fontSize: 16 }}>Allow Camera</Text>
      </Pressable>
    </View>
  );
}
