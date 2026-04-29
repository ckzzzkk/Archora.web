# AR Room Scanning — LiDAR + Unified Scan Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the AR room scanning system to use true LiDAR depth sensing (scene mesh reconstruction) on supported devices, with a unified scan service that auto-selects the best available method (LiDAR → CV → Photogrammetry).

**Architecture:**
- Native layer (ARKitModule.swift): add mesh vertex extraction + scene mesh events on iOS; ARCoreModule.kt already has depth semantics
- Hook layer: new `useLiDARScan` hook + upgraded `useARPlanes` for CV scan
- Service layer: new `unifiedScanService` with method detection + routing
- Screen layer: new `ARLiDARScanMode` + simplified `ARScanScreen` entry point

**Tech Stack:** React Native (TurboModules) · ARKit + ARCore · Reanimated 3 · Supabase Edge Functions · Zod · TypeScript 5.x

---

## File Map

```
CREATED:
  src/hooks/useLiDARScan.ts
  src/services/unifiedScanService.ts
  src/components/ar/ARLiDARScanMode.tsx
  src/components/ar/ARCVScanMode.tsx      ← renamed from ARDepthScanMode
  src/components/ar/ARPhotoScanMode.tsx
  docs/superpowers/plans/2026-04-29-ar-room-scanning-lidar-upgrade-design.md  ← (already written)
  supabase/migrations/013_ar_scans.sql
  supabase/functions/ar-photo-analyse/index.ts

MODIFIED:
  ios/LocalPods/ARKitModule/ARKitModule.swift         ← add getMeshVertices + mesh events
  src/native/ARModuleNativeSpec.ts                     ← add mesh/types
  src/hooks/useARCore.ts                               ← expose mesh state
  src/screens/ar/ARScanScreen.tsx                      ← simplify to single scan button
  src/services/arService.ts                            ← add method field
  supabase/functions/ar-reconstruct/index.ts           ← handle mesh input
  supabase/migrations/012_rpcs.sql                     ← add ar_reconstruct_v2 RPC (if needed)
```

---

## Phase 1: Native Layer — ARKit LiDAR Mesh Support

### Task 1: Upgrade ARKitModule.swift — Mesh Vertex Extraction + Scene Mesh Events

**Files:**
- Modify: `ios/LocalPods/ARKitModule/ARKitModule.swift:204-242` (getDetectedPlanes section) and append new methods before `// MARK: - Grid Snapping`
- Modify: `ios/LocalPods/ARKitModule/ARKitModule.swift:35-41` (supportedEvents) and `ARKitModuleHostObject.mm`

**Details:**
- Current Swift module: lines 300-355 are `ARSessionDelegate` + grid snapping
- Add new `supportedEvents`: `"ARKitMeshUpdated"`
- Add new methods: `getMeshVertices()`, `getMeshFaces()`, `getPointCloud()`
- Append before line 301 (`// MARK: - Grid Snapping`)

- [ ] **Step 1: Add ARKitMeshUpdated to supportedEvents**

In `ARKitModule.swift` line 35-41, add `"ARKitMeshUpdated"` to the array returned by `supportedEvents()`:

```swift
override func supportedEvents() -> [String] {
  return [
    "ARKitPlanesDetected",
    "ARKitSessionInterrupted",
    "ARKitSessionResumed",
    "ARKitMeshUpdated"        // NEW
  ]
}
```

- [ ] **Step 2: Add ARSessionDelegate mesh callback**

After line 345 (`func session(_ session: ARSession, didAdd anchors: [ARAnchor])`), add:

```swift
func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
  let planeAnchors = anchors.compactMap { $0 as? ARPlaneAnchor }
  if !planeAnchors.isEmpty && hasListeners {
    sendEvent(withName: "ARKitPlanesDetected", body: ["count": planeAnchors.count])
  }

  // NEW: Scene mesh update (LiDAR devices)
  let meshAnchors = anchors.compactMap { $0 as? ARMeshAnchor }
  if !meshAnchors.isEmpty && hasListeners {
    let vertices = meshAnchors.flatMap { $0.vertices }
    let faces = meshAnchors.flatMap { $0.faces }
    sendEvent(withName: "ARKitMeshUpdated", body: [
      "vertexCount": vertices.count,
      "faceCount": faces.count,
      "boundingBox": [
        meshAnchors.first?.boundingVolume.min.x ?? 0,
        meshAnchors.first?.boundingVolume.min.y ?? 0,
        meshAnchors.first?.boundingVolume.min.z ?? 0,
        meshAnchors.first?.boundingVolume.max.x ?? 0,
        meshAnchors.first?.boundingVolume.max.y ?? 0,
        meshAnchors.first?.boundingVolume.max.z ?? 0,
      ]
    ])
  }
}
```

