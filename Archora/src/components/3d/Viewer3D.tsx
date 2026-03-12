import React, { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { OrbitControls, Grid, Sky } from '@react-three/drei/native';
import { ProceduralBuilding } from './ProceduralBuilding';
import { CompassRoseLoader } from '../common/CompassRoseLoader';
import { EmptyState } from '../common/EmptyState';
import { use3DScene } from '../../hooks/use3DScene';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useTheme } from '../../hooks/useTheme';
import { BASE_COLORS } from '../../theme/colors';
import { DEFAULT_LIGHTING, gridDimensions } from '../../utils/procedural/sceneHelpers';

interface Viewer3DProps {
  showControls?: boolean;
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={DEFAULT_LIGHTING.ambientIntensity} color={DEFAULT_LIGHTING.ambientColor} />
      <directionalLight
        position={DEFAULT_LIGHTING.sunPosition}
        intensity={DEFAULT_LIGHTING.sunIntensity}
        color={DEFAULT_LIGHTING.sunColor}
        castShadow
      />
      <pointLight
        position={DEFAULT_LIGHTING.fillPosition}
        intensity={DEFAULT_LIGHTING.fillIntensity}
      />
    </>
  );
}

export function Viewer3D({ showControls = true }: Viewer3DProps) {
  const { colors } = useTheme();
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const selectedId = useBlueprintStore((s) => s.selectedId);
  const viewMode = useBlueprintStore((s) => s.viewMode);

  const {
    activeCameraPreset,
    showGrid,
    showShadows,
    showFurniture,
    isRendering,
    setShowGrid,
    setShowShadows,
    setShowFurniture,
    setIsRendering,
  } = use3DScene(viewMode);

  if (!blueprint) {
    return (
      <EmptyState
        title="No Blueprint"
        subtitle="Generate or load a blueprint to view it in 3D."
        icon="◻"
      />
    );
  }

  const grid = gridDimensions(blueprint);
  const cam = activeCameraPreset ?? { position: [10, 8, 10] as [number, number, number], target: [0, 0, 0] as [number, number, number], fov: 45 };

  return (
    <View style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
      <Canvas
        shadows={showShadows}
        camera={{ position: cam.position, fov: cam.fov, near: 0.1, far: 500 }}
        style={{ flex: 1 }}
        onCreated={() => setIsRendering(true)}
      >
        <SceneLighting />
        <Sky sunPosition={DEFAULT_LIGHTING.sunPosition} />

        {showGrid ? (
          <Grid
            args={[grid.size, grid.divisions]}
            cellColor={BASE_COLORS.border}
            sectionColor={colors.primaryDim}
          />
        ) : null}

        <ProceduralBuilding
          blueprint={blueprint}
          selectedId={selectedId}
          showFurniture={showFurniture}
        />

        {viewMode !== 'FirstPerson' ? (
          <OrbitControls
            enableZoom
            enablePan
            enableRotate
            minDistance={2}
            maxDistance={60}
            maxPolarAngle={Math.PI / 2 - 0.05}
            target={cam.target}
          />
        ) : null}
      </Canvas>

      {/* Overlay controls */}
      {showControls ? (
        <View
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            gap: 6,
          }}
        >
          {[
            { label: showGrid ? 'Grid ✓' : 'Grid', onPress: () => setShowGrid(!showGrid) },
            { label: showShadows ? 'Shad ✓' : 'Shad', onPress: () => setShowShadows(!showShadows) },
            { label: showFurniture ? 'Furn ✓' : 'Furn', onPress: () => setShowFurniture(!showFurniture) },
          ].map(({ label, onPress }) => (
            <TouchableOpacity
              key={label}
              onPress={onPress}
              style={{
                backgroundColor: BASE_COLORS.surface + 'CC',
                borderRadius: 6,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: BASE_COLORS.border,
              }}
            >
              <Text
                style={{
                  fontFamily: 'JetBrainsMono_400Regular',
                  fontSize: 10,
                  color: BASE_COLORS.textSecondary,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}
