import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue as useSV, useAnimatedStyle as useAS, withTiming, withRepeat,
  Easing as EA, interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArchText } from '../../components/common/ArchText';
import { AmbientAura } from '../../components/common/AmbientAura';
import { ConstructingBuilding3D } from '../../components/3d/ConstructingBuilding3D';
import { DS } from '../../theme/designSystem';

const LOADING_PHASES = [
  'Understanding your vision',
  'Laying the foundation',
  'Raising walls & rooms',
  'Fitting the roof',
  'Furnishing & finishing',
];

interface IterationProgress {
  status: string;
  iteration: number;
  message: string;
  scores: { n: number; score: number; keyChange: string }[];
}

/** Indeterminate shimmer bar — proves work is happening between phase changes. */
function ShimmerBar() {
  const sweep = useSV(0);
  useEffect(() => {
    sweep.value = withRepeat(withTiming(1, { duration: 1300, easing: EA.inOut(EA.cubic) }), -1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const TRACK_W = 200;
  const BAR_W = 60;
  const barStyle = useAS(() => ({
    transform: [{ translateX: interpolate(sweep.value, [0, 1], [-BAR_W, TRACK_W]) }],
  }));
  return (
    <View style={{ width: TRACK_W, height: 3, borderRadius: 999, backgroundColor: DS.colors.border, overflow: 'hidden', marginTop: DS.spacing.md }}>
      <Animated.View style={[barStyle, { width: BAR_W, height: '100%', borderRadius: 999, backgroundColor: DS.colors.accent }]} />
    </View>
  );
}

export function BlueprintGeneratingOverlay({
  phase,
  iterationProgress,
  batchStatus,
}: {
  phase: number;
  iterationProgress: IterationProgress;
  batchStatus?: { ready: number; total: number } | null;
}) {
  const insets = useSafeAreaInsets();

  // soft cross-fade the phase label on change
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
      style={{ flex: 1, backgroundColor: DS.colors.background }}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`ARIA is generating your design. ${LOADING_PHASES[phase]}`}
      accessibilityRole="progressbar"
    >
      <AmbientAura intensity={0.85} />

      {/* Eyebrow */}
      <View style={{ paddingTop: insets.top + 16, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: DS.colors.accent }} />
          <ArchText variant="label" style={{ fontSize: 10, color: DS.colors.primaryDim, letterSpacing: 3 }}>
            ARIA IS DESIGNING
          </ArchText>
        </View>
      </View>

      {/* The building constructs itself */}
      <View style={{ flex: 1 }}>
        <ConstructingBuilding3D phase={phase} />
      </View>

      {/* Progress panel */}
      <View style={{ paddingHorizontal: DS.spacing.xl, paddingBottom: Math.max(DS.spacing.xxl, insets.bottom + DS.spacing.lg), alignItems: 'center' }}>
        {batchStatus && (
          <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 11, color: DS.colors.accent, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: DS.spacing.sm }}>
            {batchStatus.ready} / {batchStatus.total} variations ready
          </ArchText>
        )}

        <Animated.View style={[textStyle, { alignItems: 'center' }]}>
          <ArchText variant="heading" style={{ fontSize: 20, color: DS.colors.primary, textAlign: 'center', letterSpacing: -0.3 }}>
            {LOADING_PHASES[phase]}
          </ArchText>
        </Animated.View>

        {/* Phase progress dots */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: DS.spacing.md }}>
          {LOADING_PHASES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === phase ? 22 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i <= phase ? DS.colors.primary : DS.colors.border,
              }}
            />
          ))}
        </View>

        <ShimmerBar />

        {/* Iteration / scoring detail */}
        <View style={{
          marginTop: DS.spacing.xl,
          borderTopWidth: 1,
          borderTopColor: DS.colors.border,
          paddingTop: DS.spacing.md,
          width: '100%',
          alignItems: 'center',
          gap: DS.spacing.xs,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm }}>
            <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 10, color: DS.colors.primaryDim, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Iteration {iterationProgress.iteration} / 3
            </ArchText>
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: DS.colors.border }} />
            <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 10, color: iterationProgress.status === 'scoring' ? DS.colors.warning : iterationProgress.status === 'refining' ? DS.colors.error : DS.colors.primary, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {iterationProgress.status}
            </ArchText>
          </View>

          {iterationProgress.message ? (
            <ArchText variant="caption" style={{ fontSize: 12, color: DS.colors.primaryDim, textAlign: 'center', paddingHorizontal: DS.spacing.sm }}>
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
                    borderRadius: 12,
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
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