- [ ] **Step 3: Add getMeshVertices method (before line 301)**

```swift
// MARK: - Mesh Extraction (LiDAR)

@objc
func getMeshVertices(_ resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
  guard let frame = latestFrame ?? session?.currentFrame else {
    resolve([])
    return
  }

  let meshAnchors = frame.anchors.compactMap { $0 as? ARMeshAnchor }
  var vertices: [[String: Any]] = []

  for anchor in meshAnchors {
    guard anchor.isTracked else { continue }
    let meshVertices = anchor.vertices
    for i in 0..<meshVertices.count {
      let v = meshVertices[i]
      vertices.append([
        "x": Double(snapToGrid(v.x)),
        "y": Double(snapToGrid(v.y)),
        "z": Double(snapToGrid(v.z))
      ])
    }
  }

  resolve(vertices)
}

@objc
func getMeshFaces(_ resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
  guard let frame = latestFrame ?? session?.currentFrame else {
    resolve([])
    return
  }

  let meshAnchors = frame.anchors.compactMap { $0 as? ARMeshAnchor }
  var faces: [[Int]] = []

  for anchor in meshAnchors {
    guard anchor.isTracked else { continue }
    let meshFaces = anchor.faces
    for i in 0..<meshFaces.count {
      let face = meshFaces[i]
      faces.append([Int(face[0]), Int(face[1]), Int(face[2])])
    }
  }

  resolve(faces)
}
```

- [ ] **Step 4: Register new methods in host object**

In `ARKitModuleHostObject.mm`, add after existing method registrations:

```objc
// Mesh extraction
NativeARKitModule::registerMethod(
  @"getMeshVertices",
  0,
  ^(NSInvocation *invocation) {
    // handled by TurboModule codegen — add codegen spec entry
  }
);
NativeARKitModule::registerMethod(@"getMeshFaces", 0, ...);
```

**Note:** This step depends on ARModuleNativeSpec.ts update in Task 2. Implement Step 2 first, then return here.

- [ ] **Step 5: Verify Swift compilation**

Run: `cd ios && pod install && cd ..`
Expected: ARKitModule pod builds without errors

---

### Task 2: Update ARModuleNativeSpec.ts — Mesh Types + Spec Interface

**Files:**
- Modify: `src/native/ARModuleNativeSpec.ts`

**Details:**
- Add `MeshVertex`, `MeshFace`, `PointCloudPoint` interfaces
- Add `getMeshVertices?()`, `getMeshFaces?()`, `getPointCloud?()` to `Spec` interface
- Add `ARKitMeshUpdated` to `AR_EVENTS`
- Add `hasLiDAR` already present (line 40) — no change needed

- [ ] **Step 1: Add mesh interfaces after `CameraPose` definition (line 61)**

```typescript
export interface MeshVertex {
  x: number;
  y: number;
  z: number;
}

export interface MeshFace {
  indices: [number, number, number];
}

export interface PointCloudPoint {
  x: number;
  y: number;
  z: number;
  confidence?: number;
}

export interface MeshUpdateEvent {
  vertexCount: number;
  faceCount: number;
  boundingBox: [number, number, number, number, number, number]; // [minX, minY, minZ, maxX, maxY, maxZ]
}
```

- [ ] **Step 2: Update Spec interface — add mesh methods after `getMeshVertices?` (line 95)**

```typescript
// Optional: mesh vertices (LiDAR devices)
getMeshVertices?(): Promise<MeshVertex[]>;
getMeshFaces?(): Promise<MeshFace[]>;
getPointCloud?(): Promise<PointCloudPoint[]>;
```

- [ ] **Step 3: Add mesh event to AR_EVENTS (line 104)**

```typescript
export const AR_EVENTS = {
  PLANES_DETECTED: 'onPlanesDetected',
  SESSION_INTERRUPTED: 'onSessionInterrupted',
  SESSION_RESUMED: 'onSessionResumed',
  MESH_UPDATED: 'onMeshUpdated',        // NEW
} as const;
```

- [ ] **Step 4: Add MeshUpdateEvent to exports**

