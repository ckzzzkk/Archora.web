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
} from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { useHaptics } from '../../hooks/useHaptics';
import { aiService } from '../../services/aiService';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useAuthStore } from '../../stores/authStore';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { BASE_COLORS } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import type { BlueprintData } from '../../types/blueprint';
import type { GenerationPayload } from '../../types/generation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_SPACING = 32;

const BUILDING_TYPES = [
  { id: 'house',      emoji: '🏠', label: 'House'  },
  { id: 'apartment',  emoji: '🏢', label: 'Flat'   },
  { id: 'office',     emoji: '🏗️', label: 'Office' },
  { id: 'studio',     emoji: '🎨', label: 'Studio' },
  { id: 'villa',      emoji: '🏡', label: 'Villa'  },
  { id: 'commercial', emoji: '🏪', label: 'Shop'   },
] as const;

const DESIGN_STYLES = [
  { id: 'modern',       icon: '◻',  label: 'Modern'     },
  { id: 'minimalist',   icon: '◻',  label: 'Minimal'    },
  { id: 'industrial',   icon: '⚙',  label: 'Industrial' },
  { id: 'scandinavian', icon: '❄',  label: 'Scandi'     },
  { id: 'tropical',     icon: '🌿', label: 'Tropical'   },
  { id: 'classic',      icon: '🏛', label: 'Classic'    },
] as const;

const PROMPT_CHIPS = [
  'Modern family home',
  'Open plan apartment',
  'Studio with mezzanine',
  'Villa with pool',
  'Home office',
  'Kitchen extension',
];

const LOADING_PHASES = [
  'Understanding your vision...',
  'Designing your space...',
  'Placing rooms and walls...',
  'Adding furniture...',
  'Finishing details...',
];

type ScreenState = 'input' | 'generating' | 'success' | 'error';

function GridBackground() {
  const hCount = Math.ceil(SCREEN_HEIGHT / GRID_SPACING) + 1;
  const vCount = Math.ceil(SCREEN_WIDTH  / GRID_SPACING) + 1;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute', top: 0, left: 0,
        width: SCREEN_WIDTH, height: SCREEN_HEIGHT,
      }}
    >
      {Array.from({ length: hCount }).map((_, i) => (
        <View
          key={`h${i}`}
          style={{
            position: 'absolute',
            top: i * GRID_SPACING,
            left: 0, right: 0,
            height: 1,
            backgroundColor: '#222222',
          }}
        />
      ))}
      {Array.from({ length: vCount }).map((_, i) => (
        <View
          key={`v${i}`}
          style={{
            position: 'absolute',
            left: i * GRID_SPACING,
            top: 0, bottom: 0,
            width: 1,
            backgroundColor: '#222222',
          }}
        />
      ))}
    </View>
  );
}

