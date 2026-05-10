/**
 * RenderSheet — Pro+ Creative Render UI
 *
 * Bottom sheet that lets Pro+ users select atmosphere + view type,
 * request a photorealistic AI render via ai-render edge function,
 * and view the generated image result.
 */
import React, { useState, useCallback } from 'react';
import {
  View, ScrollView, Image, Pressable, Linking,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, Easing,
} from 'react-native-reanimated';
import { ArchText } from '../common/ArchText';
import { OvalButton } from '../common/OvalButton';
import { CompassRoseLoader } from '../common/CompassRoseLoader';
import { AIProcessingIndicator } from '../common/AIProcessingIndicator';
import { TierGate } from '../common/TierGate';
import { DS } from '../../theme/designSystem';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { supabase, supabaseUrl, supabaseAnonKey } from '../../lib/supabase';

type Atmosphere =
  | 'golden_hour'
  | 'sunny_midday'
  | 'overcast_day'
  | 'twilight'
  | 'night_interior'
  | 'rain_storm'
  | 'snow';

type ViewType =
  | 'exterior_front'
  | 'exterior_aerial'
  | 'interior_living'
  | 'interior_kitchen'
  | 'interior_bedroom'
  | 'garden';

interface AtmosphereOption {
  id: Atmosphere;
  label: string;
  icon: string;
}

interface ViewOption {
  id: ViewType;
  label: string;
  icon: string;
}

const ATMOSPHERES: AtmosphereOption[] = [
  { id: 'golden_hour', label: 'Golden Hour', icon: '🌅' },
  { id: 'sunny_midday', label: 'Sunny Day', icon: '☀️' },
  { id: 'overcast_day', label: 'Overcast', icon: '☁️' },
  { id: 'twilight', label: 'Twilight', icon: '🌆' },
  { id: 'night_interior', label: 'Night', icon: '🌙' },
  { id: 'rain_storm', label: 'Storm', icon: '⛈️' },
  { id: 'snow', label: 'Snow', icon: '❄️' },
];

const VIEW_TYPES: ViewOption[] = [
  { id: 'exterior_front', label: 'Front Exterior', icon: '🏠' },
  { id: 'exterior_aerial', label: 'Aerial View', icon: '🛸' },
  { id: 'interior_living', label: 'Living Room', icon: '🛋️' },
  { id: 'interior_kitchen', label: 'Kitchen', icon: '🍳' },
  { id: 'interior_bedroom', label: 'Bedroom', icon: '🛏️' },
  { id: 'garden', label: 'Garden', icon: '🌿' },
];

const RENDER_WORDS = [
  { text: 'Composing scene...', icon: 'compass' as const },
  { text: 'Generating prompts...', icon: 'wave' as const },
  { text: 'Rendering image...', icon: 'sparkle' as const },
  { text: 'Finalising...', icon: 'compass' as const },
];

interface RenderSheetProps {
  onClose: () => void;
}

export function RenderSheet({ onClose }: RenderSheetProps) {
  return (
    <TierGate feature="aiGenerationsPerMonth" featureLabel="Creative Renders (Pro+)">
      <RenderSheetContent onClose={onClose} />
    </TierGate>
  );
}

