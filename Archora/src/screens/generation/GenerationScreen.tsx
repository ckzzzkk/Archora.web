/**
 * GenerationScreen — ASORIA AI design interview.
 * Three states: idle (input) → generating → success
 *
 * Design intent: architect's black drafting desk.
 * Every element references the physical act of sketching on paper.
 * The grid behind everything is graph paper. Ovals everywhere.
 * Animations are tactile — weight, spring, deliberate pacing.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
  runOnJS,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { useHaptics } from '../../hooks/useHaptics';
import { aiService } from '../../services/aiService';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { GridBackground }     from '../../components/common/GridBackground';
import { OvalButton }         from '../../components/common/OvalButton';
import { OvalChip }           from '../../components/common/OvalChip';
import { SketchCard }         from '../../components/common/SketchCard';
import { ArchText }           from '../../components/common/ArchText';
import { WaveformVisualizer } from '../../components/common/WaveformVisualizer';
import { SketchLoader }       from '../../components/common/SketchLoader';
import { FloatingCard }       from '../../components/common/FloatingCard';
import { DS }                 from '../../theme/designSystem';
import { supabase }           from '../../utils/supabaseClient';
import { useAuthStore }       from '../../stores/authStore';
import type { RootStackParamList } from '../../navigation/types';
import type { BlueprintData }      from '../../types/blueprint';
import type { GenerationPayload }  from '../../types/generation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ScreenState = 'idle' | 'generating' | 'success' | 'error';
type ConversationStep = 0 | 1 | 2 | 3 | 4;

interface ChatMessage {
  id: string;
  role: 'aria' | 'user';
  text: string;
  component?: React.ReactNode;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Data ────────────────────────────────────────────────────────────────────

const BUILDING_TYPES: Array<{ id: GenerationPayload['buildingType']; emoji: string; label: string }> = [
  { id: 'house',      emoji: '🏠', label: 'House'  },
  { id: 'apartment',  emoji: '🏢', label: 'Flat'   },
  { id: 'office',     emoji: '🏗️', label: 'Office' },
  { id: 'studio',     emoji: '🎨', label: 'Studio' },
  { id: 'villa',      emoji: '🏡', label: 'Villa'  },
  { id: 'commercial', emoji: '🏪', label: 'Shop'   },
];

const DESIGN_STYLES = [
  { id: 'modern',       label: 'Modern'     },
  { id: 'minimalist',   label: 'Minimal'    },
  { id: 'industrial',   label: 'Industrial' },
  { id: 'scandinavian', label: 'Scandi'     },
  { id: 'tropical',     label: 'Tropical'   },
  { id: 'classic',      label: 'Classic'    },
];

const ARIA_QUESTIONS: Record<number, string> = {
  0: "Hi! I'm ARIA, your AI architect. What would you like to design today?",
  1: "Great choice! And what style are you going for?",
  2: "Perfect. Add any details below and when you're ready, hit generate.",
};

const PROMPT_CHIPS = [
  'Modern family home',
  'Open plan apartment',
  'Studio with mezzanine',
  'Villa with pool',
  'Home office',
  'Barn conversion',
  'Beach house',
  'City penthouse',
];

const LOADING_PHASES = [
  'Understanding your vision...',
  'Sketching your space...',
  'Placing rooms and walls...',
  'Arranging furniture...',
  'Adding the details...',
];

const ERROR_MESSAGES: Record<string, string> = {
  QUOTA_EXCEEDED:   'You have used all your designs this month',
  RATE_LIMITED:     'Slow down — please wait a moment',
  TIMEOUT:          'Taking longer than usual — try a simpler description',
  NETWORK:          'Check your connection and try again',
  AUTH_ERROR:       'Please sign in again',
  AI_NOT_CONFIGURED:'AI features are coming soon',
};

// ─── Sub-components ────────────────────────────────────────────────────────

/** Animated compass A logo mark with gentle pulse */
function LogoMark() {
  const opacity = useSharedValue(0.75);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1,    { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.75, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[animStyle, { alignItems: 'center' }]}>
      <Svg width={48} height={48} viewBox="0 0 48 48">
        {/* Compass circle */}
        <Circle
          cx={24} cy={24} r={22}
          stroke={DS.colors.primary}
          strokeWidth={1.5}
          fill="none"
        />
        {/* A glyph — two diagonal strokes + crossbar */}
        <Path
          d="M 16 36 L 24 12 L 32 36"
          stroke={DS.colors.primary}
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M 19 27 L 29 27"
          stroke={DS.colors.primary}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        {/* Cardinal tick marks */}
        <Path d="M 24 2 L 24 6"  stroke={DS.colors.primaryDim} strokeWidth={1} strokeLinecap="round" />
        <Path d="M 24 42 L 24 46" stroke={DS.colors.primaryDim} strokeWidth={1} strokeLinecap="round" />
        <Path d="M 2 24 L 6 24"  stroke={DS.colors.primaryDim} strokeWidth={1} strokeLinecap="round" />
        <Path d="M 42 24 L 46 24" stroke={DS.colors.primaryDim} strokeWidth={1} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

/** Pulsing red halo behind mic button when recording */
function RecordingHalo() {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 700, easing: Easing.out(Easing.quad) }),
        withTiming(1,   { duration: 700, easing: Easing.in(Easing.quad)  }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 700 }),
        withTiming(0.4, { duration: 700 }),
      ),
      -1,
      false,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        animStyle,
        {
          position:        'absolute',
          width:           48,
          height:          48,
          borderRadius:    24,
          backgroundColor: DS.colors.error,
        },
      ]}
    />
  );
}