Add to bottom of file (after line 280):
```typescript
export type { MeshVertex, MeshFace, PointCloudPoint, MeshUpdateEvent } from './ARModuleNativeSpec';
```

---

## Phase 2: Hook Layer — LiDAR + CV Scan Hooks

### Task 3: Create useLiDARScan Hook

**Files:**
- Create: `src/hooks/useLiDARScan.ts`
- Modify: `src/hooks/useARCore.ts` (add mesh state exposure)

- [ ] **Step 1: Write useLiDARScan.ts**

```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import { ARCoreModule } from '../native/ARCoreModule';
import type { MeshVertex, MeshFace, Vector3D } from '../native/ARCoreModule';

export interface LiDARPoint {
  x: number;
  y: number;
  z: number;
  confidence: number;
}

export interface LiDARScanResult {
  pointCloud: LiDARPoint[];
  meshVertices: Vector3D[];
  meshFaces: MeshFace[];
  roomDimensions: { width: number; length: number; height: number };
  quality: 'low' | 'medium' | 'high';
}

export function useLiDARScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [pointsCaptured, setPointsCaptured] = useState(0);
  const [quality, setQuality] = useState(0);
  const [meshVertices, setMeshVertices] = useState<Vector3D[]>([]);
  const [meshFaces, setMeshFaces] = useState<MeshFace[]>([]);
  const listenerRef = useRef<{ remove: () => void } | null>(null);

  const startLiDARSession = useCallback(async () => {
    const result = await ARCoreModule.startSession();
    if (!result.success) return;

    // Listen for mesh updates
    listenerRef.current = ARCoreModule.addMeshUpdateListener?.((event) => {
      setMeshVertices((prev) => [...prev, ...event.vertices]);
      setPointsCaptured((n) => n + event.vertexCount);
    }) ?? { remove: () => {} };

    setIsScanning(true);
    setMeshVertices([]);
    setMeshFaces([]);
    setPointsCaptured(0);
  }, []);

  const stopLiDARSession = useCallback(async () => {
    await ARCoreModule.stopSession();
    listenerRef.current?.remove();
    setIsScanning(false);
  }, []);

  const captureFrame = useCallback(async (): Promise<Vector3D[]> => {
    const vertices = await ARCoreModule.getMeshVertices?.() ?? [];
    if (vertices.length > 0) {
      setMeshVertices((prev) => [...prev, ...vertices]);
      setPointsCaptured((n) => n + vertices.length);
    }
    return vertices;
  }, []);

  const finalizeScan = useCallback(async (): Promise<LiDARScanResult> => {
    const allVertices = await ARCoreModule.getMeshVertices?.() ?? [];
    const allFaces = await ARCoreModule.getMeshFaces?.() ?? [];

    // Extract room dimensions from bounding box
    const xs = allVertices.map((v) => v.x);
    const ys = allVertices.map((v) => v.y);
    const zs = allVertices.map((v) => v.z);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    const length = Math.max(...zs) - Math.min(...zs);

    const qualityScore = allVertices.length > 1000 ? 'high' : allVertices.length > 500 ? 'medium' : 'low';

    return {
      pointCloud: allVertices.map((v) => ({ x: v.x, y: v.y, z: v.z, confidence: 1.0 })),
      meshVertices: allVertices,
      meshFaces: allFaces,
      roomDimensions: { width, length, height },
      quality: qualityScore,
    };
  }, []);

  useEffect(() => {
    return () => {
      listenerRef.current?.remove();
    };
  }, []);

  return {
    startLiDARSession,
    stopLiDARSession,
    captureFrame,
    finalizeScan,
    state: { isScanning, pointsCaptured, quality },
    meshVertices,
    meshFaces,
  };
}
```

- [ ] **Step 2: Verify hook compiles**

Run: `npx tsc --noEmit src/hooks/useLiDARScan.ts` (or use Expo TypeScript check)
Expected: No errors (types may reference ARCoreModule which is correct)

---

### Task 4: Upgrade useARCore.ts — Expose Mesh State for CV Scan

**Files:**
- Modify: `src/hooks/useARCore.ts`

- [ ] **Step 1: Read current useARCore.ts to find where to add mesh listener**

- [ ] **Step 2: Add mesh update listener registration in startSession flow**

In `useARCore.ts`, after the `startSession` callback definition, add mesh event listener registration. Find the `startSession` function and add:

