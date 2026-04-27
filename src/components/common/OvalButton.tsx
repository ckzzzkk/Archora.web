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
import { LinearGradient } from 'expo-linear-gradient';
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
  small:  { height: 38,  ph: 18, fs: DS.fontSize.sm },
  medium: { height: 50,  ph: 26, fs: DS.fontSize.md },
  large:  { height: 58,  ph: 34, fs: DS.fontSize.lg },
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
  const scale = useSharedValue(1);
  const pressOp = useSharedValue(1);
  const { height, ph, fs } = SIZE[size];

  const isInactive = disabled || loading;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: pressOp.value,
  }));

  const handlePressIn = () => {
    if (!isInactive) {
      scale.value = withSpring(0.93, { damping: 18, stiffness: 420 });
      pressOp.value = withTiming(0.82, { duration: 80 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 420 });
    pressOp.value = withTiming(1, { duration: 120 });
  };

  const contentStyle = {
    height,
    paddingHorizontal: ph,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  };

  const labelColor = variant === 'filled'
    ? DS.colors.background
    : variant === 'amber'
    ? DS.colors.background
    : variant === 'danger'
    ? DS.colors.error
    : DS.colors.primary;

  const accessibilityLabel = loading
    ? `${label}, loading`
    : disabled
    ? `${label}, disabled`
    : label;

  if (variant === 'filled') {
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
            borderRadius: DS.radius.oval,
            overflow: 'hidden',
            opacity: isInactive ? 0.32 : 1,
            alignSelf: fullWidth ? 'stretch' : 'flex-start',
          },
        ]}
      >
        <LinearGradient
          colors={[DS.colors.primary, DS.colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[contentStyle, { borderRadius: DS.radius.oval }]}
        >
          {loading ? <LoadingDots color={DS.colors.background} /> : (
            <>
              {icon}
              <View style={{ flexShrink: 1 }}>
                <Text style={{ fontFamily: DS.font.bold, fontSize: fs, color: labelColor, includeFontPadding: false, letterSpacing: 0.3 }} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            </>
          )}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  const nonFilledStyle = variant === 'outline'
    ? { bg: 'rgba(240, 237, 232, 0.03)', border: 'rgba(240, 237, 232, 0.18)', borderWidth: 1 }
    : variant === 'danger'
    ? { bg: 'rgba(240, 237, 232, 0.03)', border: 'rgba(192, 96, 74, 0.30)', borderWidth: 1 }
    : variant === 'amber'
    ? { bg: DS.colors.amber, border: 'transparent', borderWidth: 0 }
    : variant === 'success'
    ? { bg: DS.colors.success, border: 'transparent', borderWidth: 0 }
    : { bg: 'transparent', border: 'transparent', borderWidth: 0 }; // ghost

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
          ...contentStyle,
          borderRadius: DS.radius.oval,
          backgroundColor: nonFilledStyle.bg,
          borderWidth: nonFilledStyle.borderWidth,
          borderColor: nonFilledStyle.border,
          opacity: isInactive ? 0.32 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
    >
      {loading ? (
        <LoadingDots color={labelColor} />
      ) : (
        <>
          {icon}
          <View style={{ flexShrink: 1 }}>
            <Text style={{ fontFamily: DS.font.bold, fontSize: fs, color: labelColor, includeFontPadding: false, letterSpacing: 0.3 }} numberOfLines={1}>
              {label}
            </Text>
          </View>
        </>
      )}
    </AnimatedPressable>
  );
}
