# AR Room Scanning — LiDAR + Unified Scan Upgrade

**Date:** 2026-04-29
**Status:** Draft

---

## 1. Concept & Vision

Upgrade the AR room scanning system to use true LiDAR depth sensing where available, with a seamless fallback chain that always delivers a good scan regardless of device hardware. The user taps "Scan Room" once and the system selects the best available method — no tech jargon, no mode selection. The result is a precise, dimension-accurate blueprint-ready room model.

---

## 2. Design Language

**Existing ASORIA brand tokens apply** — no new colors or typefaces introduced.

- **Border radius:** cards 20–24px · modals 24px top · buttons 50px (all per CLAUDE.md)
- **Fonts:** ArchitectsDaughter_400Regular (headings) · Inter (body) · JetBrainsMono (numbers/measurements)
- **Colors:** Background #1A1A1A · Surface #222222 · Elevated #2C2C2C · Border #333333 · Text Primary #F0EDE8 · Text Secondary #9A9590 · Success #7AB87A · Warning #D4A84B · Error #C0604A · Primary #C8C8C8
- **No new color additions without ADR**

**Motion:** Reanimated 3 for all transitions. Oval scanning indicator ring.

---

## 3. Architecture

### Scan Method Hierarchy (automatic, no user selection needed)

```
User taps "Scan Room"
        │
        ▼
┌───────────────────────────────────────────┐
│         getBestScanMethod()                │
├───────────────────────────────────────────┤
│  1. LiDAR hardware detected?              │
│     → runLiDARScan()  [ARKit scene mesh] │
│                                           │
│  2. ARKit/ARCore plane detection?         │
│     → runCVScan()   [plane corners]      │
│                                           │
│  3. Photo capture available?              │
│     → runPhotogrammetryScan()            │
│     (cloud edge detection + AI)          │
└───────────────────────────────────────────┘
```

### Tier Access

| Method | Tier Required | Device |
|--------|-------------|--------|
| LiDAR scan | Creator+ | iPhone 12 Pro+ / iPad Pro |
| CV scan (plane detect) | Creator+ | Any ARKit/ARCore device |
| Photogrammetry scan | Pro+ | Any camera device |

---

## 4. Components

### 4.1 `useLiDARScan` Hook (NEW)

```typescript
// src/hooks/useLiDARScan.ts
interface LiDARPoint {
  x: number; y: number; z: number;
  confidence: number;
}
interface LiDARScanResult {
  pointCloud: LiDARPoint[];
  meshVertices: Vector3D[];
  meshFaces: number[][];
  roomDimensions: { width: number; length: number; height: number };
  wallPlanes: DetectedPlane[];  // reusing DetectedPlane type
  quality: 'low' | 'medium' | 'high';
}

export function useLiDARScan(): {
  startLiDARSession: () => Promise<void>;
  stopLiDARSession: () => Promise<void>;
  captureFrame: () => Promise<LiDARPoint[]>;
  finalizeScan: () => Promise<LiDARScanResult>;
  state: { isScanning: boolean; pointsCaptured: number; quality: number };
}
```

### 4.2 `unifiedScanService` (NEW)

```typescript
// src/services/unifiedScanService.ts
export type ScanMethod = 'lidar' | 'cv' | 'photogrammetry';

export interface ScanOutput {
  scanId: string;
  method: ScanMethod;
  roomDimensions: { width: number; length: number; height: number };
  wallPlanes: DetectedPlane[];
  pointCloud?: LiDARPoint[];       // only for LiDAR
  meshVertices?: Vector3D[];       // only for LiDAR
  meshFaces?: number[][];         // only for LiDAR
  blueprint: BlueprintData;
  quality: number;                 // 0–100
}

export const unifiedScanService = {
  // Returns the best available method for current device
  getBestMethod(): ScanMethod;
  // Returns capability summary
  getCapabilities(): Promise<{
    hasLiDAR: boolean;
    hasAR: boolean;
    hasCamera: boolean;
    recommendedMethod: ScanMethod;
  }>;
  // Run scan using best available method
  runScan(method?: ScanMethod): Promise<ScanOutput>;
}
```