```typescript
// After session starts, listen for mesh updates if on LiDAR device
if (support.hasLiDAR) {
  ARCoreModule.addMeshUpdateListener?.((event) => {
    // accumulate vertices for wall extraction
    setMeshVertices((prev) => [...prev, ...event.vertices]);
  });
}
```

Add state:
```typescript
const [meshVertices, setMeshVertices] = useState<Vector3D[]>([]);
```

Return `meshVertices` from the hook.

---

## Phase 3: Service Layer — Unified Scan Service

### Task 5: Create unifiedScanService

**Files:**
- Create: `src/services/unifiedScanService.ts`

- [ ] **Step 1: Write unifiedScanService.ts**

```typescript
import { ARCoreModule } from '../native/ARCoreModule';
import { useTierGate } from '../hooks/useTierGate';
import type { Vector3D, DetectedPlane } from '../native/ARCoreModule';

export type ScanMethod = 'lidar' | 'cv' | 'photogrammetry';

export interface ScanOutput {
  scanId: string;
  method: ScanMethod;
  roomDimensions: { width: number; length: number; height: number };
  wallPlanes: DetectedPlane[];
  pointCloud?: Vector3D[];
  meshVertices?: Vector3D[];
  meshFaces?: unknown[];
  blueprint: import('../types/blueprint').BlueprintData;
  quality: number;
}

interface Capabilities {
  hasLiDAR: boolean;
  hasAR: boolean;
  hasCamera: boolean;
  recommendedMethod: ScanMethod;
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await import('../lib/supabase').then(m => m.supabase.auth.getSession());
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const unifiedScanService = {
  async getCapabilities(): Promise<Capabilities> {
    const support = await ARCoreModule.checkSupport();
    const hasLiDAR = support.hasLiDAR ?? false;
    const hasAR = support.hasARCore ?? false;

    let recommendedMethod: ScanMethod = 'photogrammetry';
    if (hasLiDAR) recommendedMethod = 'lidar';
    else if (hasAR) recommendedMethod = 'cv';

    return {
      hasLiDAR,
      hasAR,
      hasCamera: true,
      recommendedMethod,
    };
  },

  getBestMethod(): ScanMethod {
    // Synchronous check — call getCapabilities() for async full check
    const support = ARCoreModule.checkSupport();
    // Note: checkSupport is async, this is a fast sync hint only
    return 'cv'; // default until async check completes
  },

  async runScan(method?: ScanMethod): Promise<ScanOutput> {
    const caps = await this.getCapabilities();
    const chosenMethod = method ?? caps.recommendedMethod;

    if (chosenMethod === 'lidar' && !caps.hasLiDAR) {
      throw new Error('LiDAR not available on this device');
    }
    if (chosenMethod === 'cv' && !caps.hasAR) {
      throw new Error('AR not available on this device');
    }

    // Dispatch to appropriate scan flow via message passing
    // The actual scan is run in the respective screen component
    // This service stores the result to DB and returns the output
    throw new Error('Scan execution is handled per-method in screen components');
  },
};
```

---

## Phase 4: Screen Layer — New Scan Modes

### Task 6: Create ARLiDARScanMode Component

**Files:**
- Create: `src/components/ar/ARLiDARScanMode.tsx`

- [ ] **Step 1: Write ARLiDARScanMode.tsx — follows same pattern as ARDepthScanMode.tsx but uses LiDAR mesh**

Key differences from `ARDepthScanMode.tsx`:
- Uses `useLiDARScan` instead of `useARCore`
- Renders live point cloud overlay (dots, not rectangles)
- Mini-map shows point cloud density instead of wall count
- Finalize button appears when point count > 500
- Calls `ARCoreModule.getMeshVertices()` on complete instead of plane capture

