import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { randomUUID } from 'expo-crypto';
import Svg, { Rect, Line, Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue as useSV, useAnimatedStyle as useAS, withTiming, withRepeat,
  withDelay as wDelay, withSpring, Easing as EA, interpolate,
} from 'react-native-reanimated';

import { aiService } from '../../services/aiService';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useSession } from '../../auth/useSession';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { SketchLoader } from '../../components/common/SketchLoader';
import { ArchText } from '../../components/common/ArchText';
import { OvalButton } from '../../components/common/OvalButton';
import { GridBackground } from '../../components/common/GridBackground';
import { DS } from '../../theme/designSystem';
import { useTierGate } from '../../hooks/useTierGate';
import { useGenerationPreferences } from '../../hooks/useGenerationPreferences';

import { Step1BuildingType } from './steps/Step1BuildingType';
import { Step2PlotSize } from './steps/Step2PlotSize';
import { Step3Rooms } from './steps/Step3Rooms';
import { Step4Style } from './steps/Step4Style';
import { Step5Reference } from './steps/Step5Reference';
import { Step6Notes } from './steps/Step6Notes';
import { Step7Review } from './steps/Step7Review';
import { StepProgressBar } from './steps/StepProgressBar';

import type { RootStackParamList } from '../../navigation/types';
import type { BlueprintData } from '../../types/blueprint';
import type { GenerationPayload } from '../../types/generation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type BuildingType = GenerationPayload['buildingType'];
type ScreenState = 'idle' | 'generating' | 'success' | 'error';

interface RoomsState {
  bedrooms: number;
  bathrooms: number;
  livingAreas: number;
  hasGarage: boolean;
  hasGarden: boolean;
  hasPool: boolean;
  poolSize: 'small' | 'medium' | 'large';
  hasHomeOffice: boolean;
  hasUtilityRoom: boolean;
}

const LOADING_PHASES = [
  'Understanding your vision...',
  'Sketching your space...',
  'Placing rooms and walls...',
  'Arranging furniture...',
  'Adding the details...',
];

const ERROR_MESSAGES: Record<string, string> = {
  QUOTA_EXCEEDED: 'You have used all your designs this month',
  RATE_LIMITED: 'Slow down — please wait a moment',
  TIMEOUT: 'Taking longer than usual — try a simpler description',
  NETWORK: 'Check your connection and try again',
  AUTH_ERROR: 'Please sign in again',
  AI_NOT_CONFIGURED: 'AI features are coming soon',
};

interface IterationProgress {
  status: string;
  iteration: number;
  message: string;
  scores: Array<{ n: number; score: number; keyChange: string }>;
}

