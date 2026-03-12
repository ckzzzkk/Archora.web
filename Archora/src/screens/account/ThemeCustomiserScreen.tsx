import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { COLOR_THEMES, type ThemeName } from '../../theme/colors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ThemeCustomiser'>;

export function ThemeCustomiserScreen({ navigation }: Props) {
  const { colors, themeName, setTheme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 24, paddingTop: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 28, color: colors.textPrimary }}>
          Your Style
        </Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.textDim, fontFamily: 'Inter_400Regular' }}>Done</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase' }}>
          Colour Theme
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {(Object.keys(COLOR_THEMES) as ThemeName[]).map((name) => {
            const theme = COLOR_THEMES[name];
            const isActive = themeName === name;
            return (
              <Pressable
                key={name}
                onPress={() => setTheme(name)}
                style={{
                  alignItems: 'center',
                  gap: 6,
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 999,
                  backgroundColor: theme.primary,
                  borderWidth: isActive ? 3 : 1.5,
                  borderColor: isActive ? colors.textPrimary : colors.border,
                }} />
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.textSecondary }}>
                  {theme.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
