import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { DS } from '../../theme/designSystem';

export type OvalButtonVariant = 'filled' | 'outline' | 'ghost' | 'danger' | 'amber' | 'success';
export type OvalButtonSize   = 'small' | 'medium' | 'large';

interface Props {
  label:      string;
  onPress:    () => void;
  variant?:   OvalButtonVariant;
  loading?:   boolean;
  disabled?:  boolean;
  size?:      OvalButtonSize;
  icon?:      React.ReactNode;
  fullWidth?: boolean;
}

const SIZE = {
  small:  { height: 38, ph: 18, fs: DS.fontSize.sm },
  medium: { height: 50, ph: 26, fs: DS.fontSize.md },
  large:  { height: 58, ph: 34, fs: DS.fontSize.lg },
};

type VariantStyle = {
  bg: string;
  borderWidth: number;
  borderColor: string;
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  textColor: string;
};

const VARIANTS: Record<OvalButtonVariant, VariantStyle> = {
  // Flat solid ink — white pill on dark navy, offset shadow gives depth
  filled: {
    bg: DS.colors.ink,
    borderWidth: 2,
    borderColor: DS.colors.ink,
    shadowColor: DS.colors.ink,
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 1,
    textColor: DS.colors.paper,
  },
  // Transparent with visible 2px ink border — secondary action
  outline: {
    bg: 'transparent',
    borderWidth: 2,
    borderColor: DS.colors.ink,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    textColor: DS.colors.ink,
  },
  // Amber gold — primary CTA
  amber: {
    bg: DS.colors.amber,
    borderWidth: 2,
    borderColor: DS.colors.ink,
    shadowColor: DS.colors.ink,
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 1,
    textColor: DS.colors.paper,
  },
  danger: {
    bg: DS.colors.error,
    borderWidth: 2,
    borderColor: DS.colors.ink,
    shadowColor: DS.colors.ink,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    textColor: DS.colors.ink,
  },
  success: {
    bg: DS.colors.success,
    borderWidth: 2,
    borderColor: DS.colors.ink,
    shadowColor: DS.colors.ink,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    textColor: DS.colors.paper,
  },
  ghost: {
    bg: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    textColor: DS.colors.ink,
  },
};

function LoadingDots({ color }: { color: string }) {
  const d1 = useSharedValue(0.3);
  const d2 = useSharedValue(0.3);
  const d3 = useSharedValue(0.3);

  useEffect(() => {
    d1.value = withRepeat(withSequence(withTiming(1, { duration: 320 }), withTiming(0.3, { duration: 320 })), -1, false);
    d2.value = withRepeat(withSequence(withTiming(0.3, { duration: 160 }), withTiming(1, { duration: 320 }), withTiming(0.3, { duration: 320 })), -1, false);
    d3.value = withRepeat(withSequence(withTiming(0.3, { duration: 320 }), withTiming(1, { duration: 320 }), withTiming(0.3, { duration: 320 })), -1, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s1 = useAnimatedStyle(() => ({ opacity: d1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: d2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: d3.value }));
  const dot = { width: 5, height: 5, borderRadius: 3, marginHorizontal: 2.5 };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Animated.View style={[dot, { backgroundColor: color }, s1]} />
      <Animated.View style={[dot, { backgroundColor: color }, s2]} />
      <Animated.View style={[dot, { backgroundColor: color }, s3]} />
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function OvalButton({
  label,
  onPress,
  variant  = 'filled',
  loading  = false,
  disabled = false,
  size     = 'medium',
  icon,
  fullWidth = false,
}: Props) {
  const scale  = useSharedValue(1);
  const rotate = useSharedValue(0);
  const pressOp = useSharedValue(1);
  const { height, ph, fs } = SIZE[size];
  const v = VARIANTS[variant];
  const isInactive = disabled || loading;

  // press-squish: scale + rotation together (matches reference)
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
    opacity: pressOp.value,
  }));

  const handlePressIn = () => {
    if (!isInactive) {
      scale.value  = withSpring(0.93, { damping: 18, stiffness: 420 });
      rotate.value = withSpring(-1,   { damping: 18, stiffness: 420 });
      pressOp.value = withTiming(0.85, { duration: 80 });
    }
  };

  const handlePressOut = () => {
    scale.value  = withSpring(1, { damping: 18, stiffness: 420 });
    rotate.value = withSpring(0, { damping: 18, stiffness: 420 });
    pressOp.value = withTiming(1, { duration: 120 });
  };

  const accessibilityLabel = loading ? `${label}, loading` : disabled ? `${label}, disabled` : label;

  return (
    <AnimatedPressable
      onPress={isInactive ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isInactive, busy: !!loading }}
      accessibilityHint={loading ? 'Please wait while the action completes' : undefined}
      style={[
        animStyle,
        {
          height,
          paddingHorizontal: ph,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: DS.radius.oval,
          backgroundColor: v.bg,
          borderWidth: v.borderWidth,
          borderColor: v.borderColor,
          shadowColor: v.shadowColor,
          shadowOffset: v.shadowOffset,
          shadowOpacity: v.shadowOpacity,
          shadowRadius: 0,
          elevation: 0,
          opacity: isInactive ? 0.32 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
    >
      {loading ? (
        <LoadingDots color={v.textColor} />
      ) : (
        <>
          {icon}
          <View style={{ flexShrink: 1 }}>
            <Text
              style={{
                fontFamily: DS.font.bold,
                fontSize: fs,
                color: v.textColor,
                includeFontPadding: false,
                letterSpacing: 0.3,
              }}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        </>
      )}
    </AnimatedPressable>
  );
}