// Animated blueprint being drawn — shown while AI generates
function BlueprintGeneratingOverlay({ phase, iterationProgress }: { phase: number; iterationProgress: IterationProgress }) {
  // Pulse for the cross-hair + dots
  const pulse = useSV(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: EA.inOut(EA.ease) }), -1, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wall draw-in animations (5 walls, staggered)
  const walls = [useSV(0), useSV(0), useSV(0), useSV(0), useSV(0)];
  useEffect(() => {
    walls.forEach((w, i) => {
      w.value = wDelay(i * 320, withTiming(1, { duration: 600, easing: EA.out(EA.cubic) }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const w0 = useAS(() => ({ opacity: walls[0].value }));
  const w1 = useAS(() => ({ opacity: walls[1].value }));
  const w2 = useAS(() => ({ opacity: walls[2].value }));
  const w3 = useAS(() => ({ opacity: walls[3].value }));
  const w4 = useAS(() => ({ opacity: walls[4].value }));
  const wallStyles = [w0, w1, w2, w3, w4];

  // Phase text fade
  const textOp = useSV(1);
  useEffect(() => {
    textOp.value = withTiming(0, { duration: 200 }, () => {
      textOp.value = withTiming(1, { duration: 300 });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  const textStyle = useAS(() => ({ opacity: textOp.value }));

  const pulseStyle = useAS(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.4, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.95, 1.05]) }],
  }));

  // SVG wall segments (floor plan view)
  const segments = [
    // outer walls
    { x1: 24, y1: 24, x2: 120, y2: 24 },   // top
    { x1: 120, y1: 24, x2: 120, y2: 112 },  // right
    { x1: 24, y1: 112, x2: 120, y2: 112 },  // bottom
    { x1: 24, y1: 24, x2: 24, y2: 112 },    // left
    { x1: 24, y1: 68, x2: 80, y2: 68 },     // interior partition
  ];

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <GridBackground />

      {/* Blueprint canvas */}
      <Animated.View style={[pulseStyle, { marginBottom: DS.spacing.xl }]}>
        <Svg width={144} height={136} viewBox="0 0 144 136">
          {/* Grid dots */}
          {[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => (
            <Circle key={`${r}-${c}`} cx={24 + c * 24} cy={24 + r * 24} r={1.5}
              fill={DS.colors.border} opacity={0.4} />
          )))}
          {/* Walls — each fades in */}
          {segments.map((seg, i) => (
            <Animated.View key={i} style={wallStyles[i]}>
              <Svg width={144} height={136} viewBox="0 0 144 136" style={{ position: 'absolute', top: 0, left: 0 }}>
                <Line
                  x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                  stroke={DS.colors.primary} strokeWidth={2.2} strokeLinecap="round"
                />
              </Svg>
            </Animated.View>
          ))}
          {/* Corner dots where walls meet */}
          {[
            { cx: 24, cy: 24 }, { cx: 120, cy: 24 },
            { cx: 120, cy: 112 }, { cx: 24, cy: 112 },
            { cx: 80, cy: 68 },
          ].map((pt, i) => (
            <Circle key={i} cx={pt.cx} cy={pt.cy} r={3}
              fill="none" stroke={DS.colors.accent} strokeWidth={1.5} opacity={0.8} />
          ))}
          {/* Compass marker */}
          <Path d="M72 8 L74 14 L72 12 L70 14 Z" fill={DS.colors.primary} opacity={0.6} />
          <Circle cx={72} cy={16} r={2} fill={DS.colors.primary} opacity={0.4} />
        </Svg>
      </Animated.View>

      {/* ARIA label */}
      <ArchText variant="heading" style={{ fontSize: 13, color: DS.colors.primaryDim, letterSpacing: 4, textTransform: 'uppercase', marginBottom: DS.spacing.sm }}>
        ARIA
      </ArchText>

      {/* Cycling phase text */}
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

      {/* Progress dots */}
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

      {/* Iteration status strip */}
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
        {/* Status line */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm }}>
          <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 10, color: DS.colors.primaryDim, letterSpacing: 2, textTransform: 'uppercase' }}>
            ITERATION {iterationProgress.iteration} / 3
          </ArchText>
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: DS.colors.border }} />
          <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 10, color: iterationProgress.status === 'scoring' ? DS.colors.warning : iterationProgress.status === 'refining' ? DS.colors.error : DS.colors.primary, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {iterationProgress.status}
          </ArchText>
        </View>

        {/* Live message */}
        {iterationProgress.message ? (
          <ArchText variant="body" style={{ fontSize: 12, color: DS.colors.primaryDim, textAlign: 'center', paddingHorizontal: DS.spacing.sm }}>
            {iterationProgress.message}
          </ArchText>
        ) : null}

        {/* Score badges — appear as iterations complete */}
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
                  {iterationProgress.scores[iterationProgress.scores.length - 1].score > iterationProgress.scores[0].score ? '↑' : '→'}
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

