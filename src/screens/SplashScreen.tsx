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
import Svg, { Rect, Path, Circle, G, Defs, FeDropShadow, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface Props {
  appReady: boolean;
  onComplete: () => void;
}

const COLORS = {
  background: '#2A2A28',
  letterformLight: '#C5D4B8',
  letterformDim: '#89B4C8',
  compassRing: '#7A9AAA',
  compassDot: '#89B4C8',
  waveAccent: '#A8B8A0',
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
      {/* Logo — logo-01 flipped vertically (upside down) */}
      <Animated.View style={logoStyle}>
        <Svg width={logoSize} height={logoSize} viewBox="0 0 120 120">
          <Defs>
            <FeDropShadow dx="4" dy="4" stdDeviation="3" floodColor="#1a1a1a" floodOpacity="0.6" />
            <FeGaussianBlur stdDeviation="1.5" result="blur" />
            <FeMerge>
              <FeMergeNode in="blur" />
              <FeMergeNode in="SourceGraphic" />
            </FeMerge>
          </Defs>

          {/* Background */}
          <Rect width="120" height="120" fill={COLORS.background} />

          {/* FLIPPED VERTICALLY — logo-01 upside down */}
          <G transform="translate(0, 120) scale(1, -1)">
            {/* Layered depth - 3 stacked A's */}
            <G opacity={0.2} transform="translate(3,3)">
              <Path d="M35,20 L25,70 M85,20 L95,70" stroke={COLORS.letterformDim} strokeWidth="4" strokeLinecap="round" />
              <Path d="M30,50 L90,50" stroke={COLORS.letterformDim} strokeWidth="3" strokeLinecap="round" />
            </G>
            <G opacity={0.4} transform="translate(1.5,1.5)">
              <Path d="M35,20 L25,70 M85,20 L95,70" stroke={COLORS.letterformDim} strokeWidth="4" strokeLinecap="round" />
              <Path d="M30,50 L90,50" stroke={COLORS.letterformDim} strokeWidth="3" strokeLinecap="round" />
            </G>

            {/* Main bold wave A */}
            <G filter="url(#shadow)">
              <Path d="M34,18 C42,28 48,40 52,50 C56,60 58,65 60,70" stroke={COLORS.letterformLight} strokeWidth="5" strokeLinecap="round" fill="none" />
              <Path d="M86,18 C78,28 72,40 68,50 C64,60 62,65 60,70" stroke={COLORS.letterformLight} strokeWidth="5" strokeLinecap="round" fill="none" />
              <Path d="M30,48 C45,46 60,46 75,48 C80,49 85,50 90,49" stroke={COLORS.letterformLight} strokeWidth="4" strokeLinecap="round" fill="none" />
            </G>

            {/* Compass */}
            <G>
              <Circle cx="60" cy="42" r="14" stroke={COLORS.compassRing} strokeWidth="1.5" fill="none" />
              <Path d="M60,28 L60,56 M46,42 L74,42" stroke={COLORS.letterformLight} strokeWidth="2" strokeLinecap="round" />
              <Circle cx="60" cy="42" r="3.5" fill={COLORS.compassDot} />
            </G>

            {/* Wave ripples */}
            <G opacity={0.25}>
              <Path d="M52,58 C56,60 58,61 60,62 C62,61 64,60 68,58" stroke={COLORS.waveAccent} strokeWidth="1.2" strokeLinecap="round" />
              <Path d="M50,62 C55,64 58,65 60,66 C62,65 65,64 70,62" stroke={COLORS.waveAccent} strokeWidth="0.8" strokeLinecap="round" />
            </G>
          </G>
        </Svg>
      </Animated.View>

      {/* Brand word */}
      <Animated.View style={[{ alignItems: 'center', marginTop: 60 }, wordStyle]}>
        <Animated.Text
          style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 46,
            color: COLORS.letterformLight,
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