### 4.3 `ARLiDARScanMode` Screen (NEW component)

Replaces the current `ARDepthScanMode` entry point for the `scan` mode when LiDAR is available.

**Layout:**
- Full-screen camera feed
- Live mini-map (top-right, 88×88px) showing captured point cloud / walls
- Scanning oval ring (bottom-center) — animated during capture, progress fills ring
- Instruction bubble (top-center): dynamic, context-aware prompts
- Haptic feedback on each wall capture
- Back button (top-left, small oval)
- "Complete Room" button appears when ≥4 walls captured

**States:**
| State | UI |
|---|---|
| Initializing | "Starting LiDAR session…" + warning banner |
| Scanning | Live mini-map + ring animation + captured wall count |
| Processing | "Processing scan…" + progress percentage |
| Done | ARResultScreen with dimensions + wall count + "Open in Studio" |

### 4.4 `ARCVScanMode` Screen (UPGRADE of current ARDepthScanMode)

- Upgraded from plane-boundary inference to true corner + edge extraction from ARFrame
- Uses `ARFrame` raw camera data for feature point extraction
- Better wall line detection via line segment detection (LSD) algorithm on detected planes
- Mini-map now shows inferred wall lines, not just bounding rectangles

### 4.5 `ARPhotoScanMode` Screen (NEW)

- Guided photo capture UI: shows camera viewfinder with overlay guides
- User photographs each wall (minimum 4 walls, recommended 6)
- User photographs floor from diagonal corner (1 photo)
- Photos uploaded to Supabase Storage
- Edge Function `ar-photo-analyse` runs AI edge detection → extracts wall dimensions
- Polling for results via `getScanStatus()`

### 4.6 `ARScanScreen` (MINIMAL CHANGE)

- Remove the 3-card "Manual / Auto Depth / Photo" sub-selection UI
- Replace with single "Scan Room" button that calls `unifiedScanService.runScan()`
- Add tier gate: if user has no scan access, show tier upgrade prompt
- Capability check runs on mount → shows which method will be used (small badge)
- No mode sub-selection visible to user

---

## 5. Data Flow

### LiDAR Scan Flow

```
[User taps "Scan Room"]
    → unifiedScanService.runScan()
    → detect LiDAR hardware via ARKit scene reconstruction
    → ARKitSession starts with .sceneReconstruction = .mesh
    → Every frame: ARKit provides scene mesh + point cloud
    → Captured walls stored in state
    → finalizeScan() → extracts walls from mesh faces + point cloud
    → arToBlueprintConverter.buildBlueprintFromAR(walls, rooms, [])
    → BlueprintData stored in blueprintStore
    → Navigation to Workspace
```

### Photogrammetry Flow

```
[User taps "Scan Room"]
    → detect no LiDAR/AR → prompt user to photograph walls
    → ARPhotoScanMode guides: 4+ wall photos + 1 floor photo
    → Photos → supabase.storage ('ar-photo-inputs')
    → Edge Function ar-photo-analyse triggered
    → AI extracts edges + dimensions from photos
    → Returns room dimensions + wall outlines
    → buildBlueprintFromAR() called on Edge Function result
    → BlueprintData stored in blueprintStore
    → Navigation to Workspace
```

---

## 6. Native Module Changes

### iOS — `ARKitModule` (upgrade)

Currently: `startSession()` uses ARKit with plane detection.

**Upgrade:**
```swift
// ARKitModule.swift — new session types
enum ARSessionType {
    case planeDetection      // current
    case sceneMesh           // NEW: LiDAR mesh reconstruction
    case pointCloud          // NEW: LiDAR point cloud
}

// startSession options:
// - sceneReconstruction: .mesh (enables scene mesh on LiDAR devices)
// - frameSemantics: [.sceneDepth, .smoothedSceneDepth]  // NEW depth options
```

New native events:
- `ARKitSceneMeshUpdated` — mesh vertices/faces updated each frame
- `ARKitPointCloudUpdated` — point cloud updated each frame
- `ARKitWallDetected` — wall plane inferred from mesh

