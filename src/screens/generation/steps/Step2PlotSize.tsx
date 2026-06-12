import React, { useState } from 'react';
import { DS } from '../../../theme/designSystem';
import { ArchText } from '../../../components/common/ArchText';
import { View, TextInput, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { ClimateZone } from '../../../types/blueprint';


const QUICK_PICKS = [
  { label: 'Studio', value: 20 },
  { label: 'Small', value: 70 },
  { label: 'Medium', value: 175 },
  { label: 'Large', value: 375 },
  { label: 'Estate', value: 700 },
];

const CLIMATE_ZONES: Array<{ id: ClimateZone; label: string }> = [
  { id: 'tropical', label: 'Tropical' },
  { id: 'subtropical', label: 'Subtropical' },
  { id: 'temperate', label: 'Temperate' },
  { id: 'arid', label: 'Arid' },
  { id: 'cold', label: 'Cold' },
  { id: 'alpine', label: 'Alpine' },
];

const ORIENTATIONS: Array<'N' | 'E' | 'S' | 'W'> = ['N', 'E', 'S', 'W'];

interface Props {
  plotSize: string;
  plotUnit: 'm2' | 'ft2';
  explicitPlotWidth: string;
  explicitPlotDepth: string;
  climateZone: ClimateZone;
  hemisphere: 'north' | 'south';
  orientation: 'N' | 'S' | 'E' | 'W';
  onPlotSizeChange: (v: string) => void;
  onPlotUnitChange: (u: 'm2' | 'ft2') => void;
  onExplicitWidthChange: (v: string) => void;
  onExplicitDepthChange: (v: string) => void;
  onClimateZoneChange: (z: ClimateZone) => void;
  onHemisphereChange: (h: 'north' | 'south') => void;
  onOrientationChange: (o: 'N' | 'S' | 'E' | 'W') => void;
  onNext: () => void;
}

export function Step2PlotSize({
  plotSize, plotUnit,
  explicitPlotWidth, explicitPlotDepth,
  climateZone, hemisphere, orientation,
  onPlotSizeChange, onPlotUnitChange,
  onExplicitWidthChange, onExplicitDepthChange,
  onClimateZoneChange, onHemisphereChange, onOrientationChange,
  onNext,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSite, setShowSite] = useState(false);

  const hasExplicit = showAdvanced && explicitPlotWidth && explicitPlotDepth;
  const computedArea = hasExplicit
    ? (parseFloat(explicitPlotWidth) || 0) * (parseFloat(explicitPlotDepth) || 0)
    : 0;

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
        Tell me about your space
      </ArchText>

      {/* Area-based input */}
      <TextInput
        value={plotSize}
        onChangeText={onPlotSizeChange}
        placeholder="Plot size"
        placeholderTextColor={DS.colors.primaryGhost}
        keyboardType="numeric"
        accessibilityLabel="Plot size in square meters or feet"
        style={{
          backgroundColor: DS.colors.surface,
          borderRadius: 50,
          paddingHorizontal: DS.spacing.lg,
          paddingVertical: 14,
          fontFamily: 'Inter_400Regular',
          fontSize: 16,
          color: DS.colors.primary,
          borderWidth: 1,
          borderColor: DS.colors.border,
          marginBottom: 12,
        }}
      />

      <View style={{ flexDirection: 'row', alignSelf: 'flex-start', marginBottom: 20, borderRadius: 50, overflow: 'hidden', borderWidth: 1, borderColor: DS.colors.border }}>
        {(['m2', 'ft2'] as const).map((u) => (
          <Pressable
            key={u}
            onPress={() => onPlotUnitChange(u)}
            accessibilityLabel={`${u === 'm2' ? 'Square meters' : 'Square feet'}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: plotUnit === u }}
            style={{
              paddingHorizontal: DS.spacing.lg,
              paddingVertical: 10,
              backgroundColor: plotUnit === u ? DS.colors.primary : 'transparent',
            }}
          >
            <ArchText variant="body"
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 14,
                color: plotUnit === u ? DS.colors.background : DS.colors.primaryDim,
              }}
            >
              {u === 'm2' ? 'm\u00B2' : 'ft\u00B2'}
            </ArchText>
          </Pressable>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {QUICK_PICKS.map((qp) => (
            <Pressable
              key={qp.label}
              onPress={() => onPlotSizeChange(String(qp.value))}
              accessibilityLabel={`${qp.label}, ${qp.value} ${plotUnit === 'm2' ? 'square meters' : 'square feet'}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: plotSize === String(qp.value) }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 50,
                borderWidth: 1,
                borderColor: plotSize === String(qp.value) ? DS.colors.primary : DS.colors.border,
                backgroundColor: plotSize === String(qp.value) ? `${DS.colors.primary}20` : 'transparent',
              }}
            >
              <ArchText variant="body"
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  color: DS.colors.primaryDim,
                }}
              >
                {qp.label}
              </ArchText>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Advanced: exact plot dimensions */}
      <Pressable
        onPress={() => setShowAdvanced(v => !v)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16,
          gap: 8,
        }}
      >
        <View style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: showAdvanced ? DS.colors.primary : DS.colors.border,
          backgroundColor: showAdvanced ? DS.colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {showAdvanced && (
            <ArchText variant="body" style={{ color: DS.colors.background, fontSize: 12 }}>✓</ArchText>
          )}
        </View>
        <ArchText variant="body"
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 13,
            color: DS.colors.primaryDim,
          }}
        >
          I know my exact plot dimensions
        </ArchText>
      </Pressable>

      {showAdvanced && (
        <Animated.View entering={FadeIn.duration(150)} style={{ marginBottom: 20, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <ArchText variant="body"
                style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.primaryDim, marginBottom: 6 }}
              >
                Width (m)
              </ArchText>
              <TextInput
                value={explicitPlotWidth}
                onChangeText={onExplicitWidthChange}
                placeholder="e.g. 12"
                placeholderTextColor={DS.colors.primaryGhost}
                keyboardType="numeric"
                style={{
                  backgroundColor: DS.colors.surface,
                  borderRadius: 50,
                  paddingHorizontal: DS.spacing.lg,
                  paddingVertical: 12,
                  fontFamily: 'Inter_400Regular',
                  fontSize: 15,
                  color: DS.colors.primary,
                  borderWidth: 1,
                  borderColor: DS.colors.border,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <ArchText variant="body"
                style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.primaryDim, marginBottom: 6 }}
              >
                Depth (m)
              </ArchText>
              <TextInput
                value={explicitPlotDepth}
                onChangeText={onExplicitDepthChange}
                placeholder="e.g. 15"
                placeholderTextColor={DS.colors.primaryGhost}
                keyboardType="numeric"
                style={{
                  backgroundColor: DS.colors.surface,
                  borderRadius: 50,
                  paddingHorizontal: DS.spacing.lg,
                  paddingVertical: 12,
                  fontFamily: 'Inter_400Regular',
                  fontSize: 15,
                  color: DS.colors.primary,
                  borderWidth: 1,
                  borderColor: DS.colors.border,
                }}
              />
            </View>
          </View>

          {hasExplicit && computedArea > 0 && (
            <ArchText variant="body"
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
                color: DS.colors.primary,
              }}
            >
              Plot: {explicitPlotWidth}m × {explicitPlotDepth}m = {computedArea.toFixed(0)}m²
            </ArchText>
          )}
        </Animated.View>
      )}

      {/* Site: climate, hemisphere, entry orientation */}
      <Pressable
        onPress={() => setShowSite(v => !v)}
        accessibilityLabel="Site details: climate zone, hemisphere and entry direction"
        accessibilityRole="button"
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 }}
      >
        <View style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: showSite ? DS.colors.primary : DS.colors.border,
          backgroundColor: showSite ? DS.colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {showSite && (
            <ArchText variant="body" style={{ color: DS.colors.background, fontSize: 12 }}>✓</ArchText>
          )}
        </View>
        <ArchText variant="body"
          style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryDim }}
        >
          Site details — climate &amp; orientation ({CLIMATE_ZONES.find(z => z.id === climateZone)?.label}, entry {orientation})
        </ArchText>
      </Pressable>

      {showSite && (
        <Animated.View entering={FadeIn.duration(150)} style={{ marginBottom: 20, gap: 14 }}>
          {/* Climate zone chips */}
          <View>
            <ArchText variant="body"
              style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.primaryDim, marginBottom: 6 }}
            >
              Climate zone — drives roof pitch, eaves, glazing and ventilation
            </ArchText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {CLIMATE_ZONES.map((z) => (
                  <Pressable
                    key={z.id}
                    onPress={() => onClimateZoneChange(z.id)}
                    accessibilityLabel={`Climate zone ${z.label}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: climateZone === z.id }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 50,
                      borderWidth: 1,
                      borderColor: climateZone === z.id ? DS.colors.primary : DS.colors.border,
                      backgroundColor: climateZone === z.id ? `${DS.colors.primary}20` : 'transparent',
                    }}
                  >
                    <ArchText variant="body"
                      style={{
                        fontFamily: 'Inter_400Regular',
                        fontSize: 13,
                        color: climateZone === z.id ? DS.colors.primary : DS.colors.primaryDim,
                      }}
                    >
                      {z.label}
                    </ArchText>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Hemisphere toggle */}
          <View>
            <ArchText variant="body"
              style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.primaryDim, marginBottom: 6 }}
            >
              Hemisphere — decides which side the sun is on
            </ArchText>
            <View style={{ flexDirection: 'row', alignSelf: 'flex-start', borderRadius: 50, overflow: 'hidden', borderWidth: 1, borderColor: DS.colors.border }}>
              {(['north', 'south'] as const).map((h) => (
                <Pressable
                  key={h}
                  onPress={() => onHemisphereChange(h)}
                  accessibilityLabel={`${h}ern hemisphere`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: hemisphere === h }}
                  style={{
                    paddingHorizontal: DS.spacing.lg,
                    paddingVertical: 10,
                    backgroundColor: hemisphere === h ? DS.colors.primary : 'transparent',
                  }}
                >
                  <ArchText variant="body"
                    style={{
                      fontFamily: 'Inter_500Medium',
                      fontSize: 14,
                      color: hemisphere === h ? DS.colors.background : DS.colors.primaryDim,
                    }}
                  >
                    {h === 'north' ? 'Northern' : 'Southern'}
                  </ArchText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Entry orientation */}
          <View>
            <ArchText variant="body"
              style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.primaryDim, marginBottom: 6 }}
            >
              Which way does your entry face? (street side)
            </ArchText>
            <View style={{ flexDirection: 'row', alignSelf: 'flex-start', borderRadius: 50, overflow: 'hidden', borderWidth: 1, borderColor: DS.colors.border }}>
              {ORIENTATIONS.map((o) => (
                <Pressable
                  key={o}
                  onPress={() => onOrientationChange(o)}
                  accessibilityLabel={`Entry faces ${o === 'N' ? 'north' : o === 'S' ? 'south' : o === 'E' ? 'east' : 'west'}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: orientation === o }}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    backgroundColor: orientation === o ? DS.colors.primary : 'transparent',
                  }}
                >
                  <ArchText variant="body"
                    style={{
                      fontFamily: 'JetBrainsMono_400Regular',
                      fontSize: 14,
                      color: orientation === o ? DS.colors.background : DS.colors.primaryDim,
                    }}
                  >
                    {o}
                  </ArchText>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      <Pressable
        onPress={onNext}
        disabled={!plotSize && !hasExplicit}
        accessibilityLabel={plotSize || hasExplicit ? 'Next, proceed to rooms' : 'Next, enter plot size first'}
        accessibilityRole="button"
        accessibilityState={{ disabled: !plotSize && !hasExplicit }}
        style={{
          backgroundColor: plotSize || hasExplicit ? DS.colors.primary : DS.colors.border,
          borderRadius: 50,
          paddingVertical: 16,
          alignItems: 'center',
        }}
      >
        <ArchText variant="body"
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 16,
            color: DS.colors.background,
          }}
        >
          Next
        </ArchText>
      </Pressable>
    </Animated.View>
  );
}
