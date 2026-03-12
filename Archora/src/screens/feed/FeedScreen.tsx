import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export function FeedScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 32, color: colors.textPrimary }}>
        Inspo Feed
      </Text>
    </View>
  );
}
