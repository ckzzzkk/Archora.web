import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../common/ArchText';

const SCREEN_H = Dimensions.get('window').height;

interface ARInstructionBubbleProps {
  /** Contextual instruction text */
  prompt: string;
  /** Number of walls detected so far */
  wallCount: number;
  /** Total number of walls expected */
  totalWalls?: number;
  /** Scan quality/completeness as a percentage (0-100) */
  qualityPercent: number;
  /** Optional step counter like "Step 1 of 4" */
  step?: string;
  /** Position: 'top' | 'center' | 'bottom' */
  position?: 'top' | 'center' | 'bottom';
  /** Animation delay in ms */
  delay?: number;
}

// Inline SVG ring component using strokeDashoffset for progress
function QualityRing({ percent, size = 40 }: { percent: number; size?: number }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(240,237,232,0.15)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={DS.colors.success}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ArchText
          variant="body"
          style={{
            fontFamily: DS.font.mono,
            fontSize: 9,
            color: DS.colors.primary,
          }}
        >
          {Math.round(percent)}%
        </ArchText>
      </View>
    </View>
  );
}

export function ARInstructionBubble({
  prompt,
  wallCount,
  totalWalls = 4,
  qualityPercent,
  step,
  position = 'top',
  delay = 0,
}: ARInstructionBubbleProps) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) });
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
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
          backgroundColor: 'rgba(28, 28, 28, 0.85)',
          borderRadius: 50,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: DS.colors.border,
          maxWidth: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Left: instruction text column */}
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          {step && (
            <ArchText
              variant="body"
              style={{
                fontFamily: DS.font.mono,
                fontSize: 11,
                color: DS.colors.primaryGhost,
                marginBottom: 2,
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
            }}
          >
            {prompt}
          </ArchText>
        </View>

        {/* Center: wall count badge */}
        <View
          style={{
            backgroundColor: DS.colors.surface,
            borderRadius: 50,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: DS.colors.border,
          }}
        >
          <ArchText
            variant="body"
            style={{
              fontFamily: DS.font.mono,
              fontSize: 11,
              color: DS.colors.primary,
            }}
          >
            {wallCount}/{totalWalls} walls
          </ArchText>
        </View>

        {/* Right: quality ring */}
        <QualityRing percent={qualityPercent} size={40} />
      </View>
    </Animated.View>
  );
}
