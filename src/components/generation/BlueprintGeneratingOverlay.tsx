import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Line, Circle, Path, G } from 'react-native-svg';
import Animated, {
  useSharedValue as useSV, useAnimatedStyle as useAS, withTiming, withRepeat,
  withDelay as wDelay, Easing as EA, interpolate,
} from 'react-native-reanimated';
import { GridBackground } from '../../components/common/GridBackground';
import { ArchText } from '../../components/common/ArchText';
import { DS } from '../../theme/designSystem';

const LOADING_PHASES = [
  'Understanding your vision...',
  'Sketching your space...',
  'Placing rooms and walls...',
  'Arranging furniture...',
  'Adding the details...',
];

interface IterationProgress {
  status: string;
  iteration: number;
  message: string;
  scores: Array<{ n: number; score: number; keyChange: string }>;
}

const gridPositions: Array<{ r: number; c: number }> = [];
for (let r = 0; r < 4; r++) {
  for (let c = 0; c < 5; c++) {
    gridPositions.push({ r, c });
  }
}

const cornerPoints = [
  { cx: 24, cy: 24 }, { cx: 120, cy: 24 },
  { cx: 120, cy: 112 }, { cx: 24, cy: 112 },
  { cx: 80, cy: 68 },
];

const segments = [
  { x1: 24, y1: 24, x2: 120, y2: 24 },
  { x1: 120, y1: 24, x2: 120, y2: 112 },
  { x1: 24, y1: 112, x2: 120, y2: 112 },
  { x1: 24, y1: 24, x2: 24, y2: 112 },
  { x1: 24, y1: 68, x2: 80, y2: 68 },
];

export function BlueprintGeneratingOverlay({
  phase,
  iterationProgress,
}: {
  phase: number;
  iterationProgress: IterationProgress;
}) {
  const pulse = useSV(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: EA.inOut(EA.ease) }), -1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pulseStyle = useAS(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.4, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.95, 1.05]) }],
  }));

  const textOp = useSV(1);
  useEffect(() => {
    textOp.value = withTiming(0, { duration: 200 }, () => {
      textOp.value = withTiming(1, { duration: 300 });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  const textStyle = useAS(() => ({ opacity: textOp.value }));

  return (
    <View
      style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center' }}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`ARIA is generating your design. ${LOADING_PHASES[phase]}`}
      accessibilityRole="progressbar"
    >
      <GridBackground />

      <Animated.View style={[pulseStyle, { marginBottom: DS.spacing.xl }]}>
        <Svg width={144} height={136} viewBox="0 0 144 136">
          <G>
            {gridPositions.map(({ r, c }) => (
              <Circle
                key={`${r}-${c}`}
                cx={24 + c * 24}
                cy={24 + r * 24}
                r={1.5}
                fill={DS.colors.border}
                opacity={0.4}
              />
            ))}
            {segments.map((seg, i) => (
              <Line
                key={i}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke={DS.colors.primary}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            ))}
            {cornerPoints.map((pt, i) => (
              <Circle
                key={i}
                cx={pt.cx}
                cy={pt.cy}
                r={3}
                fill="none"
                stroke={DS.colors.accent}
                strokeWidth={1.5}
                opacity={0.8}
              />
            ))}
            <Path d="M72 8 L74 14 L72 12 L70 14 Z" fill={DS.colors.primary} opacity={0.6} />
            <Circle cx={72} cy={16} r={2} fill={DS.colors.primary} opacity={0.4} />
          </G>
        </Svg>
      </Animated.View>

      <ArchText variant="heading" style={{ fontSize: 13, color: DS.colors.primaryDim, letterSpacing: 4, textTransform: 'uppercase', marginBottom: DS.spacing.sm }}>
        ARIA
      </ArchText>

      <Animated.View style={[textStyle, { alignItems: 'center' }]}>
        <ArchText variant="body" style={{
          fontFamily: 'ArchitectsDaughter_400Regular',
          fontSize: 18,
          color: DS.colors.primary,
          textAlign: 'center',
          paddingHorizontal: 40,
          marginBottom: DS.spacing.md,
        }}>
          {LOADING_PHASES[phase]}
        </ArchText>
      </Animated.View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: DS.spacing.xs }}>
        {LOADING_PHASES.map((_, i) => (
          <Animated.View
            key={i}
            style={{
              width: i === phase ? 20 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === phase ? DS.colors.primary : DS.colors.border,
            }}
          />
        ))}
      </View>

      <View style={{
        marginTop: DS.spacing.xl,
        borderTopWidth: 1,
        borderTopColor: DS.colors.border,
        paddingTop: DS.spacing.md,
        width: '100%',
        paddingHorizontal: DS.spacing.xl,
        alignItems: 'center',
        gap: DS.spacing.xs,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm }}>
          <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 10, color: DS.colors.primaryDim, letterSpacing: 2, textTransform: 'uppercase' }}>
            ITERATION {iterationProgress.iteration} / 3
          </ArchText>
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: DS.colors.border }} />
          <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 10, color: iterationProgress.status === 'scoring' ? DS.colors.warning : iterationProgress.status === 'refining' ? DS.colors.error : DS.colors.primary, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {iterationProgress.status}
          </ArchText>
        </View>

        {iterationProgress.message ? (
          <ArchText variant="body" style={{ fontSize: 12, color: DS.colors.primaryDim, textAlign: 'center', paddingHorizontal: DS.spacing.sm }}>
            {iterationProgress.message}
          </ArchText>
        ) : null}

        {iterationProgress.scores.length > 0 && (
          <View style={{ flexDirection: 'row', gap: DS.spacing.sm, marginTop: DS.spacing.xs }}>
            {iterationProgress.scores.map((s) => {
              const scoreColor = s.score >= 88 ? DS.colors.primary : s.score >= 70 ? DS.colors.warning : DS.colors.error;
              return (
                <View key={s.n} style={{
                  alignItems: 'center',
                  paddingHorizontal: DS.spacing.sm,
                  paddingVertical: DS.spacing.xs,
                  borderRadius: 10,
                  backgroundColor: 'rgba(240, 237, 232, 0.03)',
                  borderWidth: 1,
                  borderColor: `${scoreColor}30`,
                  minWidth: 52,
                }}>
                  <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 16, color: scoreColor }}>
                    {s.score}
                  </ArchText>
                  <ArchText variant="body" style={{ fontSize: 9, color: DS.colors.primaryDim, fontFamily: DS.font.mono }}>
                    #{s.n}
                  </ArchText>
                </View>
              );
            })}
            {iterationProgress.scores.length > 1 && (
              <View style={{ justifyContent: 'center', paddingHorizontal: 4 }}>
                <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 10, color: DS.colors.warning }}>
                  {iterationProgress.scores[iterationProgress.scores.length - 1].score > iterationProgress.scores[0].score ? 'UP' : 'RT'}
                  {Math.abs(iterationProgress.scores[iterationProgress.scores.length - 1].score - iterationProgress.scores[0].score)}
                </ArchText>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}