import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BASE_COLORS } from '../../../theme/colors';

const QUICK_PICKS = [
  { label: 'Studio', value: 20 },
  { label: 'Small', value: 70 },
  { label: 'Medium', value: 175 },
  { label: 'Large', value: 375 },
  { label: 'Estate', value: 700 },
];

interface Props {
  plotSize: string;
  plotUnit: 'm2' | 'ft2';
  onPlotSizeChange: (v: string) => void;
  onPlotUnitChange: (u: 'm2' | 'ft2') => void;
  onNext: () => void;
}

export function Step2PlotSize({ plotSize, plotUnit, onPlotSizeChange, onPlotUnitChange, onNext }: Props) {
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
        Tell me about your space
      </Text>

      <TextInput
        value={plotSize}
        onChangeText={onPlotSizeChange}
        placeholder="Plot size"
        placeholderTextColor={BASE_COLORS.textDim}
        keyboardType="numeric"
        style={{
          backgroundColor: BASE_COLORS.surface,
          borderRadius: 50,
          paddingHorizontal: 20,
          paddingVertical: 14,
          fontFamily: 'Inter_400Regular',
          fontSize: 16,
          color: BASE_COLORS.textPrimary,
          borderWidth: 1,
          borderColor: BASE_COLORS.border,
          marginBottom: 12,
        }}
      />

      <View style={{ flexDirection: 'row', alignSelf: 'flex-start', marginBottom: 20, borderRadius: 50, overflow: 'hidden', borderWidth: 1, borderColor: BASE_COLORS.border }}>
        {(['m2', 'ft2'] as const).map((u) => (
          <Pressable
            key={u}
            onPress={() => onPlotUnitChange(u)}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: plotUnit === u ? BASE_COLORS.textPrimary : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 14,
                color: plotUnit === u ? BASE_COLORS.background : BASE_COLORS.textSecondary,
              }}
            >
              {u === 'm2' ? 'm\u00B2' : 'ft\u00B2'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 32 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {QUICK_PICKS.map((qp) => (
            <Pressable
              key={qp.label}
              onPress={() => onPlotSizeChange(String(qp.value))}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 50,
                borderWidth: 1,
                borderColor: plotSize === String(qp.value) ? BASE_COLORS.textPrimary : BASE_COLORS.border,
                backgroundColor: plotSize === String(qp.value) ? `${BASE_COLORS.textPrimary}20` : 'transparent',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  color: BASE_COLORS.textSecondary,
                }}
              >
                {qp.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Pressable
        onPress={onNext}
        disabled={!plotSize}
        style={{
          backgroundColor: plotSize ? BASE_COLORS.textPrimary : BASE_COLORS.border,
          borderRadius: 50,
          paddingVertical: 16,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 16,
            color: BASE_COLORS.background,
          }}
        >
          Next
        </Text>
      </Pressable>
    </Animated.View>
  );
}
