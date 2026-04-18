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
import Svg, { Rect, Circle, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { ARScanRing } from './ARScanRing';
import { ARInstructionBubble } from './ARInstructionBubble';
import { calculateScanQuality } from './scanQuality';

export function ARDepthScanMode() {
  return (
    <TierGate feature="arScansPerMonth" featureLabel="AR Depth Scan">
      <ARDepthScanContent />
    </TierGate>
  );
}

type ScanStage = 'idle' | 'scanning';

function ARDepthScanContent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { startSession, stopSession, state } = useARCore();
  const { wallPlanes, floorPlanes, refresh } = useARPlanes();

  const [stage, setStage] = useState<ScanStage>('idle');
  const [capturedWalls, setCapturedWalls] = useState<DetectedPlane[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<{
    blueprint: any;
    roomDimensions: { width: number; length: number };
    roomLabel: string;
    wallCount: number;
    detectedObjects: Array<{ label: string; width: number; length: number }>;
  } | null>(null);

  // Start AR session
  useEffect(() => {
    const init = async () => {
      await startSession();
    };
    init();
    return () => {
      stopSession();
    };
  }, [startSession, stopSession]);

  // Refresh planes while scanning + update prompt every 500ms
  useEffect(() => {
    if (stage !== 'scanning') return;
    const interval = setInterval(refresh, 500);
    return () => clearInterval(interval);
  }, [stage, refresh]);

  const quality = calculateScanQuality(capturedWalls.length);
  const canComplete = capturedWalls.length >= 3;

  const handleStartScan = useCallback(() => {
    setCapturedWalls([]);
    setStage('scanning');
  }, []);

  const handleCapture = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCapturedWalls((prev) => {
      const newWalls = wallPlanes.filter((p) => !prev.some((c) => c.id === p.id));
      return [...prev, ...newWalls];
    });
  }, [wallPlanes]);

  const handleComplete = useCallback(async () => {
    if (capturedWalls.length < 2) return;
    setStage('idle');

    const wallPairs = wallPlanesToWallPairs(capturedWalls);
    const walls = convertPointsToWalls(wallPairs);
    const floorPlane = floorPlanes[0];
    let room;
    if (floorPlane) {
      room = arPlaneToBlueprintRoom(floorPlane, walls.map((w) => w.id));
    } else {
      room = {
        id: `room-${Date.now()}`,
        name: 'Scanned Room',
        type: 'living_room' as const,
        wallIds: walls.map((w) => w.id),
        floorMaterial: 'hardwood' as const,
        ceilingHeight: 2.4,
        ceilingType: 'flat_white' as const,
        area:
          Math.round(
            capturedWalls.reduce((sum, p) => sum + p.extentX * p.extentZ, 0) * 100,
          ) / 100,
        centroid: { x: 0, y: 0 },
      };
    }

    const blueprint = buildBlueprintFromAR(walls, [room], []);
    const xs = walls.flatMap((w) => [w.start.x, w.end.x]);
    const ys = walls.flatMap((w) => [w.start.y, w.end.y]);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);

    setResultData({
      blueprint,
      roomDimensions: { width, length: height },
      roomLabel: room.name,
      wallCount: capturedWalls.length,
      detectedObjects: [],
    });
    setShowResult(true);
  }, [capturedWalls, floorPlanes]);

  const handleReset = useCallback(() => {
    setCapturedWalls([]);
    setShowResult(false);
    setResultData(null);
    setStage('idle');
  }, []);

  const handleOpenInStudio = useCallback(() => {
    if (resultData?.blueprint) {
      useBlueprintStore.getState().actions.loadBlueprint(resultData.blueprint);
      navigation.navigate('Workspace', { fromAR: true });
    }
  }, [resultData, navigation]);

  // Result screen
  if (showResult && resultData) {
    return (
      <ARResultScreen
        visible={true}
        isProcessing={false}
        wallCount={resultData.wallCount}
        roomDimensions={resultData.roomDimensions}
        roomLabel={resultData.roomLabel}
        detectedObjects={resultData.detectedObjects}
        onImportToStudio={handleOpenInStudio}
        onSaveScan={() => {}}
        onScanAgain={handleReset}
      />
    );
  }

  const isScanning = stage === 'scanning';

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Dynamic instruction bubble */}
      <ARInstructionBubble
        prompt={isScanning ? quality.prompt : 'Walk around the room to map walls'}
        wallCount={capturedWalls.length}
        totalWalls={4}
        qualityPercent={isScanning ? quality.qualityPercent : 0}
        step={isScanning ? `Step ${capturedWalls.length} of 4` : undefined}
        position="top"
      />

      {/* Session warning */}
      {!state.isSessionActive && (
        <View
          style={{
            position: 'absolute',
            top: insets.top + 130,
            left: 24,
            right: 24,
            backgroundColor: `${DS.colors.warning}15`,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: `${DS.colors.warning}40`,
          }}
        >
          <ArchText
            variant="body"
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 12,
              color: DS.colors.warning,
              textAlign: 'center',
            }}
          >
            {state.error || 'Starting depth session...'}
          </ArchText>
        </View>
      )}

      {/* Live mini-map */}
      <ScanningMiniMap
        walls={capturedWalls}
        wallCount={capturedWalls.length}
        qualityPercent={quality.qualityPercent}
      />

      {/* Plane overlay */}
      <View style={{ flex: 1, pointerEvents: 'none' }}>
        {wallPlanes.map((plane) => {
          const isCaptured = capturedWalls.some((p) => p.id === plane.id);
          return (
            <View
              key={plane.id}
              style={{
                position: 'absolute',
                left: 80 + plane.centerX * 60,
                top: 200 + plane.centerZ * 60,
                width: Math.max(plane.extentX * 60, 8),
                height: Math.max(plane.extentZ * 60, 8),
                borderWidth: 2,
                borderColor: isCaptured ? DS.colors.success : DS.colors.primary,
                backgroundColor: isCaptured
                  ? `${DS.colors.success}20`
                  : `${DS.colors.primary}10`,
                borderRadius: 4,
              }}
            />
          );
        })}
      </View>

      {/* Bottom controls */}
      <View
        style={{
          position: 'absolute',
          bottom: insets.bottom + 32,
          left: 0,
          right: 0,
          alignItems: 'center',
          gap: 16,
        }}
      >
        <ARScanRing
          isScanning={isScanning}
          onCapture={handleCapture}
          canCapture={isScanning && wallPlanes.length > 0}
        />
        {!isScanning ? (
          <OvalButton label="Start Scan" onPress={handleStartScan} variant="filled" />
        ) : (
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Pressable
              onPress={() => setStage('idle')}
              style={{ paddingHorizontal: 16, paddingVertical: 8, minWidth: 44, minHeight: 44, justifyContent: 'center' }}
            >
              <ArchText
                variant="body"
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  color: DS.colors.primaryGhost,
                }}
              >
                Stop
              </ArchText>
            </Pressable>
            {canComplete && (
              <OvalButton label="Complete Room" onPress={handleComplete} variant="success" />
            )}
          </View>
        )}
      </View>

      {/* Back button */}
      <View style={{ position: 'absolute', top: insets.top + 70, left: 20 }}>
        <OvalButton label="← Back" onPress={() => navigation.goBack()} variant="outline" size="small" />
      </View>
    </View>
  );
}

