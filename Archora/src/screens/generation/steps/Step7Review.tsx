import React from 'react';
import { DS } from '../../../theme/designSystem';
import { ArchText } from '../../../components/common/ArchText';
import { View,  Pressable, Image } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { DESIGN_STYLES } from '../../../data/designStyles';
import type { GenerationPayload } from '../../../types/generation';
import type { BlueprintData } from '../../../types/blueprint';

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
  result?: BlueprintData | null;
  onGenerate: () => void;
}

export function Step7Review({ payload, result, onGenerate }: Props) {
  const styleName = DESIGN_STYLES.find((s) => s.id === payload.style)?.name ?? payload.style;

  return (
    <Animated.View entering={FadeIn.duration(150)} style={{ paddingHorizontal: 20, flex: 1 }}>
      <ArchText variant="body"
        style={{
          fontFamily: 'ArchitectsDaughter_400Regular',
          fontSize: 24,
          color: DS.colors.primary,
          marginBottom: 24,
        }}
      >
        Review your brief
      </ArchText>

      <View
        style={{
          backgroundColor: DS.colors.surface,
          borderRadius: 24,
          padding: 16,
          marginBottom: 32,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ArchText variant="body" style={{ fontSize: 24 }}>{TYPE_EMOJI[payload.buildingType] ?? '\u{1F3E0}'}</ArchText>
          <ArchText variant="body" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: DS.colors.primary, textTransform: 'capitalize' }}>
            {payload.buildingType}
          </ArchText>
        </View>

        <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primaryDim }}>
          {payload.plotSize} {payload.plotUnit === 'm2' ? 'm\u00B2' : 'ft\u00B2'}
        </ArchText>

        <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primaryDim }}>
          {payload.bedrooms} bed {'\u00B7'} {payload.bathrooms} bath {'\u00B7'} {payload.livingAreas} living
        </ArchText>

        <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primaryDim }}>
          Style: {styleName}
        </ArchText>

        {(payload.hasGarage || payload.hasGarden || payload.hasPool || payload.hasHomeOffice || payload.hasUtilityRoom) && (
          <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost }}>
            {[
              payload.hasGarage && 'Garage',
              payload.hasGarden && 'Garden',
              payload.hasPool && `Pool (${payload.poolSize ?? 'medium'})`,
              payload.hasHomeOffice && 'Office',
              payload.hasUtilityRoom && 'Utility',
            ].filter(Boolean).join(' \u00B7 ')}
          </ArchText>
        )}

        {payload.referenceImageUrl && (
          <Image
            source={{ uri: payload.referenceImageUrl }}
            style={{ width: '100%', height: 100, borderRadius: 16, marginTop: 4 }}
            resizeMode="cover"
          />
        )}

        {payload.additionalNotes ? (
          <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost, fontStyle: 'italic' }} numberOfLines={3}>
            &ldquo;{payload.additionalNotes}&rdquo;
          </ArchText>
        ) : null}
      </View>

      {result && (
        <ArchText variant="body"
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 13,
            color: DS.colors.primaryGhost,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Previous design loaded — generating will replace it
        </ArchText>
      )}

      <Pressable
        onPress={onGenerate}
        style={{
          backgroundColor: DS.colors.primary,
          borderRadius: 50,
          paddingVertical: 18,
          alignItems: 'center',
          height: 56,
          justifyContent: 'center',
        }}
      >
        <ArchText variant="body"
          style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 18,
            color: DS.colors.background,
          }}
        >
          Create My Design
        </ArchText>
      </Pressable>
    </Animated.View>
  );
}
