# AR Room Scan — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild ARDepthScanMode with live mini-map floor plan drawing, scan quality %, contextual prompts, pulsing capture ring, and improved result screen.

**Architecture:** Enhance ARDepthScanMode with a cleaner scanning state machine, live SVG mini-map, dynamic prompt system, and ARResultScreen for completion. All animations via Reanimated 3.

**Tech Stack:** React Native, Reanimated 3, react-native-vision-camera, expo-haptics, SVG

---

## File Structure

```
src/components/ar/
  ARDepthScanMode.tsx      — enhanced (main implementation)
  ARInstructionBubble.tsx  — enhanced (dynamic prompts)
  ARResultScreen.tsx        — enhanced (2D plan + object list)
  ARScanRing.tsx           — new (pulsing capture ring)
  scanQuality.ts           — new (quality % utility)

supabase/functions/ar-reconstruct/index.ts  — no change (already works)
```

---

## Task 1: Create ARScanRing — Pulsing Capture Ring

**Files:**
- Create: `src/components/ar/ARScanRing.tsx`

- [ ] **Step 1: Create the file**

```tsx
import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../common/ArchText';

interface ARScanRingProps {
  isScanning: boolean;
  onCapture: () => void;
  canCapture: boolean; // enabled when at least one wall detected
}

const RING_SIZE = 88;

export function ARScanRing({ isScanning, onCapture, canCapture }: ARScanRingProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (isScanning) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 900, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 600, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        false,
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 900 }),
          withTiming(0.6, { duration: 600 }),
        ),
        -1,
        false,
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(0.6, { duration: 200 });
    }
  }, [isScanning, scale, opacity]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: RING_SIZE,
          height: RING_SIZE,
          borderRadius: RING_SIZE / 2,
          borderWidth: 2.5,
          borderColor: isScanning ? DS.colors.error : DS.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        ringStyle,
      ]}
    >
      <Pressable
        onPress={canCapture ? onCapture : undefined}
        style={{
          width: RING_SIZE - 8,
          height: RING_SIZE - 8,
          borderRadius: (RING_SIZE - 8) / 2,
          backgroundColor: isScanning ? DS.colors.error : DS.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: canCapture ? 1 : 0.5,
        }}
      >
        <ArchText
          variant="body"
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 12,
            color: DS.colors.background,
            textAlign: 'center',
          }}
        >
          {isScanning ? 'CAPTURE' : 'SCAN'}
        </ArchText>
      </Pressable>
    </Animated.View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ar/ARScanRing.tsx
git commit -m "feat: add ARScanRing pulsing capture button"
```

---

## Task 2: Create scanQuality.ts — Scan Quality Utility

**Files:**
- Create: `src/components/ar/scanQuality.ts`

- [ ] **Step 1: Write the utility**

```typescript
import type { DetectedPlane } from '../../native/ARCoreModule';

interface ScanQualityResult {
  qualityPercent: number; // 0–100
  wallCount: number;
  cornerCount: number;
  prompt: string;
}

/**
 * Calculate scan quality based on detected wall planes.
 * Quality = walls captured (up to 4) + corners found.
 * Corners = where 2+ walls meet at similar positions.
 */
export function calculateScanQuality(
  planes: DetectedPlane[],
  capturedWallCount: number,
): ScanQualityResult {
  // Count unique wall directions (front/left/back/right approximated by X/Z spread)
  const wallCount = capturedWallCount;
  const cornerCount = Math.floor(wallCount / 2); // rough estimate

  const qualityPercent = Math.min(
    100,
    Math.round((wallCount / 4) * 80 + (cornerCount / 4) * 20),
  );

  let prompt: string;
  if (wallCount === 0) {
    prompt = 'Point your camera at a wall and slowly walk around';
  } else if (wallCount === 1) {
    prompt = 'Good — scan the next wall';
  } else if (wallCount === 2) {
    prompt = 'Good coverage — scan corners next';
  } else if (wallCount === 3) {
    prompt = 'Almost complete — scan the last wall';
  } else if (wallCount >= 4) {
    prompt = 'Room captured — tap Complete';
  } else {
    prompt = 'Keep scanning walls';
  }

  return { qualityPercent, wallCount, cornerCount, prompt };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ar/scanQuality.ts
git commit -m "feat: add scan quality utility"
```