function RenderSheetContent({ onClose }: RenderSheetProps) {
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const [atmosphere, setAtmosphere] = useState<Atmosphere>('golden_hour');
  const [viewType, setViewType] = useState<ViewType>('exterior_front');
  const [phase, setPhase] = useState<'idle' | 'generating' | 'result' | 'error'>('idle');
  const [renderUrl, setRenderUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const sheetY = useSharedValue(40);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) });
    sheetY.value = withSpring(0, { damping: 22, stiffness: 280 });
  }, [opacity, sheetY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: sheetY.value }],
  }));

  const handleRender = useCallback(async () => {
    if (!blueprint) return;
    setPhase('generating');
    setErrorMsg('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const blueprintMeta = blueprint.metadata ?? {};
      const totalArea = (blueprintMeta as { totalArea?: number }).totalArea
        ?? (blueprint.floors?.[0]?.rooms ?? []).reduce(
          (sum: number, r: { area?: number }) => sum + (r.area ?? 0), 0,
        );
      const roomCount = (blueprint.floors?.[0]?.rooms ?? []).length || blueprintMeta.roomCount || 1;

      const resp = await fetch(`${supabaseUrl}/functions/v1/ai-render`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          blueprintSummary: {
            buildingType: blueprintMeta.buildingType ?? 'house',
            style: blueprintMeta.style ?? 'modern',
            totalArea,
            roomCount,
          },
          atmosphere,
          viewType,
          hemisphere: 'northern',
        }),
      });

      const data = await resp.json() as {
        renderUrl?: string | null;
        error?: string;
        message?: string;
      };

      if (!resp.ok || data.error) {
        throw new Error(data.message ?? data.error ?? 'Render failed');
      }

      setRenderUrl(data.renderUrl ?? null);
      setPhase('result');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to generate render');
      setPhase('error');
    }
  }, [blueprint, atmosphere, viewType]);

  const handleOpenInBrowser = useCallback(() => {
    if (renderUrl) void Linking.openURL(renderUrl);
  }, [renderUrl]);

  const handleTryAgain = useCallback(() => {
    setPhase('idle');
    setRenderUrl(null);
    setErrorMsg('');
  }, []);

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: '92%',
          backgroundColor: DS.colors.surfaceHigh,
          borderTopLeftRadius: DS.radius.modal,
          borderTopRightRadius: DS.radius.modal,
        },
      ]}
    >
      {/* Handle bar */}
      <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: DS.colors.border }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ArchText variant="heading" style={{ fontSize: 20, color: DS.colors.primary }}>
              Creative Render
            </ArchText>
            <View style={{ backgroundColor: `${DS.colors.warning}22`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
              <ArchText variant="body" style={{ fontSize: 10, fontFamily: DS.font.medium, color: DS.colors.warning }}>
                PRO+
              </ArchText>
            </View>
          </View>
          <Pressable onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <ArchText variant="body" style={{ color: DS.colors.primaryGhost, fontSize: 20 }}>✕</ArchText>
          </Pressable>
        </View>

        {/* Atmosphere selector */}
        <ArchText variant="body" style={{ fontFamily: DS.font.medium, fontSize: 11, color: DS.colors.primaryGhost, marginBottom: 10, letterSpacing: 1 }}>
          ATMOSPHERE
        </ArchText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {ATMOSPHERES.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => setAtmosphere(a.id)}
                style={{
                  borderRadius: DS.radius.chip,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  backgroundColor: atmosphere === a.id ? `${DS.colors.accent}22` : DS.colors.surface,
                  borderWidth: 1,
                  borderColor: atmosphere === a.id ? DS.colors.accent : DS.colors.border,
                }}
              >
                <ArchText variant="body" style={{ fontSize: 12, color: atmosphere === a.id ? DS.colors.accent : DS.colors.primaryDim }}>
                  {a.icon} {a.label}
                </ArchText>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* View type selector */}
        <ArchText variant="body" style={{ fontFamily: DS.font.medium, fontSize: 11, color: DS.colors.primaryGhost, marginBottom: 10, letterSpacing: 1 }}>
          VIEW
        </ArchText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {VIEW_TYPES.map((v) => (
            <Pressable
              key={v.id}
              onPress={() => setViewType(v.id)}
              style={{
                borderRadius: DS.radius.chip,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: viewType === v.id ? `${DS.colors.accent}22` : DS.colors.surface,
                borderWidth: 1,
                borderColor: viewType === v.id ? DS.colors.accent : DS.colors.border,
              }}
            >
              <ArchText variant="body" style={{ fontSize: 12, color: viewType === v.id ? DS.colors.accent : DS.colors.primaryDim }}>
                {v.icon} {v.label}
              </ArchText>
            </Pressable>
          ))}
        </View>

        {/* Generate button — shown during idle or error state */}
        {(phase === 'idle' || phase === 'error') && (
          <OvalButton
            label="Generate Render"
            onPress={handleRender}
            variant="filled"
            fullWidth
          />
        )}

        {/* Generating state */}
        {phase === 'generating' && (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <AIProcessingIndicator
              size="large"
              words={RENDER_WORDS}
              interval={3500}
            />
            <ArchText variant="body" style={{ fontFamily: DS.font.medium, fontSize: 14, color: DS.colors.primaryDim, marginTop: 20 }}>
              Rendering...
            </ArchText>
            <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 12, color: DS.colors.primaryGhost, marginTop: 6, textAlign: 'center' }}>
              May take 30–60 seconds
            </ArchText>
          </View>
        )}

        {/* Error state */}
        {phase === 'error' && (
          <View style={{ marginBottom: 16 }}>
            <View style={{
              backgroundColor: `${DS.colors.error}18`,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: `${DS.colors.error}40`,
              marginBottom: 12,
            }}>
              <ArchText variant="body" style={{ fontFamily: DS.font.medium, fontSize: 14, color: DS.colors.error, textAlign: 'center' }}>
                Render Failed
              </ArchText>
              <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 12, color: DS.colors.primaryDim, marginTop: 4, textAlign: 'center' }}>
                {errorMsg}
              </ArchText>
            </View>
            <OvalButton label="Try Again" onPress={handleTryAgain} variant="outline" fullWidth />
          </View>
        )}

        {/* Result state */}
        {phase === 'result' && (
          <View>
            {renderUrl ? (
              <View style={{ marginBottom: 20 }}>
                <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: DS.colors.surface, borderWidth: 1, borderColor: DS.colors.border }}>
                  <Image
                    source={{ uri: renderUrl }}
                    style={{ width: '100%', aspectRatio: 4 / 3 }}
                    resizeMode="cover"
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <OvalButton
                    label="Open Full Image"
                    onPress={handleOpenInBrowser}
                    variant="outline"
                    fullWidth
                  />
                  <OvalButton
                    label="New Render"
                    onPress={handleTryAgain}
                    variant="ghost"
                    fullWidth
                  />
                </View>
              </View>
            ) : (
              <View style={{
                backgroundColor: `${DS.colors.warning}15`,
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: `${DS.colors.warning}40`,
                marginBottom: 16,
                alignItems: 'center',
              }}>
                <ArchText variant="body" style={{ fontSize: 14, color: DS.colors.warning, marginBottom: 6 }}>
                  Render pending
                </ArchText>
                <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 12, color: DS.colors.primaryDim, textAlign: 'center' }}>
                  Prompts generated — Replicate not yet configured. Check back soon.
                </ArchText>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}