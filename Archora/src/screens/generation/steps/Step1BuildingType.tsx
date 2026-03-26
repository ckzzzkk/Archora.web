import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BASE_COLORS } from '../../../theme/colors';
import type { GenerationPayload } from '../../../types/generation';

type BuildingType = GenerationPayload['buildingType'];

const TYPES: { key: BuildingType; label: string; emoji: string }[] = [
  { key: 'house', label: 'House', emoji: '\u{1F3E0}' },
  { key: 'apartment', label: 'Apartment', emoji: '\u{1F3E2}' },
  { key: 'office', label: 'Office', emoji: '\u{1F3E2}' },
  { key: 'studio', label: 'Studio', emoji: '\u{1F3A8}' },
  { key: 'villa', label: 'Villa', emoji: '\u{1F3D6}' },
  { key: 'commercial', label: 'Commercial', emoji: '\u{1F3EA}' },
];

interface Props {
  selected: BuildingType | null;
  onSelect: (type: BuildingType) => void;
}

export function Step1BuildingType({ selected, onSelect }: Props) {
  return (
    <Animated.View entering={FadeIn.duration(150)} style={{ paddingHorizontal: 20, flex: 1 }}>
      <Text
        style={{
          fontFamily: 'ArchitectsDaughter_400Regular',
          fontSize: 24,
          color: BASE_COLORS.textPrimary,
          marginBottom: 24,
        }}
      >
        What are we designing?
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {TYPES.map((t) => {
          const isActive = selected === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => onSelect(t.key)}
              style={{
                width: '47%',
                backgroundColor: BASE_COLORS.surface,
                borderRadius: 24,
                paddingVertical: 20,
                alignItems: 'center',
                borderWidth: isActive ? 2 : 1,
                borderColor: isActive ? BASE_COLORS.textPrimary : BASE_COLORS.border,
              }}
            >
              <Text style={{ fontSize: 32, marginBottom: 8 }}>{t.emoji}</Text>
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 14,
                  color: BASE_COLORS.textPrimary,
                }}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}
