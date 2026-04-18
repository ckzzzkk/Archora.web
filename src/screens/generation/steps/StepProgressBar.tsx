import React from 'react';
import { DS } from '../../../theme/designSystem';
import { ArchText } from '../../../components/common/ArchText';
import { View, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useHaptics } from '../../../hooks/useHaptics';

import type { GenerationPayload } from '../../../types/generation';

type BuildingType = GenerationPayload['buildingType'];

interface Props {
  current: number;
  total: number;
  onBack?: () => void;
}

function AnimatedDot({ index, current }: { index: number; current: number }) {
  const isActive = index < current;
  const isCurrent = index === Math.max(0, current - 1);
  const scale = useSharedValue(1);
  const width = useSharedValue(isActive ? 20 : 8);

  React.useEffect(() => {
    if (isCurrent) {
      // Bounce when becoming the active step
      scale.value = withSpring(1.15, { damping: 8, stiffness: 300 }, () => {
        scale.value = withSpring(1, { damping: 12, stiffness: 280 });
      });
    }
    width.value = withSpring(isActive ? 20 : 8, { damping: 16, stiffness: 240 });
  }, [isActive, isCurrent, scale, width]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    width: width.value,
  }));

  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 4,
          backgroundColor: isActive ? DS.colors.primary : DS.colors.border,
        },
        dotStyle,
      ]}
    />
  );
}

export function StepProgressBar({ current, total, onBack }: Props) {
  const { light } = useHaptics();

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
      }}
    >
      {onBack && current > 0 ? (
        <Pressable
          onPress={() => { light(); onBack(); }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          accessibilityHint={`Go to step ${current - 1} of ${total}`}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 19l-7-7 7-7"
              stroke={DS.colors.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      ) : (
        <View style={{ width: 36 }} />
      )}

      <View
        style={{ flex: 1, alignItems: 'center' }}
        accessibilityRole="progressbar"
        accessibilityLabel={`Step ${current} of ${total}: Create with AI`}
        accessibilityValue={{ min: 0, max: total, now: current }}
      >
        <ArchText variant="body"
          style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 18,
            color: DS.colors.primary,
            marginBottom: 10,
          }}
        >
          Create with AI
        </ArchText>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {Array.from({ length: total }).map((_, i) => (
            <AnimatedDot key={i} index={i} current={current} />
          ))}
        </View>
      </View>

      <View style={{ width: 36 }} />
    </Animated.View>
  );
}
