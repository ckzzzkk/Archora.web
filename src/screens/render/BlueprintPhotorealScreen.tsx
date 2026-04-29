/**
 * BlueprintPhotorealScreen — Architect-tier photorealistic 3D viewer.
 * Displays a GLTF rendered by Blender from the user's blueprint.
 */
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArchText } from '../../components/common/ArchText';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { GltfFurniture } from '../../components/3d/GltfFurniture';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { DS } from '../../theme/designSystem';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BlueprintPhotoreal'>;

export function BlueprintPhotorealScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { gltfUrl } = route.params;
  const [loading, setLoading] = useState(true);
  const blueprint = useBlueprintStore((s) => s.blueprint);

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
      {/* Header */}
      <View style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: DS.colors.surfaceHigh + 'CC',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: DS.colors.border,
          }}
        >
          <Text style={{ color: DS.colors.primary, fontSize: 18 }}>←</Text>
        </Pressable>

        <ArchText variant="heading" style={{ fontSize: 16 }}>
          Photorealistic View
        </ArchText>

        <View style={{ width: 40 }} />
      </View>

      {/* 3D Canvas */}
      {loading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: DS.colors.background }}>
          <CompassRoseLoader size="large" />
          <Text style={{ color: DS.colors.mutedForeground, marginTop: 12, fontSize: 13 }}>
            Loading model...
          </Text>
        </View>
      )}

      <Canvas
        style={{ flex: 1 }}
        camera={{ position: [12, 10, 12], fov: 45, near: 0.1, far: 1000 }}
        onCreated={() => setLoading(false)}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} color="#FFFFFF" />
        <directionalLight
          position={[8, 10, 6]}
          intensity={1.2}
          color="#FFF5E4"
          castShadow
        />
        <pointLight position={[0, 5, 0]} intensity={0.3} />

        {/* Photorealistic GLTF */}
        <GltfFurniture
          url={gltfUrl}
          position={[0, 0, 0]}
          rotation={0}
          scale={1}
        />
      </Canvas>

      {/* Footer info */}
      <View style={{
        position: 'absolute',
        bottom: insets.bottom + 16,
        left: 16,
        right: 16,
        alignItems: 'center',
      }}>
        <View style={{
          backgroundColor: DS.colors.surfaceHigh + 'CC',
          borderRadius: 20,
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: DS.colors.border,
        }}>
          <Text style={{ color: DS.colors.primaryGhost, fontSize: 11 }}>
            {blueprint?.metadata.buildingType ?? 'Blueprint'} · Photorealistic Render
          </Text>
        </View>
      </View>
    </View>
  );
}
