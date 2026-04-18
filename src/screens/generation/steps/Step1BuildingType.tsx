import React from 'react';
import { DS } from '../../../theme/designSystem';
import { ArchText } from '../../../components/common/ArchText';
import { View, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import type { GenerationPayload } from '../../../types/generation';

type BuildingType = GenerationPayload['buildingType'];

// SVG path data matching ink-blueprint-magic BlueprintThumbnail
const BUILDING_PATHS: Record<BuildingType, string> = {
  house: 'M20 70 L20 40 L50 18 L80 40 L80 70 Z M40 70 L40 50 L60 50 L60 70 M52 30 L52 22 L60 22 L60 36',
  apartment: 'M18 75 L18 22 L82 22 L82 75 Z M30 32 H42 M58 32 H70 M30 48 H42 M58 48 H70 M30 64 H42 M58 64 H70 M50 22 V75',
  office: 'M14 75 L14 35 L50 22 L86 35 L86 75 Z M26 45 H40 V60 H26 Z M44 45 H56 V60 H44 Z M60 45 H74 V60 H74 Z',
  villa: 'M10 70 L10 45 L50 22 L90 45 L90 70 Z M22 70 V52 H38 V70 M62 70 V52 H78 V70 M44 70 V58 H56 V70',
  studio: 'M22 75 L22 30 L78 30 L78 75 Z M22 48 H78 M40 30 V48 M50 50 L50 70 M58 50 L58 70',
  commercial: 'M14 75 L14 35 L50 18 L86 35 L86 75 Z M28 45 H44 V60 H28 Z M48 45 H64 V60 H48 Z M68 45 H80 V60 H68 Z',
};

const TYPES: { key: BuildingType; label: string }[] = [
  { key: 'house', label: 'House' },
  { key: 'apartment', label: 'Apartment' },
  { key: 'office', label: 'Office' },
  { key: 'studio', label: 'Studio' },
  { key: 'villa', label: 'Villa' },
  { key: 'commercial', label: 'Commercial' },
];

function BuildingTypeCard({ type, label, isActive, onPress }: {
  type: BuildingType; label: string; isActive: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${label} building type${isActive ? ', selected' : ''}`}
      accessibilityRole="radio"
      accessibilityState={{ selected: isActive }}
      accessibilityHint="Double tap to select this building type"
      style={{
        width: '47%',
        backgroundColor: DS.colors.surface,
        borderRadius: 24,
        paddingVertical: 20,
        alignItems: 'center',
        borderWidth: isActive ? 2 : 1,
        borderColor: isActive ? DS.colors.primary : DS.colors.border,
        minHeight: 44,
      }}
    >
      {/* SVG building line art */}
      <View style={{ marginBottom: 8 }}>
        <Svg width={56} height={48} viewBox="0 0 100 90">
          <Path
            d={BUILDING_PATHS[type]}
            stroke={isActive ? DS.colors.primary : DS.colors.primaryGhost}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <ArchText variant="body"
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 14,
          color: isActive ? DS.colors.primary : DS.colors.primaryDim,
        }}
        numberOfLines={1}
      >
        {label}
      </ArchText>
    </Pressable>
  );
}

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
          fontSize: 22,
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
            <BuildingTypeCard
              key={t.key}
              type={t.key}
              label={t.label}
              isActive={isActive}
              onPress={() => onSelect(t.key)}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}
