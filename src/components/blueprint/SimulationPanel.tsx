import React, { useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { ArchText } from '../common/ArchText';
import { DS } from '../../theme/designSystem';
import type { SimulationReport } from '../../types/blueprint';

interface SimulationPanelProps {
  report: SimulationReport;
  onReanalyse?: () => void;
  onClose?: () => void;
}

type RatingLevel = 'excellent' | 'good' | 'fair' | 'poor';

function gradeColor(grade: SimulationReport['grade']): string {
  switch (grade) {
    case 'A': return '#7AB87A';
    case 'B': return DS.colors.accent;
    case 'C': return DS.colors.warning;
    case 'D': return '#FFB870';
    case 'F': return DS.colors.error;
    default:  return DS.colors.primaryDim;
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return '#7AB87A';
  if (score >= 60) return DS.colors.accent;
  if (score >= 40) return DS.colors.warning;
  return DS.colors.error;
}

function ratingColor(rating: RatingLevel): string {
  switch (rating) {
    case 'excellent': return '#7AB87A';
    case 'good':      return DS.colors.accent;
    case 'fair':      return DS.colors.warning;
    case 'poor':      return DS.colors.error;
    default:          return DS.colors.primaryDim;
  }
}

function severityColor(severity: 'critical' | 'major' | 'minor'): string {
  switch (severity) {
    case 'critical': return DS.colors.error;
    case 'major':    return DS.colors.warning;
    case 'minor':    return DS.colors.border;
    default:         return DS.colors.border;
  }
}

function categoryIcon(category: 'structural' | 'weather' | 'flow' | 'code'): string {
  switch (category) {
    case 'structural': return '⬡';
    case 'weather':    return '◎';
    case 'flow':       return '⟳';
    case 'code':       return '✓';
    default:           return '•';
  }
}

interface ScoreGaugeProps {
  label: string;
  score: number;
  index: number;
}

function ScoreGauge({ label, score, index }: ScoreGaugeProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(
      index * 100,
      withTiming(score, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
  }, [score, index, width]);

  const animatedWidth = useAnimatedStyle(() => ({
    width: `${width.value}%` as `${number}%`,
  }));

  const color = scoreColor(score);

  return (
    <View style={{ flex: 1, paddingHorizontal: 6 }}>
      <View style={{ alignItems: 'center', marginBottom: 6 }}>
        <ArchText
          variant="body"
          style={{
            fontFamily: DS.font.mono,
            fontSize: 22,
            color,
            lineHeight: 28,
          }}
        >
          {score}
        </ArchText>
      </View>
      <View style={{ height: 4, backgroundColor: DS.colors.surfaceHigh, borderRadius: 2, overflow: 'hidden' }}>
        <Animated.View
          style={[
            animatedWidth,
            { height: 4, borderRadius: 2, backgroundColor: color },
          ]}
        />
      </View>
      <ArchText
        variant="body"
        style={{
          fontFamily: DS.font.regular,
          fontSize: 10,
          color: DS.colors.primaryDim,
          textAlign: 'center',
          marginTop: 4,
        }}
      >
        {label}
      </ArchText>
    </View>
  );
}

interface ProfileChipProps {
  label: string;
  value: RatingLevel;
}

function ProfileChip({ label, value }: ProfileChipProps) {
  const color = ratingColor(value);
  return (
    <View
      style={{
        flex: 1,
        margin: 4,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: DS.radius.chip,
        borderWidth: 1,
        borderColor: `${color}40`,
        backgroundColor: `${color}10`,
        alignItems: 'center',
      }}
    >
      <ArchText
        variant="body"
        style={{ fontFamily: DS.font.semibold, fontSize: 11, color, marginBottom: 2 }}
      >
        {value.toUpperCase()}
      </ArchText>
      <ArchText
        variant="body"
        style={{ fontFamily: DS.font.regular, fontSize: 9, color: DS.colors.primaryDim, textAlign: 'center' }}
      >
        {label}
      </ArchText>
    </View>
  );
}

type RoomEnv = NonNullable<SimulationReport['roomEnvironment']>[number];

/** One habitable room's winter-sun bar + ventilation marker. */
function RoomSunRow({ room }: { room: RoomEnv }) {
  // A winter index of 0.08 (≈ generous well-oriented glazing) fills the bar.
  const fill = Math.max(0.04, Math.min(1, room.winterSun / 0.08));
  const barColor = room.winterSun >= 0.04 ? '#7AB87A' : room.winterSun >= 0.01 ? DS.colors.warning : DS.colors.error;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
      <ArchText
        variant="body"
        numberOfLines={1}
        style={{ fontFamily: DS.font.regular, fontSize: 12, color: DS.colors.primary, width: 110 }}
      >
        {room.roomName}
      </ArchText>
      <View style={{ flex: 1, height: 8, borderRadius: 999, backgroundColor: DS.colors.border, overflow: 'hidden' }}>
        <View style={{ width: `${fill * 100}%`, height: '100%', borderRadius: 999, backgroundColor: barColor }} />
      </View>
      <ArchText
        variant="body"
        style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: DS.colors.primaryDim, width: 16, textAlign: 'center' }}
      >
        {room.facade}
      </ArchText>
      <ArchText
        variant="body"
        style={{ fontSize: 12, color: room.crossVentilation ? '#7AB87A' : DS.colors.primaryGhost, width: 18, textAlign: 'center' }}
      >
        ⇄
      </ArchText>
    </View>
  );
}

