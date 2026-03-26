import React, { useRef, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BASE_COLORS } from '../../../theme/colors';
import { DESIGN_STYLES } from '../../../data/designStyles';
import { useAuthStore } from '../../../stores/authStore';
import { getAvailableStyles, isStyleAccessible } from '../../../utils/tierLimits';

interface Props {
  selected: string | null;
  onSelect: (styleId: string) => void;
  onNext: () => void;
}

export function Step4Style({ selected, onSelect, onNext }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const tier = useAuthStore((s) => s.user?.subscriptionTier ?? 'starter');
  const available = getAvailableStyles(tier);

  const handleSelect = useCallback((id: string, index: number) => {
    onSelect(id);
    // Auto-scroll to center the selected card
    scrollRef.current?.scrollTo({ x: Math.max(0, index * 132 - 100), animated: true });
  }, [onSelect]);

  return (
    <Animated.View entering={FadeIn.duration(150)} style={{ flex: 1 }}>
      <Text
        style={{
          fontFamily: 'ArchitectsDaughter_400Regular',
          fontSize: 24,
          color: BASE_COLORS.textPrimary,
          marginBottom: 24,
          paddingHorizontal: 20,
        }}
      >
        What style are you going for?
      </Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      >
        {DESIGN_STYLES.map((style, idx) => {
          const isLocked = !isStyleAccessible(style.id, available);
          const isActive = selected === style.id;

          return (
            <Pressable
              key={style.id}
              onPress={() => !isLocked && handleSelect(style.id, idx)}
              style={{
                width: 120,
                height: 140,
                borderRadius: 24,
                backgroundColor: BASE_COLORS.surface,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: isActive ? 2 : 1,
                borderColor: isActive ? BASE_COLORS.textPrimary : BASE_COLORS.border,
                opacity: isLocked ? 0.4 : 1,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: style.previewGradient[0],
                  marginBottom: 8,
                }}
              />
              <Text
                style={{
                  fontFamily: 'ArchitectsDaughter_400Regular',
                  fontSize: 14,
                  color: BASE_COLORS.textPrimary,
                  textAlign: 'center',
                }}
                numberOfLines={2}
              >
                {style.name}
              </Text>
              {isLocked && (
                <Text style={{ fontSize: 10, color: BASE_COLORS.textDim, marginTop: 4 }}>Locked</Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
        <Pressable
          onPress={onNext}
          disabled={!selected}
          style={{
            backgroundColor: selected ? BASE_COLORS.textPrimary : BASE_COLORS.border,
            borderRadius: 50,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: BASE_COLORS.background }}>Next</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
