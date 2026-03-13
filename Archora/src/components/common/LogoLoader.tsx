import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { useUIStore } from '../../stores/uiStore';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// SVG viewBox: 0 0 60 70
// Architectural "A" mark: two compass legs from apex, crossbar, grid lines, apex ring

const LEG_LEN = 60;     // left/right leg ≈ sqrt(22²+54²) ≈ 58.3, rounded up
const BAR_LEN = 28;     // crossbar length (43-17 = 26 + buffer)
const GRID1_LEN = 34;   // grid line 1 at y=48
const GRID2_LEN = 40;   // grid line 2 at y=54
const RING_CIRC = 32;   // circumference of apex ring (r=5, 2π*5 ≈ 31.4)

// Timing phases (ms)
const LEGS_DURATION = 380;
const BAR_START = 280;
const BAR_DURATION = 200;
const GRID1_START = 440;
const GRID1_DURATION = 200;
const GRID2_START = 530;
const GRID2_DURATION = 160;
const RING_START = 680;
const CYCLE_MS = 1650; // full cycle: draw(800) + hold(250) + fade(400) + reset(200)

interface Props {
  size?: 'small' | 'medium' | 'large';
}

const PX = { small: 24, medium: 48, large: 96 };

export function LogoLoader({ size = 'medium' }: Props) {
  const primaryColor = useUIStore((s) => s.primaryColor);
  const px = PX[size];

  const leftLeg = useSharedValue(LEG_LEN);
  const rightLeg = useSharedValue(LEG_LEN);
  const crossbar = useSharedValue(BAR_LEN);
  const grid1 = useSharedValue(GRID1_LEN);
  const grid2 = useSharedValue(GRID2_LEN);
  const ringScale = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runCycle = () => {
    // Reset
    leftLeg.value = LEG_LEN;
    rightLeg.value = LEG_LEN;
    crossbar.value = BAR_LEN;
    grid1.value = GRID1_LEN;
    grid2.value = GRID2_LEN;
    ringScale.value = 0;
    containerOpacity.value = 1;

    // Phase 1: draw both legs simultaneously from apex downward
    leftLeg.value = withTiming(0, { duration: LEGS_DURATION, easing: Easing.out(Easing.cubic) });
    rightLeg.value = withTiming(0, { duration: LEGS_DURATION, easing: Easing.out(Easing.cubic) });

    // Phase 2: crossbar draws left to right
    crossbar.value = withDelay(BAR_START, withTiming(0, { duration: BAR_DURATION, easing: Easing.linear }));

    // Phase 3: grid lines draw in
    grid1.value = withDelay(GRID1_START, withTiming(0, { duration: GRID1_DURATION, easing: Easing.linear }));
    grid2.value = withDelay(GRID2_START, withTiming(0, { duration: GRID2_DURATION, easing: Easing.linear }));

    // Phase 4: apex ring pops in with spring
    ringScale.value = withDelay(RING_START, withSpring(1, { damping: 8, stiffness: 320 }));

    // After draw complete + hold, fade to 20%
    containerOpacity.value = withDelay(1050, withTiming(0.2, { duration: 380, easing: Easing.out(Easing.quad) }));
  };

  useEffect(() => {
    runCycle();
    timerRef.current = setInterval(runCycle, CYCLE_MS);
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animated props for each path (strokeDashoffset)
  const leftLegProps = useAnimatedProps(() => ({
    strokeDashoffset: leftLeg.value,
  }));
  const rightLegProps = useAnimatedProps(() => ({
    strokeDashoffset: rightLeg.value,
  }));
  const crossbarProps = useAnimatedProps(() => ({
    strokeDashoffset: crossbar.value,
  }));
  const grid1Props = useAnimatedProps(() => ({
    strokeDashoffset: grid1.value,
  }));
  const grid2Props = useAnimatedProps(() => ({
    strokeDashoffset: grid2.value,
  }));
  const ringProps = useAnimatedProps(() => ({
    r: 5 * ringScale.value,
    opacity: ringScale.value,
  }));

  const containerStyle = useAnimatedProps(() => ({
    opacity: containerOpacity.value,
  }));

  // Scale factor: viewBox 0 0 60 70 → px
  const vbW = 60;
  const vbH = 70;

  return (
    <Animated.View style={[{ width: px, height: px * (vbH / vbW) }, containerStyle]}>
      <Svg width={px} height={px * (vbH / vbW)} viewBox="0 0 60 70">
        {/* Left leg: apex(30,6) → bottom-left(8,62), slight width variation */}
        <AnimatedPath
          d="M 30 6 L 8 62"
          stroke={primaryColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={`${LEG_LEN} ${LEG_LEN}`}
          fill="none"
          animatedProps={leftLegProps}
        />
        {/* Right leg: apex(30,6) → bottom-right(52,62), slightly thinner for hand-drawn feel */}
        <AnimatedPath
          d="M 30 6 L 52 62"
          stroke={primaryColor}
          strokeWidth={2.3}
          strokeLinecap="round"
          strokeDasharray={`${LEG_LEN} ${LEG_LEN}`}
          fill="none"
          animatedProps={rightLegProps}
        />
        {/* Crossbar: left-to-right at y=40 */}
        <AnimatedPath
          d="M 17 40 L 43 40"
          stroke={primaryColor}
          strokeWidth={2.7}
          strokeLinecap="round"
          strokeDasharray={`${BAR_LEN} ${BAR_LEN}`}
          fill="none"
          animatedProps={crossbarProps}
        />
        {/* Floor plan grid line 1 */}
        <AnimatedPath
          d="M 14 48 L 46 48"
          stroke={primaryColor}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeDasharray={`${GRID1_LEN} ${GRID1_LEN}`}
          fill="none"
          animatedProps={grid1Props}
        />
        {/* Floor plan grid line 2 */}
        <AnimatedPath
          d="M 11 54 L 49 54"
          stroke={primaryColor}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeDasharray={`${GRID2_LEN} ${GRID2_LEN}`}
          fill="none"
          animatedProps={grid2Props}
        />
        {/* Apex ring — scale pop */}
        <AnimatedCircle
          cx={30}
          cy={6}
          stroke={primaryColor}
          strokeWidth={2}
          fill="none"
          animatedProps={ringProps}
        />
      </Svg>
    </Animated.View>
  );
}
