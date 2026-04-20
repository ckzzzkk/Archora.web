import React from 'react';
import { View, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { DS } from '../../../theme/designSystem';
import { BASE_COLORS } from '../../../theme/colors';
import { ArchText } from '../../../components/common/ArchText';
import { GridBackground } from '../../../components/common/GridBackground';
import { OvalButton } from '../../../components/common/OvalButton';
import type { GenerationPayload, ConsultationSummary } from '../../../types/generation';
import type { BlueprintData } from '../../../types/blueprint';

interface Props {
  payload: GenerationPayload;
  consultationSummary?: ConsultationSummary | null;
  result?: BlueprintData | null;
  onGenerate: () => void;
}

const SKETCH_SHADOW = {
  shadowColor: BASE_COLORS.background,
  shadowOffset: { width: 3, height: 4 },
  shadowOpacity: 0.5,
  shadowRadius: 2,
};

export function Step7Review({ payload, consultationSummary, result, onGenerate }: Props) {
  const plotUnit = payload.plotUnit === 'm2' ? 'm\u00B2' : 'ft\u00B2';
  const extras = [
    payload.hasGarage && 'Garage',
    payload.hasGarden && 'Garden',
    payload.hasPool && `Pool (${payload.poolSize ?? 'medium'})`,
    payload.hasHomeOffice && 'Office',
    payload.hasUtilityRoom && 'Utility',
  ].filter(Boolean);

  return (
    <Animated.View entering={FadeIn.duration(150)} style={{ flex: 1 }}>
      <GridBackground />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: DS.spacing.lg, paddingBottom: DS.spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <ArchText variant="heading" style={{ marginBottom: DS.spacing.xl }}>
          review your brief
        </ArchText>

        {/* Summary card */}
        <View
          style={{
            borderRadius: DS.radius.card,
            borderWidth: 2,
            borderColor: BASE_COLORS.textPrimary,
            backgroundColor: DS.colors.surface,
            padding: DS.spacing.lg,
            marginBottom: DS.spacing.xl,
            ...SKETCH_SHADOW,
          }}
        >
          <ArchText variant="label" style={{ marginBottom: DS.spacing.sm }}>
            {payload.buildingType}
          </ArchText>

          <View style={{ gap: DS.spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: DS.spacing.sm }}>
              <ArchText variant="caption">Plot size</ArchText>
              <ArchText variant="body">{payload.plotSize} {plotUnit}</ArchText>
            </View>

            <View style={{ flexDirection: 'row', gap: DS.spacing.sm }}>
              <ArchText variant="caption">Bedrooms</ArchText>
              <ArchText variant="body">{payload.bedrooms}</ArchText>
            </View>

            <View style={{ flexDirection: 'row', gap: DS.spacing.sm }}>
              <ArchText variant="caption">Bathrooms</ArchText>
              <ArchText variant="body">{payload.bathrooms}</ArchText>
            </View>

            <View style={{ flexDirection: 'row', gap: DS.spacing.sm }}>
              <ArchText variant="caption">Living areas</ArchText>
              <ArchText variant="body">{payload.livingAreas}</ArchText>
            </View>

            <View style={{ flexDirection: 'row', gap: DS.spacing.sm }}>
              <ArchText variant="caption">Style</ArchText>
              <ArchText variant="body">{payload.style}</ArchText>
            </View>

            {extras.length > 0 && (
              <View style={{ flexDirection: 'row', gap: DS.spacing.sm }}>
                <ArchText variant="caption">Extras</ArchText>
                <ArchText variant="body">{extras.join(' \u00B7 ')}</ArchText>
              </View>
            )}
          </View>
        </View>

        {/* Consultation insights */}
        {consultationSummary && (
          <View
            style={{
              borderRadius: DS.radius.large,
              borderWidth: 2,
              borderColor: BASE_COLORS.textPrimary,
              backgroundColor: DS.colors.surfaceHigh,
              padding: DS.spacing.lg,
              marginBottom: DS.spacing.xl,
            }}
          >
            <ArchText variant="label" style={{ marginBottom: DS.spacing.md }}>
              consultation insights
            </ArchText>

            <View style={{ gap: DS.spacing.sm }}>
              {consultationSummary.householdDescription && (
                <View style={{ flexDirection: 'row', gap: DS.spacing.sm }}>
                  <ArchText variant="caption">Household</ArchText>
                  <ArchText variant="body">{consultationSummary.householdDescription}</ArchText>
                </View>
              )}
              {consultationSummary.dailyRoutine && (
                <View style={{ flexDirection: 'row', gap: DS.spacing.sm }}>
                  <ArchText variant="caption">Routine</ArchText>
                  <ArchText variant="body">{consultationSummary.dailyRoutine}</ArchText>
                </View>
              )}
              {consultationSummary.entertainingFrequency && (
                <View style={{ flexDirection: 'row', gap: DS.spacing.sm }}>
                  <ArchText variant="caption">Entertaining</ArchText>
                  <ArchText variant="body">{consultationSummary.entertainingFrequency}</ArchText>
                </View>
              )}
              {consultationSummary.keyFrustrations.length > 0 && (
                <View style={{ flexDirection: 'row', gap: DS.spacing.sm }}>
                  <ArchText variant="caption">Key needs</ArchText>
                  <ArchText variant="body">{consultationSummary.keyFrustrations.join(', ')}</ArchText>
                </View>
              )}
              {consultationSummary.architectInsights.length > 0 && (
                <View style={{ gap: DS.spacing.xs }}>
                  <ArchText variant="caption">Architect insights</ArchText>
                  {consultationSummary.architectInsights.map((insight, i) => (
                    <ArchText key={i} variant="body">{insight}</ArchText>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {result && (
          <ArchText variant="caption" style={{ textAlign: 'center', marginBottom: DS.spacing.md }}>
            Previous design loaded — generating will replace it
          </ArchText>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: DS.spacing.lg, paddingBottom: DS.spacing.lg }}>
        <OvalButton
          label="generate your design"
          onPress={onGenerate}
          variant="amber"
          size="lg"
          fullWidth
        />
      </View>
    </Animated.View>
  );
}
