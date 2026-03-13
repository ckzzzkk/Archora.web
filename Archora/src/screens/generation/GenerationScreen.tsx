import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView,
  Platform, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSpring, Easing, withSequence,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { useTierGate } from '../../hooks/useTierGate';
import { aiService } from '../../services/aiService';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useProjectStore } from '../../stores/projectStore';
import { useAuthStore } from '../../stores/authStore';
import { LogoLoader } from '../../components/common/LogoLoader';
import { BASE_COLORS } from '../../theme/colors';
import type { BuildingType, ArchStyle } from '../../types';
import type { RootStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');
type Nav = NativeStackNavigationProp<RootStackParamList>;

const STYLES: { key: ArchStyle; label: string }[] = [
  { key: 'modern', label: 'Modern' },
  { key: 'traditional', label: 'Traditional' },
  { key: 'scandinavian', label: 'Scandinavian' },
  { key: 'industrial', label: 'Industrial' },
  { key: 'minimalist', label: 'Minimalist' },
  { key: 'mediterranean', label: 'Mediterranean' },
];

const BUILDING_TYPES: { key: BuildingType; label: string }[] = [
  { key: 'house', label: 'House' },
  { key: 'apartment', label: 'Apartment' },
  { key: 'office', label: 'Office' },
  { key: 'studio', label: 'Studio' },
  { key: 'villa', label: 'Villa' },
];

const MAX_PROMPT = 1000;

export function GenerationScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { success, error: errorHaptic } = useHaptics();
  const audioGate = useTierGate('audioInput');
  const loadBlueprint = useBlueprintStore((s) => s.actions.loadBlueprint);
  const user = useAuthStore((s) => s.user);
  const projectActions = useProjectStore((s) => s.actions);

  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<ArchStyle>('modern');
  const [selectedType, setSelectedType] = useState<BuildingType>('house');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);

  // Blueprint grid pulse animation during generation
  const gridOpacity = useSharedValue(0.05);

  // Compass rose rotation during generation
  const compassRotation = useSharedValue(0);

  // Blueprint draw-in animation
  const blueprintProgress = useSharedValue(0);

  const gridStyle = useAnimatedStyle(() => ({
    opacity: gridOpacity.value,
  }));

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    if (!user) return;

    setIsGenerating(true);
    setError('');
    setGenerated(false);

    // Start grid pulse
    gridOpacity.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 800 }),
        withTiming(0.08, { duration: 800 }),
      ),
      -1,
      false,
    );

    // Start compass rotation
    compassRotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false,
    );

    try {
      const blueprint = await aiService.generateFloorPlan({
        prompt: prompt.trim(),
        buildingType: selectedType,
        style: selectedStyle,
      });

      // Stop animations
      gridOpacity.value = withTiming(0.05, { duration: 600 });
      compassRotation.value = 0;

      // Load into store
      loadBlueprint(blueprint);
      success();
      setGenerated(true);

      // Save as new project if user is logged in
      if (user) {
        await projectActions.create(user.id, `${blueprint.metadata.style} ${blueprint.metadata.buildingType}`.replace(/^\w/, (c) => c.toUpperCase()), selectedType);
      }
    } catch (e) {
      gridOpacity.value = withTiming(0.05, { duration: 400 });
      compassRotation.value = 0;
      errorHaptic();
      const err = e as { code?: string; message?: string };
      if (err.code === 'QUOTA_EXCEEDED') {
        setError('Monthly AI generation limit reached. Upgrade your plan.');
      } else if (err.code === 'RATE_LIMITED') {
        setError('Too many requests. Please wait a moment.');
      } else {
        setError('Generation failed. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const compassStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${compassRotation.value}deg` }],
  }));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BASE_COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 60, marginBottom: 24 }}>
          <Text style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 32,
            color: BASE_COLORS.textPrimary,
          }}>
            Generate
          </Text>
          <Text style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 14,
            color: BASE_COLORS.textSecondary,
            marginTop: 4,
          }}>
            Describe your building in any way
          </Text>
        </View>

        {/* Prompt area */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{
            backgroundColor: BASE_COLORS.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: BASE_COLORS.border,
            padding: 16,
            position: 'relative',
          }}>
            {/* Blueprint ruling lines behind text */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: 12,
                  overflow: 'hidden',
                },
                gridStyle,
              ]}
              pointerEvents="none"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    left: 16,
                    right: 16,
                    top: 16 + i * 28,
                    height: 1,
                    backgroundColor: colors.primary,
                  }}
                />
              ))}
            </Animated.View>

            <TextInput
              value={prompt}
              onChangeText={(t) => setPrompt(t.slice(0, MAX_PROMPT))}
              placeholder="A 3-bedroom modern house with an open kitchen and large windows..."
              placeholderTextColor={BASE_COLORS.textDim}
              multiline
              numberOfLines={6}
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 15,
                color: BASE_COLORS.textPrimary,
                minHeight: 140,
                textAlignVertical: 'top',
              }}
            />

            <Text style={{
              fontFamily: 'JetBrainsMono_400Regular',
              fontSize: 11,
              color: BASE_COLORS.textDim,
              textAlign: 'right',
              marginTop: 8,
            }}>
              {prompt.length}/{MAX_PROMPT}
            </Text>
          </View>
        </View>

        {/* Style chips */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 12,
            color: BASE_COLORS.textSecondary,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            Style
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {STYLES.map((s) => {
                const isActive = selectedStyle === s.key;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => setSelectedStyle(s.key)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: isActive ? colors.primary : BASE_COLORS.border,
                      backgroundColor: isActive ? `${colors.primary}25` : 'transparent',
                    }}
                  >
                    <Text style={{
                      fontFamily: 'Inter_500Medium',
                      fontSize: 13,
                      color: isActive ? colors.primary : BASE_COLORS.textSecondary,
                    }}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Building type */}
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <Text style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 12,
            color: BASE_COLORS.textSecondary,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            Building Type
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {BUILDING_TYPES.map((t) => {
                const isActive = selectedType === t.key;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setSelectedType(t.key)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: isActive ? colors.primary : BASE_COLORS.border,
                      backgroundColor: isActive ? `${colors.primary}25` : 'transparent',
                    }}
                  >
                    <Text style={{
                      fontFamily: 'Inter_500Medium',
                      fontSize: 13,
                      color: isActive ? colors.primary : BASE_COLORS.textSecondary,
                    }}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Error */}
        {error ? (
          <View style={{
            marginHorizontal: 20,
            padding: 12,
            backgroundColor: `${BASE_COLORS.error}20`,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: BASE_COLORS.error,
            marginBottom: 16,
          }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.error }}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* Generation area */}
        {isGenerating && (
          <View style={{
            marginHorizontal: 20,
            height: 200,
            backgroundColor: BASE_COLORS.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: BASE_COLORS.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            overflow: 'hidden',
          }}>
            {/* Pulsing grid */}
            <Animated.View style={[
              { position: 'absolute', inset: 0 },
              gridStyle,
            ]}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: i * 28, height: 1, backgroundColor: colors.primary }} />
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: i * 40, width: 1, backgroundColor: colors.primary }} />
              ))}
            </Animated.View>

            <Animated.View style={compassStyle}>
              <LogoLoader size="medium" />
            </Animated.View>
            <Text style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 13,
              color: BASE_COLORS.textSecondary,
              marginTop: 16,
            }}>
              Drawing your floor plan...
            </Text>
          </View>
        )}

        {/* Success state */}
        {generated && !isGenerating && (
          <View style={{
            marginHorizontal: 20,
            padding: 16,
            backgroundColor: `${BASE_COLORS.success}15`,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: BASE_COLORS.success,
            marginBottom: 24,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}>
            <Text style={{ fontSize: 20 }}>✓</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 16, color: BASE_COLORS.textPrimary }}>
                Floor plan generated
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.textSecondary, marginTop: 2 }}>
                Open in Workspace to edit
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('Workspace', {})}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: BASE_COLORS.background }}>
                Open
              </Text>
            </Pressable>
          </View>
        )}

        {/* Generate button */}
        <View style={{ paddingHorizontal: 20 }}>
          <Pressable
            onPress={() => { void handleGenerate(); }}
            disabled={isGenerating || !prompt.trim()}
            style={{
              backgroundColor: isGenerating || !prompt.trim() ? BASE_COLORS.border : colors.primary,
              borderRadius: 24,
              paddingVertical: 18,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            {isGenerating ? (
              <LogoLoader size="small" />
            ) : null}
            <Text style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 18,
              color: BASE_COLORS.background,
              letterSpacing: 0.5,
            }}>
              {isGenerating ? 'Generating...' : 'Generate Floor Plan'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
