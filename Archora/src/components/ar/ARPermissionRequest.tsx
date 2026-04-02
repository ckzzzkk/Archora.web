import { DS } from '../../theme/designSystem';
import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface Props {
  onRequest: () => void;
}

export function ARPermissionRequest({ onRequest }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ color: DS.colors.primary, fontSize: 20, fontFamily: 'ArchitectsDaughter_400Regular', textAlign: 'center', marginBottom: 12 }}>
        Camera Access Needed
      </Text>
      <Text style={{ color: DS.colors.primaryDim, fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
        ASORIA needs your camera to use AR features — scan rooms, place furniture, and measure spaces.
      </Text>
      <Pressable
        onPress={onRequest}
        style={{ backgroundColor: DS.colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 50 }}
      >
        <Text style={{ color: DS.colors.background, fontWeight: '600', fontSize: 16 }}>Allow Camera</Text>
      </Pressable>
    </View>
  );
}
