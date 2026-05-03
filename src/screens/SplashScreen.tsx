import React, { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface Props {
  appReady: boolean;
  onComplete: () => void;
}

// Matches logo-final.svg exactly
const COLORS = {
  background: '#2A2A28',
  letterform: '#C8C8C8',
  compassRing: '#5A5550',
  compassStar: '#C8C8C8',
  compassDot: '#7AB87A',
};

export function SplashScreen({ appReady, onComplete }: Props) {
  const { width: SW, height: SH } = useWindowDimensions();
  const screenOp = useSharedValue(1);
  const logoOp = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const wordOp = useSharedValue(0);
  const wordSc = useSharedValue(1.2);
  const subOp = useSharedValue(0);
  const subTrack = useSharedValue(0);

  const animDoneRef = useSharedValue(false);
  const appReadyRef = useSharedValue(false);

  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOp.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOp.value,
    transform: [{ scale: logoScale.value }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOp.value,
    transform: [{ scale: wordSc.value }],
  }));
  const subStyle = useAnimatedStyle(() => ({
    opacity: subOp.value,
    letterSpacing: subTrack.value,
  }));

  function triggerFadeOut() {
    screenOp.value = withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }, (done) => {
      if (done) runOnJS(onComplete)();
    });
  }

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    const fast = Easing.out(Easing.quad);

    logoOp.value = withTiming(1, { duration: 400, easing: ease });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 200 });

    wordOp.value = withDelay(500, withTiming(1, { duration: 200, easing: fast }));
    wordSc.value = withDelay(500, withSpring(1, { damping: 16, stiffness: 300 }));

    subOp.value = withDelay(700, withTiming(1, { duration: 320, easing: fast }));
    subTrack.value = withDelay(700, withTiming(7, { duration: 550, easing: ease }));

    const doneTimer = setTimeout(() => {
      animDoneRef.value = true;
      if (appReadyRef.value) triggerFadeOut();
    }, 1500);

    return () => clearTimeout(doneTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    appReadyRef.value = appReady;
    if (appReady && animDoneRef.value) triggerFadeOut();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appReady]);

  const logoSize = Math.min(SW, SH) * 0.45;

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }, screenStyle]}>
      {/* Logo — matches logo-final.svg exactly */}
      <Animated.View style={logoStyle}>
        <Svg width={logoSize} height={logoSize} viewBox="0 0 80 80">
          {/* Dark background */}
          <Rect width="80" height="80" fill="#1A1A1A" />

          {/* Letterform: Narrow "A" */}
          {/* Left leg: (28,12) to (20,65) · Right leg: (52,12) to (60,65) · Crossbar at y=46 */}
          <Path
            d="M28,12 L20,65 M52,12 L60,65 M26,46 L54,46"
            stroke={COLORS.letterform}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Compass outer ring */}
          <Circle cx="40" cy="32" r="10" stroke={COLORS.compassRing} strokeWidth="1" fill="none" />

          {/* 4-point compass star */}
          <Path
            d="M40,22 L40,42 M30,32 L50,32"
            stroke={COLORS.compassStar}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Compass center dot (Success Green) */}
          <Circle cx="40" cy="32" r="2.5" fill={COLORS.compassDot} />
        </Svg>
      </Animated.View>

      {/* Brand word */}
      <Animated.View style={[{ alignItems: 'center', marginTop: 60 }, wordStyle]}>
        <Animated.Text
          style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 46,
            color: COLORS.letterform,
            letterSpacing: 16,
            paddingLeft: 16,
          }}
        >
          ASORIA
        </Animated.Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.Text
        style={[
          {
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 10,
            color: COLORS.compassRing,
            marginTop: 12,
            textTransform: 'uppercase',
            letterSpacing: 0,
          },
          subStyle,
        ]}
      >
        AI ARCHITECTURE STUDIO
      </Animated.Text>
    </Animated.View>
  );
}
