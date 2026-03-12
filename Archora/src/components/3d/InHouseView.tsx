import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, PanResponder } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import * as THREE from 'three';
import { ProceduralBuilding } from './ProceduralBuilding';
import { CompassRoseLoader } from '../common/CompassRoseLoader';
import { EmptyState } from '../common/EmptyState';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useTheme } from '../../hooks/useTheme';
import { BASE_COLORS } from '../../theme/colors';
import { computeFirstPersonPreset } from '../../utils/procedural/sceneHelpers';
import { DEFAULT_LIGHTING } from '../../utils/procedural/sceneHelpers';

/** First-person camera controller */
function FirstPersonCamera({ yaw, pitch }: { yaw: React.MutableRefObject<number>; pitch: React.MutableRefObject<number> }) {
  const { camera } = useThree();

  useFrame(() => {
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;
  });

  return null;
}

interface InHouseViewProps {
  onExit?: () => void;
}

export function InHouseView({ onExit }: InHouseViewProps) {
  const { colors } = useTheme();
  const blueprint = useBlueprintStore((s) => s.blueprint);

  const yaw = useRef(0);
  const pitch = useRef(0);
  const lastTouch = useRef<{ x: number; y: number } | null>(null);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      lastTouch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
    },
    onPanResponderMove: (e) => {
      if (!lastTouch.current) return;
      const dx = e.nativeEvent.pageX - lastTouch.current.x;
      const dy = e.nativeEvent.pageY - lastTouch.current.y;
      yaw.current -= dx * 0.003;
      pitch.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch.current - dy * 0.003));
      lastTouch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
    },
    onPanResponderRelease: () => {
      lastTouch.current = null;
    },
  });

  if (!blueprint) {
    return <EmptyState title="No Blueprint" subtitle="Load a blueprint to walk through it." />;
  }

  const preset = computeFirstPersonPreset(blueprint);

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <Canvas
        camera={{ position: preset.position, fov: preset.fov, near: 0.1, far: 200 }}
        style={{ flex: 1 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={DEFAULT_LIGHTING.sunPosition} intensity={1} castShadow />

        <FirstPersonCamera yaw={yaw} pitch={pitch} />

        <ProceduralBuilding
          blueprint={blueprint}
          showFurniture
        />
      </Canvas>

      {/* HUD */}
      <View style={{ position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
        <View
          style={{
            backgroundColor: BASE_COLORS.surface + 'CC',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: BASE_COLORS.border,
          }}
        >
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: colors.primary }}>
            FIRST PERSON
          </Text>
        </View>

        {onExit ? (
          <TouchableOpacity
            onPress={onExit}
            style={{
              backgroundColor: BASE_COLORS.surface + 'CC',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: BASE_COLORS.border,
            }}
          >
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: BASE_COLORS.textSecondary }}>
              EXIT ✕
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Crosshair */}
      <View
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginLeft: -8,
          marginTop: -8,
          width: 16,
          height: 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        pointerEvents="none"
      >
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, lineHeight: 16 }}>+</Text>
      </View>
    </View>
  );
}
