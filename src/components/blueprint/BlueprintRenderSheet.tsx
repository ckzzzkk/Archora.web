/**
 * BlueprintRenderSheet — Architect-tier photorealistic 3D render.
 * Renders the blueprint as a GLTF via Blender headless and shows the result.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { ArchText } from '../common/ArchText';
import { CompassRoseLoader } from '../common/CompassRoseLoader';
import { DS } from '../../theme/designSystem';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { supabase, supabaseUrl, supabaseAnonKey } from '../../lib/supabase';

type RenderStatus = 'idle' | 'rendering' | 'done' | 'failed';

interface BlueprintRenderSheetProps {
  onClose: () => void;
}

export function BlueprintRenderSheet({ onClose }: BlueprintRenderSheetProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const projectId = useBlueprintStore((s) => s.blueprint?.id);
  const [status, setStatus] = useState<RenderStatus>('idle');
  const [gltfUrl, setGltfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const translateY = useSharedValue(400);

  React.useEffect(() => {
    translateY.value = withSpring(0, { damping: 20 });
    return () => { translateY.value = withTiming(400, { duration: 200 }); };
  }, []);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleRender = useCallback(async () => {
    if (!projectId) return;
    setStatus('rendering');
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const resp = await fetch(`${supabaseUrl}/functions/v1/render-blueprint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ blueprintId: projectId }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message ?? 'Render request failed');
      }

      const { gltfUrl } = await resp.json() as { taskId: string; gltfUrl: string; projectId: string };

      if (!gltfUrl) throw new Error('No GLTF URL returned');

      setGltfUrl(gltfUrl);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('failed');
    }
  }, [projectId]);

  return (
    <Animated.View
      style={[
        sheetStyle,
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: DS.colors.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
          borderTopWidth: 1,
          borderColor: DS.colors.border,
        },
      ]}
    >
      <ArchText variant="heading" style={{ marginBottom: 4 }}>
        Photorealistic View
      </ArchText>
      <Text style={{ color: DS.colors.mutedForeground, fontSize: 13, marginBottom: 20 }}>
        Generate a photorealistic 3D mesh of your blueprint using AI reconstruction.
      </Text>

      {status === 'idle' && (
        <Pressable
          onPress={handleRender}
          style={{
            backgroundColor: DS.colors.amber,
            borderRadius: 50,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: DS.colors.background, fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>
            Render Photorealistic 3D
          </Text>
        </Pressable>
      )}

      {status === 'rendering' && (
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <CompassRoseLoader size="large" />
          <Text style={{ color: DS.colors.mutedForeground, marginTop: 12, fontSize: 13 }}>
            Rendering your blueprint...
          </Text>
          <Text style={{ color: DS.colors.primaryGhost, fontSize: 11, marginTop: 4 }}>
            This may take a few minutes
          </Text>
        </View>
      )}

      {status === 'done' && gltfUrl && (
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Text style={{ color: DS.colors.success, fontSize: 14, marginBottom: 12 }}>
            Render complete!
          </Text>
          <Pressable
            onPress={() => {
              if (gltfUrl) {
                navigation.navigate('BlueprintPhotoreal', { gltfUrl });
              }
            }}
            style={{
              backgroundColor: DS.colors.success,
              borderRadius: 50,
              paddingVertical: 14,
              paddingHorizontal: 32,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: DS.colors.background, fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>
              View in 3D
            </Text>
          </Pressable>
        </View>
      )}

      {status === 'failed' && (
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Text style={{ color: DS.colors.error, fontSize: 13, marginBottom: 12 }}>
            {error ?? 'Render failed'}
          </Text>
          <Pressable
            onPress={() => setStatus('idle')}
            style={{
              borderWidth: 1, borderColor: DS.colors.border,
              borderRadius: 50, paddingVertical: 10, paddingHorizontal: 24,
            }}
          >
            <Text style={{ color: DS.colors.primary }}>Try Again</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}