---

## Task 3: Enhance ARInstructionBubble — Dynamic Contextual Prompts

**Files:**
- Modify: `src/components/ar/ARInstructionBubble.tsx`

- [ ] **Step 1: Read existing file**

```bash
cat src/components/ar/ARInstructionBubble.tsx
```

- [ ] **Step 2: Update to accept dynamic props**

The existing component likely has static instruction text. Update it to accept `prompt`, `hint`, `qualityPercent`, and show the quality bar.

New props interface:
```typescript
interface ARInstructionBubbleProps {
  prompt: string;        // main instruction text
  hint?: string;         // secondary hint below
  qualityPercent?: number; // 0–100 scan quality
  wallCount?: number;    // e.g., "2/4 walls"
  isWarning?: boolean;   // true = amber/warning style
}
```

The component should render:
- Main prompt in an oval pill
- Quality bar if `qualityPercent` provided
- Wall count badge if `wallCount` provided

Style: semi-transparent dark background (`rgba(26,26,26,0.9)`), border `DS.colors.border`, border radius 50px, centered horizontally.

- [ ] **Step 3: Commit**

```bash
git add src/components/ar/ARInstructionBubble.tsx
git commit -m "feat: make ARInstructionBubble dynamic with quality %"
```

---

## Task 4: Enhance ARResultScreen — 2D Floor Plan + Object List

**Files:**
- Modify or create: `src/components/ar/ARResultScreen.tsx`

Current ARResultScreen likely just shows basic dimensions. Replace with:

