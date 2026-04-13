import React from 'react';
import { DS } from '../../../theme/designSystem';
import { ArchText } from '../../../components/common/ArchText';
import { View,  Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

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
    <Animated.View entering={FadeIn.duration(150)} style={{ paddingHorizontal: DS.spacing.lg, flex: 1 }}>
      <ArchText variant="body"
        style={{
          fontFamily: 'ArchitectsDaughter_400Regular',
          fontSize: 24,
          color: DS.colors.primary,
          marginBottom: 24,
        }}
      >
        What are we designing?
      </ArchText>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {TYPES.map((t) => {
          const isActive = selected === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => onSelect(t.key)}
              style={{
                width: '47%',
                backgroundColor: DS.colors.surface,
                borderRadius: 24,
                paddingVertical: 20,
                alignItems: 'center',
                borderWidth: isActive ? 2 : 1,
                borderColor: isActive ? DS.colors.primary : DS.colors.border,
              }}
            >
              <ArchText variant="body" style={{ fontSize: 32, marginBottom: 8 }}>{t.emoji}</ArchText>
              <ArchText variant="body"
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 14,
                  color: DS.colors.primary,
                }}
              >
                {t.label}
              </ArchText>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}
