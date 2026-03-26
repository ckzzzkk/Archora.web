import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BASE_COLORS } from '../../../theme/colors';
import { DESIGN_STYLES } from '../../../data/designStyles';
import type { GenerationPayload } from '../../../types/generation';

const TYPE_EMOJI: Record<string, string> = {
  house: '\u{1F3E0}',
  apartment: '\u{1F3E2}',
  office: '\u{1F3E2}',
  studio: '\u{1F3A8}',
  villa: '\u{1F3D6}',
  commercial: '\u{1F3EA}',
};

interface Props {
  payload: GenerationPayload;
  onGenerate: () => void;
}

export function Step7Review({ payload, onGenerate }: Props) {
  const styleName = DESIGN_STYLES.find((s) => s.id === payload.style)?.name ?? payload.style;

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
        Review your brief
      </Text>

      <View
        style={{
          backgroundColor: BASE_COLORS.surface,
          borderRadius: 24,
          padding: 16,
          marginBottom: 32,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 24 }}>{TYPE_EMOJI[payload.buildingType] ?? '\u{1F3E0}'}</Text>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: BASE_COLORS.textPrimary, textTransform: 'capitalize' }}>
            {payload.buildingType}
          </Text>
        </View>

        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textSecondary }}>
          {payload.plotSize} {payload.plotUnit === 'm2' ? 'm\u00B2' : 'ft\u00B2'}
        </Text>

        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textSecondary }}>
          {payload.bedrooms} bed {'\u00B7'} {payload.bathrooms} bath {'\u00B7'} {payload.livingAreas} living
        </Text>

        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textSecondary }}>
          Style: {styleName}
        </Text>

        {(payload.hasGarage || payload.hasGarden || payload.hasPool || payload.hasHomeOffice || payload.hasUtilityRoom) && (
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.textDim }}>
            {[
              payload.hasGarage && 'Garage',
              payload.hasGarden && 'Garden',
              payload.hasPool && `Pool (${payload.poolSize ?? 'medium'})`,
              payload.hasHomeOffice && 'Office',
              payload.hasUtilityRoom && 'Utility',
            ].filter(Boolean).join(' \u00B7 ')}
          </Text>
        )}

        {payload.referenceImageUrl && (
          <Image
            source={{ uri: payload.referenceImageUrl }}
            style={{ width: '100%', height: 100, borderRadius: 16, marginTop: 4 }}
            resizeMode="cover"
          />
        )}

        {payload.additionalNotes ? (
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.textDim, fontStyle: 'italic' }} numberOfLines={3}>
            &ldquo;{payload.additionalNotes}&rdquo;
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={onGenerate}
        style={{
          backgroundColor: BASE_COLORS.textPrimary,
          borderRadius: 50,
          paddingVertical: 18,
          alignItems: 'center',
          height: 56,
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 18,
            color: BASE_COLORS.background,
          }}
        >
          Create My Design
        </Text>
      </Pressable>
    </Animated.View>
  );
}