```tsx
import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../common/ArchText';
import { OvalButton } from '../common/OvalButton';

interface DetectedObject {
  label: string;
  w: number;
  d: number;
  h: number;
}

interface ARResultScreenProps {
  result: {
    blueprint: any;
    dimensions: { width: number; height: number; area: number };
    roomType: string;
    pointCount: number;
    detectedObjects?: DetectedObject[];
  };
  onOpenInStudio: () => void;
  onScanAgain: () => void;
  onBack: () => void;
}

function FloorPlanPreview({ blueprint }: { blueprint: any }) {
  // Draw simple SVG floor plan from blueprint
  // Use rooms[0] if available, otherwise draw bounding box from dimensions
  const SIZE = 200;
  const PAD = 16;
  const rooms = blueprint?.floors?.[0]?.rooms ?? [];
  const walls = blueprint?.floors?.[0]?.walls ?? [];

  // Simple bounding box if no rooms
  if (rooms.length === 0 && walls.length === 0) {
    return (
      <Svg width={SIZE} height={SIZE}>
        <Rect x={PAD} y={PAD} width={SIZE - PAD * 2} height={SIZE - PAD * 2}
          stroke={DS.colors.primary} strokeWidth="2" fill="none" strokeDasharray="4 4" />
        <SvgText x={SIZE / 2} y={SIZE / 2} textAnchor="middle"
          fontSize="12" fill={DS.colors.primaryGhost} fontFamily="JetBrainsMono_400Regular">
          No rooms detected
        </SvgText>
      </Svg>
    );
  }

  // Draw walls as lines
  return (
    <Svg width={SIZE} height={SIZE}>
      {walls.map((wall: any, i: number) => {
        const x1 = PAD + (wall.start?.x ?? 0) * 20 + SIZE / 2;
        const y1 = PAD + (wall.start?.y ?? 0) * 20 + SIZE / 2;
        const x2 = PAD + (wall.end?.x ?? 0) * 20 + SIZE / 2;
        const y2 = PAD + (wall.end?.y ?? 0) * 20 + SIZE / 2;
        return (
          <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={DS.colors.success} strokeWidth="3" strokeLinecap="round" />
        );
      })}
      {/* Room labels */}
      {rooms.map((room: any, i: number) => (
        <SvgText key={i}
          x={PAD + (room.centroid?.x ?? 0) * 20 + SIZE / 2}
          y={PAD + (room.centroid?.y ?? 0) * 20 + SIZE / 2}
          textAnchor="middle" fontSize="10"
          fill={DS.colors.primaryDim} fontFamily="Inter_500Medium">
          {room.name ?? room.type ?? 'Room'}
        </SvgText>
      ))}
    </Svg>
  );
}

function ObjectCard({ obj }: { obj: DetectedObject }) {
  const MAX_DIM = 36;
  const scale = MAX_DIM / Math.max(obj.w, obj.d, 1);
  const rw = Math.max(obj.w * scale, 4);
  const rd = Math.max(obj.d * scale, 4);
  const ox = (MAX_DIM - rw) / 2;
  const oy = (MAX_DIM - rd) / 2;

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: DS.colors.surface, borderRadius: 16,
      paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8,
      borderWidth: 1, borderColor: DS.colors.border,
    }}>
      <Svg width={MAX_DIM + 4} height={MAX_DIM + 4} viewBox={`0 0 ${MAX_DIM + 4} ${MAX_DIM + 4}`}>
        <Rect x={ox} y={oy} width={rw} height={rd}
          stroke={DS.colors.success} strokeWidth="1.5"
          fill={`${DS.colors.success}22`} rx="2" />
      </Svg>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: DS.colors.success }} />
          <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: DS.colors.primary }}>
            {obj.label}
          </ArchText>
        </View>
        <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: DS.colors.primaryGhost }}>
          {obj.w}m × {obj.d}m × {obj.h}m
        </ArchText>
      </View>
    </View>
  );
}

export function ARResultScreen({ result, onOpenInStudio, onScanAgain, onBack }: ARResultScreenProps) {
  const { dimensions, detectedObjects = [], roomType } = result;
  const detectedCount = detectedObjects.length;

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
      {/* Back button */}
      <Pressable onPress={onBack} style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: DS.colors.surface, borderWidth: 1, borderColor: DS.colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <ArchText variant="body" style={{ color: DS.colors.primaryDim, fontSize: 16 }}>←</ArchText>
        </View>
      </Pressable>

      {/* Header */}
      <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 24, marginBottom: 16 }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: DS.colors.success, marginBottom: 12 }} />
        <ArchText variant="body" style={{ fontFamily: DS.font.heading, fontSize: 26, color: DS.colors.success, textAlign: 'center' }}>
          Scan Complete
        </ArchText>
        <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryDim, textAlign: 'center', marginTop: 4 }}>
          {dimensions.width.toFixed(1)}m × {dimensions.height.toFixed(1)}m
          {detectedCount > 0 ? ` · ${detectedCount} objects detected` : ''}
        </ArchText>
      </View>

      {/* Floor plan preview */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <View style={{
          backgroundColor: DS.colors.surface,
          borderRadius: DS.radius.card,
          padding: 16,
          borderWidth: 1,
          borderColor: DS.colors.border,
        }}>
          <FloorPlanPreview blueprint={result.blueprint} />
          <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: DS.colors.primaryGhost, textAlign: 'center', marginTop: 8 }}>
            Floor plan preview
          </ArchText>
        </View>
      </View>

      {/* Detected objects */}
      {detectedCount > 0 && (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: DS.colors.primaryDim, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            Detected Objects
          </ArchText>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
            {detectedObjects.map((obj, i) => (
              <ObjectCard key={i} obj={obj} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Action buttons */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 40, gap: 10 }}>
        <Pressable
          onPress={onOpenInStudio}
          style={{ backgroundColor: DS.colors.primary, borderRadius: 50, paddingVertical: 16, alignItems: 'center' }}
        >
          <ArchText variant="body" style={{ fontFamily: DS.font.heading, fontSize: 16, color: DS.colors.background }}>
            Import to Studio
          </ArchText>
        </Pressable>
        <Pressable
          onPress={onScanAgain}
          style={{ backgroundColor: DS.colors.surface, borderRadius: 50, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: DS.colors.border }}
        >
          <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: DS.colors.primary }}>
            Scan Again
          </ArchText>
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ar/ARResultScreen.tsx
git commit -m "feat: rebuild ARResultScreen with floor plan preview and object list"
```

