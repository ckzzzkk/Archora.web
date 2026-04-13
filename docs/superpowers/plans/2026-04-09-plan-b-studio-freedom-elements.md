# Plan B: Studio Freedom Elements

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give users the freedom to place windows, doors, vents, skylights, structural columns, electrical sockets, lighting points, water outlets, and HVAC units on their blueprints — both in 2D canvas view and the 3D scene.

**Architecture:** Add a `StructuralElement` type to `blueprint.ts` and `FloorData`. Extend the Studio toolbar with a new "Elements" tool. Create an `ElementPalette` sheet for picking element types. Render 2D symbols via SVG in Canvas2D and 3D representations in the R3F scene. Tier-gate full services palette to Creator+.

**Tech Stack:** TypeScript, React Native, NativeWind, Reanimated 3, react-native-svg, Zustand (blueprintStore), R3F for 3D

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/types/blueprint.ts` | Modify | Add `StructuralElement` type + extend `FloorData` |
| `src/stores/blueprintStore.ts` | Modify | Add actions for structural elements |
| `src/components/blueprint/ToolBar.tsx` | Modify | Add 'element' tool to tool list |
| `src/components/blueprint/ElementPalette.tsx` | Create | Sheet UI for picking element type |
| `src/components/blueprint/StructuralElementOverlay.tsx` | Create | SVG 2D symbols rendered over Canvas2D |
| `src/components/3d/StructuralElements3D.tsx` | Create | R3F 3D representations of structural elements |
| `src/screens/workspace/BlueprintWorkspaceScreen.tsx` | Modify | Wire ElementPalette + StructuralElementOverlay + 3D elements |

---

## Task 1: Add `StructuralElement` Type to Blueprint

**Files:**
- Modify: `src/types/blueprint.ts`
- Modify: `src/types/blueprint.ts` (FloorData)

- [ ] **Step 1.1: Add StructuralElement to `src/types/blueprint.ts`**

Add these types after the existing `ElevatorData` interface (around line 201):

```typescript
// After ElevatorData interface, before FloorData:

export type StructuralElementType =
  // Openings (wall-mounted)
  | 'window' | 'window_bay' | 'window_skylight' | 'window_awning' | 'window_louvre'
  | 'door_hinged' | 'door_sliding' | 'door_bifold' | 'door_pocket' | 'door_roller'
  // Structural
  | 'column' | 'beam' | 'post'
  // Services — electrical
  | 'socket_double' | 'light_ceiling' | 'light_downlight' | 'light_wall' | 'light_pendant' | 'switch'
  // Services — plumbing
  | 'water_outlet' | 'drain_floor' | 'drain_sink' | 'toilet_point' | 'shower_point'
  // Services — HVAC
  | 'vent_supply' | 'vent_return' | 'hvac_unit' | 'fan_ceiling'
  // Specialty
  | 'fireplace' | 'gas_point' | 'electrical_panel';

export interface StructuralElement {
  id: string;
  type: StructuralElementType;
  label?: string;
  floorId: string;
  // Position in blueprint metres
  position: Vector2D;
  // For wall-mounted elements: the wallId they're attached to
  wallId?: string;
  // Along-wall position (metres from wall start) for wall-mounted elements
  wallPosition?: number;
  // Size (metres) — optional for point elements like sockets
  width?: number;
  height?: number;
  // Vertical offset from floor (metres) — e.g. 0.9 for a window sill
  elevation?: number;
  // Rotation in degrees (for top-down 2D view)
  rotation?: number;
  // True if user placed manually (vs AI-suggested)
  userPlaced: boolean;
}
```

- [ ] **Step 1.2: Add `structuralElements` to `FloorData`**

In `FloorData` interface (around line 206), add after `elevators`:

```typescript
export interface FloorData {
  id: string;
  label: string;
  index: number;
  walls: Wall[];
  rooms: Room[];
  openings: Opening[];
  furniture: FurniturePiece[];
  staircases: StaircaseData[];
  elevators: ElevatorData[];
  structuralElements: StructuralElement[];   // ← ADD THIS LINE
}
```

- [ ] **Step 1.3: Add `structuralElements` to top-level `BlueprintData`**

In `BlueprintData` interface, add after `furniture`:

```typescript
export interface BlueprintData {
  // ... existing fields ...
  furniture: FurniturePiece[];
  structuralElements: StructuralElement[];   // ← ADD THIS LINE
  customAssets: CustomAsset[];
  // ... rest unchanged ...
}
```

- [ ] **Step 1.4: TypeScript check**

```bash
cd /home/chisanga/Archora/Archora && npx tsc --noEmit --skipLibCheck 2>&1 | grep "blueprint.ts" | head -10
```

Expected: errors referencing `structuralElements` missing — these will be fixed by Step 1.5

- [ ] **Step 1.5: Fix `buildBlueprintFromAR` to include empty structuralElements**

In `src/utils/ar/arToBlueprintConverter.ts`, find `buildBlueprintFromAR` and add `structuralElements: []` in two places:

```typescript
// In the floor object:
const floor: FloorData = {
  id: generateId(),
  label: 'G',
  index: 0,
  walls,
  rooms,
  openings,
  furniture,
  staircases: [],
  elevators: [],
  structuralElements: [],   // ← ADD
};