### Android — `ARCoreModule` (no LiDAR — ARCore uses RGB-D depth)

ARCore does not have LiDAR. The module remains plane-detection based but gains:
- `.sceneDepth` frame semantics for enhanced depth
- Improved wall detection via horizontal + vertical plane grouping

---

## 7. Edge Functions

### `ar-reconstruct` (upgrade existing)

```typescript
// Input
interface ReconstructRequest {
  scanId: string;
  method: 'lidar' | 'cv';
  meshVertices?: Vector3D[];   // LiDAR only
  meshFaces?: number[][];     // LiDAR only
  wallPlanes: DetectedPlane[];
}

// Output
interface ReconstructResponse {
  scanId: string;
  status: 'processing' | 'complete' | 'failed';
  roomDimensions: { width: number; length: number; height: number };
  blueprintData: BlueprintData;
  qualityScore: number;       // 0–100
  wallCount: number;
}
```

### `ar-photo-analyse` (new)

```typescript
// Input
interface PhotoAnalyseRequest {
  photoUrls: string[];       // 4+ wall photos + 1 floor photo
  userId: string;
}

// Output
interface PhotoAnalyseResponse {
  scanId: string;
  status: 'processing' | 'complete' | 'failed';
  roomDimensions: { width: number; length: number; height: number };
  wallOutlines: { width: number; height: number; wallId: string }[];
  qualityScore: number;
}
```

---

## 8. Database

**New table:** `ar_scans`

```sql
CREATE TABLE ar_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('lidar', 'cv', 'photogrammetry')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  room_dimensions JSONB,
  mesh_url TEXT,              -- LiDAR only: URL to stored mesh
  point_cloud_url TEXT,       -- LiDAR only: URL to stored point cloud
  wall_planes JSONB,
  detected_objects JSONB,
  quality_score INTEGER,
  blueprint_data JSONB,       -- BlueprintData JSON
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: user_id = auth.uid() — default deny
```

**Storage buckets:**
- `ar-scans` (existing) — holds captured frames
- `ar-meshes` (new) — holds LiDAR mesh .obj files
- `ar-photo-inputs` (new) — holds user photos before analysis
- `ar-photo-outputs` (new) — holds processed results

---

## 9. Error Handling

| Scenario | Behavior |
|---|---|
| LiDAR hardware not found mid-scan | Graceful switch to CV scan with user notification |
| ARKit session interrupted | Banner warning + pause + auto-resume when app returns |
| Photogrammetry photos blurry | Edge Function returns low confidence → prompt re-take |
| Network offline | Scan data cached in MMKV → upload when online + notify user |
| Edge Function timeout | Retry up to 3x with exponential backoff; show error after 3 failures |
| Quota exceeded (Creator+ limit) | TierGate blocks entry, shows upgrade prompt |

---

## 10. What Stays The Same

- `useARPlanes` hook — continues to work (used by CV scan mode)
- `ARPlaceMode` — no changes (furniture placement via plane hit-test)
- `ARMeasureMode` — no changes (distance measurement)
- `ARResultScreen` — receives `ScanOutput` instead of `ARScanResult` (compatible)
- `arService` — remains unchanged (used for upload + polling)
- Tab bar and navigation — no changes

---

## 11. Implementation Order

1. **Upgrade `ARKitModule`** — add `.sceneMesh` session type + mesh/point cloud events
2. **New `useLiDARScan` hook** — LiDAR session management + point cloud capture
3. **New `unifiedScanService`** — method detection + routing
4. **Upgrade `ARDepthScanMode`** → `ARCVScanMode` with improved wall detection
5. **New `ARPhotoScanMode`** + `ar-photo-analyse` Edge Function
6. **Simplify `ARScanScreen`** — single scan button
7. **New `ar_scans` table** + storage buckets
8. **Database migrations** for new table + buckets
9. **Update tier limits** — photogrammetry gated to Pro+
10. **Obsidian vault sync**
