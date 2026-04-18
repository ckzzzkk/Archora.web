import React, { useState, useCallback } from 'react';
import { View, Pressable, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { ArchText } from '../common/ArchText';
import { OvalButton } from '../common/OvalButton';
import { TierGate } from '../common/TierGate';
import { DS } from '../../theme/designSystem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useARCore } from '../../hooks/useARCore';
import type { Vector3D } from '../../native/ARCoreModule';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { buildBlueprintFromAR } from '../../utils/ar/arToBlueprintConverter';
import { convertPointsToWalls, detectRoomTypeFromDimensions } from '../../utils/ar/scanConverter';
import { getSuggestedFurnitureForRoom } from '../../utils/ar/furnitureSuggestions';
import {
  Crosshair,
  AnchorPin,
  MeasurementLine,
  ProximityRing,
  FloorPlanMiniMap,
} from './ARMeasurementOverlay';
import { ARInstructionBubble } from './ARInstructionBubble';
import { ARResultScreen } from './ARResultScreen';

interface PlacedPoint {
  id: string;
  screenPos: { x: number; y: number };
  worldPos: Vector3D;
}

export function ARManualMeasureMode() {
  return (
    <TierGate feature="arMeasure" featureLabel="AR Measure">
      <ARManualMeasureContent />
    </TierGate>
  );
}

function ARManualMeasureContent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { hitTest, startSession, stopSession, distanceBetween, state } = useARCore();
  const [points, setPoints] = useState<PlacedPoint[]>([]);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const CLOSE_RADIUS = 40; // pixels

  // Start AR session
  React.useEffect(() => {
    const initSession = async () => {
      const success = await startSession();
      setIsSessionStarted(success);
    };
    initSession();

    return () => {
      stopSession();
    };
  }, [startSession, stopSession]);

  const handleTap = useCallback(
    async (x: number, y: number) => {
      if (!isSessionStarted) return;

      // Check if closing the room (tapping near first point with 3+ points)
      if (points.length >= 3) {
        const firstPoint = points[0];
        const dist = Math.sqrt(
          Math.pow(x - firstPoint.screenPos.x, 2) +
          Math.pow(y - firstPoint.screenPos.y, 2)
        );

        if (dist <= CLOSE_RADIUS) {
          // Close the room
          finalizeRoom();
          return;
        }
      }

      // Perform hit test
      const worldPos = await hitTest(x, y);
      if (!worldPos) return;

      const newPoint: PlacedPoint = {
        id: `point-${Date.now()}`,
        screenPos: { x, y },
        worldPos,
      };

      setPoints((prev) => [...prev, newPoint]);
    },
    [isSessionStarted, points, hitTest]
  );

  const buildAndShowResult = useCallback(async (roomName: string) => {
    if (points.length < 3) return;

    const wallPairs: { p1: Vector3D; p2: Vector3D }[] = [];
    const distances: number[] = [];

    for (let i = 0; i < points.length; i++) {
      const current = points[i].worldPos;
      const next = points[(i + 1) % points.length].worldPos;
      wallPairs.push({ p1: current, p2: next });
      distances.push(await distanceBetween(current, next));
    }

    const walls = convertPointsToWalls(wallPairs);
    const roomDimensions = calculateRoomDimensions(distances);
    const roomType = detectRoomTypeFromDimensions(roomDimensions.area);
    const furniture = getSuggestedFurnitureForRoom(roomType, roomDimensions);

    const blueprint = buildBlueprintFromAR(
      walls,
      [
        {
          id: `room-${Date.now()}`,
          name: roomName.trim() || 'Scanned Room',
          type: roomType,
          wallIds: walls.map((w) => w.id),
          floorMaterial: 'hardwood',
          ceilingHeight: 2.4,
          ceilingType: 'flat_white',
          area: roomDimensions.area,
          centroid: calculateCentroid(points.map((p) => p.worldPos)),
        },
      ],
      furniture
    );

    setScanResult({
      blueprint,
      dimensions: roomDimensions,
      roomType,
      pointCount: points.length,
    });
    setShowResult(true);
  }, [points, distanceBetween]);

  const finalizeRoom = useCallback(() => {
    if (points.length < 3) return;

    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Name Your Room',
        'What is this room called?',
        (name) => { void buildAndShowResult(name ?? 'Living Room'); },
        'plain-text',
        'Living Room',
      );
    } else {
      // Android: default name, proceed directly
      void buildAndShowResult('Living Room');
    }
  }, [points.length, buildAndShowResult]);

  const handleReset = useCallback(() => {
    setPoints([]);
    setShowResult(false);
    setScanResult(null);
  }, []);

  const handleOpenInStudio = useCallback(() => {
    if (scanResult?.blueprint) {
      useBlueprintStore.getState().actions.loadBlueprint(scanResult.blueprint);
      navigation.navigate('Workspace', { fromAR: true });
    }
  }, [scanResult, navigation]);

  const handleBack = useCallback(() => {
    stopSession();
    navigation.goBack();
  }, [stopSession, navigation]);

  // Calculate measurements between consecutive points
  const measurements = points.slice(0, -1).map((p, i) => ({
    p1: p.screenPos,
    p2: points[i + 1].screenPos,
    distance: Math.sqrt(
      Math.pow(points[i + 1].screenPos.x - p.screenPos.x, 2) +
      Math.pow(points[i + 1].screenPos.y - p.screenPos.y, 2)
    ) / 100, // rough conversion to meters
  }));

  if (showResult && scanResult) {
    return (
      <ARResultScreen
        result={scanResult}
        onOpenInStudio={handleOpenInStudio}
        onScanAgain={handleReset}
        onBack={handleBack}
      />
    );
  }

  return (
    <Pressable
      style={{ flex: 1, backgroundColor: 'transparent' }}
      onPress={(e) => handleTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}
    >
      {/* Instructions */}
      <ARInstructionBubble
        prompt={
          points.length === 0
            ? 'Tap to place first corner'
            : points.length < 3
            ? `Corner ${points.length + 1} — tap next corner`
            : 'Tap near first corner to close room'
        }
        wallCount={points.length}
        totalWalls={4}
        qualityPercent={Math.min((points.length / 4) * 100, 100)}
        step={points.length > 0 ? `Corner ${points.length}` : undefined}
      />

      {/* Session status */}
      {!isSessionStarted && (
        <View
          style={{
            position: 'absolute',
            top: insets.top + 120,
            left: 24,
            right: 24,
            backgroundColor: 'rgba(34,34,34,0.9)',
            borderRadius: DS.radius.card,
            padding: 16,
            borderWidth: 1,
            borderColor: DS.colors.warning,
          }}
        >
          <ArchText
            variant="body"
            style={{
              fontFamily: DS.font.medium,
              fontSize: 14,
              color: DS.colors.warning,
              textAlign: 'center',
            }}
          >
            {state.error || 'Starting AR session...'}
          </ArchText>
        </View>
      )}

      {/* Floor plan mini-map */}
      <FloorPlanMiniMap points={points.map((p) => p.screenPos)} />

      {/* Crosshair at center */}
      {isSessionStarted && points.length === 0 && (
        <Crosshair x={200} y={350} />
      )}

      {/* Anchor pins */}
      {points.map((point, index) => (
        <AnchorPin
          key={point.id}
          x={point.screenPos.x}
          y={point.screenPos.y}
          label={String(index + 1)}
          isFirst={index === 0}
        />
      ))}

      {/* Proximity ring for closing */}
      {points.length >= 3 && (
        <ProximityRing
          x={points[0].screenPos.x}
          y={points[0].screenPos.y}
          radius={CLOSE_RADIUS}
        />
      )}

      {/* Measurement lines */}
      {measurements.map((m, i) => (
        <MeasurementLine
          key={i}
          p1={m.p1}
          p2={m.p2}
          distance={m.distance}
        />
      ))}

      {/* Action buttons */}
      {points.length > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: insets.bottom + 24,
            left: 20,
            right: 20,
            gap: 10,
          }}
        >
          {points.length >= 3 ? (
            <OvalButton
              label="Complete Room"
              onPress={finalizeRoom}
              variant="success"
              fullWidth
            />
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 4 }}>
              <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 11, color: DS.colors.primaryDim }}>
                {points.length}/3 walls minimum
              </ArchText>
            </View>
          )}
          <OvalButton
            label="Reset"
            onPress={handleReset}
            variant="ghost"
            fullWidth
          />
        </View>
      )}

      {/* Back button */}
      <View style={{ position: 'absolute', top: insets.top + 16, left: 20 }}>
        <OvalButton label="← Back" onPress={handleBack} variant="outline" size="small" />
      </View>
    </Pressable>
  );
}

// Helper functions
function calculateRoomDimensions(distances: number[]): {
  width: number;
  height: number;
  area: number;
} {
  // Use largest distances as width/height estimate
  const sorted = [...distances].sort((a, b) => b - a);
  const width = sorted[0] || 0;
  const height = sorted[1] || 0;
  return {
    width: Math.round(width * 10) / 10,
    height: Math.round(height * 10) / 10,
    area: Math.round(width * height * 100) / 100,
  };
}

function calculateCentroid(points: Vector3D[]): { x: number; y: number } {
  const sum = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );
  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  };
}
