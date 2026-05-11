import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ScrollView, Pressable, SafeAreaView } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { randomUUID } from 'expo-crypto';
import Svg, { Rect, Line, Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue as useSV, useAnimatedStyle as useAS, withTiming, withRepeat,
  withDelay as wDelay, withSpring, Easing as EA, interpolate,
  runOnJS,
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
import { useUIStore } from '../../stores/uiStore';
import { useGenerationPreferences } from '../../hooks/useGenerationPreferences';

import { Step0Architect } from './steps/Step0Architect';
import { Step1BuildingType } from './steps/Step1BuildingType';
import { Step2PlotSize } from './steps/Step2PlotSize';
import { Step3Rooms } from './steps/Step3Rooms';
import { Step3RoomStudio } from './steps/Step3RoomStudio';
import { Step4Style } from './steps/Step4Style';
import { Step5Reference } from './steps/Step5Reference';
import { Step6Notes } from './steps/Step6Notes';
import { Step7Review } from './steps/Step7Review';
import { StepProgressBar } from './steps/StepProgressBar';
import { BlueprintGeneratingOverlay } from '../../components/generation/BlueprintGeneratingOverlay';
import { ConsultationChat } from '../../components/consultation/ConsultationChat';

import type { RootStackParamList } from '../../navigation/types';
import type { BlueprintData } from '../../types/blueprint';
import type { GenerationPayload, ConsultationSummary } from '../../types/generation';

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


export function GenerationScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const blueprintActions = useBlueprintStore((s) => s.actions);
  const { allowed: aiAllowed } = useTierGate('aiGenerationsPerMonth');
  const { preferences, loading: prefsLoading, prefilledFromDb, setPrefilledFromDb, save } = useGenerationPreferences();

  // Step state
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>(0);

  // Architect selection state
  const [selectedArchitectId, setSelectedArchitectId] = useState<string | null>(null);
  const tier = user?.subscriptionTier ?? 'starter';

  // Payload state
  const [buildingType, setBuildingType] = useState<BuildingType | null>(null);
  const [plotSize, setPlotSize] = useState<string>('175');
  const [plotUnit, setPlotUnit] = useState<'m2' | 'ft2'>('m2');
  const [explicitPlotWidth, setExplicitPlotWidth] = useState<string>('');
  const [explicitPlotDepth, setExplicitPlotDepth] = useState<string>('');
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
  const [consultationSummary, setConsultationSummary] = useState<ConsultationSummary | null>(null);
  const [floorCount, setFloorCount] = useState(1);

  // Room Studio state (Pro/Architect)
  const [showRoomStudio, setShowRoomStudio] = useState(false);
  const [roomSizes, setRoomSizes] = useState<Record<string, { width: number; depth: number }>>({});
  const [layoutStyle, setLayoutStyle] = useState<'traditional' | 'open_plan' | 'mixed' | null>(null);
  const [archetypeId, setArchetypeId] = useState<string | null>(null);

  // Screen state
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [loadingPhase, setLoadingPhase] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [iterationProgress, setIterationProgress] = useState<IterationProgress>({
    status: 'generating', iteration: 1, message: 'Preparing design session...', scores: [],
  });

  // ARIA suggestion chip press animation
  const chipScale = useSV(1);
  const chipAnimatedStyle = useAS(() => ({ transform: [{ scale: chipScale.value }] }));
  const handleChipPressIn = () => { chipScale.value = withSpring(0.97, { damping: 14, stiffness: 300 }); };
  const handleChipPressOut = () => { chipScale.value = withSpring(1, { damping: 14, stiffness: 300 }); };

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
      useUIStore.getState().actions.showToast(`Last time: ${preferences.style_id ?? 'style'} ${preferences.building_type ?? 'building'}`, 'info');
    }
  }, [preferences, prefsLoading, prefilledFromDb]);

  // Cycle loading phase text during generation (fallback when no Realtime update)
  useEffect(() => {
    if (screenState !== 'generating') return;
    const id = setInterval(() => setLoadingPhase((p) => (p + 1) % LOADING_PHASES.length), 3500);
    return () => clearInterval(id);
  }, [screenState]);

  const goBack = useCallback(() => {
    if (step > 0) {
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
    const hasExplicit = explicitPlotWidth && explicitPlotDepth;
    return {
      buildingType,
      plotSize: hasExplicit
        ? parseFloat(explicitPlotWidth) * parseFloat(explicitPlotDepth)
        : parseFloat(plotSize) || 175,
      plotUnit: hasExplicit ? 'm2' : plotUnit as 'm2' | 'ft2',
      ...rooms,
      floors: floorCount,
      style,
      referenceImageUrl: referenceImageUrl ?? undefined,
      additionalNotes: notes,
      transcript,
      architectId: selectedArchitectId ?? undefined,
      explicitPlotWidth: hasExplicit ? parseFloat(explicitPlotWidth) : undefined,
      explicitPlotDepth: hasExplicit ? parseFloat(explicitPlotDepth) : undefined,
      roomSizes: Object.keys(roomSizes).length > 0 ? roomSizes : undefined,
      layoutStyle: layoutStyle ?? undefined,
      archetypeId: archetypeId ?? undefined,
    };
  };

  // Only build a complete payload on step 7 (for Step7Review preview)
  const reviewPayload = step === 7 ? buildPayload() : null;

  const handleGenerate = useCallback(async () => {
    if (!buildingType || !style) return;

    /// Dev flag: use deterministic procedural layout engine instead of AI
    if (__DEV__ && process.env.EXPO_PUBLIC_USE_PROCEDURAL_LAYOUT === 'true') {
      const { generateFloorPlan } = await import('../../utils/layoutEngine');
      const payload = buildPayload();
      const blueprint = generateFloorPlan(payload);
      await blueprintActions.loadBlueprint(blueprint);
      await save(payload);
      navigation.navigate('Workspace', { projectId: blueprint.id });
      return;
    }

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
        setLoadingPhase(phaseMap[update.status as string] ?? 1);
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

  // ── Swipe-to-go-back gesture ─────────────────────────────────────────────
  const swipeTranslateX = useSV(0);
  const handleSwipeBack = useCallback(() => {
    if (step > 0) {
      setStep((prev) => (prev - 1) as typeof step);
    }
  }, [step]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      if (event.translationX < 0) {
        swipeTranslateX.value = event.translationX * 0.25;
      }
    })
    .onEnd((event) => {
      if (event.translationX < -80) {
        swipeTranslateX.value = withSpring(0);
        runOnJS(handleSwipeBack)();
      } else {
        swipeTranslateX.value = withSpring(0, { damping: 16, stiffness: 200 });
      }
    });

  const wizardStyle = useAS(() => ({ transform: [{ translateX: swipeTranslateX.value }] }));

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
    <GestureDetector gesture={panGesture}>
    <Animated.View style={[wizardStyle, { flex: 1 }]}>
    <SafeAreaView className="flex-1" style={{ backgroundColor: DS.colors.background }}>
      <GridBackground />

      <StepProgressBar
        current={step}
        total={8}
        onBack={step > 0 ? goBack : undefined}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: Math.max(40, insets.bottom + 16), flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <Step0Architect
            selectedId={selectedArchitectId}
            onSelect={setSelectedArchitectId}
            onContinue={goNext}
            onUseDefault={() => { setSelectedArchitectId(null); goNext(); }}
            userTier={user?.subscriptionTier ?? 'starter'}
          />
        )}

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
            explicitPlotWidth={explicitPlotWidth}
            explicitPlotDepth={explicitPlotDepth}
            onPlotSizeChange={setPlotSize}
            onPlotUnitChange={(u) => setPlotUnit(u)}
            onExplicitWidthChange={setExplicitPlotWidth}
            onExplicitDepthChange={setExplicitPlotDepth}
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
              floors={floorCount}
              tier={tier}
              onBedroomsChange={(v) => setRooms((r) => ({ ...r, bedrooms: v }))}
              onBathroomsChange={(v) => setRooms((r) => ({ ...r, bathrooms: v }))}
              onLivingAreasChange={(v) => setRooms((r) => ({ ...r, livingAreas: v }))}
              onGarageChange={(v) => setRooms((r) => ({ ...r, hasGarage: v }))}
              onGardenChange={(v) => setRooms((r) => ({ ...r, hasGarden: v }))}
              onPoolChange={(v) => setRooms((r) => ({ ...r, hasPool: v }))}
              onPoolSizeChange={(v) => setRooms((r) => ({ ...r, poolSize: v }))}
              onHomeOfficeChange={(v) => setRooms((r) => ({ ...r, hasHomeOffice: v }))}
              onUtilityRoomChange={(v) => setRooms((r) => ({ ...r, hasUtilityRoom: v }))}
              onFloorsChange={setFloorCount}
              onOpenRoomStudio={() => setShowRoomStudio(true)}
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
                      onPressIn={handleChipPressIn}
                      onPressOut={handleChipPressOut}
                      onPress={chip.action}
                      style={[{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 999,
                        backgroundColor: 'rgba(240, 237, 232, 0.03)',
                        borderWidth: 1,
                        borderColor: 'rgba(240, 237, 232, 0.10)',
                      }, chipAnimatedStyle as StyleProp<ViewStyle>]}
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

            {/* Customise rooms — Pro/Architect tier */}
            {(tier === 'pro' || tier === 'architect') && (
              <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
                <OvalButton
                  label="Customise rooms ✦"
                  onPress={() => setShowRoomStudio(true)}
                  variant="ghost"
                />
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

        {(step === 5 || step === 6) && (
          <ConsultationChat
            tier={user?.subscriptionTier ?? 'starter'}
            architectId={selectedArchitectId}
            structuredPayload={{
              buildingType: buildingType ?? undefined,
              plotSize: parseFloat(plotSize) || 0,
              plotUnit: plotUnit,
              ...rooms,
              style: style ?? undefined,
              referenceImageUrl: referenceImageUrl,
              additionalNotes: notes,
              transcript: transcript,
              architectId: selectedArchitectId ?? undefined,
            }}
            onComplete={(summary, fullPayload) => {
              setConsultationSummary(summary);
              if (summary.householdDescription) {
                setNotes(prev => prev ? `${prev}\n\nHousehold: ${summary.householdDescription}` : `Household: ${summary.householdDescription}`);
              }
              setStep(7);
            }}
            onBack={goBack}
          />
        )}

        {step === 7 && reviewPayload && (
          <Step7Review
            payload={reviewPayload}
            consultationSummary={consultationSummary}
            onGenerate={handleGenerate}
          />
        )}
      </ScrollView>

      {/* Room Studio modal — Pro/Architect */}
      <Step3RoomStudio
        visible={showRoomStudio}
        roomSizes={roomSizes}
        layoutStyle={layoutStyle}
        archetypeId={archetypeId}
        onClose={() => setShowRoomStudio(false)}
        onRoomSizesChange={setRoomSizes}
        onLayoutStyleChange={setLayoutStyle}
        onArchetypeChange={setArchetypeId}
      />
    </SafeAreaView>
    </Animated.View>
    </GestureDetector>
  );
}

export default GenerationScreen;
