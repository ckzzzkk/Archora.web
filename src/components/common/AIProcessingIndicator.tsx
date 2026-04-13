/**
 * AIProcessingIndicator — animated AI processing feedback.
 *
 * Features:
 * - Pulsing ring around a central icon
 * - Typewriter-style cycling processing words
 * - Animated indicator dots
 * - Smooth fade transitions between phases
 */
import React, { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { SUNRISE } from '../../theme/sunrise';
import { ArchText } from './ArchText';
import { DS } from '../../theme/designSystem';

interface ProcessingWord {
  text: string;
  icon?: 'compass' | 'wave' | 'sparkle';
}

const DEFAULT_CHAT_WORDS: ProcessingWord[] = [
  { text: 'Reading your blueprint...', icon: 'compass' },
  { text: 'Planning the changes...', icon: 'wave' },
  { text: 'Applying modifications...', icon: 'sparkle' },
  { text: 'Finalizing...', icon: 'compass' },
];

const DEFAULT_GENERATION_WORDS: ProcessingWord[] = [
  { text: 'Understanding your vision...', icon: 'compass' },
  { text: 'Sketching your space...', icon: 'wave' },
  { text: 'Placing rooms and walls...', icon: 'sparkle' },
  { text: 'Arranging furniture...', icon: 'compass' },
  { text: 'Adding the details...', icon: 'wave' },
];

interface Props {
  /** Size preset: small (chat), medium (inline), large (overlay) */
  size?: 'small' | 'medium' | 'large';
  /** Custom processing words. Defaults to chat-style words. */
  words?: ProcessingWord[];
  /** Interval between word changes in ms */
  interval?: number;
  /** Show animated dots indicator */
  showDots?: boolean;
  /** Color override */
  color?: string;
}

// Pulsing ring animation around icon
function PulsingRing({ size, color }: { size: number; color: string }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulse.value, [0, 1], [0.8, 1.4]);
    const opacity = interpolate(pulse.value, [0, 0.3, 1], [0.6, 0.3, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const ringSize = size * 2.2;

  return (
    <Animated.View style={[{ position: 'absolute' }, ringStyle]}>
      <Svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
        <Circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={(size * 0.42) * 1.8}
          stroke={color}
          strokeWidth={1.5}
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

// Animated icon inside the ring
function AnimatedIcon({ size, color, icon }: { size: number; color: string; icon?: 'compass' | 'wave' | 'sparkle' }) {
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2400, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const c = size / 2;
  const r = size * 0.38;

  return (
    <Animated.View style={containerStyle}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {icon === 'wave' ? (
          // Wave dots animation representation
          <>
            <Circle cx={c - r * 0.5} cy={c} r={size * 0.06} fill={color} opacity={0.5} />
            <Circle cx={c} cy={c} r={size * 0.08} fill={color} opacity={0.8} />
            <Circle cx={c + r * 0.5} cy={c} r={size * 0.06} fill={color} opacity={0.5} />
          </>
        ) : icon === 'sparkle' ? (
          // Sparkle star
          <>
            <Path
              d={`M ${c} ${c - r * 0.6} L ${c + r * 0.15} ${c - r * 0.15} L ${c + r * 0.6} ${c} L ${c + r * 0.15} ${c + r * 0.15} L ${c} ${c + r * 0.6} L ${c - r * 0.15} ${c + r * 0.15} L ${c - r * 0.6} ${c} L ${c - r * 0.15} ${c - r * 0.15} Z`}
              fill={color}
              opacity={0.7}
            />
          </>
        ) : (
          // Default compass rose
          <>
            <Circle cx={c} cy={c} r={r} stroke={color} strokeWidth={size * 0.04} fill="none" opacity={0.3} />
            <Path
              d={`M ${c} ${c - r * 0.3} L ${c - r * 0.12} ${c - r * 0.85} L ${c} ${c - r * 0.95} L ${c + r * 0.12} ${c - r * 0.85} Z`}
              fill={color}
            />
            <Path
              d={`M ${c} ${c + r * 0.3} L ${c - r * 0.12} ${c + r * 0.85} L ${c} ${c + r * 0.95} L ${c + r * 0.12} ${c + r * 0.85} Z`}
              fill={color}
              opacity={0.5}
            />
            <Circle cx={c} cy={c} r={size * 0.04} fill={color} />
          </>
        )}
      </Svg>
    </Animated.View>
  );
}

// Animated dots indicator
function AnimatedDots({ count = 3, color, active }: { count?: number; color: string; active: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot key={i} index={i} color={color} active={active} />
      ))}
    </View>
  );
}

function Dot({ index, color, active }: { index: number; color: string; active: boolean }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (active) {
      const delay = index * 200;
      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1.3, { duration: 400, easing: Easing.out(Easing.ease) }),
            withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        ),
      );
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.4, { duration: 400 }),
          ),
          -1,
          true,
        ),
      );
    }
  }, [active, index, scale, opacity]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: color,
        },
        dotStyle,
      ]}
    />
  );
}