export function GenerationScreen() {
  const navigation = useNavigation<Nav>();
  const { success: successHaptic, error: errorHaptic } = useHaptics();
  const loadBlueprint = useBlueprintStore((s) => s.actions.loadBlueprint);
  useAuthStore((s) => s.user); // subscribe for re-renders if needed

  const isMounted   = useRef(true);
  const isCancelled = useRef(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const [screenState, setScreenState]       = useState<ScreenState>('input');
  const [textInput, setTextInput]           = useState('');
  const [selectedType, setSelectedType]     = useState<GenerationPayload['buildingType']>('house');
  const [selectedStyle, setSelectedStyle]   = useState<string>('modern');
  const [isRecording, setIsRecording]       = useState(false);
  const [showExtras, setShowExtras]         = useState(false);
  const [generationPhase, setGenerationPhase] = useState(0);
  const [errorMessage, setErrorMessage]     = useState('');
  const [errorCode, setErrorCode]           = useState('');
  const [result, setResult]                 = useState<BlueprintData | null>(null);

  // ── Waveform animation ──────────────────────────────────────────────────
  const bar1 = useSharedValue(8);
  const bar2 = useSharedValue(8);
  const bar3 = useSharedValue(8);
  const bar4 = useSharedValue(8);

  const bar1Style = useAnimatedStyle(() => ({ height: bar1.value }));
  const bar2Style = useAnimatedStyle(() => ({ height: bar2.value }));
  const bar3Style = useAnimatedStyle(() => ({ height: bar3.value }));
  const bar4Style = useAnimatedStyle(() => ({ height: bar4.value }));

  useEffect(() => {
    if (isRecording) {
      bar1.value = withRepeat(withSequence(
        withTiming(28, { duration: 200 }), withTiming(6,  { duration: 200 })), -1, false);
      bar2.value = withRepeat(withSequence(
        withTiming(10, { duration: 280 }), withTiming(26, { duration: 280 })), -1, false);
      bar3.value = withRepeat(withSequence(
        withTiming(24, { duration: 180 }), withTiming(8,  { duration: 180 })), -1, false);
      bar4.value = withRepeat(withSequence(
        withTiming(16, { duration: 240 }), withTiming(6,  { duration: 240 })), -1, false);
    } else {
      bar1.value = withTiming(8, { duration: 200 });
      bar2.value = withTiming(8, { duration: 200 });
      bar3.value = withTiming(8, { duration: 200 });
      bar4.value = withTiming(8, { duration: 200 });
    }
  }, [isRecording, bar1, bar2, bar3, bar4]);

  // ── Loading phase animation ─────────────────────────────────────────────
  const phaseOpacity = useSharedValue(0);

  const advancePhase = useCallback(() => {
    setGenerationPhase((p) => Math.min(p + 1, LOADING_PHASES.length - 1));
    phaseOpacity.value = withTiming(1, { duration: 350 });
  }, [phaseOpacity]);

  useEffect(() => {
    if (screenState !== 'generating') {
      phaseOpacity.value = 0;
      return;
    }
    setGenerationPhase(0);
    phaseOpacity.value = withTiming(1, { duration: 350 });

    const interval = setInterval(() => {
      phaseOpacity.value = withTiming(0, { duration: 280 }, () => {
        runOnJS(advancePhase)();
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [screenState, advancePhase, phaseOpacity]);

  const phaseAnimStyle = useAnimatedStyle(() => ({ opacity: phaseOpacity.value }));

  // ── Voice ───────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
    } catch {
      // Permission denied or hardware unavailable — silent fail
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    const recording = recordingRef.current;
    if (!recording) return;
    recordingRef.current = null;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) return;
      const transcript = await aiService.transcribeAudio(uri);
      if (transcript) {
        setTextInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    } catch {
      // Transcription failed — user can type manually
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      void stopRecording();
    } else {
      void startRecording();
    }
  };

  // ── Generation ──────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!textInput.trim()) return;
    isCancelled.current = false;
    setScreenState('generating');
    setErrorMessage('');
    setErrorCode('');

    try {
      const blueprint = await aiService.generateFloorPlan({
        prompt: textInput,
        buildingType: selectedType,
        style: selectedStyle,
      });

      if (isCancelled.current || !isMounted.current) return;
      loadBlueprint(blueprint);
      setResult(blueprint);
      successHaptic();
      setScreenState('success');
    } catch (e) {
      if (isCancelled.current || !isMounted.current) return;
      errorHaptic();
      const err = e as { code?: string };
      const code = err.code ?? '';
      setErrorCode(code);
      switch (code) {
        case 'QUOTA_EXCEEDED':
          setErrorMessage('You have used all your designs this month');
          break;
        case 'RATE_LIMITED':
          setErrorMessage('Slow down — please wait a moment before trying again');
          break;
        case 'TIMEOUT':
          setErrorMessage('Taking longer than usual — try a simpler description');
          break;
        case 'NETWORK':
          setErrorMessage('Check your connection and try again');
          break;
        case 'AUTH_ERROR':
          setErrorMessage('Please sign in again');
          break;
        default:
          setErrorMessage('Something went wrong — please try again');
      }
      setScreenState('error');
    }
  };

  const handleCancel = () => {
    isCancelled.current = true;
    setScreenState('input');
  };

  const resetToInput = useCallback(() => {
    setTextInput('');
    setSelectedType('house');
    setSelectedStyle('modern');
    setResult(null);
    setErrorMessage('');
    setErrorCode('');
    setScreenState('input');
  }, []);

  // ── Generating ──────────────────────────────────────────────────────────
  if (screenState === 'generating') {
    return (
      <View style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
        <GridBackground />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <CompassRoseLoader size="large" />
          <Animated.View style={[{ marginTop: 32, alignItems: 'center' }, phaseAnimStyle]}>
            <Text style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              color: BASE_COLORS.textSecondary,
              textAlign: 'center',
            }}>
              {LOADING_PHASES[generationPhase]}
            </Text>
          </Animated.View>
        </View>
        <View style={{ paddingBottom: Platform.OS === 'ios' ? 48 : 32, paddingHorizontal: 24 }}>
          <Pressable
            onPress={handleCancel}
            style={{
              borderRadius: 50,
              borderWidth: 1,
              borderColor: BASE_COLORS.border,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: BASE_COLORS.textSecondary }}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────
  if (screenState === 'success') {
    const styleLabel = result?.metadata?.style
      ? result.metadata.style.charAt(0).toUpperCase() + result.metadata.style.slice(1)
      : 'Modern';
    const typeLabel = result?.metadata?.buildingType
      ? result.metadata.buildingType.charAt(0).toUpperCase() + result.metadata.buildingType.slice(1)
      : 'Design';

    return (
      <View style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
        <GridBackground />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 24,
            color: BASE_COLORS.textPrimary,
            textAlign: 'center',
            marginBottom: 8,
          }}>
            Your design is ready
          </Text>
          <Text style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 14,
            color: BASE_COLORS.textSecondary,
            textAlign: 'center',
            marginBottom: 40,
          }}>
            {styleLabel} {typeLabel}
          </Text>

          <View style={{ width: '100%', gap: 12 }}>
            <Pressable
              onPress={() => navigation.navigate('Workspace', {})}
              style={{
                backgroundColor: BASE_COLORS.textPrimary,
                borderRadius: 50,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: BASE_COLORS.background }}>
                Open in Studio
              </Text>
            </Pressable>
            <Pressable
              onPress={resetToInput}
              style={{
                borderRadius: 50,
                paddingVertical: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: BASE_COLORS.border,
              }}
            >
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 16, color: BASE_COLORS.textPrimary }}>
                Generate Again
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (screenState === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
        <GridBackground />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{
            backgroundColor: `${BASE_COLORS.error}18`,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: `${BASE_COLORS.error}50`,
            padding: 24,
            marginBottom: 24,
            width: '100%',
          }}>
            <Text style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              color: BASE_COLORS.textPrimary,
              textAlign: 'center',
              lineHeight: 22,
            }}>
              {errorMessage}
            </Text>
          </View>

          {errorCode === 'QUOTA_EXCEEDED' ? (
            <Pressable
              onPress={() => navigation.navigate('Subscription', {})}
              style={{
                backgroundColor: BASE_COLORS.textPrimary,
                borderRadius: 50,
                paddingVertical: 14,
                paddingHorizontal: 32,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: BASE_COLORS.background }}>
                Upgrade
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setScreenState('input')}
              style={{
                backgroundColor: BASE_COLORS.textPrimary,
                borderRadius: 50,
                paddingVertical: 14,
                paddingHorizontal: 32,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: BASE_COLORS.background }}>
                Try Again
              </Text>
            </Pressable>
          )}

          <Pressable onPress={resetToInput} style={{ paddingVertical: 10 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textDim }}>
              Start over
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Input ────────────────────────────────────────────────────────────────
  const inputActive = textInput.trim().length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
      <GridBackground />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 56,
          paddingBottom: 160,
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo + tagline */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View style={{
            width: 40, height: 40,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: BASE_COLORS.textPrimary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}>
            <Text style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 18,
              color: BASE_COLORS.textPrimary,
              lineHeight: 22,
            }}>
              A
            </Text>
          </View>
          <Text style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 14,
            color: BASE_COLORS.textSecondary,
            letterSpacing: 0.3,
          }}>
            Design Without Limits
          </Text>
        </View>

        {/* Prompt chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
          style={{ marginBottom: 28, marginHorizontal: -20, paddingHorizontal: 20 }}
        >
          {PROMPT_CHIPS.map((chip) => (
            <Pressable
              key={chip}
              onPress={() => setTextInput(chip)}
              style={{
                borderRadius: 50,
                backgroundColor: BASE_COLORS.surface,
                borderWidth: 1,
                borderColor: BASE_COLORS.border,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <Text style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 13,
                color: BASE_COLORS.textSecondary,
              }}>
                {chip}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Building type */}
        <Text style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 12,
          color: BASE_COLORS.textDim,
          marginBottom: 10,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}>
          What are we designing?
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
          style={{ marginBottom: 24, marginHorizontal: -20, paddingHorizontal: 20 }}
        >
          {BUILDING_TYPES.map((bt) => {
            const active = selectedType === bt.id;
            return (
              <Pressable
                key={bt.id}
                onPress={() => setSelectedType(bt.id)}
                style={{
                  height: 44,
                  paddingHorizontal: 14,
                  borderRadius: 50,
                  backgroundColor: active ? BASE_COLORS.textPrimary : BASE_COLORS.surface,
                  borderWidth: 1,
                  borderColor: active ? BASE_COLORS.textPrimary : BASE_COLORS.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 14 }}>{bt.emoji}</Text>
                <Text style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  color: active ? BASE_COLORS.background : BASE_COLORS.textSecondary,
                }}>
                  {bt.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Design style */}
        <Text style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 12,
          color: BASE_COLORS.textDim,
          marginBottom: 10,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}>
          Design style
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
          style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
        >
          {DESIGN_STYLES.map((ds) => {
            const active = selectedStyle === ds.id;
            return (
              <Pressable
                key={ds.id}
                onPress={() => setSelectedStyle(ds.id)}
                style={{
                  height: 44,
                  paddingHorizontal: 16,
                  borderRadius: 50,
                  backgroundColor: active ? BASE_COLORS.textPrimary : BASE_COLORS.surface,
                  borderWidth: 1,
                  borderColor: active ? BASE_COLORS.textPrimary : BASE_COLORS.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 13 }}>{ds.icon}</Text>
                <Text style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  color: active ? BASE_COLORS.background : BASE_COLORS.textSecondary,
                }}>
                  {ds.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </ScrollView>

      {/* Voice waveform — above input bar */}
      {isRecording && (
        <View style={{
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 118 : 100,
          left: 16, right: 16,
          backgroundColor: BASE_COLORS.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: BASE_COLORS.border,
          paddingVertical: 12,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {[bar1Style, bar2Style, bar3Style, bar4Style].map((animStyle, i) => (
              <Animated.View
                key={i}
                style={[{
                  width: 3,
                  borderRadius: 2,
                  backgroundColor: BASE_COLORS.textPrimary,
                }, animStyle]}
              />
            ))}
          </View>
          <Text style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 13,
            color: BASE_COLORS.textSecondary,
          }}>
            Listening...
          </Text>
        </View>
      )}

      {/* Input bar — fixed at bottom */}
      <View style={{
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 34 : 16,
        left: 16, right: 16,
      }}>
        <View style={{
          backgroundColor: BASE_COLORS.surface,
          borderRadius: 30,
          borderWidth: 1,
          borderColor: BASE_COLORS.border,
          paddingVertical: 8,
          paddingHorizontal: 8,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 6,
        }}>
          {/* + extras button */}
          <Pressable
            onPress={() => setShowExtras(true)}
            style={{
              width: 36, height: 36,
              borderRadius: 18,
              backgroundColor: BASE_COLORS.surfaceHigh,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 2,
            }}
          >
            <Text style={{
              color: BASE_COLORS.textSecondary,
              fontSize: 20,
              lineHeight: 22,
              includeFontPadding: false,
            }}>
              +
            </Text>
          </Pressable>

          {/* Text input */}
          <TextInput
            multiline
            value={textInput}
            onChangeText={setTextInput}
            placeholder="Describe your space..."
            placeholderTextColor={BASE_COLORS.textSecondary}
            style={{
              flex: 1,
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              color: BASE_COLORS.textPrimary,
              maxHeight: 100,
              paddingTop: 8,
              paddingBottom: 8,
            }}
          />

          {/* Microphone */}
          <Pressable
            onPress={handleMicPress}
            style={{
              width: 40, height: 40,
              borderRadius: 20,
              backgroundColor: isRecording ? BASE_COLORS.error : BASE_COLORS.surfaceHigh,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 2,
            }}
          >
            <Text style={{ fontSize: 17, lineHeight: 20 }}>🎤</Text>
          </Pressable>

          {/* Generate */}
          <Pressable
            onPress={() => { void handleGenerate(); }}
            disabled={!inputActive}
            style={{
              width: 40, height: 40,
              borderRadius: 20,
              backgroundColor: inputActive ? BASE_COLORS.textPrimary : BASE_COLORS.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 2,
            }}
          >
            <Text style={{
              color: inputActive ? BASE_COLORS.background : BASE_COLORS.textDim,
              fontSize: 18,
              lineHeight: 22,
              fontWeight: '600',
            }}>
              ↑
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Extras sheet */}
      <Modal
        visible={showExtras}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExtras(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShowExtras(false)}
        >
          <View style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            backgroundColor: BASE_COLORS.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            gap: 10,
          }}>
            {/* Drag handle */}
            <View style={{
              width: 36, height: 4,
              borderRadius: 2,
              backgroundColor: BASE_COLORS.border,
              alignSelf: 'center',
              marginBottom: 8,
            }} />

            {([
              { icon: '📷', label: 'Upload reference image' },
              { icon: '📐', label: 'Set plot size' },
              { icon: '🛋️', label: 'Furniture style' },
              { icon: '🌿', label: 'Garden preferences' },
            ] as const).map((item) => (
              <Pressable
                key={item.label}
                onPress={() => setShowExtras(false)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: BASE_COLORS.surfaceHigh,
                  borderRadius: 50,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                }}
              >
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                <Text style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 15,
                  color: BASE_COLORS.textPrimary,
                }}>
                  {item.label}
                </Text>
              </Pressable>
            ))}

            <View style={{ height: Platform.OS === 'ios' ? 24 : 8 }} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