export function GenerationScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const blueprintActions = useBlueprintStore((s) => s.actions);
  const { allowed: aiAllowed } = useTierGate('aiGenerationsPerMonth');
  const { preferences, loading: prefsLoading, prefilledFromDb, setPrefilledFromDb, save } = useGenerationPreferences();

  // Step state
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

  // Payload state
  const [buildingType, setBuildingType] = useState<BuildingType | null>(null);
  const [plotSize, setPlotSize] = useState<string>('175');
  const [plotUnit, setPlotUnit] = useState<'m2' | 'ft2'>('m2');
  const [rooms, setRooms] = useState<RoomsState>({
    bedrooms: 3,
    bathrooms: 0,
    livingAreas: 1,
    hasGarage: false,
    hasGarden: false,
    hasPool: false,
    poolSize: 'medium',
    hasHomeOffice: false,
    hasUtilityRoom: false,
  });
  const [style, setStyle] = useState<string | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');

  // Screen state
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [loadingPhase, setLoadingPhase] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [iterationProgress, setIterationProgress] = useState<IterationProgress>({
    status: 'generating', iteration: 1, message: 'Preparing design session...', scores: [],
  });

  // Pre-fill from saved user preferences on mount
  useEffect(() => {
    if (prefsLoading || prefilledFromDb || !preferences) return;
    if (preferences.building_type && preferences.building_type !== buildingType) {
      setBuildingType(preferences.building_type as any);
    }
    if (preferences.plot_size) {
      setPlotSize(String(preferences.plot_size));
    }
    if (preferences.plot_unit) {
      setPlotUnit(preferences.plot_unit as 'm2' | 'ft2');
    }
    if (preferences.bedrooms != null) {
      setRooms(prev => ({ ...prev, bedrooms: preferences.bedrooms! }));
    }
    if (preferences.bathrooms != null) {
      setRooms(prev => ({ ...prev, bathrooms: preferences.bathrooms! }));
    }
    if (preferences.has_pool != null) {
      setRooms(prev => ({ ...prev, hasPool: preferences.has_pool! }));
    }
    if (preferences.has_garden != null) {
      setRooms(prev => ({ ...prev, hasGarden: preferences.has_garden! }));
    }
    if (preferences.has_garage != null) {
      setRooms(prev => ({ ...prev, hasGarage: preferences.has_garage! }));
    }
    if (preferences.has_home_office != null) {
      setRooms(prev => ({ ...prev, hasHomeOffice: preferences.has_home_office! }));
    }
    if (preferences.has_utility_room != null) {
      setRooms(prev => ({ ...prev, hasUtilityRoom: preferences.has_utility_room! }));
    }
    if (preferences.style_id) {
      setStyle(preferences.style_id);
    }
    setPrefilledFromDb(true);
    // Show hint toast if we had a previous preference
    if (preferences.style_id || preferences.building_type) {
      const { useUIStore } = require('../../stores/uiStore');
      const s = useUIStore.getState();
      s.actions.showToast(`Last time: ${preferences.style_id ?? 'style'} ${preferences.building_type ?? 'building'}`, 'info');
    }
  }, [preferences, prefsLoading, prefilledFromDb]);

  // Cycle loading phase text during generation (fallback when no Realtime update)
  useEffect(() => {
    if (screenState !== 'generating') return;
    const id = setInterval(() => setLoadingPhase((p) => (p + 1) % LOADING_PHASES.length), 3500);
    return () => clearInterval(id);
  }, [screenState]);

  const goBack = useCallback(() => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as typeof step);
    }
  }, [step]);

  const goNext = useCallback(() => {
    if (step < 7) {
      setStep((prev) => (prev + 1) as typeof step);
    }
  }, [step]);

  const buildPayload = (): GenerationPayload => {
    if (!buildingType || !style) throw new Error('buildPayload called before selection complete');
    return {
      buildingType,
      plotSize: parseFloat(plotSize) || 175,
      plotUnit: plotUnit as 'm2' | 'ft2',
      ...rooms,
      style,
      referenceImageUrl: referenceImageUrl ?? undefined,
      additionalNotes: notes,
      transcript,
    };
  };

  // Only build a complete payload on step 7 (for Step7Review preview)
  const reviewPayload = step === 7 ? buildPayload() : null;

  const handleGenerate = useCallback(async () => {
    if (!buildingType || !style) return;
    if (!aiAllowed) {
      navigation.navigate('Subscription', { feature: 'aiGenerationsPerMonth' });
      return;
    }

    if (!user?.id) return;

    setScreenState('generating');
    setLoadingPhase(0);
    setIterationProgress({ status: 'generating', iteration: 1, message: 'Preparing design session...', scores: [] });

    try {
      // Create session for Realtime progress tracking
      const sessionId = await aiService.createGenerationSession(user.id);

      const payload = buildPayload();
      const blueprint = await aiService.generateOptimal(payload, sessionId, (update) => {
        setIterationProgress(update);
        // Map status to phase index
        const phaseMap: Record<string, number> = { generating: 1, scoring: 2, refining: 3, complete: 4 };
        setLoadingPhase(phaseMap[update.status] ?? 1);
      });

      await blueprintActions.loadBlueprint(blueprint);
      await save(buildPayload());
      navigation.navigate('Workspace', {
        projectId: (blueprint as BlueprintData & { id?: string }).id ?? randomUUID(),
      });
      setScreenState('success');
    } catch (err: unknown) {
      setScreenState('error');
      const code = err instanceof Error && 'code' in err ? (err as Error & { code: string }).code : '';
      setErrorMessage(ERROR_MESSAGES[code] ?? (err instanceof Error ? err.message : 'Something went wrong. Please try again.'));
    }
  }, [buildingType, style, blueprintActions, navigation, plotSize, plotUnit, rooms, notes, transcript, aiAllowed]);

  // ── Generating overlay ────────────────────────────────────────────────────
  if (screenState === 'generating') {
    return <BlueprintGeneratingOverlay phase={loadingPhase} iterationProgress={iterationProgress} />;
  }

  // ── Error overlay ─────────────────────────────────────────────────────────
  if (screenState === 'error') {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: DS.colors.background, padding: 32 }}>
        <GridBackground />
        <ArchText
          variant="body"
          style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 22,
            color: DS.colors.error,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Oops!
        </ArchText>
        <ArchText
          variant="body"
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 15,
            color: DS.colors.primaryDim,
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          {errorMessage}
        </ArchText>
        <OvalButton
          label="Try Again"
          onPress={() => {
            setScreenState('idle');
            setStep(7);
          }}
        />
      </View>
    );
  }

  // ── Main wizard ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: DS.colors.background }}>
      <GridBackground />

      <StepProgressBar
        current={step}
        total={7}
        onBack={step > 1 ? goBack : undefined}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: Math.max(40, insets.bottom + 16), flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <Step1BuildingType
            selected={buildingType}
            onSelect={(type) => {
              setBuildingType(type);
              goNext();
            }}
          />
        )}

        {step === 2 && (
          <Step2PlotSize
            plotSize={plotSize}
            plotUnit={plotUnit}
            onPlotSizeChange={setPlotSize}
            onPlotUnitChange={(u) => setPlotUnit(u)}
            onNext={goNext}
          />
        )}

        {step === 3 && (
          <>
            <Step3Rooms
              bedrooms={rooms.bedrooms}
              bathrooms={rooms.bathrooms}
              livingAreas={rooms.livingAreas}
              hasGarage={rooms.hasGarage}
              hasGarden={rooms.hasGarden}
              hasPool={rooms.hasPool}
              poolSize={rooms.poolSize}
              hasHomeOffice={rooms.hasHomeOffice}
              hasUtilityRoom={rooms.hasUtilityRoom}
              onBedroomsChange={(v) => setRooms((r) => ({ ...r, bedrooms: v }))}
              onBathroomsChange={(v) => setRooms((r) => ({ ...r, bathrooms: v }))}
              onLivingAreasChange={(v) => setRooms((r) => ({ ...r, livingAreas: v }))}
              onGarageChange={(v) => setRooms((r) => ({ ...r, hasGarage: v }))}
              onGardenChange={(v) => setRooms((r) => ({ ...r, hasGarden: v }))}
              onPoolChange={(v) => setRooms((r) => ({ ...r, hasPool: v }))}
              onPoolSizeChange={(v) => setRooms((r) => ({ ...r, poolSize: v }))}
              onHomeOfficeChange={(v) => setRooms((r) => ({ ...r, hasHomeOffice: v }))}
              onUtilityRoomChange={(v) => setRooms((r) => ({ ...r, hasUtilityRoom: v }))}
              onNext={goNext}
            />

            {/* ARIA smart suggestions — shown when bedrooms set but no bathroom yet */}
            {rooms.bathrooms === 0 && rooms.bedrooms >= 1 && (
              <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
                <ArchText
                  variant="body"
                  style={{ fontSize: 12, color: DS.colors.primaryDim, marginBottom: 8 }}
                >
                  ARIA suggests
                </ArchText>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    {
                      label: '+ En-suite bathroom',
                      action: () => setRooms((r) => ({ ...r, bathrooms: 1 })),
                    },
                    {
                      label: '+ Add garage',
                      action: () => setRooms((r) => ({ ...r, hasGarage: true })),
                    },
                    {
                      label: '+ Garden area',
                      action: () => setRooms((r) => ({ ...r, hasGarden: true })),
                    },
                  ].map((chip) => (
                    <Pressable
                      key={chip.label}
                      onPress={chip.action}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 999,
                        backgroundColor: 'rgba(240, 237, 232, 0.03)',
                        borderWidth: 1,
                        borderColor: 'rgba(240, 237, 232, 0.10)',
                      }}
                    >
                      <ArchText
                        variant="body"
                        style={{ fontSize: 13, color: DS.colors.primary }}
                      >
                        {chip.label}
                      </ArchText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {step === 4 && (
          <Step4Style
            selected={style}
            onSelect={setStyle}
            onNext={goNext}
          />
        )}

        {step === 5 && (
          <Step5Reference
            referenceImageUrl={referenceImageUrl}
            onImageUploaded={setReferenceImageUrl}
            onSkip={goNext}
            onNext={goNext}
          />
        )}

        {step === 6 && (
          <Step6Notes
            notes={notes}
            transcript={transcript}
            onNotesChange={setNotes}
            onTranscriptAppend={(v) => setTranscript((t) => t ? `${t} ${v}` : v)}
            onNext={goNext}
          />
        )}

        {step === 7 && reviewPayload && (
          <Step7Review
            payload={reviewPayload}
            onGenerate={handleGenerate}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default GenerationScreen;
