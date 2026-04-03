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
import { useThemeColors } from '../../hooks/useThemeColors';

export type OvalButtonVariant = 'filled' | 'outline' | 'ghost' | 'danger' | 'success';
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
  const C = useThemeColors();

  const VARIANT_STYLE: Record<OvalButtonVariant, { bg: string; border?: string; text: string; borderWidth: number }> = {
    filled:  { bg: C.primary,     text: C.background,   borderWidth: 0 },
    outline: { bg: 'transparent', border: C.primary,     text: C.primary,     borderWidth: 2 },
    ghost:   { bg: 'transparent',                        text: C.primaryDim,  borderWidth: 0 },
    danger:  { bg: 'transparent', border: C.error,       text: C.error,       borderWidth: 2 },
    success: { bg: C.success,                            text: C.background,  borderWidth: 0 },
  };

  const vs = VARIANT_STYLE[variant];
  const isInactive = disabled || loading;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: pressOp.value,
  }));

  return (
    <AnimatedPressable
      onPress={isInactive ? undefined : onPress}
      onPressIn={() => {
        if (!isInactive) {
          scale.value = withSpring(0.93, { damping: 18, stiffness: 420 });
          pressOp.value = withTiming(0.82, { duration: 80 });
        }
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 420 });
        pressOp.value = withTiming(1, { duration: 120 });
      }}
      style={[
        animStyle,
        {
          height,
          paddingHorizontal: ph,
          borderRadius: DS.radius.oval,
          backgroundColor: vs.bg,
          borderWidth: vs.borderWidth,
          borderColor: vs.border ?? 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: isInactive ? 0.32 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
    >
      {loading ? (
        <LoadingDots color={vs.text} />
      ) : (
        <>
          {icon}
          <Text style={{
            fontFamily: DS.font.bold,
            fontSize: fs,
            color: vs.text,
            includeFontPadding: false,
            letterSpacing: 0.3,
          }}>
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}