interface ScanningMiniMapProps {
  walls: DetectedPlane[];
  wallCount: number;
  qualityPercent: number;
}

function ScanningMiniMap({ walls, wallCount, qualityPercent }: ScanningMiniMapProps) {
  const insets = useSafeAreaInsets();
  const SIZE = 88;
  const PAD = 10;

  if (walls.length === 0) {
    return (
      <View
        style={{
          position: 'absolute',
          top: insets.top + 80,
          right: 16,
          width: SIZE + 8,
          height: SIZE + 8,
          backgroundColor: 'rgba(26,26,26,0.94)',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: DS.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={SIZE} height={SIZE}>
          <Rect
            x={PAD}
            y={PAD}
            width={SIZE - PAD * 2}
            height={SIZE - PAD * 2}
            stroke={DS.colors.border}
            strokeWidth="1"
            fill="none"
            strokeDasharray="3 3"
          />
        </Svg>
        <ArchText
          variant="body"
          style={{
            position: 'absolute',
            bottom: 4,
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 8,
            color: DS.colors.primaryGhost,
          }}
        >
          0/4 walls
        </ArchText>
      </View>
    );
  }

  const xs = walls.map((p) => p.centerX);
  const zs = walls.map((p) => p.centerZ);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const rangeX = maxX - minX || 1;
  const rangeZ = maxZ - minZ || 1;
  const scale = Math.min(
    (SIZE - PAD * 2) / rangeX,
    (SIZE - PAD * 2) / rangeZ,
  );

  const toSvg = (x: number, z: number) => ({
    x:
      PAD +
      (x - minX) * scale +
      (SIZE - PAD * 2 - rangeX * scale) / 2,
    y:
      PAD +
      (z - minZ) * scale +
      (SIZE - PAD * 2 - rangeZ * scale) / 2,
  });

  return (
    <View
      style={{
        position: 'absolute',
        top: insets.top + 80,
        right: 16,
        width: SIZE + 8,
        height: SIZE + 8,
        backgroundColor: 'rgba(26,26,26,0.94)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: DS.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={SIZE} height={SIZE}>
        <Rect
          x={PAD}
          y={PAD}
          width={SIZE - PAD * 2}
          height={SIZE - PAD * 2}
          stroke={DS.colors.border}
          strokeWidth="0.8"
          fill={`${DS.colors.primary}06`}
        />
        {walls.map((plane, i) => {
          const center = toSvg(plane.centerX, plane.centerZ);
          const hw = Math.max(plane.extentX * scale, 4);
          const hd = Math.max(plane.extentZ * scale, 4);
          return (
            <Rect
              key={i}
              x={center.x - hw / 2}
              y={center.y - hd / 2}
              width={hw}
              height={hd}
              stroke={DS.colors.success}
              strokeWidth="2"
              fill={`${DS.colors.success}20`}
            />
          );
        })}
        <SvgText
          x={SIZE / 2}
          y={PAD - 1}
          textAnchor="middle"
          fontSize="8"
          fill={DS.colors.primaryGhost}
          fontFamily="JetBrainsMono_400Regular"
        >
          N
        </SvgText>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={2} fill={DS.colors.success} />
      </Svg>
      <ArchText
        variant="body"
        style={{
          position: 'absolute',
          bottom: 4,
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 8,
          color: DS.colors.primaryGhost,
        }}
      >
        {wallCount}/4 walls
      </ArchText>
    </View>
  );
}
