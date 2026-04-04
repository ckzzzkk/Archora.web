import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { randomUUID } from 'expo-crypto';

import { aiService } from '../../services/aiService';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { SketchLoader } from '../../components/common/SketchLoader';
import { ArchText } from '../../components/common/ArchText';
import { OvalButton } from '../../components/common/OvalButton';
import { GridBackground } from '../../components/common/GridBackground';
import { DS } from '../../theme/designSystem';
import { SUNRISE } from '../../theme/sunrise';
import { useTierGate } from '../../hooks/useTierGate';

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

export function GenerationScreen() {
  const navigation = useNavigation<Nav>();
  const blueprintActions = useBlueprintStore((s) => s.actions);
  const { allowed: aiAllowed } = useTierGate('aiGenerationsPerMonth');

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

  // Cycle loading phase text during generation
  useEffect(() => {
    if (screenState !== 'generating') return;
    const id = setInterval(() => setLoadingPhase((p) => (p + 1) % LOADING_PHASES.length), 2500);
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

    // Tier gate: check AI generation quota before proceeding
    if (!aiAllowed) {
      navigation.navigate('Subscription', { feature: 'aiGenerationsPerMonth' });
      return;
    }

    setScreenState('generating');
    setLoadingPhase(0);
    try {
      const payload = buildPayload();
      const blueprint = await aiService.generateFloorPlan(payload);
      // Blueprint state is synchronous (Zustand), navigate immediately after loading
      blueprintActions.loadBlueprint(blueprint);
      navigation.navigate('Workspace', {
        projectId: (blueprint as BlueprintData & { id?: string }).id ?? randomUUID(),
      });
      // success state is moot since we're navigating away, but keep for correctness:
      setScreenState('success');
    } catch (err: unknown) {
      setScreenState('error');
      const code = err instanceof Error && 'code' in err ? (err as Error & { code: string }).code : '';
      setErrorMessage(ERROR_MESSAGES[code] ?? (err instanceof Error ? err.message : 'Something went wrong. Please try again.'));
    }
  }, [buildingType, style, blueprintActions, navigation, plotSize, plotUnit, rooms, notes, transcript, aiAllowed]);

  // ── Generating overlay ────────────────────────────────────────────────────
  if (screenState === 'generating') {
    return (
      <View className="flex-1" style={{ backgroundColor: DS.colors.background }}>
        <GridBackground />
        <View className="flex-1 items-center justify-center" style={{ gap: 24 }}>
          <SketchLoader />
          <ArchText
            variant="body"
            style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 18,
              color: DS.colors.primary,
              textAlign: 'center',
              paddingHorizontal: 32,
            }}
          >
            {LOADING_PHASES[loadingPhase]}
          </ArchText>
        </View>
      </View>
    );
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
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
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
                        backgroundColor: SUNRISE.glass.subtleBg,
                        borderWidth: 1,
                        borderColor: SUNRISE.goldBorderDim,
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
