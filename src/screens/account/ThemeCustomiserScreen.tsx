// src/screens/account/ThemeCustomiserScreen.tsx
import React from 'react';
import { View, Pressable, ScrollView, Switch } from 'react-native';
import { ArchText } from '../../components/common/ArchText';
import { AccentPicker } from '../../components/common/AccentPicker';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAppearanceStore } from '../../stores/appearanceStore';
import { useTierGate } from '../../hooks/useTierGate';
import { COLOR_THEMES, type ThemeName } from '../../theme/colors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ThemeCustomiser'>;

export function ThemeCustomiserScreen({ navigation }: Props) {
  const C = useThemeColors();
  const { allowed, requiredTier } = useTierGate('appearanceCustomization');

  const themeName     = useAppearanceStore((s) => s.themeName);
  const customPalette = useAppearanceStore((s) => s.customPalette);
  const setTheme      = useAppearanceStore((s) => s.setTheme);
  const setCustomPalette   = useAppearanceStore((s) => s.setCustomPalette);
  const clearCustomPalette = useAppearanceStore((s) => s.clearCustomPalette);

  const usingCustom = customPalette !== null;

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <View style={{ padding: 24, paddingTop: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 28, color: C.primary }}>
          Your Style
        </ArchText>
        <Pressable onPress={() => navigation.goBack()}>
          <ArchText variant="body" style={{ color: C.primaryGhost, fontFamily: 'Inter_400Regular' }}>Done</ArchText>
        </Pressable>
      </View>

      {!allowed ? (
        <View style={{ padding: 24, gap: 12 }}>
          <ArchText variant="body" style={{ color: C.primaryDim, fontFamily: 'Inter_400Regular' }}>
            Themes and custom colours are a {requiredTier ?? 'Creator'} feature.
          </ArchText>
          <Pressable
            onPress={() => navigation.navigate('Subscription', { feature: 'appearanceCustomization' })}
            style={{ backgroundColor: C.accent, borderRadius: 50, paddingVertical: 14, alignItems: 'center' }}
          >
            <ArchText variant="body" style={{ color: C.background, fontFamily: 'Inter_600SemiBold' }}>Upgrade</ArchText>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
          <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: C.primaryDim, letterSpacing: 1, textTransform: 'uppercase' }}>
            Colour Theme
          </ArchText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {(Object.keys(COLOR_THEMES) as ThemeName[]).map((name) => {
              const theme = COLOR_THEMES[name];
              const isActive = !usingCustom && themeName === name;
              return (
                <Pressable key={name} onPress={() => { clearCustomPalette(); setTheme(name); }} style={{ alignItems: 'center', gap: 6, opacity: isActive ? 1 : 0.7 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: theme.primary,
                    borderWidth: isActive ? 3 : 1.5, borderColor: isActive ? C.primary : C.border }} />
                  <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: C.primaryDim }}>
                    {theme.label}
                  </ArchText>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: C.primaryDim, letterSpacing: 1, textTransform: 'uppercase' }}>
              Custom Colour
            </ArchText>
            <Switch
              value={usingCustom}
              onValueChange={(on) => on
                ? setCustomPalette({ accent: COLOR_THEMES[themeName].primary, bgTint: null })
                : clearCustomPalette()
              }
              trackColor={{ false: C.border, true: C.accent }}
              thumbColor={usingCustom ? C.background : C.primaryDim}
              accessibilityLabel="Use custom colour"
            />
          </View>

          {usingCustom && customPalette && (
            <AccentPicker
              value={customPalette.accent}
              onChange={(hex) => setCustomPalette({ ...customPalette, accent: hex })}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}