export function SimulationPanel({ report, onReanalyse, onClose }: SimulationPanelProps) {
  const gColor = gradeColor(report.grade);

  const criticalRecs = report.recommendations.filter((r) => r.severity === 'critical');
  const majorRecs    = report.recommendations.filter((r) => r.severity === 'major');
  const minorRecs    = report.recommendations.filter((r) => r.severity === 'minor');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: DS.colors.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 16,
        }}
      >
        <ArchText
          variant="body"
          style={{ fontFamily: DS.font.heading, fontSize: 20, color: DS.colors.primary }}
        >
          Build Simulation
        </ArchText>
        {onClose && (
          <Pressable
            onPress={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: DS.colors.surfaceHigh,
              borderWidth: 1,
              borderColor: DS.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArchText variant="body" style={{ color: DS.colors.primaryDim, fontSize: 14 }}>✕</ArchText>
          </Pressable>
        )}
      </View>

      {/* Grade badge + summary */}
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 20,
          padding: 20,
          borderRadius: DS.radius.card,
          backgroundColor: DS.colors.surface,
          borderWidth: 1,
          borderColor: `${gColor}30`,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            borderWidth: 2,
            borderColor: gColor,
            backgroundColor: `${gColor}18`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArchText
            variant="body"
            style={{ fontFamily: DS.font.bold, fontSize: 28, color: gColor }}
          >
            {report.grade}
          </ArchText>
        </View>
        <View style={{ flex: 1 }}>
          <ArchText
            variant="body"
            style={{
              fontFamily: DS.font.mono,
              fontSize: 11,
              color: DS.colors.primaryDim,
              marginBottom: 4,
            }}
          >
            OVERALL SCORE: {report.overall}/100
          </ArchText>
          <ArchText
            variant="body"
            style={{
              fontFamily: DS.font.regular,
              fontSize: 13,
              color: DS.colors.primary,
              lineHeight: 18,
            }}
          >
            {report.summary}
          </ArchText>
        </View>
      </View>

      {/* Score gauges */}
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 20,
          padding: 16,
          borderRadius: DS.radius.card,
          backgroundColor: DS.colors.surface,
          borderWidth: 1,
          borderColor: DS.colors.border,
        }}
      >
        <ArchText
          variant="body"
          style={{
            fontFamily: DS.font.medium,
            fontSize: 12,
            color: DS.colors.primaryDim,
            marginBottom: 14,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Score Breakdown
        </ArchText>
        <View style={{ flexDirection: 'row' }}>
          <ScoreGauge label="Structural" score={report.structural} index={0} />
          <ScoreGauge label="Weather" score={report.weather} index={1} />
          <ScoreGauge label="Flow" score={report.flow} index={2} />
          <ScoreGauge label="Code" score={report.codeCompliance} index={3} />
        </View>
      </View>

      {/* Weather profile */}
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 20,
          padding: 16,
          borderRadius: DS.radius.card,
          backgroundColor: DS.colors.surface,
          borderWidth: 1,
          borderColor: DS.colors.border,
        }}
      >
        <ArchText
          variant="body"
          style={{
            fontFamily: DS.font.medium,
            fontSize: 12,
            color: DS.colors.primaryDim,
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Weather Profile
        </ArchText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <ProfileChip label="Solar Gain" value={report.weatherProfile.solarGain} />
          <ProfileChip label="Wind Resistance" value={report.weatherProfile.windResistance} />
          <ProfileChip label="Rain Protection" value={report.weatherProfile.rainProtection} />
          <ProfileChip label="Thermal Mass" value={report.weatherProfile.thermalMass} />
        </View>
      </View>

      {/* Room-by-room sun & airflow (deterministic engine detail) */}
      {report.roomEnvironment && report.roomEnvironment.some((r) => r.habitable) && (
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 20,
            padding: 16,
            borderRadius: DS.radius.card,
            backgroundColor: DS.colors.surface,
            borderWidth: 1,
            borderColor: DS.colors.border,
          }}
        >
          <ArchText
            variant="body"
            style={{
              fontFamily: DS.font.medium,
              fontSize: 12,
              color: DS.colors.primaryDim,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Room Sun &amp; Airflow
          </ArchText>
          {report.roomEnvironment.filter((r) => r.habitable).map((room) => (
            <RoomSunRow key={`${room.floorIndex}-${room.roomName}`} room={room} />
          ))}
          <ArchText
            variant="body"
            style={{ fontFamily: DS.font.regular, fontSize: 10, color: DS.colors.primaryGhost, marginTop: 8 }}
          >
            ☀ winter sun capture · ⇄ cross-ventilation path · letter = window facade
          </ArchText>
        </View>
      )}

      {/* Structural profile */}
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 20,
          padding: 16,
          borderRadius: DS.radius.card,
          backgroundColor: DS.colors.surface,
          borderWidth: 1,
          borderColor: DS.colors.border,
        }}
      >
        <ArchText
          variant="body"
          style={{
            fontFamily: DS.font.medium,
            fontSize: 12,
            color: DS.colors.primaryDim,
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Structural Profile
        </ArchText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <ProfileChip label="Load Path" value={report.structuralProfile.loadPath} />
          <ProfileChip label="Span Integrity" value={report.structuralProfile.spanIntegrity} />
          <ProfileChip label="Foundation Fit" value={report.structuralProfile.foundationFit} />
          <ProfileChip label="Shear Walls" value={report.structuralProfile.shearWalls} />
        </View>
      </View>

      {/* Strengths */}
      {report.strengths.length > 0 && (
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 20,
            padding: 16,
            borderRadius: DS.radius.card,
            backgroundColor: DS.colors.surface,
            borderWidth: 1,
            borderColor: DS.colors.border,
          }}
        >
          <ArchText
            variant="body"
            style={{
              fontFamily: DS.font.medium,
              fontSize: 12,
              color: DS.colors.primaryDim,
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Strengths
          </ArchText>
          {report.strengths.map((strength, i) => (
            <View
              key={i}
              style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 10 }}
            >
              <ArchText
                variant="body"
                style={{ fontSize: 14, color: '#7AB87A', lineHeight: 20 }}
              >
                ✓
              </ArchText>
              <ArchText
                variant="body"
                style={{
                  flex: 1,
                  fontFamily: DS.font.regular,
                  fontSize: 13,
                  color: DS.colors.primary,
                  lineHeight: 20,
                }}
              >
                {strength}
              </ArchText>
            </View>
          ))}
        </View>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <ArchText
            variant="body"
            style={{
              fontFamily: DS.font.medium,
              fontSize: 12,
              color: DS.colors.primaryDim,
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Recommendations
          </ArchText>

          {[
            { label: 'Critical', items: criticalRecs },
            { label: 'Major', items: majorRecs },
            { label: 'Minor', items: minorRecs },
          ].map(({ label, items }) =>
            items.map((rec, i) => (
              <View
                key={`${label}-${i}`}
                style={{
                  padding: 14,
                  borderRadius: DS.radius.medium,
                  backgroundColor: DS.colors.surface,
                  borderWidth: 1,
                  borderColor: severityColor(rec.severity),
                  marginBottom: 10,
                }}
              >
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}
                >
                  <ArchText
                    variant="body"
                    style={{ fontSize: 14, color: severityColor(rec.severity) }}
                  >
                    {categoryIcon(rec.category)}
                  </ArchText>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: DS.radius.chip,
                      backgroundColor: `${severityColor(rec.severity)}20`,
                    }}
                  >
                    <ArchText
                      variant="body"
                      style={{
                        fontFamily: DS.font.semibold,
                        fontSize: 10,
                        color: severityColor(rec.severity),
                        textTransform: 'uppercase',
                      }}
                    >
                      {rec.severity} · {rec.category}
                    </ArchText>
                  </View>
                </View>
                <ArchText
                  variant="body"
                  style={{
                    fontFamily: DS.font.medium,
                    fontSize: 13,
                    color: DS.colors.primary,
                    marginBottom: 4,
                    lineHeight: 18,
                  }}
                >
                  {rec.issue}
                </ArchText>
                <ArchText
                  variant="body"
                  style={{
                    fontFamily: DS.font.regular,
                    fontSize: 12,
                    color: DS.colors.primaryDim,
                    lineHeight: 17,
                  }}
                >
                  Fix: {rec.fix}
                </ArchText>
              </View>
            )),
          )}
        </View>
      )}

      {/* Re-analyse button */}
      {onReanalyse && (
        <Pressable
          onPress={onReanalyse}
          style={{
            marginHorizontal: 20,
            paddingVertical: 14,
            borderRadius: DS.radius.oval,
            backgroundColor: `${DS.colors.warning}18`,
            borderWidth: 1,
            borderColor: `${DS.colors.warning}40`,
            alignItems: 'center',
          }}
        >
          <ArchText
            variant="body"
            style={{ fontFamily: DS.font.medium, fontSize: 14, color: DS.colors.warning }}
          >
            Re-analyse
          </ArchText>
        </Pressable>
      )}

      {/* Timestamp */}
      <ArchText
        variant="body"
        style={{
          fontFamily: DS.font.mono,
          fontSize: 10,
          color: DS.colors.primaryGhost,
          textAlign: 'center',
          marginTop: 16,
        }}
      >
        Generated {new Date(report.generatedAt).toLocaleString()}
      </ArchText>
    </ScrollView>
  );
}
