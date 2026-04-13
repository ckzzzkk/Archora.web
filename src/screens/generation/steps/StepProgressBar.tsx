import React from 'react';
import { DS } from '../../../theme/designSystem';
import { ArchText } from '../../../components/common/ArchText';
import { View,  Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';


interface Props {
  current: number;
  total: number;
  onBack?: () => void;
}

export function StepProgressBar({ current, total, onBack }: Props) {
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
      {onBack && current > 1 ? (
        <Pressable
          onPress={onBack}
          style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
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

      <View style={{ flex: 1, alignItems: 'center' }}>
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
            <View
              key={i}
              style={{
                width: 20,
                height: 8,
                borderRadius: 4,
                backgroundColor: i < current ? DS.colors.primary : DS.colors.border,
              }}
            />
          ))}
        </View>
      </View>

      <View style={{ width: 36 }} />
    </Animated.View>
  );
}