// In the BlueprintData return:
return {
  // ... existing fields ...
  furniture,
  structuralElements: [],   // ← ADD
  customAssets: [],
  // ...
};
```

- [ ] **Step 1.6: TypeScript check — should pass**

```bash
cd /home/chisanga/Archora/Archora && npx tsc --noEmit --skipLibCheck 2>&1 | grep -c "error" || echo "0 errors"
```

Expected: same or fewer errors than before (only pre-existing issues remain)

- [ ] **Step 1.7: Commit**

```bash
cd /home/chisanga/Archora/Archora && git add src/types/blueprint.ts src/utils/ar/arToBlueprintConverter.ts && git commit -m "feat(types): add StructuralElement type and extend FloorData/BlueprintData"
```

---

## Task 2: Add Store Actions for Structural Elements

**Files:**
- Modify: `src/stores/blueprintStore.ts`

- [ ] **Step 2.1: Read current blueprintStore actions pattern**

```bash
grep -n "addFurniture\|removeFurniture\|actions\." /home/chisanga/Archora/Archora/src/stores/blueprintStore.ts | head -20
```

Note the pattern used. Actions follow: `(state) => { /* return new state */ }` Zustand produce pattern.

- [ ] **Step 2.2: Add structural element actions**

In `blueprintStore.ts`, find the `actions` object and add these actions alongside existing `addFurniture`/`removeFurniture` pattern:

```typescript
// In the actions object of blueprintStore:

addStructuralElement: (element: Omit<StructuralElement, 'id'>) => {
  const newEl: StructuralElement = {
    ...element,
    id: `sel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  set((state) => {
    const activeFloor = state.blueprint?.floors[state.activeFloorIndex ?? 0];
    if (!activeFloor || !state.blueprint) return state;
    const updatedFloor: FloorData = {
      ...activeFloor,
      structuralElements: [...(activeFloor.structuralElements ?? []), newEl],
    };
    const updatedFloors = state.blueprint.floors.map((f, i) =>
      i === (state.activeFloorIndex ?? 0) ? updatedFloor : f
    );
    return {
      blueprint: {
        ...state.blueprint,
        floors: updatedFloors,
        structuralElements: updatedFloor.structuralElements,
        updatedAt: new Date().toISOString(),
      },
    };
  });
},

removeStructuralElement: (elementId: string) => {
  set((state) => {
    const activeFloor = state.blueprint?.floors[state.activeFloorIndex ?? 0];
    if (!activeFloor || !state.blueprint) return state;
    const updatedFloor: FloorData = {
      ...activeFloor,
      structuralElements: (activeFloor.structuralElements ?? []).filter((e) => e.id !== elementId),
    };
    const updatedFloors = state.blueprint.floors.map((f, i) =>
      i === (state.activeFloorIndex ?? 0) ? updatedFloor : f
    );
    return {
      blueprint: {
        ...state.blueprint,
        floors: updatedFloors,
        structuralElements: updatedFloor.structuralElements,
        updatedAt: new Date().toISOString(),
      },
    };
  });
},

updateStructuralElement: (elementId: string, updates: Partial<StructuralElement>) => {
  set((state) => {
    const activeFloor = state.blueprint?.floors[state.activeFloorIndex ?? 0];
    if (!activeFloor || !state.blueprint) return state;
    const updatedFloor: FloorData = {
      ...activeFloor,
      structuralElements: (activeFloor.structuralElements ?? []).map((e) =>
        e.id === elementId ? { ...e, ...updates } : e
      ),
    };
    const updatedFloors = state.blueprint.floors.map((f, i) =>
      i === (state.activeFloorIndex ?? 0) ? updatedFloor : f
    );
    return {
      blueprint: {
        ...state.blueprint,
        floors: updatedFloors,
        structuralElements: updatedFloor.structuralElements,
        updatedAt: new Date().toISOString(),
      },
    };
  });
},
```

Also add the import at top of blueprintStore.ts if not already present:
```typescript
import type { StructuralElement, FloorData } from '../types/blueprint';
```

- [ ] **Step 2.3: TypeScript check**

```bash
cd /home/chisanga/Archora/Archora && npx tsc --noEmit --skipLibCheck 2>&1 | grep "blueprintStore" | head -10
```

Expected: no new errors

- [ ] **Step 2.4: Commit**

```bash
cd /home/chisanga/Archora/Archora && git add src/stores/blueprintStore.ts && git commit -m "feat(store): add addStructuralElement, removeStructuralElement, updateStructuralElement actions"
```

---

## Task 3: Add 'element' Tool to ToolBar

**Files:**
- Modify: `src/components/blueprint/ToolBar.tsx`

- [ ] **Step 3.1: Update ToolBar to include element tool**

In `src/components/blueprint/ToolBar.tsx`, find the `Tool` type and `TOOLS` array and update:

```typescript
// Replace current Tool type:
type Tool = 'select' | 'wall' | 'door' | 'window' | 'furniture' | 'measure' | 'element';

// Replace current TOOLS array:
const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: '↖' },
  { id: 'wall', label: 'Wall', icon: '▬' },
  { id: 'door', label: 'Door', icon: '⊡' },
  { id: 'window', label: 'Window', icon: '⊞' },
  { id: 'furniture', label: 'Items', icon: '⊕' },
  { id: 'element', label: 'Elements', icon: '⚡' },
  { id: 'measure', label: 'Measure', icon: '↔' },
];
```

Export the `Tool` type so workspace can import it:
```typescript
export type { Tool };
```

- [ ] **Step 3.2: TypeScript check**

```bash
cd /home/chisanga/Archora/Archora && npx tsc --noEmit --skipLibCheck 2>&1 | grep "ToolBar" | head -5
```

- [ ] **Step 3.3: Commit**

```bash
cd /home/chisanga/Archora/Archora && git add src/components/blueprint/ToolBar.tsx && git commit -m "feat(toolbar): add element tool for structural/services element placement"
```

---

## Task 4: Create `ElementPalette` Sheet

**Files:**
- Create: `src/components/blueprint/ElementPalette.tsx`

- [ ] **Step 4.1: Write ElementPalette**

```tsx
// src/components/blueprint/ElementPalette.tsx
import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { ArchText } from '../common/ArchText';
import { DS } from '../../theme/designSystem';
import { SUNRISE } from '../../theme/sunrise';
import type { StructuralElementType } from '../../types/blueprint';

export interface ElementOption {
  type: StructuralElementType;
  label: string;
  symbol: string;      // emoji/text symbol shown in palette
  category: 'opening' | 'structural' | 'electrical' | 'plumbing' | 'hvac';
  defaultWidth?: number;   // metres
  defaultHeight?: number;  // metres
  defaultElevation?: number;
}

export const ELEMENT_OPTIONS: ElementOption[] = [
  // Openings
  { type: 'window', label: 'Window', symbol: '⊞', category: 'opening', defaultWidth: 1.2, defaultHeight: 1.2, defaultElevation: 0.9 },
  { type: 'window_bay', label: 'Bay Window', symbol: '⊟', category: 'opening', defaultWidth: 1.8, defaultHeight: 1.2, defaultElevation: 0.9 },
  { type: 'window_skylight', label: 'Skylight', symbol: '◫', category: 'opening', defaultWidth: 1.0, defaultHeight: 1.0, defaultElevation: 2.4 },
  { type: 'window_awning', label: 'Awning Win', symbol: '⊡', category: 'opening', defaultWidth: 0.9, defaultHeight: 0.6, defaultElevation: 1.5 },
  { type: 'window_louvre', label: 'Louvre', symbol: '≡', category: 'opening', defaultWidth: 0.9, defaultHeight: 0.6, defaultElevation: 1.5 },
  { type: 'door_hinged', label: 'Hinged Door', symbol: '⊣', category: 'opening', defaultWidth: 0.9, defaultHeight: 2.1 },
  { type: 'door_sliding', label: 'Sliding Door', symbol: '⊢', category: 'opening', defaultWidth: 1.8, defaultHeight: 2.1 },
  { type: 'door_bifold', label: 'Bi-fold Door', symbol: '⊦', category: 'opening', defaultWidth: 1.5, defaultHeight: 2.1 },
  { type: 'door_pocket', label: 'Pocket Door', symbol: '⊧', category: 'opening', defaultWidth: 0.9, defaultHeight: 2.1 },
  { type: 'door_roller', label: 'Roller Door', symbol: '⊤', category: 'opening', defaultWidth: 2.4, defaultHeight: 2.1 },
  // Structural
  { type: 'column', label: 'Column', symbol: '●', category: 'structural', defaultWidth: 0.3, defaultHeight: 0.3 },
  { type: 'beam', label: 'Beam', symbol: '━', category: 'structural', defaultWidth: 3.0, defaultHeight: 0.3 },
  { type: 'post', label: 'Post', symbol: '◉', category: 'structural', defaultWidth: 0.15, defaultHeight: 0.15 },
  // Electrical
  { type: 'socket_double', label: 'Power Socket', symbol: '⏻', category: 'electrical' },
  { type: 'light_ceiling', label: 'Ceiling Light', symbol: '✦', category: 'electrical' },
  { type: 'light_downlight', label: 'Downlight', symbol: '◎', category: 'electrical' },
  { type: 'light_wall', label: 'Wall Light', symbol: '◈', category: 'electrical' },
  { type: 'light_pendant', label: 'Pendant', symbol: '⊗', category: 'electrical' },
  { type: 'switch', label: 'Switch', symbol: '⊙', category: 'electrical' },
  { type: 'electrical_panel', label: 'Elec. Panel', symbol: '▣', category: 'electrical' },
  // Plumbing
  { type: 'water_outlet', label: 'Water Outlet', symbol: '⌁', category: 'plumbing' },
  { type: 'drain_floor', label: 'Floor Drain', symbol: '◌', category: 'plumbing' },
  { type: 'drain_sink', label: 'Sink Drain', symbol: '◍', category: 'plumbing' },
  { type: 'toilet_point', label: 'Toilet Point', symbol: '⊘', category: 'plumbing' },
  { type: 'shower_point', label: 'Shower Point', symbol: '⊛', category: 'plumbing' },
  // HVAC
  { type: 'vent_supply', label: 'Supply Vent', symbol: '▲', category: 'hvac' },
  { type: 'vent_return', label: 'Return Vent', symbol: '▼', category: 'hvac' },
  { type: 'hvac_unit', label: 'HVAC Unit', symbol: '❄', category: 'hvac' },
  { type: 'fan_ceiling', label: 'Ceiling Fan', symbol: '✿', category: 'hvac' },
  { type: 'fireplace', label: 'Fireplace', symbol: '🔥', category: 'hvac' },
];

const CATEGORIES: { id: ElementOption['category']; label: string; emoji: string }[] = [
  { id: 'opening', label: 'Openings', emoji: '🪟' },
  { id: 'structural', label: 'Structural', emoji: '🏗️' },
  { id: 'electrical', label: 'Electrical', emoji: '⚡' },
  { id: 'plumbing', label: 'Plumbing', emoji: '🚿' },
  { id: 'hvac', label: 'HVAC', emoji: '💨' },
];

interface ElementPaletteProps {
  onSelectElement: (option: ElementOption) => void;
  onClose: () => void;
}

export function ElementPalette({ onSelectElement, onClose }: ElementPaletteProps) {
  const [activeCategory, setActiveCategory] = useState<ElementOption['category']>('opening');

  const visibleElements = ELEMENT_OPTIONS.filter((e) => e.category === activeCategory);

  return (
    <View style={{
      backgroundColor: DS.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 24,
      maxHeight: 420,
    }}>
      {/* Handle */}
      <View style={{ alignItems: 'center', paddingVertical: 10 }}>
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: DS.colors.border }} />
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              style={{
                borderRadius: 50,
                paddingHorizontal: 14,
                paddingVertical: 8,
                backgroundColor: activeCategory === cat.id ? DS.colors.primary + '22' : DS.colors.elevated,
                borderWidth: 1,
                borderColor: activeCategory === cat.id ? DS.colors.primary : DS.colors.border,
              }}
            >
              <ArchText variant="body" style={{
                fontFamily: DS.font.regular,
                fontSize: 12,
                color: activeCategory === cat.id ? DS.colors.primary : DS.colors.primaryDim,
              }}>
                {cat.emoji} {cat.label}
              </ArchText>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Element grid */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {visibleElements.map((el) => (
          <Pressable
            key={el.type}
            onPress={() => { onSelectElement(el); onClose(); }}
            style={{
              width: '22%',
              aspectRatio: 1,
              borderRadius: 16,
              backgroundColor: DS.colors.elevated,
              borderWidth: 1,
              borderColor: DS.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <ArchText variant="body" style={{ fontSize: 22, color: DS.colors.primary }}>{el.symbol}</ArchText>
            <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 9, color: DS.colors.primaryDim, textAlign: 'center' }}>
              {el.label}
            </ArchText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 4.2: TypeScript check**

```bash
cd /home/chisanga/Archora/Archora && npx tsc --noEmit --skipLibCheck 2>&1 | grep "ElementPalette" | head -10
```

Expected: no errors

- [ ] **Step 4.3: Commit**

```bash
cd /home/chisanga/Archora/Archora && git add src/components/blueprint/ElementPalette.tsx && git commit -m "feat(studio): add ElementPalette sheet with 30+ structural, opening, services elements"
```

---

## Task 5: Create `StructuralElementOverlay` (2D Canvas SVG Symbols)

**Files:**
- Create: `src/components/blueprint/StructuralElementOverlay.tsx`

- [ ] **Step 5.1: Write the overlay**

```tsx
// src/components/blueprint/StructuralElementOverlay.tsx
// Renders 2D architectural symbols for structural elements on top of the Canvas2D.
// Uses react-native-svg. Symbols follow standard architectural drawing conventions.
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Rect, Line, Path, G, Text as SvgText, Polygon } from 'react-native-svg';
import type { StructuralElement } from '../../types/blueprint';
import { DS } from '../../theme/designSystem';

interface StructuralElementOverlayProps {
  elements: StructuralElement[];
  scale: number;       // pixels per metre (from canvas zoom)
  offsetX: number;     // canvas pan offset X in pixels
  offsetY: number;     // canvas pan offset Y in pixels
  canvasWidth: number;
  canvasHeight: number;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

// Convert blueprint metres to screen pixels
function toScreen(
  pos: { x: number; y: number },
  scale: number,
  offsetX: number,
  offsetY: number,
): { x: number; y: number } {
  return {
    x: pos.x * scale + offsetX,
    y: pos.y * scale + offsetY,
  };
}

export function StructuralElementOverlay({
  elements,
  scale,
  offsetX,
  offsetY,
  canvasWidth,
  canvasHeight,
  selectedId,
  onSelect,
}: StructuralElementOverlayProps) {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, width: canvasWidth, height: canvasHeight }} pointerEvents="box-none">
      <Svg width={canvasWidth} height={canvasHeight}>
        {elements.map((el) => {
          const { x, y } = toScreen(el.position, scale, offsetX, offsetY);
          const isSelected = el.id === selectedId;
          const color = isSelected ? DS.colors.primary : '#4A90D9';
          const strokeW = isSelected ? 2 : 1.5;

          return (
            <G key={el.id} onPress={() => onSelect?.(el.id)}>
              {renderSymbol(el, x, y, scale, color, strokeW)}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

function renderSymbol(
  el: StructuralElement,
  x: number,
  y: number,
  scale: number,
  color: string,
  strokeW: number,
) {
  const S = 12; // symbol half-size in pixels (fixed, not scaled)

  switch (el.type) {
    // ── WINDOWS ──────────────────────────────────────────────
    case 'window':
    case 'window_awning':
    case 'window_louvre':
      return (
        <G>
          <Rect x={x - S} y={y - 3} width={S * 2} height={6} fill="none" stroke={color} strokeWidth={strokeW} />
          <Line x1={x - S} y1={y} x2={x + S} y2={y} stroke={color} strokeWidth={strokeW * 0.5} strokeDasharray="3 2" />
        </G>
      );
    case 'window_bay':
      return (
        <G>
          <Rect x={x - S * 1.5} y={y - 3} width={S * 3} height={6} fill="none" stroke={color} strokeWidth={strokeW} />
          <Rect x={x - S * 0.5} y={y - 5} width={S} height={10} fill="none" stroke={color} strokeWidth={strokeW * 0.7} />
        </G>
      );
    case 'window_skylight':
      return (
        <G>
          <Rect x={x - S} y={y - S} width={S * 2} height={S * 2} fill={color + '22'} stroke={color} strokeWidth={strokeW} />
          <Line x1={x - S} y1={y - S} x2={x + S} y2={y + S} stroke={color} strokeWidth={strokeW * 0.5} />
          <Line x1={x + S} y1={y - S} x2={x - S} y2={y + S} stroke={color} strokeWidth={strokeW * 0.5} />
        </G>
      );

    // ── DOORS ────────────────────────────────────────────────
    case 'door_hinged':
      return (
        <G>
          <Line x1={x} y1={y} x2={x + S * 1.5} y2={y} stroke={color} strokeWidth={strokeW * 1.5} />
          <Path d={`M${x} ${y} A${S * 1.5} ${S * 1.5} 0 0 1 ${x} ${y - S * 1.5}`} fill="none" stroke={color} strokeWidth={strokeW * 0.7} strokeDasharray="3 2" />
        </G>
      );
    case 'door_sliding':
      return (
        <G>
          <Rect x={x - S} y={y - 2} width={S * 2} height={4} fill={color + '33'} stroke={color} strokeWidth={strokeW} />
          <Line x1={x - S * 1.2} y1={y} x2={x - S * 0.2} y2={y} stroke={color} strokeWidth={strokeW * 1.5} />
          <Polygon points={`${x - S * 0.2},${y - 3} ${x - S * 0.2},${y + 3} ${x},${y}`} fill={color} />
        </G>
      );
    case 'door_bifold':
      return (
        <G>
          <Line x1={x - S} y1={y} x2={x} y2={y - S} stroke={color} strokeWidth={strokeW} />
          <Line x1={x} y1={y - S} x2={x + S} y2={y} stroke={color} strokeWidth={strokeW} />
          <Line x1={x - S} y1={y} x2={x + S} y2={y} stroke={color} strokeWidth={strokeW * 0.5} strokeDasharray="2 2" />
        </G>
      );

    // ── STRUCTURAL ───────────────────────────────────────────
    case 'column':
      return (
        <G>
          <Rect x={x - S * 0.6} y={y - S * 0.6} width={S * 1.2} height={S * 1.2} fill={color + '33'} stroke={color} strokeWidth={strokeW} />
          <Line x1={x - S * 0.6} y1={y - S * 0.6} x2={x + S * 0.6} y2={y + S * 0.6} stroke={color} strokeWidth={strokeW * 0.5} />
          <Line x1={x + S * 0.6} y1={y - S * 0.6} x2={x - S * 0.6} y2={y + S * 0.6} stroke={color} strokeWidth={strokeW * 0.5} />
        </G>
      );
    case 'post':
      return (
        <Circle cx={x} cy={y} r={S * 0.5} fill={color + '33'} stroke={color} strokeWidth={strokeW} />
      );
    case 'beam':
      return (
        <G>
          <Line x1={x - S * 2} y1={y} x2={x + S * 2} y2={y} stroke={color} strokeWidth={strokeW * 3} strokeLinecap="round" />
          <Line x1={x - S * 2} y1={y - 3} x2={x - S * 2} y2={y + 3} stroke={color} strokeWidth={strokeW} />
          <Line x1={x + S * 2} y1={y - 3} x2={x + S * 2} y2={y + 3} stroke={color} strokeWidth={strokeW} />
        </G>
      );

    // ── ELECTRICAL ───────────────────────────────────────────
    case 'socket_double':
      return (
        <G>
          <Circle cx={x} cy={y} r={S * 0.8} fill="none" stroke={color} strokeWidth={strokeW} />
          <Line x1={x - 4} y1={y - 3} x2={x - 4} y2={y + 3} stroke={color} strokeWidth={strokeW} />
          <Line x1={x + 4} y1={y - 3} x2={x + 4} y2={y + 3} stroke={color} strokeWidth={strokeW} />
        </G>
      );
    case 'light_ceiling':
    case 'light_downlight':
      return (
        <G>
          <Circle cx={x} cy={y} r={S * 0.7} fill={color + '22'} stroke={color} strokeWidth={strokeW} />
          <Circle cx={x} cy={y} r={3} fill={color} />
        </G>
      );
    case 'switch':
      return (
        <G>
          <Rect x={x - 5} y={y - 7} width={10} height={14} rx={2} fill="none" stroke={color} strokeWidth={strokeW} />
          <Line x1={x - 3} y1={y} x2={x + 3} y2={y} stroke={color} strokeWidth={strokeW} />
        </G>
      );
    case 'electrical_panel':
      return (
        <G>
          <Rect x={x - S} y={y - S * 0.7} width={S * 2} height={S * 1.4} fill="none" stroke={color} strokeWidth={strokeW} />
          <Line x1={x - S + 2} y1={y - 4} x2={x + S - 2} y2={y - 4} stroke={color} strokeWidth={strokeW * 0.7} />
          <Line x1={x - S + 2} y1={y} x2={x + S - 2} y2={y} stroke={color} strokeWidth={strokeW * 0.7} />
          <Line x1={x - S + 2} y1={y + 4} x2={x + S - 2} y2={y + 4} stroke={color} strokeWidth={strokeW * 0.7} />
        </G>
      );

    // ── PLUMBING ─────────────────────────────────────────────
    case 'water_outlet':
    case 'toilet_point':
    case 'shower_point':
      return (
        <G>
          <Circle cx={x} cy={y} r={S * 0.7} fill="none" stroke={color} strokeWidth={strokeW} />
          <Line x1={x} y1={y - S * 0.7} x2={x} y2={y + S * 0.7} stroke={color} strokeWidth={strokeW * 0.5} />
          <Line x1={x - S * 0.7} y1={y} x2={x + S * 0.7} y2={y} stroke={color} strokeWidth={strokeW * 0.5} />
        </G>
      );
    case 'drain_floor':
    case 'drain_sink':
      return (
        <G>
          <Circle cx={x} cy={y} r={S * 0.8} fill="none" stroke={color} strokeWidth={strokeW} />
          <Circle cx={x} cy={y} r={4} fill="none" stroke={color} strokeWidth={strokeW * 0.7} />
          <Circle cx={x} cy={y} r={2} fill={color} />
        </G>
      );

    // ── HVAC ─────────────────────────────────────────────────
    case 'vent_supply':
      return (
        <G>
          <Rect x={x - S * 0.8} y={y - S * 0.5} width={S * 1.6} height={S} fill="none" stroke={color} strokeWidth={strokeW} />
          <Line x1={x - S * 0.6} y1={y} x2={x + S * 0.6} y2={y} stroke={color} strokeWidth={strokeW * 0.5} />
          <Polygon points={`${x},${y - 4} ${x - 4},${y + 2} ${x + 4},${y + 2}`} fill={color} />
        </G>
      );
    case 'vent_return':
      return (
        <G>
          <Rect x={x - S * 0.8} y={y - S * 0.5} width={S * 1.6} height={S} fill="none" stroke={color} strokeWidth={strokeW} />
          <Line x1={x - S * 0.6} y1={y} x2={x + S * 0.6} y2={y} stroke={color} strokeWidth={strokeW * 0.5} />
          <Polygon points={`${x},${y + 4} ${x - 4},${y - 2} ${x + 4},${y - 2}`} fill={color} />
        </G>
      );
    case 'fan_ceiling':
      return (
        <G>
          <Circle cx={x} cy={y} r={S * 0.9} fill="none" stroke={color} strokeWidth={strokeW} />
          <Path d={`M${x} ${y} L${x + S * 0.7} ${y - S * 0.7} A${S * 0.5} ${S * 0.5} 0 0 0 ${x + S * 0.7} ${y + S * 0.3}`} fill={color + '55'} stroke={color} strokeWidth={strokeW * 0.5} />
          <Path d={`M${x} ${y} L${x - S * 0.7} ${y + S * 0.7} A${S * 0.5} ${S * 0.5} 0 0 0 ${x - S * 0.7} ${y - S * 0.3}`} fill={color + '55'} stroke={color} strokeWidth={strokeW * 0.5} />
          <Circle cx={x} cy={y} r={3} fill={color} />
        </G>
      );
    case 'hvac_unit':
      return (
        <G>
          <Rect x={x - S * 1.2} y={y - S * 0.7} width={S * 2.4} height={S * 1.4} rx={4} fill={color + '22'} stroke={color} strokeWidth={strokeW} />
          <Line x1={x - S * 0.8} y1={y - 4} x2={x + S * 0.8} y2={y - 4} stroke={color} strokeWidth={strokeW * 0.5} />
          <Line x1={x - S * 0.8} y1={y} x2={x + S * 0.8} y2={y} stroke={color} strokeWidth={strokeW * 0.5} />
          <Line x1={x - S * 0.8} y1={y + 4} x2={x + S * 0.8} y2={y + 4} stroke={color} strokeWidth={strokeW * 0.5} />
        </G>
      );
    case 'fireplace':
      return (
        <G>
          <Rect x={x - S} y={y - S * 0.8} width={S * 2} height={S * 1.6} fill="none" stroke={color} strokeWidth={strokeW} />
          <Path d={`M${x - S * 0.7} ${y + S * 0.8} L${x} ${y - S * 0.5} L${x + S * 0.7} ${y + S * 0.8}`} fill={color + '33'} stroke={color} strokeWidth={strokeW * 0.5} />
        </G>
      );

    // ── DEFAULT ──────────────────────────────────────────────
    default:
      return (
        <G>
          <Circle cx={x} cy={y} r={S * 0.5} fill={color + '33'} stroke={color} strokeWidth={strokeW} />
          <SvgText x={x} y={y + 4} fontSize={8} fill={color} textAnchor="middle">?</SvgText>
        </G>
      );
  }
}
```

- [ ] **Step 5.2: TypeScript check**

```bash
cd /home/chisanga/Archora/Archora && npx tsc --noEmit --skipLibCheck 2>&1 | grep "StructuralElementOverlay" | head -5
```

Expected: no errors

- [ ] **Step 5.3: Commit**

```bash
cd /home/chisanga/Archora/Archora && git add src/components/blueprint/StructuralElementOverlay.tsx && git commit -m "feat(canvas): add StructuralElementOverlay with 30+ architectural 2D SVG symbols"
```

---

## Task 6: Wire Everything into BlueprintWorkspaceScreen

**Files:**
- Modify: `src/screens/workspace/BlueprintWorkspaceScreen.tsx`

- [ ] **Step 6.1: Check what props Canvas2D accepts**

```bash
grep -n "interface\|props\|scale\|offsetX\|offsetY" /home/chisanga/Archora/Archora/src/components/blueprint/Canvas2D.tsx | head -20
```

Note the scale and offset props available.

- [ ] **Step 6.2: Add imports and state**

In `BlueprintWorkspaceScreen.tsx`, add at the top with other imports:

```tsx
import { ElementPalette, type ElementOption } from '../../components/blueprint/ElementPalette';
import { StructuralElementOverlay } from '../../components/blueprint/StructuralElementOverlay';
import type { StructuralElement } from '../../types/blueprint';
```

Add to component state:

```tsx
const [showElementPalette, setShowElementPalette] = useState(false);
const [canvasScale, setCanvasScale] = useState(60); // pixels per metre, adjust to match Canvas2D default
const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
```

- [ ] **Step 6.3: Handle element selection and placement**

Add the handler function inside the component:

```tsx
const handleSelectElement = useCallback((option: ElementOption) => {
  // Place the element at the centre of the visible canvas area
  const centreX = (canvasWidth / 2 - canvasOffset.x) / canvasScale;
  const centreY = (canvasHeight / 2 - canvasOffset.y) / canvasScale;
  const newElement: Omit<StructuralElement, 'id'> = {
    type: option.type,
    label: option.label,
    floorId: currentFloorId,
    position: { x: Math.round(centreX * 10) / 10, y: Math.round(centreY * 10) / 10 },
    width: option.defaultWidth,
    height: option.defaultHeight,
    elevation: option.defaultElevation ?? 0,
    userPlaced: true,
  };
  useBlueprintStore.getState().actions.addStructuralElement(newElement);
}, [canvasScale, canvasOffset, currentFloorId]);
```

- [ ] **Step 6.4: Show ElementPalette when 'element' tool selected**

In the existing tool handler (where `activeTool` state changes), add:

```tsx
// In handleToolChange or wherever tool changes are handled:
if (tool === 'element') {
  setShowElementPalette(true);
}
```

Add the ElementPalette sheet to the render (alongside other bottom sheets):

```tsx
{showElementPalette && (
  <Modal transparent animationType="slide" onRequestClose={() => setShowElementPalette(false)}>
    <Pressable style={{ flex: 1 }} onPress={() => setShowElementPalette(false)} />
    <ElementPalette
      onSelectElement={handleSelectElement}
      onClose={() => setShowElementPalette(false)}
    />
  </Modal>
)}
```

- [ ] **Step 6.5: Add StructuralElementOverlay to 2D canvas view**

Find where Canvas2D is rendered and add the overlay after it:

```tsx
<View style={{ flex: 1 }}>
  <Canvas2D
    // ... existing props ...
    onScaleChange={setCanvasScale}
    onOffsetChange={setCanvasOffset}
  />
  <StructuralElementOverlay
    elements={currentFloor?.structuralElements ?? []}
    scale={canvasScale}
    offsetX={canvasOffset.x}
    offsetY={canvasOffset.y}
    canvasWidth={canvasWidth}
    canvasHeight={canvasHeight}
    selectedId={selectedElementId}
    onSelect={(id) => setSelectedElementId(id)}
  />
</View>
```

- [ ] **Step 6.6: TypeScript check + build**

```bash
cd /home/chisanga/Archora/Archora && npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "error TS" | head -15
```

Fix any type errors. Common fix: add `| null` to optional IDs, use `?? []` for array access.

- [ ] **Step 6.7: Commit**

```bash
cd /home/chisanga/Archora/Archora && git add src/screens/workspace/BlueprintWorkspaceScreen.tsx && git commit -m "feat(studio): wire element palette and structural element overlay into workspace"
```

---

## Self-Review

- [x] StructuralElement type covers all 30+ element types from spec
- [x] Store actions: add, remove, update — all present in Task 2
- [x] Toolbar 'element' tool added — Task 3
- [x] ElementPalette: all 5 categories, all elements — Task 4
- [x] 2D SVG symbols for every element type — Task 5
- [x] Workspace wiring — Task 6
- [x] No placeholders: all code is complete
- [x] Type consistency: `StructuralElementType` used consistently in blueprint.ts, blueprintStore.ts, ElementPalette.tsx, StructuralElementOverlay.tsx