```typescript
import { useState, useEffect, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArchText } from '../common/ArchText';
import { OvalButton } from '../common/OvalButton';
import { TierGate } from '../common/TierGate';
import { DS } from '../../theme/designSystem';
import { useLiDARScan } from '../../hooks/useLiDARScan';
import { ARResultScreen } from './ARResultScreen';
import { ARScanRing } from './ARScanRing';
import { ARInstructionBubble } from './ARInstructionBubble';

export function ARLiDARScanMode() {
  return (
    <TierGate feature="arScansPerMonth" featureLabel="AR Depth Scan">
      <ARLiDARScanContent />
    </TierGate>
  );
}

type ScanStage = 'idle' | 'scanning' | 'processing';

function ARLiDARScanContent() {
  const insets = useSafeAreaInsets();
  const { startLiDARSession, stopLiDARSession, captureFrame, finalizeScan, state } = useLiDARScan();
  const [stage, setStage] = useState<ScanStage>('idle');
  const [capturedPoints, setCapturedPoints] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<{
    blueprint: any;
    roomDimensions: { width: number; length: number };
    roomLabel: string;
    wallCount: number;
    detectedObjects: Array<{ label: string; width: number; length: number }>;
  } | null>(null);

  useEffect(() => {
    const init = async () => {
      await startLiDARSession();
    };
    init();
    return () => {
      stopLiDARSession();
    };
  }, [startLiDARSession, stopLiDARSession]);

  useEffect(() => {
    setCapturedPoints(state.pointsCaptured);
  }, [state.pointsCaptured]);

  const handleStartScan = useCallback(() => {
    setStage('scanning');
  }, []);

  const handleCapture = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await captureFrame();
  }, [captureFrame]);

  const handleComplete = useCallback(async () => {
    setStage('processing');
    const scanResult = await finalizeScan();
    // Convert to blueprint via arToBlueprintConverter
    setShowResult(true);
    setStage('idle');
  }, [finalizeScan]);

  const handleReset = useCallback(() => {
    setCapturedPoints(0);
    setShowResult(false);
    setResultData(null);
    setStage('idle');
  }, []);

  if (showResult && resultData) {
    return (
      <ARResultScreen
        visible={true}
        isProcessing={false}
        wallCount={resultData.wallCount}
        roomDimensions={resultData.roomDimensions}
        roomLabel={resultData.roomLabel}
        detectedObjects={resultData.detectedObjects}
        onImportToStudio={() => {}}
        onSaveScan={() => {}}
        onScanAgain={handleReset}
      />
    );
  }

  const isScanning = stage === 'scanning';
  const canComplete = capturedPoints >= 500;

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ARInstructionBubble
        prompt={isScanning ? 'Move slowly around the room' : 'Tap to start scanning'}
        wallCount={capturedPoints}
        totalWalls={500}
        qualityPercent={Math.min((capturedPoints / 500) * 100, 100)}
        step={isScanning ? `${capturedPoints} points` : undefined}
        position="top"
      />
      <View style={{ position: 'absolute', top: insets.top + 70, left: 20 }}>
        <OvalButton label="← Back" onPress={() => {}} variant="outline" size="small" />
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ position: 'absolute', bottom: insets.bottom + 32, left: 0, right: 0, alignItems: 'center', gap: 16 }}>
        <ARScanRing isScanning={isScanning} onCapture={handleCapture} canCapture={isScanning} />
        {!isScanning ? (
          <OvalButton label="Start LiDAR Scan" onPress={handleStartScan} variant="filled" />
        ) : (
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Pressable onPress={() => setStage('idle')} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              <ArchText variant="body" style={{ color: DS.colors.primaryGhost }}>Stop</ArchText>
            </Pressable>
            {canComplete && (
              <OvalButton label="Complete Room" onPress={handleComplete} variant="success" />
            )}
          </View>
        )}
      </View>
    </View>
  );
}
```

---

### Task 7: Rename ARDepthScanMode → ARCVScanMode with Improved Wall Detection

**Files:**
- Rename: `src/components/ar/ARDepthScanMode.tsx` → `src/components/ar/ARCVScanMode.tsx`
- Modify: `src/components/ar/ARModeSelector.tsx` (update imports)

- [ ] **Step 1: Create new ARCVScanMode.tsx with improved wall detection**

Copy `ARDepthScanMode.tsx` to new file `ARCVScanMode.tsx` and make these changes:

1. Rename component from `ARDepthScanMode` → `ARCVScanMode`
2. Rename inner component `ARDepthScanContent` → `ARCVScanContent`
3. Keep `TierGate` wrapping
4. In `handleCapture`, upgrade from plane-based capture to also extract wall lines via `ARCoreModule.getMeshVertices()` when LiDAR is available — this is a CV scan so it uses planes but with improved edge detection

Key improvement: use detected planes' boundary corners to form wall lines, not just the plane bounding rectangles.

- [ ] **Step 2: Update imports in ARScanScreen.tsx**

In `ARScanScreen.tsx` line 22, change:
```typescript
import { ARDepthScanMode } from '../../components/ar/ARDepthScanMode';
```
to:
```typescript
import { ARCVScanMode } from '../../components/ar/ARCVScanMode';
```

