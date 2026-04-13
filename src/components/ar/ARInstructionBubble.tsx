import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_H = Dimensions.get('window').height;
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../common/ArchText';

interface ARInstructionBubbleProps {
  /** Main instruction text */
  instruction: string;
  /** Optional secondary hint */
  hint?: string;
  /** Animation delay in ms */
  delay?: number;
  /** Position: 'top' | 'center' | 'bottom' */
  position?: 'top' | 'center' | 'bottom';
  /** Optional step counter like "Step 1 of 4" */
  step?: string;
}

export function ARInstructionBubble({
  instruction,
  hint,
  delay = 0,
  position = 'top',
  step,
}: ARInstructionBubbleProps) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 300 })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) })
    );
  }, [delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const positionStyle = {
    top: position === 'top' ? insets.top + 80 : position === 'center' ? Math.floor(SCREEN_H * 0.4) : undefined,
    bottom: position === 'bottom' ? insets.bottom + 96 : undefined,
  };

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          left: 24,
          right: 24,
          alignItems: 'center',
          ...positionStyle,
        },
      ]}
    >
      <View
        style={{
          backgroundColor: 'rgba(34,34,34,0.92)',
          borderRadius: 50,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: DS.colors.border,
          maxWidth: '100%',
        }}
      >
        {step && (
          <ArchText
            variant="body"
            style={{
              fontFamily: DS.font.mono,
              fontSize: 11,
              color: DS.colors.primaryGhost,
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            {step}
          </ArchText>
        )}
        <ArchText
          variant="body"
          style={{
            fontFamily: DS.font.medium,
            fontSize: 14,
            color: DS.colors.primary,
            textAlign: 'center',
          }}
        >
          {instruction}
        </ArchText>
        {hint && (
          <ArchText
            variant="body"
            style={{
              fontFamily: DS.font.regular,
              fontSize: 12,
              color: DS.colors.primaryDim,
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            {hint}
          </ArchText>
        )}
      </View>
    </Animated.View>
  );
}
