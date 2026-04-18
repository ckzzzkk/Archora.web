import React from 'react';
import { DS } from '../../../theme/designSystem';
import { ArchText } from '../../../components/common/ArchText';
import { View,  TextInput, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';


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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 32 }}>
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

      <Pressable
        onPress={onNext}
        disabled={!plotSize}
        accessibilityLabel={plotSize ? 'Next, proceed to rooms' : 'Next, enter plot size first'}
        accessibilityRole="button"
        accessibilityState={{ disabled: !plotSize }}
        style={{
          backgroundColor: plotSize ? DS.colors.primary : DS.colors.border,
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