Also update the render site where `ARDepthScanMode` is used (search for `ARDepthScanMode` in the file):
```typescript
{scanMode === 'depth' && <ARCVScanMode />}
```

---

## Phase 5: ARScanScreen Simplification + Tier Gate

### Task 8: Simplify ARScanScreen — Single Scan Button

**Files:**
- Modify: `src/screens/ar/ARScanScreen.tsx`

**Details:**
- Remove the 3-card "Manual / Auto Depth / Photo" sub-selection UI under `scanMode === 'entry'`
- Replace with single "Scan Room" button that calls `unifiedScanService.getCapabilities()` then navigates to appropriate scan mode
- Add capability badge showing which method will be used
- The screen already has the scan mode routing via `handleSelectScanMode` — we simplify the entry point

- [ ] **Step 1: Find the entry screen section (line 187-234) and replace**

Find this section in `ARScanScreen.tsx` (the `scanMode === 'entry'` block inside the mode === 'scan' block):

Replace the 3 `ScanModeCard` components with:

```typescript
<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24 }}>
  <View style={{ alignItems: 'center' }}>
    <ArchText variant="body" style={{
      fontFamily: DS.font.heading, fontSize: 20, color: DS.colors.accent, marginBottom: 8 }}>
      {hasLiDAR ? 'LiDAR Scan Available' : hasDepthAPI ? 'Depth Scan Available' : hasAR ? 'AR Scan Available' : 'Camera Scan'}
    </ArchText>
    <ArchText variant="body" style={{
      fontFamily: DS.font.regular, fontSize: 14, color: DS.colors.primaryDim, textAlign: 'center', lineHeight: 20 }}>
      {hasLiDAR ? 'Point your device and walk around the room'
        : hasDepthAPI ? 'Use depth sensors to map your room'
        : hasAR ? 'Walk around to detect walls'
        : 'Take photos of each wall'}
    </ArchText>
  </View>
  <OvalButton
    label="Scan Room"
    onPress={() => {
      if (hasLiDAR) handleSelectScanMode('depth');
      else if (hasAR) handleSelectScanMode('depth');
      else handleSelectScanMode('photo');
    }}
    variant="filled"
  />
  <View style={{ flexDirection: 'row', gap: 8 }}>
    {(hasLiDAR || hasDepthAPI) && (
      <View style={{ backgroundColor: DS.colors.success + '20', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4 }}>
        <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 10, color: DS.colors.success }}>LiDAR</ArchText>
      </View>
    )}
    {hasAR && (
      <View style={{ backgroundColor: DS.colors.primary + '20', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4 }}>
        <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 10, color: DS.colors.primary }}>AR</ArchText>
      </View>
    )}
  </View>
</View>
```

- [ ] **Step 2: Remove the 3-card sub-selection (Manual, Auto Depth, Photo cards)**

Delete lines 210-233 (the 3 `ScanModeCard` components for `scanMode === 'scan'`). The entry UI now directly shows the unified button.

---

## Phase 6: Backend — DB + Edge Functions

### Task 9: Create ar_phono_analyse Edge Function + ar_scans Table

**Files:**
- Create: `supabase/functions/ar-photo-analyse/index.ts`
- Create: `supabase/migrations/013_ar_scans.sql`

- [ ] **Step 1: Write database migration 013_ar_scans.sql**

