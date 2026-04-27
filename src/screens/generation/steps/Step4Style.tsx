import React, { useRef, useCallback } from 'react';
import { DS } from '../../../theme/designSystem';
import { ArchText } from '../../../components/common/ArchText';
import { View,  Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { DESIGN_STYLES } from '../../../data/designStyles';
import { useSession } from '../../../auth/useSession';
import { getAvailableStyles, isStyleAccessible } from '../../../utils/tierLimits';

interface Props {
  selected: string | null;
  onSelect: (styleId: string) => void;
  onNext: () => void;
}

export function Step4Style({ selected, onSelect, onNext }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const tier = useSession().user?.subscriptionTier ?? 'starter';
  const available = getAvailableStyles(tier);
  const cardScale = useSharedValue(1);
  const nextScale = useSharedValue(1);
  const cardAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }));
  const nextAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: nextScale.value }] }));
  const handleCardPressIn = () => { cardScale.value = withSpring(0.97, { damping: 14, stiffness: 300 }); };
  const handleCardPressOut = () => { cardScale.value = withSpring(1, { damping: 14, stiffness: 300 }); };
  const handleNextPressIn = () => { nextScale.value = withSpring(0.97, { damping: 14, stiffness: 300 }); };
  const handleNextPressOut = () => { nextScale.value = withSpring(1, { damping: 14, stiffness: 300 }); };

  const handleSelect = useCallback((id: string, index: number) => {
    onSelect(id);
    // Auto-scroll to center the selected card
    scrollRef.current?.scrollTo({ x: Math.max(0, index * 132 - 100), animated: true });
  }, [onSelect]);

  return (
    <Animated.View entering={FadeIn.duration(150)} style={{ flex: 1 }}>
      <ArchText variant="body"
        style={{
          fontFamily: 'ArchitectsDaughter_400Regular',
          fontSize: 24,
          color: DS.colors.primary,
          marginBottom: 24,
          paddingHorizontal: DS.spacing.lg,
        }}
      >
        What style are you going for?
      </ArchText>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: DS.spacing.lg, gap: 12 }}
      >
        {DESIGN_STYLES.map((style, idx) => {
          const isLocked = !isStyleAccessible(style.id, available);
          const isActive = selected === style.id;

          return (
            <Pressable
              key={style.id}
              onPressIn={handleCardPressIn}
              onPressOut={handleCardPressOut}
              onPress={() => !isLocked && handleSelect(style.id, idx)}
              accessibilityLabel={`${style.name} style${isActive ? ', selected' : ''}${isLocked ? ', locked' : ''}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: isActive, disabled: isLocked }}
              accessibilityHint={isLocked ? 'Upgrade your plan to unlock this style' : 'Double tap to select this style'}
              style={[{
                width: 120,
                height: 140,
                borderRadius: 24,
                backgroundColor: DS.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: isActive ? 2 : 1,
                borderColor: isActive ? DS.colors.primary : DS.colors.border,
                opacity: isLocked ? 0.4 : 1,
              }, cardAnimatedStyle]}
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
              <ArchText variant="body"
                style={{
                  fontFamily: 'ArchitectsDaughter_400Regular',
                  fontSize: 14,
                  color: DS.colors.primary,
                  textAlign: 'center',
                }}
                numberOfLines={2}
              >
                {style.name}
              </ArchText>
              {isLocked && (
                <ArchText variant="body" style={{ fontSize: 10, color: DS.colors.primaryGhost, marginTop: 4 }}>Locked</ArchText>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: DS.spacing.lg, marginTop: 32 }}>
        <Pressable
          onPressIn={handleNextPressIn}
          onPressOut={handleNextPressOut}
          onPress={onNext}
          disabled={!selected}
          accessibilityLabel={selected ? 'Next, proceed to next step' : 'Next, select a style first'}
          accessibilityRole="button"
          accessibilityState={{ disabled: !selected }}
          accessibilityHint="Proceeds to the reference image upload step"
          style={[{
            backgroundColor: selected ? DS.colors.primary : DS.colors.border,
            borderRadius: 50,
            paddingVertical: 16,
            alignItems: 'center',
          }, nextAnimatedStyle]}
        >
          <ArchText variant="body" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: DS.colors.background }}>Next</ArchText>
        </Pressable>
      </View>
    </Animated.View>
  );
}
