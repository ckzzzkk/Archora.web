import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHaptics } from '../../hooks/useHaptics';
import { aiService } from '../../services/aiService';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useProjectStore } from '../../stores/projectStore';
import { useAuthStore } from '../../stores/authStore';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { BASE_COLORS } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import type { BlueprintData } from '../../types/blueprint';
import type { GenerationPayload, GenerationStep } from '../../types/generation';

// Step components
import { StepProgressBar } from './steps/StepProgressBar';
import { Step1BuildingType } from './steps/Step1BuildingType';
import { Step2PlotSize } from './steps/Step2PlotSize';
import { Step3Rooms } from './steps/Step3Rooms';
import { Step4Style } from './steps/Step4Style';
import { Step5Reference } from './steps/Step5Reference';
import { Step6Notes } from './steps/Step6Notes';
import { Step7Review } from './steps/Step7Review';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const LOADING_PHASES = [
  'Understanding your vision...',
  'Designing your space...',
  'Adding rooms and details...',
  'Placing furniture...',
  'Finishing touches...',
];

type ScreenState = 'steps' | 'generating' | 'success' | 'error';

export function GenerationScreen() {
  const navigation = useNavigation<Nav>();
  const { success: successHaptic, error: errorHaptic } = useHaptics();
  const loadBlueprint = useBlueprintStore((s) => s.actions.loadBlueprint);
  const user = useAuthStore((s) => s.user);
  const projectActions = useProjectStore((s) => s.actions);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Step state
  const [step, setStep] = useState<GenerationStep>(1);
  const [screenState, setScreenState] = useState<ScreenState>('steps');
  const [errorMessage, setErrorMessage] = useState('');
  const [generationPhase, setGenerationPhase] = useState(0);
  const [result, setResult] = useState<BlueprintData | null>(null);

  // Payload fields
  const [buildingType, setBuildingType] = useState<GenerationPayload['buildingType'] | null>(null);
  const [plotSize, setPlotSize] = useState('');
  const [plotUnit, setPlotUnit] = useState<'m2' | 'ft2'>('m2');
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [livingAreas, setLivingAreas] = useState(1);
  const [hasGarage, setHasGarage] = useState(false);
  const [hasGarden, setHasGarden] = useState(false);
  const [hasPool, setHasPool] = useState(false);
  const [poolSize, setPoolSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [hasHomeOffice, setHasHomeOffice] = useState(false);
  const [hasUtilityRoom, setHasUtilityRoom] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [transcript, setTranscript] = useState<string | undefined>(undefined);

  const buildPayload = useCallback((): GenerationPayload => ({
    buildingType: buildingType ?? 'house',
    plotSize: Number(plotSize) || 100,
    plotUnit,
    bedrooms,
    bathrooms,
    livingAreas,
    hasGarage,
    hasGarden,
    hasPool,
    poolSize: hasPool ? poolSize : undefined,
    hasHomeOffice,
    hasUtilityRoom,
    style: selectedStyle ?? 'modern',
    referenceImageUrl,
    additionalNotes: notes,
    transcript,
  }), [buildingType, plotSize, plotUnit, bedrooms, bathrooms, livingAreas, hasGarage, hasGarden, hasPool, poolSize, hasHomeOffice, hasUtilityRoom, selectedStyle, referenceImageUrl, notes, transcript]);

  // Loading phase animation
  useEffect(() => {
    if (screenState !== 'generating') return;
    setGenerationPhase(0);
    const interval = setInterval(() => {
      setGenerationPhase((prev) => {
        if (prev >= LOADING_PHASES.length - 1) return prev;
        return prev + 1;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [screenState]);

  const handleGenerate = async () => {
    if (!user) return;

    const payload = buildPayload();
    setScreenState('generating');
    setErrorMessage('');

    try {
      const blueprint = await aiService.generateFloorPlan({
        prompt: payload.additionalNotes,
        buildingType: payload.buildingType,
        style: payload.style,
        plotSize: payload.plotSize,
        plotUnit: payload.plotUnit,
        bedrooms: payload.bedrooms,
        bathrooms: payload.bathrooms,
        livingAreas: payload.livingAreas,
        hasGarage: payload.hasGarage,
        hasGarden: payload.hasGarden,
        hasPool: payload.hasPool,
        poolSize: payload.poolSize,
        hasHomeOffice: payload.hasHomeOffice,
        hasUtilityRoom: payload.hasUtilityRoom,
        referenceImageUrl: payload.referenceImageUrl,
        additionalNotes: payload.additionalNotes,
        transcript: payload.transcript,
      });

      if (!isMounted.current) return;

      // Load into store and capture locally
      setResult(blueprint);
      loadBlueprint(blueprint);
      successHaptic();
      setScreenState('success');

      // Fire-and-forget project creation — don't affect success state
      if (user?.id) {
        projectActions.create(
          user.id,
          `${blueprint.metadata?.style ?? 'Modern'} ${blueprint.metadata?.buildingType ?? 'Building'}`.replace(/^\w/, (c) => c.toUpperCase()),
          payload.buildingType,
        ).catch((err) => {
          console.warn('Project creation failed silently:', err);
        });
      }

      // Fire-and-forget: upsert user preferences via service layer
      if (user?.id) {
        aiService.upsertUserPreferences(user.id, payload).catch(() => {});
      }
    } catch (e) {
      if (!isMounted.current) return;
      errorHaptic();
      const err = e as { code?: string; message?: string };
      if (err.code === 'QUOTA_EXCEEDED') {
        setErrorMessage("You've reached your monthly limit \u2014 upgrade to create more");
      } else if (err.code === 'RATE_LIMITED') {
        setErrorMessage('Slow down \u2014 please wait a moment before trying again');
      } else if (err.code === 'TIMEOUT') {
        setErrorMessage('This is taking a while \u2014 try a simpler description');
      } else if (err.code === 'INVALID_RESPONSE') {
        setErrorMessage('Something went wrong with the design \u2014 please try again');
      } else if (err.code === 'NETWORK') {
        setErrorMessage('Check your connection and try again');
      } else {
        // Unclassified errors treated as network failures
        setErrorMessage('Check your connection and try again');
      }
      setScreenState('error');
    }
  };

  const goBack = useCallback(() => {
    if (step > 1) setStep((s) => (s - 1) as GenerationStep);
  }, [step]);

  const goNext = useCallback(() => {
    if (step < 7) setStep((s) => (s + 1) as GenerationStep);
  }, [step]);

  const resetToStep1 = useCallback(() => {
    setBuildingType(null);
    setPlotSize('');
    setPlotUnit('m2');
    setBedrooms(3);
    setBathrooms(2);
    setLivingAreas(1);
    setHasGarage(false);
    setHasGarden(false);
    setHasPool(false);
    setPoolSize('medium');
    setHasHomeOffice(false);
    setHasUtilityRoom(false);
    setSelectedStyle(null);
    setReferenceImageUrl(undefined);
    setNotes('');
    setTranscript(undefined);
    setStep(1);
    setScreenState('steps');
    setErrorMessage('');
    setResult(null);
  }, []);

  // -- Generating State --
  if (screenState === 'generating') {
    return (
      <View style={{ flex: 1, backgroundColor: BASE_COLORS.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
        <View style={{ gap: 12, alignItems: 'center', marginBottom: 32 }}>
          {LOADING_PHASES.map((phase, i) => (
            <Animated.View
              key={phase}
              entering={i <= generationPhase ? FadeIn.duration(150) : undefined}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 50,
                backgroundColor: i <= generationPhase ? BASE_COLORS.surface : 'transparent',
                opacity: i <= generationPhase ? 1 : 0,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 14,
                  color: i === generationPhase ? BASE_COLORS.textPrimary : BASE_COLORS.textSecondary,
                }}
              >
                {phase}
              </Text>
            </Animated.View>
          ))}
        </View>
        <CompassRoseLoader size="large" />
      </View>
    );
  }

  // -- Success State --
  if (screenState === 'success') {
    return (
      <View style={{ flex: 1, backgroundColor: BASE_COLORS.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
        <Text
          style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 22,
            color: BASE_COLORS.textPrimary,
            marginBottom: 32,
            textAlign: 'center',
          }}
        >
          Your design is ready!
        </Text>

        <Pressable
          onPress={() => navigation.navigate('Workspace', {})}
          style={{
            backgroundColor: BASE_COLORS.textPrimary,
            borderRadius: 50,
            paddingVertical: 16,
            paddingHorizontal: 32,
            marginBottom: 16,
            width: '100%',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: BASE_COLORS.background }}>
            Open in Design Studio
          </Text>
        </Pressable>

        <Pressable
          onPress={resetToStep1}
          style={{
            borderRadius: 50,
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderWidth: 1,
            borderColor: BASE_COLORS.border,
            width: '100%',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 16, color: BASE_COLORS.textPrimary }}>
            Generate Another
          </Text>
        </Pressable>
      </View>
    );
  }

  // -- Error State --
  if (screenState === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: BASE_COLORS.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
        <View
          style={{
            backgroundColor: `${BASE_COLORS.error}20`,
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
            width: '100%',
            borderWidth: 1,
            borderColor: BASE_COLORS.error,
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              color: BASE_COLORS.error,
              textAlign: 'center',
            }}
          >
            {errorMessage}
          </Text>
        </View>

        <Pressable
          onPress={() => {
            setScreenState('steps');
            setStep(7);
          }}
          style={{
            backgroundColor: BASE_COLORS.textPrimary,
            borderRadius: 50,
            paddingVertical: 16,
            paddingHorizontal: 32,
            width: '100%',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: BASE_COLORS.background }}>
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  // -- Steps State --
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BASE_COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: 48 }}>
          <StepProgressBar current={step} total={7} onBack={goBack} />
        </View>

        <View style={{ flex: 1, paddingTop: 16 }}>
          {step === 1 && (
            <Step1BuildingType
              selected={buildingType}
              onSelect={(t) => {
                setBuildingType(t);
                setTimeout(() => setStep(2), 200);
              }}
            />
          )}

          {step === 2 && (
            <Step2PlotSize
              plotSize={plotSize}
              plotUnit={plotUnit}
              onPlotSizeChange={setPlotSize}
              onPlotUnitChange={setPlotUnit}
              onNext={goNext}
            />
          )}

          {step === 3 && (
            <Step3Rooms
              bedrooms={bedrooms}
              bathrooms={bathrooms}
              livingAreas={livingAreas}
              hasGarage={hasGarage}
              hasGarden={hasGarden}
              hasPool={hasPool}
              poolSize={poolSize}
              hasHomeOffice={hasHomeOffice}
              hasUtilityRoom={hasUtilityRoom}
              onBedroomsChange={setBedrooms}
              onBathroomsChange={setBathrooms}
              onLivingAreasChange={setLivingAreas}
              onGarageChange={setHasGarage}
              onGardenChange={setHasGarden}
              onPoolChange={setHasPool}
              onPoolSizeChange={setPoolSize}
              onHomeOfficeChange={setHasHomeOffice}
              onUtilityRoomChange={setHasUtilityRoom}
              onNext={goNext}
            />
          )}

          {step === 4 && (
            <Step4Style
              selected={selectedStyle}
              onSelect={setSelectedStyle}
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
              onTranscriptAppend={(t) => setTranscript((prev) => prev ? `${prev}\n${t}` : t)}
              onNext={goNext}
            />
          )}

          {step === 7 && (
            <Step7Review
              payload={buildPayload()}
              result={result}
              onGenerate={() => { void handleGenerate(); }}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
