import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Line, Rect, Text as SvgText, Polygon, Circle } from 'react-native-svg';
import { ArchText } from '../common/ArchText';
import { OvalButton } from '../common/OvalButton';
import { TierGate } from '../common/TierGate';
import { DS } from '../../theme/designSystem';
import { useARCore, useARPlanes } from '../../hooks/useARCore';
import type { DetectedPlane } from '../../native/ARCoreModule';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { buildBlueprintFromAR } from '../../utils/ar/arToBlueprintConverter';
import { wallPlanesToWallPairs, arPlaneToBlueprintRoom } from '../../utils/ar/arToBlueprintConverter';
import { convertPointsToWalls } from '../../utils/ar/scanConverter';
import { ARResultScreen } from './ARResultScreen';
import { ARInstructionBubble } from './ARInstructionBubble';

export function ARDepthScanMode() {
  return (
    <TierGate feature="arScansPerMonth" featureLabel="AR Depth Scan">
      <ARDepthScanContent />
    </TierGate>
  );
}

function ARDepthScanContent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { startSession, stopSession, state } = useARCore();
  const { wallPlanes, floorPlanes, refresh } = useARPlanes();

  const [isScanning, setIsScanning] = useState(false);
  const [capturedPlanes, setCapturedPlanes] = useState<DetectedPlane[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  // Start AR session
  useEffect(() => {
    const initSession = async () => {
      await startSession();
    };
    initSession();

    return () => {
      stopSession();
    };
  }, [startSession, stopSession]);

  // Auto-refresh planes while scanning
  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(() => {
      refresh();
    }, 500);

    return () => clearInterval(interval);
  }, [isScanning, refresh]);

  const handleStartScan = useCallback(() => {
    setIsScanning(true);
    setCapturedPlanes([]);
  }, []);

  const handleCapture = useCallback(() => {
    // Merge current wall planes with captured ones
    setCapturedPlanes((prev) => {
      const newPlanes = [...prev];
      wallPlanes.forEach((plane) => {
        if (!newPlanes.some((p) => p.id === plane.id)) {
          newPlanes.push(plane);
        }
      });
      return newPlanes;
    });
  }, [wallPlanes]);

  const handleComplete = useCallback(async () => {
    setIsScanning(false);

    if (capturedPlanes.length < 2) {
      // Not enough planes captured
      return;
    }

    // Convert planes to walls
    const wallPairs = wallPlanesToWallPairs(capturedPlanes);
    const walls = convertPointsToWalls(wallPairs);

    // Get floor plane for room dimensions
    const floorPlane = floorPlanes[0];
    let room;

    if (floorPlane) {
      room = arPlaneToBlueprintRoom(floorPlane, walls.map((w) => w.id));
    } else {
      // Estimate from walls
      room = {
        id: `room-${Date.now()}`,
        name: 'Scanned Room',
        type: 'living_room' as const,
        wallIds: walls.map((w) => w.id),
        floorMaterial: 'hardwood' as const,
        ceilingHeight: 2.4,
        ceilingType: 'flat_white' as const,
        area: Math.round(
          capturedPlanes.reduce((sum, p) => sum + p.extentX * p.extentZ, 0) * 100
        ) / 100,
        centroid: { x: 0, y: 0 },
      };
    }

    const blueprint = buildBlueprintFromAR(walls, [room], []);

    // Calculate dimensions
    const xs = walls.flatMap((w) => [w.start.x, w.end.x]);
    const ys = walls.flatMap((w) => [w.start.y, w.end.y]);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    const area = width * height;

    setScanResult({
      blueprint,
      dimensions: { width, height, area },
      roomType: room.type,
      pointCount: walls.length,
    });

    setShowResult(true);
  }, [capturedPlanes, floorPlanes]);

  const handleReset = useCallback(() => {
    setCapturedPlanes([]);
    setShowResult(false);
    setScanResult(null);
    setIsScanning(false);
  }, []);

  const handleOpenInStudio = useCallback(() => {
    if (scanResult?.blueprint) {
      useBlueprintStore.getState().actions.loadBlueprint(scanResult.blueprint);
      navigation.navigate('Workspace', { fromAR: true });
    }
  }, [scanResult, navigation]);

  if (showResult && scanResult) {
    return (
      <ARResultScreen
        result={scanResult}
        onOpenInStudio={handleOpenInStudio}
        onScanAgain={handleReset}
        onBack={() => navigation.goBack()}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Instructions */}
      <ARInstructionBubble
        instruction={
          isScanning
            ? `Detected ${capturedPlanes.length} walls`
            : 'Auto-detect walls as you walk around'
        }
        hint={
          isScanning
            ? 'Tap Capture to save detected walls'
            : 'Requires Depth API capable device'
        }
        step={isScanning ? `Walls: ${capturedPlanes.length}` : undefined}
      />

      {/* Session status */}
      {!state.isSessionActive && (
        <View
          style={{
            position: 'absolute',
            top: 200,
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
            {state.error || 'Starting depth-enabled AR session...'}
          </ArchText>
        </View>
      )}

      {/* Plane visualization */}
      <View style={{ flex: 1, pointerEvents: 'none' }}>
        <PlaneOverlay planes={wallPlanes} captured={capturedPlanes} />
      </View>

      {/* Mini map */}
      <PlaneMiniMap planes={capturedPlanes} />

      {/* Action buttons */}
      <View
        style={{
          position: 'absolute',
          bottom: 48,
          left: 20,
          right: 20,
          gap: 10,
        }}
      >
        {!isScanning ? (
          <OvalButton label="Start Scan" onPress={handleStartScan} variant="filled" fullWidth />
        ) : (
          <>
            <OvalButton label="Capture Wall" onPress={handleCapture} variant="filled" fullWidth />
            {capturedPlanes.length >= 2 && (
              <OvalButton label="Complete Room" onPress={handleComplete} variant="success" fullWidth />
            )}
            <OvalButton label="Stop Scan" onPress={() => setIsScanning(false)} variant="ghost" fullWidth />
          </>
        )}
      </View>

      {/* Back button */}
      <View style={{ position: 'absolute', top: 60, left: 20 }}>
        <OvalButton label="← Back" onPress={() => navigation.goBack()} variant="outline" size="small" />
      </View>
    </View>
  );
}


interface PlaneOverlayProps {
  planes: DetectedPlane[];
  captured: DetectedPlane[];
}

function PlaneOverlay({ planes, captured }: PlaneOverlayProps) {
  return (
    <View style={{ flex: 1, pointerEvents: 'none' }}>
      {planes.map((plane) => {
        const isCaptured = captured.some((p) => p.id === plane.id);

        // Convert 3D plane to 2D visualization
        // This is a simplified visualization - in production, use proper projection
        const screenX = 100 + plane.centerX * 50;
        const screenY = 200 + plane.centerZ * 50;
        const width = plane.extentX * 50;
        const height = plane.extentZ * 50;

        return (
          <View
            key={plane.id}
            style={{
              position: 'absolute',
              left: screenX - width / 2,
              top: screenY - height / 2,
              width,
              height,
              borderWidth: 2,
              borderColor: isCaptured ? DS.colors.success : DS.colors.primary,
              backgroundColor: isCaptured
                ? `${DS.colors.success}20`
                : `${DS.colors.primary}15`,
            }}
          >
            <ArchText
              variant="body"
              style={{
                fontFamily: DS.font.mono,
                fontSize: 9,
                color: isCaptured ? DS.colors.success : DS.colors.primary,
                textAlign: 'center',
              }}
            >
              {isCaptured ? '✓ ' : ''}
              {plane.type}
            </ArchText>
          </View>
        );
      })}
    </View>
  );
}


interface PlaneMiniMapProps {
  planes: DetectedPlane[];
}

function PlaneMiniMap({ planes }: PlaneMiniMapProps) {
  if (planes.length === 0) return null;

  const SIZE = 88;
  const PAD = 8;
  const inner = SIZE - PAD * 2;

  // Find bounds
  const xs = planes.map((p) => p.centerX);
  const zs = planes.map((p) => p.centerZ);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const rangeX = maxX - minX || 1;
  const rangeZ = maxZ - minZ || 1;
  const scale = (inner - PAD) / Math.max(rangeX, rangeZ);

  const normalize = (p: DetectedPlane) => ({
    x: PAD + (p.centerX - minX) * scale + (inner - rangeX * scale) / 2,
    y: PAD + (p.centerZ - minZ) * scale + (inner - rangeZ * scale) / 2,
    width: Math.max(p.extentX * scale, 4),
    height: Math.max(p.extentZ * scale, 4),
  });

  return (
    <View
      style={{
        position: 'absolute',
        top: 160,
        right: 16,
        width: SIZE + 8,
        height: SIZE + 8,
        backgroundColor: 'rgba(26,26,26,0.92)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: DS.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={SIZE} height={SIZE}>
        {planes.map((plane) => {
          const pos = normalize(plane);
          return (
            <Rect
              key={plane.id}
              x={pos.x - pos.width / 2}
              y={pos.y - pos.height / 2}
              width={pos.width}
              height={pos.height}
              fill={`${DS.colors.primary}20`}
              stroke={DS.colors.primary}
              strokeWidth="1"
            />
          );
        })}
        {/* Center point */}
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={3} fill={DS.colors.success} />
      </Svg>
      <ArchText
        variant="body"
        style={{
          position: 'absolute',
          bottom: 4,
          fontFamily: DS.font.mono,
          fontSize: 8,
          color: DS.colors.primaryGhost,
        }}
      >
        {planes.length} planes
      </ArchText>
    </View>
  );
}