/** Cycling loading phase text with fade transition */
function PhaseText({ phase }: { phase: number }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(0, { duration: 200 }),
      withTiming(1, { duration: 300 }),
    );
  }, [phase, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[animStyle, { marginTop: DS.spacing.md, alignItems: 'center' }]}>
      <ArchText variant="label" align="center" color={DS.colors.primaryDim}>
        {LOADING_PHASES[phase] ?? LOADING_PHASES[0]}
      </ArchText>
    </Animated.View>
  );
}

/** Three animated loading dots */
function LoadingDots() {
  const d = [
    useSharedValue(DS.colors.primaryGhost),
    useSharedValue(DS.colors.primaryGhost),
    useSharedValue(DS.colors.primaryGhost),
  ];
  const op = [useSharedValue(0.3), useSharedValue(0.3), useSharedValue(0.3)];

  useEffect(() => {
    [0, 1, 2].forEach((i) => {
      op[i].value = withRepeat(
        withSequence(
          withTiming(1,   { duration: 350 }),
          withTiming(0.3, { duration: 350 }),
        ),
        -1,
        false,
      );
    });
    void d; // suppress
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 6, marginTop: DS.spacing.sm }}>
      {op.map((opVal, i) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const style = useAnimatedStyle(() => ({ opacity: opVal.value }));
        return (
          <Animated.View
            key={i}
            style={[style, {
              width: 5, height: 5, borderRadius: 3,
              backgroundColor: DS.colors.primaryDim,
            }]}
          />
        );
      })}
    </View>
  );
}

/** Blueprint SVG preview — renders wall lines from BlueprintData */
function BlueprintPreview({ blueprint }: { blueprint: BlueprintData }) {
  const BOX = 260;
  const PAD = 16;
  const inner = BOX - PAD * 2;

  // Normalise all wall coords to fit inside `inner`
  const walls = blueprint.walls ?? [];
  if (walls.length === 0) return null;

  const allX = walls.flatMap((w) => [w.start.x, w.end.x]);
  const allY = walls.flatMap((w) => [w.start.y, w.end.y]);
  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = Math.min(...allY), maxY = Math.max(...allY);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const scale  = Math.min(inner / rangeX, inner / rangeY);

  const nx = (x: number) => PAD + (x - minX) * scale;
  const ny = (y: number) => PAD + (y - minY) * scale;

  const svgH = Math.max(120, (maxY - minY) * scale + PAD * 2);

  return (
    <View style={{
      backgroundColor: DS.colors.background,
      borderRadius:    DS.radius.medium,
      overflow:        'hidden',
      marginBottom:    DS.spacing.md,
    }}>
      <Svg width={BOX} height={svgH} style={{ alignSelf: 'center' }}>
        {walls.map((w) => (
          <Path
            key={w.id}
            d={`M ${nx(w.start.x)} ${ny(w.start.y)} L ${nx(w.end.x)} ${ny(w.end.y)}`}
            stroke={DS.colors.primary}
            strokeWidth={1}
            strokeLinecap="round"
            opacity={0.7}
          />
        ))}
      </Svg>
    </View>
  );
}

