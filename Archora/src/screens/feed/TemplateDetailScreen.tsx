import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TemplateDetail'>;

export function TemplateDetailScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 32, color: colors.textPrimary }}>
        Template
      </Text>
      <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', marginTop: 8 }}>
        {route.params.templateId}
      </Text>
      <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 24 }}>
        <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular' }}>Close</Text>
      </Pressable>
    </View>
  );
}