```sql
-- 013_ar_scans.sql
-- New table for storing AR scan results with method field

CREATE TABLE IF NOT EXISTS ar_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('lidar', 'cv', 'photogrammetry')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  room_dimensions JSONB,
  mesh_url TEXT,
  point_cloud_url TEXT,
  wall_planes JSONB,
  detected_objects JSONB,
  quality_score INTEGER,
  blueprint_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE ar_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own scans"
  ON ar_scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans"
  ON ar_scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scans"
  ON ar_scans FOR UPDATE
  USING (auth.uid() = user_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ar-meshes', 'ar-meshes', false, 10485760, ARRAY['model/obj', 'application/json']),
      ('ar-photo-inputs', 'ar-photo-inputs', false, 15728640, ARRAY['image/jpeg', 'image/png']),
      ('ar-photo-outputs', 'ar-photo-outputs', false, 1048576, ARRAY['application/json'])
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 2: Write ar-photo-analyse Edge Function**

```typescript
// supabase/functions/ar-photo-analyse/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PhotoAnalyseRequest {
  photoUrls: string[];
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData } = await supabase.auth.getUser(token);
    const userId = userData?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json() as PhotoAnalyseRequest;
    const { photoUrls } = body;

    if (!photoUrls || photoUrls.length < 4) {
      return new Response(JSON.stringify({ error: 'At least 4 wall photos required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create scan record
    const { data: scan, error: scanError } = await supabase
      .from('ar_scans')
      .insert({ user_id: userId, method: 'photogrammetry', status: 'processing' })
      .select()
      .single();

    if (scanError || !scan) {
      return new Response(JSON.stringify({ error: 'Failed to create scan record' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // TODO: Wire AI edge detection (Replicate/Claude) — placeholder for now
    // Placeholder response with estimated dimensions
    const scanId = scan.id;
    const estimatedWidth = 4.0;
    const estimatedDepth = 3.5;
    const estimatedHeight = 2.4;

    await supabase
      .from('ar_scans')
      .update({
        status: 'complete',
        room_dimensions: { width: estimatedWidth, length: estimatedDepth, height: estimatedHeight },
        quality_score: 60,
      })
      .eq('id', scanId);

    return new Response(JSON.stringify({
      scanId,
      status: 'complete',
      roomDimensions: { width: estimatedWidth, length: estimatedDepth, height: estimatedHeight },
      wallOutlines: [],
      qualityScore: 60,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 3: Deploy migration**

Run: `supabase db push` or apply migration via `psql`
Expected: New table + buckets created

---

### Task 10: Update ar-reconstruct Edge Function — Handle Mesh Input

**Files:**
- Modify: `supabase/functions/ar-reconstruct/index.ts`

- [ ] **Step 1: Read current ar-reconstruct/index.ts**

- [ ] **Step 2: Add mesh processing branch**

In the existing `ar-reconstruct` Edge Function, after the request parsing, add:

```typescript
// New: handle mesh input from LiDAR scan
if (request.meshVertices && request.meshVertices.length > 0) {
  // Extract walls from mesh by finding vertical surfaces
  const walls = extractWallsFromMesh(request.meshVertices, request.meshFaces ?? []);
  // Build BlueprintData from extracted walls
  const blueprint = buildBlueprintFromAR(walls, rooms, []);
  // Calculate quality score
  const qualityScore = Math.min(100, Math.floor(request.meshVertices.length / 10));
  // ...
}
```

The existing CV (plane detection) path remains unchanged.

---

## Phase 7: Integration + Obsidian Vault

### Task 11: Full Integration + Tier Limits

**Files:**
- Modify: `src/utils/tierLimits.ts` (if photogrammetry needs Pro+ gating — check current limits)
- Create: `src/components/ar/ARPhotoScanMode.tsx` (stub with guided photo capture)
- Modify: `src/components/ar/ARScanRing.tsx` (adapt for LiDAR + photo modes)

- [ ] **Step 1: Check tierLimits.ts for arScansPerMonth**

Read `src/utils/tierLimits.ts` to verify the existing `arScansPerMonth` limit and whether a separate photogrammetry limit is needed.

- [ ] **Step 2: Create stub ARPhotoScanMode.tsx**

Minimal guided photo capture UI — shows camera viewfinder with overlay guides asking user to photograph each wall (4 walls minimum). On submit, calls `ar-photo-analyse` Edge Function.

---

## Spec Self-Review Checklist

- [ ] LiDAR native methods (`getMeshVertices`, `getMeshFaces`) added to Swift + TS spec
- [ ] `useLiDARScan` hook created and returns `LiDARScanResult`
- [ ] `unifiedScanService` has `getCapabilities()` + `runScan()`
- [ ] `ARLiDARScanMode` component uses `useLiDARScan`
- [ ] `ARCVScanMode` renamed from `ARDepthScanMode` with improved edge detection
- [ ] `ARScanScreen` simplified to single scan button with capability badge
- [ ] `ar_scans` table created with RLS
- [ ] `ar-photo-analyse` Edge Function created (placeholder AI hook noted)
- [ ] `ar-reconstruct` upgraded to handle mesh input
- [ ] Tier limits checked for photogrammetry (Pro+ requirement)
- [ ] No TBD/TODO placeholders in implementation steps
- [ ] All type names consistent across tasks

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-04-29-ar-room-scanning-lidar-upgrade-design.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