// Typewriter text with fade
function TypewriterText({
  text,
  visible,
  style,
}: {
  text: string;
  visible: boolean;
  style?: object;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 1800 }),
        withTiming(0, { duration: 200 }),
      );
      translateY.value = withSequence(
        withTiming(0, { duration: 250, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 1800 }),
        withTiming(-8, { duration: 200 }),
      );
    }
  }, [visible, text, opacity, translateY]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={textStyle}>
      <ArchText variant="body" style={style}>
        {text}
      </ArchText>
    </Animated.View>
  );
}

const SIZES = {
  small: { icon: 28, ring: 56, text: 11, dots: 3 },
  medium: { icon: 40, ring: 80, text: 13, dots: 4 },
  large: { icon: 64, ring: 128, text: 18, dots: 5 },
};

export function AIProcessingIndicator({
  size = 'medium',
  words = DEFAULT_CHAT_WORDS,
  interval = 2500,
  showDots = true,
  color,
}: Props) {
  const { colors } = useTheme();
  const accentColor = color ?? SUNRISE.gold;
  const dims = SIZES[size];

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [visible, setVisible] = React.useState(true);

  const cycleText = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
      setVisible(true);
    }, 250);
  }, [words.length]);

  useEffect(() => {
    const id = setInterval(cycleText, interval);
    return () => clearInterval(id);
  }, [cycleText, interval]);

  const currentWord = words[currentIndex];

  return (
    <View style={{ alignItems: 'center', gap: DS.spacing.sm }}>
      {/* Icon with pulsing ring */}
      <View
        style={{
          width: dims.ring,
          height: dims.ring,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PulsingRing size={dims.icon} color={accentColor} />
        <AnimatedIcon size={dims.icon} color={accentColor} icon={currentWord.icon} />
      </View>

      {/* Typewriter text */}
      <TypewriterText
        text={currentWord.text}
        visible={visible}
        style={{
          fontFamily: 'Inter_400Regular',
          fontSize: dims.text,
          color: DS.colors.primaryDim,
          textAlign: 'center',
        }}
      />

      {/* Animated dots */}
      {showDots && (
        <AnimatedDots
          count={dims.dots}
          color={accentColor}
          active={true}
        />
      )}
    </View>
  );
}

// Convenience hook for generating AI processing state
export function useAIProcessing(words?: ProcessingWord[], intervalMs = 2500) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [currentPhase, setCurrentPhase] = React.useState(0);

  const startProcessing = useCallback(() => {
    setIsProcessing(true);
    setCurrentPhase(0);
  }, []);

  const stopProcessing = useCallback(() => {
    setIsProcessing(false);
  }, []);

  const indicator = isProcessing ? (
    <AIProcessingIndicator words={words} interval={intervalMs} />
  ) : null;

  return {
    isProcessing,
    currentPhase,
    startProcessing,
    stopProcessing,
    indicator,
  };
}