/** Three bouncing dots — ARIA is typing */
function TypingDots() {
  const y0 = useSharedValue(0);
  const y1 = useSharedValue(0);
  const y2 = useSharedValue(0);

  useEffect(() => {
    const animate = (val: ReturnType<typeof useSharedValue<number>>, delay: number) => {
      val.value = withRepeat(
        withSequence(
          withTiming(0,  { duration: delay }),
          withTiming(-4, { duration: 300, easing: Easing.inOut(Easing.quad) }),
          withTiming(0,  { duration: 300, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
    };
    animate(y0, 0);
    animate(y1, 150);
    animate(y2, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s0 = useAnimatedStyle(() => ({ transform: [{ translateY: y0.value }] }));
  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: y1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: y2.value }] }));

  const dotStyle = {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: DS.colors.primaryDim,
    marginHorizontal: 2,
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
      <Animated.View style={[dotStyle, s0]} />
      <Animated.View style={[dotStyle, s1]} />
      <Animated.View style={[dotStyle, s2]} />
    </View>
  );
}

/** 32px ARIA avatar with mini compass rose */
function ARIAAvatar() {
  return (
    <View style={{
      width: 32, height: 32,
      borderRadius: 16,
      backgroundColor: DS.colors.surface,
      borderWidth: 1,
      borderColor: DS.colors.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Svg width={16} height={16} viewBox="0 0 16 16">
        <Path d="M8 2 L6.5 8 L8 7 L9.5 8 Z" fill={DS.colors.primary} />
        <Path d="M8 14 L6.5 8 L8 9 L9.5 8 Z" fill={DS.colors.primaryDim} />
        <Path d="M2 8 L8 6.5 L7 8 L8 9.5 Z" fill={DS.colors.primaryDim} />
        <Path d="M14 8 L8 6.5 L9 8 L8 9.5 Z" fill={DS.colors.primaryDim} />
      </Svg>
    </View>
  );
}

/** Renders a single chat bubble (aria = left, user = right) */
function ChatBubble({ message }: { message: ChatMessage }) {
  const isAria = message.role === 'aria';
  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      style={{
        flexDirection: isAria ? 'row' : 'row-reverse',
        alignItems: 'flex-end',
        gap: DS.spacing.sm,
        marginBottom: DS.spacing.md,
      }}
    >
      {isAria && <ARIAAvatar />}
      <View
        style={{
          maxWidth: '78%',
          backgroundColor: isAria ? DS.colors.surface : DS.colors.surfaceHigh,
          borderRadius: 20,
          borderBottomLeftRadius: isAria ? 4 : 20,
          borderBottomRightRadius: isAria ? 20 : 4,
          padding: DS.spacing.md,
          borderWidth: 1,
          borderColor: DS.colors.borderLight,
        }}
      >
        <ArchText variant="body">{message.text}</ArchText>
        {message.component != null && (
          <View style={{ marginTop: DS.spacing.sm }}>{message.component}</View>
        )}
      </View>
    </Animated.View>
  );
}

/** ARIA typing indicator bubble */
function TypingIndicator() {
  return (
    <Animated.View
      entering={FadeInDown.duration(150)}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: DS.spacing.sm,
        marginBottom: DS.spacing.md,
      }}
    >
      <ARIAAvatar />
      <View style={{
        backgroundColor: DS.colors.surface,
        borderRadius: 20,
        borderBottomLeftRadius: 4,
        padding: DS.spacing.md,
        borderWidth: 1,
        borderColor: DS.colors.borderLight,
      }}>
        <TypingDots />
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function GenerationScreen() {
  const navigation = useNavigation<Nav>();
  const { success: hapticSuccess, error: hapticError } = useHaptics();
  const loadBlueprint = useBlueprintStore((s) => s.actions.loadBlueprint);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const isMounted   = useRef(true);
  const isCancelled = useRef(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // State
  const [screenState, setScreenState]   = useState<ScreenState>('idle');
  const [textInput,   setTextInput]     = useState('');
  const [selectedType, setSelectedType] = useState<GenerationPayload['buildingType']>('house');
  const [selectedStyle, setSelectedStyle] = useState<string>('modern');
  const [isRecording,  setIsRecording]  = useState(false);
  const [showExtras,   setShowExtras]   = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [errorCode,    setErrorCode]    = useState('');
  const [result,       setResult]       = useState<BlueprintData | null>(null);

  // Conversation state
  const [conversationStep, setConversationStep] = useState<ConversationStep>(0);
  const [chatMessages,     setChatMessages]     = useState<ChatMessage[]>([]);
  const [isTyping,         setIsTyping]         = useState(false);
  const chatScrollRef = useRef<FlatList<ChatMessage>>(null);

  // Idle ↔ generating fade
  const idleOpacity = useSharedValue(1);
  const idleStyle   = useAnimatedStyle(() => ({ opacity: idleOpacity.value }));

  // Loading phase cycle
  useEffect(() => {
    if (screenState !== 'generating') return;
    setLoadingPhase(0);
    const interval = setInterval(() => {
      setLoadingPhase((p) => Math.min(p + 1, LOADING_PHASES.length - 1));
    }, 2800);
    return () => clearInterval(interval);
  }, [screenState]);

  // ARIA introduction on mount
  useEffect(() => {
    setIsTyping(true);
    const t = setTimeout(() => {
      setIsTyping(false);
      setChatMessages([{ id: 'a0', role: 'aria', text: ARIA_QUESTIONS[0] }]);
    }, 1200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Voice ────────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
      setIsRecording(true);
    } catch {
      // no-op: permission denied or hardware unavailable
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    const rec = recordingRef.current;
    if (!rec) return;
    recordingRef.current = null;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      if (!uri) return;
      const transcript = await aiService.transcribeAudio(uri);
      if (transcript) {
        setTextInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    } catch {
      // transcription failed — user can type manually
    }
  };

  const handleMicPress = () => {
    if (isRecording) { void stopRecording(); }
    else             { void startRecording(); }
  };

  // ── Generation ───────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!textInput.trim()) return;
    isCancelled.current = false;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setErrorCode('AUTH_ERROR');
      setScreenState('error');
      return;
    }

    // Fade out idle content
    idleOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setScreenState)('generating');
    });

    try {
      const blueprint = await aiService.generateFloorPlan({
        prompt:       textInput,
        buildingType: selectedType,
        style:        selectedStyle,
      });

      if (isCancelled.current || !isMounted.current) return;
      loadBlueprint(blueprint);
      setResult(blueprint);
      hapticSuccess();
      setScreenState('success');
      idleOpacity.value = 1; // reset for next time
    } catch (e) {
      if (isCancelled.current || !isMounted.current) return;
      console.error('Generation failed:', JSON.stringify(e, null, 2));
      hapticError();
      setErrorCode((e as { code?: string }).code ?? 'UNKNOWN');
      setScreenState('error');
      idleOpacity.value = 1;
    }
  };

  const handleCancel = useCallback(() => {
    isCancelled.current = true;
    setScreenState('idle');
    idleOpacity.value = withTiming(1, { duration: 300 });
  }, [idleOpacity]);

  const resetToIdle = useCallback(() => {
    setTextInput('');
    setResult(null);
    setErrorCode('');
    setLoadingPhase(0);
    setScreenState('idle');
    idleOpacity.value = 1;
    // Reset conversation
    setConversationStep(0);
    setChatMessages([]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setChatMessages([{ id: 'a0r', role: 'aria', text: ARIA_QUESTIONS[0] }]);
    }, 1200);
  }, [idleOpacity]);

  const addAriaMessage = useCallback((id: string, step: ConversationStep) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setChatMessages((prev) => [...prev, {
        id,
        role: 'aria' as const,
        text: ARIA_QUESTIONS[step] ?? '',
      }]);
      setConversationStep(step);
    }, 800);
  }, []);

  const handleBuildingTypeSelect = useCallback((type: GenerationPayload['buildingType'], label: string) => {
    setSelectedType(type);
    setChatMessages((prev) => [...prev, { id: `u${Date.now()}`, role: 'user' as const, text: label }]);
    if (conversationStep === 0) {
      addAriaMessage('a1', 1);
    }
  }, [conversationStep, addAriaMessage]);

  const handleStyleSelect = useCallback((styleId: string, label: string) => {
    setSelectedStyle(styleId);
    setChatMessages((prev) => [...prev, { id: `u${Date.now()}`, role: 'user' as const, text: label }]);
    if (conversationStep === 1) {
      addAriaMessage('a2', 2);
    }
  }, [conversationStep, addAriaMessage]);

  const canGenerate = conversationStep >= 1 && textInput.trim().length > 0;

  const inputActive = textInput.trim().length > 0;

  // ── Generating state ─────────────────────────────────────────────────────
  if (screenState === 'generating') {
    return (
      <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
        <GridBackground />

        {/* Background sketch animation — fills screen, centred */}
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.4,
        }} pointerEvents="none">
          <SketchLoader width={220} height={170} />
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: DS.spacing.lg }}>
          <SketchCard glowing padding={DS.spacing.xl} style={{ alignItems: 'center', width: '100%', maxWidth: 320 }}>
            {/* Rotating compass loader */}
            <CompassRoseLoader size="large" />

            <PhaseText phase={loadingPhase} />
            <LoadingDots />
          </SketchCard>

          <View style={{ marginTop: DS.spacing.xl }}>
            <OvalButton label="Cancel" variant="ghost" size="small" onPress={handleCancel} />
          </View>
        </View>
      </View>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (screenState === 'success' && result) {
    const roomCount = result.rooms?.length ?? 0;
    const totalArea = result.metadata?.totalArea;
    const styleLabel = result.metadata?.style
      ? result.metadata.style.charAt(0).toUpperCase() + result.metadata.style.slice(1)
      : 'Modern';

    return (
      <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
        <GridBackground />

        <FloatingCard heightFraction={0.62} onDismiss={resetToIdle}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: DS.spacing.lg, paddingTop: DS.spacing.sm }}
          >
            <ArchText variant="heading" size="xl" align="center" style={{ marginBottom: DS.spacing.xs }}>
              Your design is ready
            </ArchText>
            <ArchText variant="caption" align="center" style={{ marginBottom: DS.spacing.md }}>
              {styleLabel} {result.metadata?.buildingType ?? 'design'}
            </ArchText>

            {/* Blueprint wall preview */}
            <BlueprintPreview blueprint={result} />

            {/* Stats row */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.xs, marginBottom: DS.spacing.lg }}>
              {roomCount > 0 && (
                <OvalChip label={`${roomCount} room${roomCount !== 1 ? 's' : ''}`} />
              )}
              {totalArea != null && (
                <OvalChip label={`${Math.round(totalArea)} m²`} />
              )}
              <OvalChip label={styleLabel} />
            </View>

            {/* Action buttons */}
            <OvalButton
              label="Open in Studio"
              variant="filled"
              size="large"
              fullWidth
              onPress={() => navigation.navigate('Workspace', {})}
            />
            <View style={{ height: DS.spacing.sm }} />
            <OvalButton
              label="Try Again"
              variant="outline"
              size="large"
              fullWidth
              onPress={resetToIdle}
            />
          </ScrollView>
        </FloatingCard>
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (screenState === 'error') {
    const msg = ERROR_MESSAGES[errorCode] ?? 'Something went wrong — please try again';
    return (
      <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
        <GridBackground />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: DS.spacing.lg }}>
          <SketchCard style={{ alignItems: 'center', width: '100%', maxWidth: 320 }}>
            <ArchText variant="body" align="center" style={{ marginBottom: DS.spacing.lg }}>
              {msg}
            </ArchText>
            {errorCode === 'QUOTA_EXCEEDED' ? (
              <OvalButton
                label="Upgrade"
                variant="filled"
                onPress={() => navigation.navigate('Subscription', {})}
              />
            ) : (
              <OvalButton label="Try Again" variant="filled" onPress={() => setScreenState('idle')} />
            )}
            <View style={{ height: DS.spacing.sm }} />
            <OvalButton label="Start over" variant="ghost" size="small" onPress={resetToIdle} />
          </SketchCard>
        </View>
      </View>
    );
  }

  // ── Idle state ────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
      <GridBackground />

      <Animated.View style={[{ flex: 1 }, idleStyle]}>
        {/* Chat messages */}
        <FlatList
          ref={chatScrollRef}
          data={chatMessages}
          keyExtractor={(m) => m.id}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: 60,
            paddingBottom: 180,
            paddingHorizontal: DS.spacing.md,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => <ChatBubble message={item} />}
          ListHeaderComponent={
            <View style={{ alignItems: 'center', marginBottom: DS.spacing.lg }}>
              <LogoMark />
            </View>
          }
          ListFooterComponent={
            <>
              {isTyping && <TypingIndicator />}
              {/* Step 0: building type chips */}
              {conversationStep === 0 && !isTyping && (
                <Animated.View entering={FadeInDown.duration(200)}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.xs, marginBottom: DS.spacing.md, marginLeft: 40 }}>
                    {BUILDING_TYPES.map((bt) => (
                      <OvalChip
                        key={bt.id}
                        label={bt.label}
                        icon={bt.emoji}
                        selected={false}
                        onPress={() => handleBuildingTypeSelect(bt.id, bt.label)}
                      />
                    ))}
                  </View>
                </Animated.View>
              )}
              {/* Step 1: style chips */}
              {conversationStep === 1 && !isTyping && (
                <Animated.View entering={FadeInDown.duration(200)}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.xs, marginBottom: DS.spacing.md, marginLeft: 40 }}>
                    {DESIGN_STYLES.map((ds) => (
                      <OvalChip
                        key={ds.id}
                        label={ds.label}
                        selected={selectedStyle === ds.id}
                        onPress={() => handleStyleSelect(ds.id, ds.label)}
                      />
                    ))}
                  </View>
                </Animated.View>
              )}
            </>
          }
        />

        {/* ── Voice waveform ────────────────────────────────────────────── */}
        {isRecording && (
          <View style={{
            position:        'absolute',
            bottom:          Platform.OS === 'ios' ? 126 : 108,
            left:            DS.spacing.md,
            right:           DS.spacing.md,
            backgroundColor: DS.colors.surfaceHigh,
            borderRadius:    DS.radius.card,
            borderWidth:     1,
            borderColor:     DS.colors.border,
            paddingVertical: DS.spacing.sm,
            paddingHorizontal: DS.spacing.md,
            flexDirection:   'row',
            alignItems:      'center',
            gap:             DS.spacing.md,
          }}>
            <WaveformVisualizer active={isRecording} />
            <ArchText variant="caption">Listening...</ArchText>
          </View>
        )}

        {/* ── Sign-in gate (unauthenticated) ───────────────────────────── */}
        {!isAuthenticated && (
          <View style={{
            position:          'absolute',
            bottom:            Platform.OS === 'ios' ? 34 : 16,
            left:              DS.spacing.md,
            right:             DS.spacing.md,
            backgroundColor:   DS.colors.surface,
            borderRadius:      DS.radius.button,
            borderWidth:       1,
            borderColor:       DS.colors.borderLight,
            padding:           DS.spacing.md,
            alignItems:        'center',
            gap:               DS.spacing.sm,
          }}>
            <ArchText variant="caption" align="center">Sign in to create designs</ArchText>
            <OvalButton
              label="Sign In"
              variant="filled"
              size="small"
              onPress={() => navigation.navigate('Auth')}
            />
          </View>
        )}

        {/* ── Floating input bar ────────────────────────────────────────── */}
        {isAuthenticated && <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'android' ? 90 : 0}
          style={{
            position: 'absolute',
            bottom:   0,
            left:     0,
            right:    0,
          }}
        >
          <View style={{ marginHorizontal: DS.spacing.md, marginBottom: Platform.OS === 'ios' ? 34 : 16 }}>
          <View style={[
            DS.shadow.large,
            {
              backgroundColor:   DS.colors.surface,
              borderRadius:      DS.radius.button,
              borderWidth:       1,
              borderColor:       DS.colors.borderLight,
              paddingVertical:   DS.spacing.sm,
              paddingHorizontal: DS.spacing.sm,
              flexDirection:     'row',
              alignItems:        'flex-end',
              gap:               DS.spacing.xs,
            },
          ]}>

            {/* + Extras */}
            <Pressable
              onPress={() => setShowExtras(true)}
              style={{
                width:           40,
                height:          40,
                borderRadius:    20,
                backgroundColor: DS.colors.surfaceHigh,
                alignItems:      'center',
                justifyContent:  'center',
                marginBottom:    2,
              }}
            >
              <Text style={{
                color:              DS.colors.primaryDim,
                fontSize:           20,
                lineHeight:         22,
                includeFontPadding: false,
              }}>+</Text>
            </Pressable>

            {/* Text input */}
            <TextInput
              multiline
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Add details about your design..."
              placeholderTextColor={DS.colors.primaryGhost}
              style={{
                flex:               1,
                fontFamily:         DS.font.regular,
                fontSize:           DS.fontSize.md,
                color:              DS.colors.primary,
                maxHeight:          100,
                paddingTop:         DS.spacing.sm,
                paddingBottom:      DS.spacing.sm,
                includeFontPadding: false,
              }}
            />

            {/* Mic */}
            <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
              {isRecording && <RecordingHalo />}
              <Pressable
                onPress={handleMicPress}
                style={{
                  width:           40,
                  height:          40,
                  borderRadius:    20,
                  backgroundColor: isRecording ? DS.colors.error : DS.colors.surfaceHigh,
                  alignItems:      'center',
                  justifyContent:  'center',
                }}
              >
                <Text style={{ fontSize: 17, lineHeight: 20 }}>🎤</Text>
              </Pressable>
            </View>

            {/* Generate — enabled after step 1 + some text */}
            <Pressable
              onPress={() => { void handleGenerate(); }}
              disabled={!canGenerate}
              style={{
                width:           40,
                height:          40,
                borderRadius:    20,
                backgroundColor: canGenerate ? DS.colors.primary : DS.colors.border,
                alignItems:      'center',
                justifyContent:  'center',
                marginBottom:    2,
              }}
            >
              <Text style={{
                color:              canGenerate ? DS.colors.background : DS.colors.primaryGhost,
                fontSize:           19,
                fontWeight:         '600',
                lineHeight:         22,
                includeFontPadding: false,
              }}>
                ↑
              </Text>
            </Pressable>
          </View>
          </View>
        </KeyboardAvoidingView>}
      </Animated.View>

      {/* ── Extras sheet ─────────────────────────────────────────────────── */}
      <Modal
        visible={showExtras}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExtras(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: DS.colors.overlay }}
          onPress={() => setShowExtras(false)}
        >
          <View style={{
            position:             'absolute',
            bottom:               0, left: 0, right: 0,
            backgroundColor:      DS.colors.surface,
            borderTopLeftRadius:  DS.radius.modal,
            borderTopRightRadius: DS.radius.modal,
            padding:              DS.spacing.lg,
            gap:                  DS.spacing.sm,
          }}>
            <View style={{
              width:           36, height: 4,
              borderRadius:    2,
              backgroundColor: DS.colors.border,
              alignSelf:       'center',
              marginBottom:    DS.spacing.sm,
            }} />

            {([
              { icon: '📷', label: 'Upload reference image' },
              { icon: '📐', label: 'Set plot size'          },
              { icon: '🛋️', label: 'Furniture style'        },
              { icon: '🌿', label: 'Garden preferences'     },
            ] as const).map((item) => (
              <Pressable
                key={item.label}
                onPress={() => setShowExtras(false)}
                style={{
                  flexDirection:   'row',
                  alignItems:      'center',
                  gap:             DS.spacing.md,
                  backgroundColor: DS.colors.surfaceHigh,
                  borderRadius:    DS.radius.oval,
                  paddingVertical: DS.spacing.md,
                  paddingHorizontal: DS.spacing.lg,
                }}
              >
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                <ArchText variant="body">{item.label}</ArchText>
              </Pressable>
            ))}

            <View style={{ height: Platform.OS === 'ios' ? DS.spacing.lg : DS.spacing.sm }} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
