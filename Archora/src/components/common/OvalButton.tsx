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
  small:  { height: 36, ph: 16, fs: DS.fontSize.sm },
  medium: { height: 48, ph: 24, fs: DS.fontSize.md },
  large:  { height: 56, ph: 32, fs: DS.fontSize.lg },
};

const VARIANT_STYLE: Record<OvalButtonVariant, {
  bg: string;
  border?: string;
  text: string;
}> = {
  filled:  { bg: DS.colors.primary,  text: DS.colors.background },
  outline: { bg: 'transparent',      border: DS.colors.primary,  text: DS.colors.primary   },
  ghost:   { bg: 'transparent',                                   text: DS.colors.primaryDim },
  danger:  { bg: 'transparent',      border: DS.colors.error,    text: DS.colors.error      },
  success: { bg: DS.colors.success,                               text: DS.colors.background },
};

function LoadingDots() {
  const d1 = useSharedValue(0.3);
  const d2 = useSharedValue(0.3);
  const d3 = useSharedValue(0.3);

  useEffect(() => {
    const pulse = (sv: typeof d1, delay: number) => {
      sv.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 0 }),
          withTiming(1,   { duration: 350 }),
          withTiming(0.3, { duration: 350 }),
        ),
        -1,
        false,
      );
      // stagger by offsetting after a short delay
      setTimeout(() => { /* already started */ }, delay);
    };
    d1.value = withRepeat(withSequence(withTiming(1, { duration: 350 }), withTiming(0.3, { duration: 350 })), -1, false);
    d2.value = withRepeat(withSequence(withTiming(0.3, { duration: 175 }), withTiming(1, { duration: 350 }), withTiming(0.3, { duration: 350 })), -1, false);
    d3.value = withRepeat(withSequence(withTiming(0.3, { duration: 350 }), withTiming(1, { duration: 350 }), withTiming(0.3, { duration: 350 })), -1, false);
    void pulse; // suppress lint
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s1 = useAnimatedStyle(() => ({ opacity: d1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: d2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: d3.value }));

  const dot = { width: 5, height: 5, borderRadius: 3, backgroundColor: 'currentColor', marginHorizontal: 2 };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Animated.View style={[dot, { backgroundColor: DS.colors.primaryDim }, s1]} />
      <Animated.View style={[dot, { backgroundColor: DS.colors.primaryDim }, s2]} />
      <Animated.View style={[dot, { backgroundColor: DS.colors.primaryDim }, s3]} />
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
  const { height, ph, fs } = SIZE[size];
  const vs = VARIANT_STYLE[variant];

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isInactive = disabled || loading;

  return (
    <AnimatedPressable
      onPress={isInactive ? undefined : onPress}
      onPressIn={() => {
        if (!isInactive) {
          scale.value = withSpring(0.96, { damping: 20, stiffness: 400 });
        }
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 400 });
      }}
      style={[
        animStyle,
        {
          height,
          paddingHorizontal: ph,
          borderRadius: DS.radius.oval,
          backgroundColor: vs.bg,
          borderWidth:  vs.border ? 1.5 : 0,
          borderColor:  vs.border ?? 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: isInactive ? 0.35 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
    >
      {loading ? (
        <LoadingDots />
      ) : (
        <>
          {icon}
          <Text style={{
            fontFamily: DS.font.semibold,
            fontSize: fs,
            color: vs.text,
            includeFontPadding: false,
          }}>
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}
