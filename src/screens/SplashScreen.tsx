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
import Svg, { Path, Circle, Line, G, Text as SvgText } from 'react-native-svg';

interface Props {
  appReady: boolean;
  onComplete: () => void;
}

const COLORS = {
  background: '#2A2A28',
  letterform: '#C8C8C8',
  compassAccent: '#C8C8C8',
  compassRing: '#9A9590',
};

export function SplashScreen({ appReady, onComplete }: Props) {
  const { width: SW, height: SH } = useWindowDimensions();
  const CX = SW / 2;
  const CY = SH / 2 - 60;
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

    // Logo appears with scale spring
    logoOp.value = withTiming(1, { duration: 400, easing: ease });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 200 });

    // Text
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

  const logoSize = Math.min(SW, SH) * 0.35;

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }, screenStyle]}>
      {/* Compass A Logo */}
      <Animated.View style={logoStyle}>
        <Svg width={logoSize} height={logoSize} viewBox="0 0 60 60">
          {/* Outer ring */}
          <Circle cx="30" cy="30" r="28" stroke="#333333" strokeWidth="1" opacity="0.6" />
          <Circle cx="30" cy="30" r="22" stroke={COLORS.compassRing} strokeWidth="1" opacity="0.5" />

          {/* Layered A — faint background */}
          <G opacity="0.15">
            <Path d="M30,5 C34.5,11 38.5,21 40.5,29 C42.5,37 43.5,41 44.5,45" stroke={COLORS.compassRing} strokeWidth="4" strokeLinecap="round" fill="none" />
            <Path d="M30,5 C25.5,11 21.5,21 19.5,29 C17.5,37 16.5,41 15.5,45" stroke={COLORS.compassRing} strokeWidth="4" strokeLinecap="round" fill="none" />
          </G>

          {/* Main Wave A — left stroke */}
          <Path
            d="M30,5 C34.5,11 38.5,21 40.5,29 C42.5,37 43.5,41 44.5,45"
            stroke={COLORS.letterform}
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Main Wave A — right stroke */}
          <Path
            d="M30,5 C25.5,11 21.5,21 19.5,29 C17.5,37 16.5,41 15.5,45"
            stroke={COLORS.letterform}
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Crossbar */}
          <Line x1="22" y1="26" x2="38" y2="26" stroke={COLORS.letterform} strokeWidth="4" strokeLinecap="round" />

          {/* Compass star */}
          <Line x1="30" y1="20" x2="30" y2="40" stroke={COLORS.compassRing} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <Line x1="20" y1="30" x2="40" y2="30" stroke={COLORS.compassRing} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

          {/* Compass inner ring */}
          <Circle cx="30" cy="30" r="8" stroke={COLORS.compassRing} strokeWidth="1" fill="none" opacity="0.5" />

          {/* Center dot */}
          <Circle cx="30" cy="30" r="2.5" fill={COLORS.compassAccent} opacity="0.9" />

          {/* N label */}
          <SvgText x="27.5" y="3" fontFamily="monospace" fontSize="4.5" fill={COLORS.compassRing} opacity="0.7">N</SvgText>
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
