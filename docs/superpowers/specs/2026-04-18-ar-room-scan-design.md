# AR Room Scan — UX Enhancement

**Date:** 2026-04-18
**Status:** Approved
**Scope:** ARDepthScanMode — the flagship Auto Depth Scan experience (Creator+)

---

## What We're Building

A room scanning UX that feels like a professional tool, not a toy. Based on research from RoomScan, Polycam, MeasureKit — the best-in-class AR scanning apps. ASORIA's advantage: tighter integration with the blueprint studio, and better visual feedback during scanning.

---

## 1. Entry State — Before Scan Starts

### Instruction Card
When user selects "Auto Depth Scan" and enters the mode:

```
┌─────────────────────────────────────────────┐
│  Walk around the room to map walls           │
│                                              │
│  Hold your device steady and walk slowly     │
│  Point at corners and edges for best results │
│                                              │
│  [Start Scanning]  (oval filled button)        │
└─────────────────────────────────────────────┘
```

- Card appears with a sketchy SVG illustration of a phone walking around a room
- "Requires Depth API capable device" note shown if LiDAR/Depth not available
- One tap to start

### Scan Ring (Idle State)
- Static ring centered on bottom button
- Text "Start Scan" inside

---

## 2. Active Scanning State

### Visual Feedback — 4 Key Elements

**A. Live Mini-Map Floor Plan (top-right corner)**

The mini-map evolves as the user scans. Unlike the current plane-rectangle display, it draws connected wall lines:

```
  N
  ┌─────┐         Current: shows plane rectangles
  │▓▓▓▓│         New: draws wall lines as user walks
  │    │
  └─────┘         - Detected walls draw as lines
  1/4 walls         - Connected corners shown as dots
                     - Floor plan grows in real time
```

- 88×88px SVG map, updated every 500ms
- Wall lines appear as user points at walls (from `wallPlanes`)
- Corners marked with small circles when two walls meet
- Color: detected = `DS.colors.success`, active = `DS.colors.primary`, undiscovered = `DS.colors.border`
- Label: "2/4 walls" updates in real time

**B. Scan Quality Indicator**

Shows estimated scan completeness (0–100%):

```
[████████░░] 73%
```

- Calculated from: number of distinct walls detected + coverage of room perimeter
- Below 40%: "Keep scanning walls"
- 40–70%: "Good coverage — scan corners next"
- 70–90%: "Almost complete"
- 90%+: "Ready to finish"

**C. Contextual Instruction Prompts**

Floating instruction bubble updates based on what the app observes:

| Condition | Prompt |
|-----------|--------|
| No walls detected yet | "Point your camera at a wall and slowly walk" |
| Walls detected but sparse | "Move closer to the wall" |
| Good wall detected | "Good — now scan the next wall" |
| Corner detected | "Corner found ✓" |
| All 4 walls done | "Room captured — tap Complete" |
| Lost tracking | "Tracking lost — move slowly" |
| Poor lighting | "Need more light — find a brighter area" |

Bubble style: oval pill, semi-transparent dark background, appears below top bar.

**D. Pulsing Scan Ring + Capture Button**

- Centered at bottom of screen
- Large ring pulses outward continuously (Reanimated `withRepeat` + `withSequence`)
- "Tap to capture wall" text inside ring
- On tap: brief scale animation, wall data saved, mini-map updates

---

## 3. Capturing Walls

### Capture Flow
1. User walks around room, ring pulses, mini-map builds wall lines
2. User taps ring → wall captured → brief haptic feedback
3. Mini-map updates: captured wall turns green, labeled
4. Quality percentage increases
5. After 3+ walls captured, "Complete Room" button appears

### Wall Lock Indicators
When a wall has been adequately scanned:
- Small lock icon appears in mini-map next to that wall
- Wall line changes from primary to success color

---

## 4. Completion Flow

### "Complete Room" Button
- Appears when 3+ walls captured (quality > 65%)
- On tap: "Processing..." overlay with CompassRoseLoader

### Processing State
```
┌────────────────────────────┐
│  Processing scan...        │
│                            │
│  [CompassRoseLoader]       │
│                            │
│  Analysing geometry        │
│  Detecting objects         │
└────────────────────────────┘
```

- Calls `arService.uploadScanFrame()` then `startReconstruction()`
- Polls `arService.getScanStatus()` every 2 seconds
- Shows Roboflow object detection results as they arrive

### Result Screen

**Header:**
```
Scan Complete
4 walls · 6.2m × 4.8m · 6 objects detected
```

**2D Floor Plan Preview** (centered, 200×200px SVG):
```
    ┌─────────┐
    │         │
    │    K    │  ← K = Kitchen (room type label)
    │         │
────┴─────────┴────
```

Shows the generated blueprint floor plan as a simple SVG wireframe.

**Detected Objects List** (scrollable):
```
┌─────────────────────────────────┐
│ ◉ Sofa       2.2m × 0.9m       │
│ ◉ Coffee Table 1.1m × 0.6m      │
│ ◉ Window     1.2m × 0.1m       │
└─────────────────────────────────┘
```

Each row: overhead footprint icon + label + dimensions.

**Action Buttons:**
```
[Import to Studio]   ← primary, filled oval
[Save Scan to Project] ← secondary, outline oval
[Scan Again]          ← tertiary, text only
```

---

## 5. Error States

| Error | UI Response |
|-------|-------------|
| No surfaces detected (after 10s) | "Point at a floor or wall" + phone illustration |
| Tracking lost mid-scan | "Tracking lost — move slowly" bubble, ring turns amber |
| Device has no ARCore/Depth | "Depth scanning requires AR-capable device" card + suggest Manual mode |
| Cloud processing fails | "Scan saved locally — try again later" + Save Scan button |
| No camera permission | (handled by existing ARPermissionRequest component) |

---

## 6. Files to Modify

| File | Change |
|------|--------|
| `src/components/ar/ARDepthScanMode.tsx` | Full rebuild: new mini-map, quality indicator, contextual prompts, improved flow |
| `src/components/ar/ARInstructionBubble.tsx` | Make dynamic — pass context to update instruction text |
| `src/components/ar/ARResultScreen.tsx` | New component for completion screen (or enhance existing) |
| `src/theme/designSystem.ts` | Add `scanQuality` colors if needed |
| `supabase/functions/ar-reconstruct/index.ts` | Already handles frame upload + Meshy + Roboflow — no change needed |

---

## 7. Technical Notes

- Mini-map updates via `setInterval` every 500ms while scanning (same as existing `refresh` pattern)
- Quality % formula: `Math.min(100, (wallCount / 4) * 80 + (cornerCount / 4) * 20)`
- Contextual prompts driven by a `getPrompt(state)` function — easy to extend
- PlaneOverlay (existing) can stay as-is for now — not the priority
- All animation via Reanimated 3 (`withSpring`, `withRepeat`, `withSequence`)
- Haptic feedback via `expo-haptics` on capture tap

---

## 8. Acceptance Criteria

1. Mini-map draws wall lines in real time as user scans
2. Scan quality % updates continuously
3. Contextual prompts change based on scan state
4. "Complete Room" enabled after 3+ walls captured
5. Processing state shows CompassRoseLoader + status messages
6. Result screen shows floor plan SVG + object list + Import/Save/Scan Again
7. Error states handled (no surfaces, tracking lost, processing failure)
8. TypeScript passes with no errors
9. Reanimated 3 used throughout (no RN `Animated`)
10. 44×44pt minimum touch targets on all interactive elements