import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');
const CX = SW / 2;
const CY = SH / 2;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

const OUTER_R = 46;
const OUTER_CIRC = Math.PI * 2 * OUTER_R;
const INNER_R = 20;
const INNER_CIRC = Math.PI * 2 * INNER_R;
const ARM = 80;

interface Props {
  appReady: boolean;
  onComplete: () => void;
}

export function SplashScreen({ appReady, onComplete }: Props) {
  const screenOp = useSharedValue(1);
  const outerP = useSharedValue(0);
  const innerP = useSharedValue(0);
  const aN = useSharedValue(0);
  const aS = useSharedValue(0);
  const aE = useSharedValue(0);
  const aW = useSharedValue(0);
  const dotS = useSharedValue(0);
  const wordOp = useSharedValue(0);
  const wordSc = useSharedValue(1.14);
  const subOp = useSharedValue(0);
  const subTrack = useSharedValue(0);

  const animDoneRef = useSharedValue(false);
  const appReadyRef = useSharedValue(false);

  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOp.value }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOp.value,
    transform: [{ scale: wordSc.value }],
  }));
  const subStyle = useAnimatedStyle(() => ({
    opacity: subOp.value,
    letterSpacing: subTrack.value,
  }));

  const outerProps = useAnimatedProps(() => ({
    strokeDashoffset: OUTER_CIRC * (1 - outerP.value),
  }));
  const innerProps = useAnimatedProps(() => ({
    strokeDashoffset: INNER_CIRC * (1 - innerP.value),
  }));
  const aNProps = useAnimatedProps(() => ({ y1: CY - aN.value }));
  const aSProps = useAnimatedProps(() => ({ y2: CY + aS.value }));
  const aEProps = useAnimatedProps(() => ({ x2: CX + aE.value }));
  const aWProps = useAnimatedProps(() => ({ x1: CX - aW.value }));
  const dotProps = useAnimatedProps(() => ({ r: 4.5 * dotS.value, opacity: dotS.value }));

  function triggerFadeOut() {
    screenOp.value = withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }, (done) => {
      if (done) runOnJS(onComplete)();
    });
  }

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    const fast = Easing.out(Easing.quad);

    outerP.value = withTiming(1, { duration: 520, easing: ease });
    aN.value = withDelay(180, withTiming(ARM, { duration: 380, easing: fast }));
    aS.value = withDelay(230, withTiming(ARM, { duration: 380, easing: fast }));
    aE.value = withDelay(280, withTiming(ARM, { duration: 380, easing: fast }));
    aW.value = withDelay(330, withTiming(ARM, { duration: 380, easing: fast }));
    innerP.value = withDelay(420, withTiming(1, { duration: 320, easing: ease }));
    dotS.value = withDelay(620, withSpring(1, { damping: 12, stiffness: 280 }));

    wordOp.value = withDelay(780, withTiming(1, { duration: 200, easing: fast }));
    wordSc.value = withDelay(780, withSpring(1, { damping: 16, stiffness: 300 }));

    subOp.value = withDelay(1080, withTiming(1, { duration: 320, easing: fast }));
    subTrack.value = withDelay(1080, withTiming(7, { duration: 550, easing: ease }));

    const doneTimer = setTimeout(() => {
      animDoneRef.value = true;
      if (appReadyRef.value) triggerFadeOut();
    }, 1950);

    return () => clearTimeout(doneTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    appReadyRef.value = appReady;
    if (appReady && animDoneRef.value) triggerFadeOut();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appReady]);

  return (
    <Animated.View
      style={[
        { flex: 1, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
        screenStyle,
      ]}
    >
      {/* Compass rose drawing */}
      <Svg
        width={SW}
        height={SH}
        style={{ position: 'absolute', top: 0, left: 0 }}
        pointerEvents="none"
      >
        <AnimatedCircle
          cx={CX} cy={CY} r={OUTER_R}
          stroke="#F0EDE8" strokeWidth="1" fill="none"
          strokeDasharray={`${OUTER_CIRC}`}
          animatedProps={outerProps}
          opacity={0.55}
        />
        <AnimatedCircle
          cx={CX} cy={CY} r={INNER_R}
          stroke="#F0EDE8" strokeWidth="1" fill="none"
          strokeDasharray={`${INNER_CIRC}`}
          animatedProps={innerProps}
          opacity={0.35}
        />
        <AnimatedLine x1={CX} y1={CY} x2={CX} y2={CY}
          animatedProps={aNProps} stroke="#F0EDE8" strokeWidth="1.5" strokeLinecap="round" opacity={0.9} />
        <AnimatedLine x1={CX} y1={CY} x2={CX} y2={CY}
          animatedProps={aSProps} stroke="#F0EDE8" strokeWidth="1.5" strokeLinecap="round" opacity={0.45} />
        <AnimatedLine x1={CX} y1={CY} x2={CX} y2={CY}
          animatedProps={aEProps} stroke="#F0EDE8" strokeWidth="1.5" strokeLinecap="round" opacity={0.45} />
        <AnimatedLine x1={CX} y1={CY} x2={CX} y2={CY}
          animatedProps={aWProps} stroke="#F0EDE8" strokeWidth="1.5" strokeLinecap="round" opacity={0.45} />
        <AnimatedCircle cx={CX} cy={CY} r={4.5} fill="#F0EDE8" animatedProps={dotProps} />
      </Svg>

      {/* Brand word — slams in */}
      <Animated.View style={[{ alignItems: 'center', marginTop: 148 }, wordStyle]}>
        <Animated.Text
          style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 46,
            color: '#F0EDE8',
            letterSpacing: 16,
            paddingLeft: 16,
          }}
        >
          ASORIA
        </Animated.Text>
      </Animated.View>

      {/* Subtitle — tracks in */}
      <Animated.Text
        style={[
          {
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 10,
            color: '#5A5550',
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