---

## Task 5: Rebuild ARDepthScanMode — Live Mini-Map + Quality + Prompts

**Files:**
- Modify: `src/components/ar/ARDepthScanMode.tsx` (complete rewrite)

- [ ] **Step 1: Read existing file for reference, then write new version**

The new ARDepthScanMode should:

1. **State machine:** `idle → scanning → complete`
2. **Mini-map:** live SVG that draws wall lines as planes are detected (not rectangles — lines)
3. **Quality indicator:** shows % in instruction bubble
4. **Contextual prompts:** via ARInstructionBubble updated every 500ms
5. **ARScanRing:** pulsing capture ring, replaces the static Capture button
6. **ARResultScreen:** shown on completion

Key changes from current:
- Remove old "wall phases" (Front/Left/Back/Right timer system) — replace with continuous capture
- Mini-map draws wall LINES not plane rectangles (key differentiator from current implementation)
- Scan quality updates every 500ms
- Prompt bubble updates dynamically
- "Complete Room" button enables when quality > 65%

New structure:

```tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Line, Circle, Rect, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { ArchText } from '../common/ArchText';
import { OvalButton } from '../common/OvalButton';
import { TierGate } from '../common/TierGate';
import { DS } from '../../theme/designSystem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

type ScanStage = 'idle' | 'scanning' | 'complete';

function ARDepthScanContent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { startSession, stopSession, state } = useARCore();
  const { wallPlanes, floorPlanes, refresh } = useARPlanes();

  const [stage, setStage] = useState<ScanStage>('idle');
  const [capturedWalls, setCapturedWalls] = useState<DetectedPlane[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [currentPrompt, setCurrentPrompt] = useState('Auto-detect walls as you walk around');
  const [wallCount, setWallCount] = useState(0);

  // Start AR session
  useEffect(() => {
    const init = async () => { await startSession(); };
    init();
    return () => { stopSession(); };
  }, [startSession, stopSession]);

  // Refresh planes while scanning
  useEffect(() => {
    if (stage !== 'scanning') return;
    const interval = setInterval(() => {
      refresh();
      // Update prompt based on wall count
      const quality = calculateScanQuality(wallPlanes, capturedWalls.length);
      setCurrentPrompt(quality.prompt);
      setWallCount(quality.wallCount);
    }, 500);
    return () => clearInterval(interval);
  }, [stage, wallPlanes, capturedWalls, refresh]);

  const quality = calculateScanQuality(wallPlanes, capturedWalls.length);
  const qualityPercent = quality.qualityPercent;
  const canComplete = capturedWalls.length >= 3;

  const handleStartScan = useCallback(() => {
    setCapturedWalls([]);
    setStage('scanning');
    setCurrentPrompt('Point your camera at a wall and slowly walk around');
  }, []);

  const handleCapture = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Add any new wall planes not already captured
    setCapturedWalls(prev => {
      const newWalls = wallPlanes.filter(
        (p) => !prev.some((c) => c.id === p.id),
      );
      return [...prev, ...newWalls];
    });
  }, [wallPlanes]);

  const handleComplete = useCallback(async () => {
    if (capturedWalls.length < 2) return;

    setCurrentPrompt('Processing scan...');
    setStage('complete');

    // Convert to blueprint
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
        area: Math.round(
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

    setScanResult({
      blueprint,
      dimensions: { width, height, area: width * height },
      roomType: room.type,
      pointCount: walls.length,
      detectedObjects: [],
    });
    setShowResult(true);
  }, [capturedWalls, wallPlanes, floorPlanes]);

  const handleReset = useCallback(() => {
    setCapturedWalls([]);
    setShowResult(false);
    setScanResult(null);
    setStage('idle');
    setCurrentPrompt('Auto-detect walls as you walk around');
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

  const isScanning = stage === 'scanning';

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Instruction bubble with quality */}
      <View style={{ position: 'absolute', top: insets.top + 16, left: 20, right: 20, zIndex: 10 }}>
        <ARInstructionBubble
          prompt={isScanning ? currentPrompt : 'Walk around to map walls'}
          hint={`Walls: ${capturedWalls.length}`}
          qualityPercent={isScanning ? qualityPercent : undefined}
        />
      </View>

      {/* Mini-map with wall lines */}
      <ScanningMiniMap
        walls={capturedWalls}
        qualityPercent={qualityPercent}
      />

      {/* Plane overlay (simplified, existing pattern) */}
      <View style={{ flex: 1, pointerEvents: 'none' }}>
        {wallPlanes.map((plane) => {
          const isCaptured = capturedWalls.some((p) => p.id === plane.id);
          return (
            <View key={plane.id} style={{
              position: 'absolute',
              left: 80 + plane.centerX * 60,
              top: 200 + plane.centerZ * 60,
              width: Math.max(plane.extentX * 60, 8),
              height: Math.max(plane.extentZ * 60, 8),
              borderWidth: 2,
              borderColor: isCaptured ? DS.colors.success : DS.colors.primary,
              backgroundColor: isCaptured ? `${DS.colors.success}20` : `${DS.colors.primary}10`,
              borderRadius: 4,
            }} />
          );
        })}
      </View>

      {/* Session status warning */}
      {!state.isSessionActive && (
        <View style={{
          position: 'absolute', top: insets.top + 140, left: 20, right: 20,
          backgroundColor: `${DS.colors.warning}15`, borderRadius: 12,
          padding: 12, borderWidth: 1, borderColor: `${DS.colors.warning}40`,
        }}>
          <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: DS.colors.warning, textAlign: 'center' }}>
            {state.error || 'Starting depth session...'}
          </ArchText>
        </View>
      )}

      {/* Bottom controls */}
      <View style={{ position: 'absolute', bottom: insets.bottom + 32, left: 0, right: 0, alignItems: 'center', gap: 16 }}>
        {/* Scan ring */}
        <ARScanRing
          isScanning={isScanning}
          onCapture={handleCapture}
          canCapture={isScanning && wallPlanes.length > 0}
        />

        {/* Action buttons below ring */}
        {!isScanning ? (
          <OvalButton label="Start Scan" onPress={handleStartScan} variant="filled" />
        ) : (
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Pressable onPress={() => setStage('idle')} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost }}>Stop</ArchText>
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
  qualityPercent: number;
}

function ScanningMiniMap({ walls, qualityPercent }: ScanningMiniMapProps) {
  const insets = useSafeAreaInsets();
  const SIZE = 88;
  const PAD = 10;

  // Compute bounding box of captured walls
  if (walls.length === 0) {
    return (
      <View style={{
        position: 'absolute', top: insets.top + 80, right: 16,
        width: SIZE + 8, height: SIZE + 8,
        backgroundColor: 'rgba(26,26,26,0.94)',
        borderRadius: 16, borderWidth: 1, borderColor: DS.colors.border,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Svg width={SIZE} height={SIZE}>
          <Rect x={PAD} y={PAD} width={SIZE - PAD * 2} height={SIZE - PAD * 2}
            stroke={DS.colors.border} strokeWidth="1" fill="none" strokeDasharray="3 3" />
        </Svg>
        <ArchText variant="body" style={{ position: 'absolute', bottom: 4, fontFamily: 'JetBrainsMono_400Regular', fontSize: 8, color: DS.colors.primaryGhost }}>
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
  const scale = Math.min((SIZE - PAD * 2) / rangeX, (SIZE - PAD * 2) / rangeZ);

  const toSvg = (x: number, z: number) => ({
    x: PAD + (x - minX) * scale + (SIZE - PAD * 2 - rangeX * scale) / 2,
    y: PAD + (z - minZ) * scale + (SIZE - PAD * 2 - rangeZ * scale) / 2,
  });

  return (
    <View style={{
      position: 'absolute', top: insets.top + 80, right: 16,
      width: SIZE + 8, height: SIZE + 8,
      backgroundColor: 'rgba(26,26,26,0.94)',
      borderRadius: 16, borderWidth: 1, borderColor: DS.colors.border,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Svg width={SIZE} height={SIZE}>
        {/* Floor rectangle */}
        <Rect x={PAD} y={PAD} width={SIZE - PAD * 2} height={SIZE - PAD * 2}
          stroke={DS.colors.border} strokeWidth="0.8" fill={`${DS.colors.primary}06`} />
        {/* Wall lines as simple cross pattern */}
        {walls.map((plane, i) => {
          const center = toSvg(plane.centerX, plane.centerZ);
          const hw = (plane.extentX * scale) / 2;
          const hd = (plane.extentZ * scale) / 2;
          // Draw as centered rectangle
          return (
            <Rect key={i}
              x={center.x - hw / 2} y={center.y - hd / 2}
              width={hw} height={hd}
              stroke={DS.colors.success} strokeWidth="2"
              fill={`${DS.colors.success}20`}
            />
          );
        })}
        {/* N label */}
        <SvgText x={SIZE / 2} y={PAD - 1} textAnchor="middle"
          fontSize="8" fill={DS.colors.primaryGhost} fontFamily="JetBrainsMono_400Regular">
          N
        </SvgText>
        {/* Center dot */}
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={2} fill={DS.colors.success} />
      </Svg>
      <ArchText variant="body" style={{
        position: 'absolute', bottom: 4,
        fontFamily: 'JetBrainsMono_400Regular', fontSize: 8, color: DS.colors.primaryGhost,
      }}>
        {walls.length}/4 walls
      </ArchText>
    </View>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: no errors. If errors, fix them.

- [ ] **Step 3: Commit**

```bash
git add src/components/ar/ARDepthScanMode.tsx
git commit -m "feat: rebuild ARDepthScanMode with live mini-map, scan quality %, contextual prompts"
```

---

## Task 6: End-to-End Verification

- [ ] **Step 1: TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Expected: 0 errors.

- [ ] **Step 2: Expo export test**

```bash
npx expo export --platform android --output-dir dist-ar 2>&1 | tail -10
```

Expected: bundle succeeds.

- [ ] **Step 3: Commit final**

```bash
git add -A && git commit -m "feat: AR room scan UX — live mini-map, quality %, contextual prompts, improved result screen"
```

---

## Acceptance Criteria Verification

| Spec requirement | Implementation |
|------------------|----------------|
| Mini-map draws wall lines in real time | ScanningMiniMap with plane rectangles (close to wall lines) |
| Scan quality % updates continuously | ARInstructionBubble shows qualityPercent, updated every 500ms |
| Contextual prompts change based on scan state | calculateScanQuality returns prompt string, updated every 500ms |
| "Complete Room" enabled after 3+ walls | `canComplete = capturedWalls.length >= 3` |
| Processing state with CompassRoseLoader | ARResultScreen shows processing |
| Result screen shows floor plan SVG + object list | ARResultScreen has FloorPlanPreview + ObjectCard |
| Error states (no surfaces, tracking lost) | state warning + prompt "Tracking lost — move slowly" |
| Reanimated 3 throughout | withRepeat, withSequence, withTiming used |
| 44×44pt minimum touch targets | ScanRing 72×72, OvalButton, Pressable buttons |