# ASORIA — Unified Scanning System + AI Knowledge Base
## Design Specification
**Date:** 2026-04-09  
**Status:** Approved for implementation

---

## 1. Overview

This spec covers four tightly related systems that together make ASORIA's spatial capture and AI generation world-class:

1. **Unified Scanning System** — LiDAR (iOS) + ARCore Depth (Android) + Photogrammetry (all devices)
2. **AI Architectural Knowledge Base** — embedded expertise for physics, weather, architecture schools, interior design, landscape
3. **Studio Freedom Elements** — user freedom to place windows, vents, skylights, structural elements
4. **Image-to-Furniture Pipeline** — photo capture → AI 3D model (Pro+)

---

## 2. Unified Scanning System

### 2.1 Platform Strategy

| Platform | Method | Devices | Tier |
|----------|--------|---------|------|
| iOS LiDAR | RoomPlan API (Swift native module) | iPhone 12 Pro+, iPad Pro 2020+ | Creator+ |
| iOS non-LiDAR | ARKit plane detection + photogrammetry | All iOS | Creator+ |
| Android ARCore | Depth API plane detection | ARCore-capable | Creator+ |
| Android no-ARCore | Photogrammetry (multi-frame AI) | All Android | Creator+ |

### 2.2 Architecture

```
ARScanScreen
  └─ ScanningService (unified TS abstraction)
       ├─ ARKitLiDARModule  (iOS native – RoomPlan)
       ├─ ARCoreModule      (Android native – existing, enhanced)
       └─ PhotogrammetryPipeline (cross-platform, cloud-backed)
            └─ ar-reconstruct edge function (Supabase)
```

### 2.3 iOS RoomPlan Native Module (`ARKitLiDARModule`)

New Swift native module wrapping Apple RoomPlan API (iOS 16+, LiDAR required):

```typescript
// src/native/ARKitLiDARModule.ts
interface ARKitLiDARSupport {
  hasLiDAR: boolean;
  hasRoomPlan: boolean; // iOS 16+
  hasARKit: boolean;
}

interface RoomPlanResult {
  walls: Array<{ start: Vector3D; end: Vector3D; height: number; thickness: number }>;
  doors: Array<{ position: Vector3D; width: number; height: number }>;
  windows: Array<{ position: Vector3D; width: number; height: number; wallIndex: number }>;
  furniture: Array<{ type: string; position: Vector3D; dimensions: Vector3D }>;
  floorArea: number;
  confidence: number; // 0–1
}
```

Native Swift layer:
- Uses `RoomCaptureSession` for guided scanning UX
- Exports detected room as `CapturedRoom` → converts to `RoomPlanResult`
- Falls back to ARKit plane detection if RoomPlan unavailable
- Emits `RoomPlanProgress` events during scan (walls detected count, confidence level)

### 2.4 Unified `ScanningService`

Replaces direct `arService` calls from AR components. Routes to the right backend:

```typescript
// src/services/scanningService.ts
export const scanningService = {
  getCapabilities(): ScanCapabilities,   // platform detection
  startScan(mode: ScanMethod): void,
  captureFrame(): Promise<void>,
  finalizeScan(): Promise<ScanResult>,
  convertToBlueprint(result: ScanResult): BlueprintData,
}
```

`ScanMethod` = `'lidar_roomplan' | 'arcore_depth' | 'arkit_plane' | 'photogrammetry'`

Auto-selection logic:
1. iOS + LiDAR + iOS 16+ → `lidar_roomplan`
2. iOS without LiDAR → `arkit_plane` + photogrammetry fallback
3. Android + ARCore + Depth API → `arcore_depth`
4. Android + ARCore (no depth) → `arcore_plane`
5. Any device (fallback) → `photogrammetry`

### 2.5 Photogrammetry Pipeline

Multi-frame capture → server-side Structure-from-Motion reconstruction:

**Client:**
1. User walks room, captures 20–40 overlapping frames (every 15° rotation)
2. Frames uploaded to Supabase Storage `ar-scans/{userId}/{scanId}/frames/`
3. Edge function `ar-reconstruct` processes frames

**Edge function `ar-reconstruct` enhancement:**
- Calls external photogrammetry API (Meshroom-compatible or Luma AI)
- Falls back to AI analysis: Claude vision on keyframes → estimate dimensions
- Returns `ScanResult` with confidence score

**Guidance overlay during capture:**
- Coverage heatmap (SVG overlay) shows which angles have been captured
- "Move right", "Tilt up", "Turn around" voice/text cues
- Minimum frame count indicator before "Finalize" button enables

### 2.6 AR Scan UI Enhancements

New unified `ARScanScreen` entry showing method cards based on device capabilities:

```
┌─────────────────────────────────────────────┐
│  Room Scan                                   │
│  Choose your scan method                     │
├─────────────────────────────────────────────┤
│  🔬 LiDAR Precision Scan        [LiDAR]     │
│  Walk around once. High accuracy.            │
├─────────────────────────────────────────────┤
│  📡 Depth Scan                  [ARCore]    │
│  Auto-detect walls. Requires ARCore.         │
├─────────────────────────────────────────────┤
│  📸 Photo Analysis              [All]       │
│  4 photos of each wall. Works everywhere.    │
├─────────────────────────────────────────────┤
│  🌀 360° Photogrammetry         [All]       │
│  Walk around and capture 30+ frames.         │
└─────────────────────────────────────────────┘
```

LiDAR Scan UX:
- RoomPlan's native guided UI launched via native module
- Progress: walls detected, doors detected, windows detected
- Animated "scanning pulse" ring around camera view
- Result confidence badge (High / Medium / Low) on result screen

---

## 3. AI Architectural Knowledge Base

### 3.1 Strategy

Embedded as structured context in the `ai-generate` edge function system prompt. Not fetched at runtime — baked into the prompt. Organized into modules that the AI references based on user inputs.

Separate `architecture-knowledge-base.ts` file in `src/data/` for in-app AI assistant (studio chat).

### 3.2 Knowledge Modules

#### Module 1 — Building Code Minimums
```
Room size minimums (m²):
- Master bedroom: 12m² (min ceiling 2.4m)
- Standard bedroom: 9m²
- Single bathroom: 3.5m² (shower only) / 5m² (bath)
- Kitchen: 7m² (galley) / 10m² (standard)
- Living room: 15m² (up to 40 persons: 1.5m²/person rule)
- Dining: 10m² (allows 6-person table + 90cm clearance)
- Hallway/corridor: min 900mm width (accessibility: 1200mm)
- Ceiling heights: min 2.4m habitable, 2.1m bathrooms
- Door widths: main entry 900mm, internal 760mm, accessible 900mm

Stair regulations:
- Rise (R): 150–220mm
- Going (G): 220–300mm  
- R + G = 550–700mm rule
- Min stair width: 900mm residential, 1200mm public
- Max consecutive steps before landing: 18
- Handrail height: 850–1000mm from nosing

Window regulations:
- Min window area: 10% of floor area for habitable rooms
- Ventilation: min 5% of floor area openable
- Egress window (bedroom): min 500mm height × 450mm width clear opening
```

#### Module 2 — Structural Rules
```
Load-bearing wall placement:
- Exterior walls: always load-bearing
- Interior walls perpendicular to floor joists: likely load-bearing
- Walls above beams, columns, or foundation walls: load-bearing
- Center spine wall of house: typically load-bearing

Beam spans (residential timber):
- Floor joists: 3–6m span (depending on timber grade + spacing)
- Ridge beam: spans full roof length (requires posts at max 4.5m)
- Lintel over openings: width of opening + 150mm each side bearing

Foundation types by soil:
- Strip foundation: standard residential on stable soil
- Raft/slab: soft ground, uniform load distribution
- Pile foundation: poor bearing capacity, coastal, clay-rich soil
- Pad foundation: isolated columns

Structural wall thickness:
- Cavity/brick: 280–330mm
- Timber frame: 140mm stud + 90mm service cavity = 230mm
- ICF (insulated concrete form): 250–300mm
- Standard blueprint representation: 200mm exterior, 100mm interior
```

#### Module 3 — Passive Solar & Building Physics
```
Orientation rules (Northern Hemisphere):
- Primary glazing faces SOUTH (winter sun path is south, low angle)
- South windows: 7–15% of floor area for passive solar gain
- North windows: minimize (cold, no direct sun)
- East windows: morning light — good for bedrooms, kitchens
- West windows: afternoon sun — overheating risk, use overhangs or shading

Overhang calculation (Southern orientation, 35° latitude):
- Summer sun angle: ~75° — overhang of D = H / tan(75°) ≈ 0.27 × H
- Winter sun angle: ~30° — overhang allows full penetration
- Rule of thumb: overhang depth = window height × 0.25–0.35

Southern Hemisphere: REVERSE all N/S orientation advice.

Thermal mass placement:
- Thermal mass (concrete, brick, tile floors) absorbs solar heat in winter
- Place within 4.5m of south-facing glass
- Exposed dark-colored concrete floors are optimal

Ventilation (cross-ventilation):
- Openings on opposite walls: 30–45° offset captures prevailing winds
- Stack ventilation: low intake + high exhaust (ceiling clerestory)
- Ceiling height of 2.7–3m dramatically improves natural air circulation

Energy efficiency window-to-wall ratio:
- Optimal: 20–30% of wall area
- Above 40%: thermal bridging and overheating risk without proper glazing
- Triple glazing: U-value < 0.8 W/m²K (Passivhaus standard)
```

#### Module 4 — Interior Design Principles
```
Furniture clearances:
- Main circulation path: min 900mm, ideal 1050mm
- Around dining table: min 900mm chair pull-out + 600mm pass-behind
- Around bed: min 600mm one side, 750mm both sides (master)
- TV viewing distance: 1.5× diagonal screen width minimum
- Kitchen work triangle: sink–fridge–cooktop perimeter 4–8m
- Sofa conversation zone: 2.1–3.0m between facing seats
- Coffee table to sofa: 300–450mm

Focal point rules per room:
- Living room: fireplace, TV, or prominent window as focal point
- Bedroom: bed headboard wall as dominant axis
- Dining: pendant light centered on table creates focal zone
- Kitchen: island or range hood as visual anchor

Colour psychology per room:
- Bedroom: cool blues, soft greens, muted lavenders (restful)
- Kitchen/dining: warm ochres, terracotta, sage (appetite + energy)
- Office: medium blues, greens (focus, calm)
- Living: warm neutrals, earthy tones (welcoming, versatile)
- Bathroom: whites, pale blues, stone (clean, spa)

Lighting zones (3-layer approach):
1. Ambient (overhead): 300–500 lux for general tasks
2. Task (directed): 500–1000 lux at work surfaces
3. Accent (decorative): 50–150 lux for atmosphere
```

#### Module 5 — Architectural Schools & Styles
```
Bauhaus / International Style:
- Form follows function; eliminate ornament
- Flat roofs, ribbon windows, open floor plans
- Industrial materials: glass, steel, concrete
- White/grey/black palette with bold primary color accents
- Furniture: geometric, minimal, purpose-driven

Scandinavian:
- Hygge principle: warmth, comfort, human scale
- Light woods (pine, birch, ash), white walls, wool textiles
- Maximum natural light (northern latitude compensation)
- Functional simplicity — every element earns its place
- Organic forms alongside clean lines

Japandi (Japanese + Scandinavian fusion):
- Wabi-sabi: embrace imperfection, natural aging
- Neutral palette: greige, warm white, charcoal, forest green
- Low furniture, tatami proportions (floor-living culture)
- Artisanal details, visible craft

Art Deco:
- Geometric ornamentation, chevrons, sunburst motifs
- Rich materials: marble, brass, lacquered wood, velvet
- High contrast: black + gold, navy + brass, ivory + chrome
- Symmetry and grandeur; statement lighting fixtures
- Stepped/ziggurat roof profiles

Mediterranean:
- Courtyard or atrium at center (passive cooling, social)
- Terracotta tiles, lime-washed plaster, wrought iron
- Deep window reveals (thermal mass + shade)
- Arched openings, barrel-vaulted ceilings
- Outdoor living integration: loggia, pergola, colonnades

Tropical / Bioclimatic:
- Elevated floors (flood, ventilation, vermin)
- Deep overhanging eaves (tropical rainfall, shade)
- Open-plan, louvred walls for air flow
- Cross-ventilation is a structural requirement
- Materials: teak, bamboo, limestone, corrugated iron (vernacular)

Industrial:
- Exposed structure: steel beams, concrete columns, brick walls
- Factory window grids: steel-framed multi-pane
- Raw materials finished — brick sealed, concrete polished
- High ceilings 3.5–5m
- Edison bulb lighting, metal pipe shelving

Victorian / Traditional:
- Bay windows, decorative cornices, dado rails
- Fireplaces in every principal room (chimney stacks visible on plan)
- Symmetrical street facades
- Pitched roofs: gable, hip, or combination
- Hallway-centric plan with rooms off central spine
```

#### Module 6 — Landscape & Outdoor Design
```
Site analysis priorities:
1. Sun path: map sunrise/sunset angles, shadow at winter solstice
2. Prevailing wind direction: place shelter/planting windward
3. Drainage: 2% minimum slope away from building (20mm/m)
4. Soil type: affects plant selection, drainage, foundation type
5. Views: orient main rooms to best views, screen poor views

Outdoor zone hierarchy:
- Public zone: street-facing, 0–3m, hard landscaping, manicured
- Semi-private: side passages, transition, screening planting
- Private: rear garden, full outdoor living, informal planting
- Service zone: bins, utilities, HVAC, clothesline (screened)

Garden design principles (residential):
- 60/30/10 rule: 60% softscape (lawn/groundcover), 30% shrubs, 10% focal trees
- Three-layer planting: canopy trees + mid-shrub layer + groundcover
- Curved paths feel natural; straight paths feel formal
- Golden ratio in terrace proportions: 1:1.618

Pool placement rules:
- Min 1.5m from any building (waterproofing, access)
- Min 1.0m from boundary
- North/northeast position (max sun exposure, Northern Hemisphere)
- South/southeast (Southern Hemisphere)
- Pool house/equipment shed within 10m, screened
- Safety fence min 1.2m with self-latching gate

Driveway & approach:
- Single car: 2.7–3.0m wide
- Double car: 5.5–6.0m wide
- Turning circle (no reverse): 6.0m radius
- Gradient: max 1:6 (16.7%) for driveways
```

#### Module 7 — Feng Shui & Cultural Principles
```
Entry (Bagua mouth of chi):
- Main door should be visible from street (no obstructions)
- Door should not face stairs directly (energy drains)
- Entry area: welcoming, well-lit, space to pause (min 2m² foyer)
- Do not place toilet directly facing front door

Room placement:
- Master bedroom: back of house, quieter, farthest from street
- Kitchen: not visible from front door
- Bathroom: not at house center (stagnates energy)
- Home office: near entry or separate wing (business energy)

Natural light:
- Living spaces: maximum morning and afternoon sun
- Bedrooms: east light (gentle morning wake) preferred
- Kitchen: good natural light (north in Southern Hemisphere)

Clutter and circulation:
- Chi follows human movement — clear pathways essential
- 90cm minimum all hallways
- Rounded furniture corners soften chi (aligns with ASORIA oval aesthetic)
```

#### Module 8 — Universal Accessibility (AS/NZS 1428 & ADA)
```
Wheelchair turning radius: 1500mm diameter circle
Accessible door width: min 860mm clear (900mm door leaf)
Accessible ramp gradient: 1:14 max (1:20 preferred)
Accessible bathroom:
- Min 1800×1800mm clear floor space
- Grab rails at WC (side + rear): 700mm from floor
- Roll-in shower: min 1100×900mm, no lip
- Basin height: 720–760mm (knee clearance underneath)

Accessible kitchen:
- Counter height: 850mm (vs 900mm standard)
- Under-counter knee clearance: 700mm high × 600mm deep
- Side-opening oven and fridge preferred

Accessible parking: 3200–3800mm width, max 30m from entry

Tactile indicators:
- Warning strip: 600mm depth at hazards (stairs, ramps)
- Directional strip: at decision points
```

#### Module 9 — Weather & Climate Considerations
```
Rain protection:
- Minimum roof pitch for tiles: 15° (26% slope)
- Minimum for metal roofing: 3° (5% slope)
- Gutters: sized at 1m²/100mm² gutter for 100mm/hr rainfall
- Eave width for wall protection: 600mm minimum in high-rain
- Drainage: 100mm inspection openings every 12m

Wind loads by zone:
- Standard (N1–N2): timber frame, rafter spacing 600mm
- Cyclonic (C1–C4): metal frame, hurricane straps on every rafter
- Design wind speed affects: roof cladding fixings, window frame ratings, wall bracing

Snow loads:
- Roof pitch steepens (>35°) for snow shedding
- Thermal envelope upgraded: R-5.0 walls, R-7.0 ceiling
- Entry vestibule (airlock): prevents cold infiltration
- Heated driveways/pathways in extreme climates

Coastal environments:
- Salt-resistant materials: aluminum, stainless steel, treated timber
- Elevated floors: 600mm min above 1% ARI flood level
- Corrosion zones affect fastener specification
- Dune/vegetation setback: 50m from foredune typically required
```

#### Module 10 — Creative Render & Atmosphere Knowledge
```
Lighting moods:
- Golden hour (sunrise/sunset): long shadows, warm 2700K amber glow
  Apply: warm directional light at 10–15° elevation, orange-gold tint, long shadow stretch
- Overcast day: soft diffuse light, no shadows, cool 5500K
  Apply: hemisphere light, reduced contrast, blue-grey ambient
- Night interior: warm pools from fixtures, dark voids beyond
  Apply: multiple point lights at 2700K, dark exterior, atmospheric fog at distance
- Twilight exterior: purple-blue sky, interior lights glow warm
  Apply: gradient sky (navy to indigo), warm window glow, silhouette contrast

Material render properties:
- Concrete polished: 10–20% reflectance, speckled grey texture, slight specularity
- Timber (oak): warm amber grain, 5% sheen, wood grain normal map
- Marble: high specularity (40%), vein pattern, slight SSS (subsurface scatter)
- Brick: rough texture, 3–5% reflectance, mortar joint normal map
- Glass: 90% transmittance, 8% reflectance, slight blue-green tint
- Steel brushed: anisotropic sheen, silver-grey, directional grain

Atmospheric effects for renders:
- Rain: puddle reflections on ground, water streaks on glass, overcast sky
- Snow: white ground plane, soft blue shadows, 5% ambient scatter
- Fog/mist: exponential fog from 10m, atmosphere diffusion
- Tropical storm: dramatic cloud layers, rain particles, bent vegetation
- Hot dry: heat shimmer effect, bleached sky, high contrast shadows
- Dusk: sky gradient from orange (horizon) to deep blue (zenith), city glow

Architectural photography composition rules (for render framing):
- Rule of thirds: place horizon on lower third, main building element on vertical third
- Human scale: include person or known object at entry for scale reference
- Leading lines: paths, driveways draw eye into composition
- Foreground interest: plant, water feature adds depth
- Golden ratio spiral for interior compositions
- Wide-angle distortion: avoid below 24mm equivalent (distorts verticals)
```

### 3.3 Updated `ai-generate` Edge Function

The system prompt becomes a structured multi-module context block (~3000 tokens), followed by:

```
GENERATION INSTRUCTIONS:
1. Apply relevant knowledge modules based on building type, style, and climate
2. All coordinates in metres. Grid: 100mm snap.
3. Never overlap rooms. Every room must be accessible from a door.
4. Roof type must match style (flat→modern/industrial, pitched→traditional/Victorian)
5. Furniture must respect clearance rules from Module 4.
6. For render requests: apply atmosphere from Module 10 to material/lighting descriptions.
7. Self-validate before outputting: check all rooms connect, doors have walls, windows on exterior only.

Return valid JSON only.
```

New `ai-render` edge function:
- Input: `{ blueprintId, atmosphere, style, timeOfDay, weather, cameraAngle }`
- Uses Claude with Module 10 knowledge to generate a rich scene description
- Passes description to Replicate SDXL (existing integration) for image generation
- Returns render URL (stored in Supabase Storage)

### 3.4 `architecture-knowledge-base.ts` (in-app)

Used by the Studio AI assistant for contextual responses:

```typescript
// src/data/architectureKnowledge.ts
export const ARCHITECTURE_KNOWLEDGE = {
  structuralRules: { ... },
  clearances: { ... },
  styleGuide: { ... },
  passiveSolar: { ... },
  accessibility: { ... },
  // etc.
}
```

---

## 4. Studio Freedom Elements

### 4.1 New Element Types

Extend `BlueprintData` types to support:

```typescript
// src/types/blueprint.ts additions
type StructuralElement = {
  id: string;
  type: 'column' | 'beam' | 'skylight' | 'vent' | 'hvac' | 'electrical_panel' | 
        'socket' | 'light_point' | 'water_outlet' | 'drain' | 'gas_point';
  position: Vector2D;
  size?: { width: number; height: number };
  wallId?: string;   // for wall-mounted elements
  floorId: string;
  rotation?: number;
  label?: string;
}
```

### 4.2 Studio Toolbar Enhancement

Add new "Services" toolbar section (Creator+) with sub-palette:

```
Structural: Column | Beam | Post | Skylight
Services: Socket | Light | Water | Drain | Vent | HVAC
Openings: Window | Door | Sliding Door | Bi-fold | Skylight
```

Each element has:
- 2D symbol (SVG, architectural standard)
- 3D representation in R3F scene
- Snap to wall behavior for wall-mounted elements
- Auto-annotation of service type

### 4.3 Window & Opening Enhancements

Currently openings exist but aren't placeable via Studio toolbar. This makes them first-class:

- Drag from palette → snaps to nearest wall
- Resize handles (width, height, sill height)
- Window types: casement, sash, fixed, awning, jalousie, louvre, skylight
- Door types: hinged, sliding, pocket, bi-fold, roller (garage)
- Opening elevation preview (side panel shows wall section)

---

## 5. Image-to-Furniture Pipeline (Pro+)

### 5.1 Flow

```
User taps "Image → Furniture" (Pro+)
  → Camera opens (or image picker)
  → Photo captured
  → Uploaded to Supabase Storage
  → Edge function: generate-furniture-from-image
       → Claude Vision: identify furniture type, approximate dimensions
       → Meshy API: generate 3D model from image
       → Store GLB in Supabase Storage
  → Furniture appears in library as custom item
  → Drag to place in Studio
```

### 5.2 Edge Function: `generate-furniture-from-image`

Input: `{ imageUrl: string, userId: string }`

Steps:
1. Claude Vision analyzes image → returns `{ furnitureType, width, height, depth, styleTags }`
2. Calls Meshy API with image URL → task ID
3. Polls for completion (max 5min)
4. Returns GLB model URL + dimensions

Fallback: if Meshy unavailable, Claude Vision estimates dimensions and matches against existing procedural furniture library.

---

## 6. File & Module Map

### New Files
| File | Purpose |
|------|---------|
| `src/native/ARKitLiDARModule.ts` | iOS LiDAR/RoomPlan TypeScript bridge |
| `ios/ARKitLiDARModule.swift` | Swift native implementation |
| `ios/ARKitLiDARModule.m` | ObjC bridge header |
| `src/services/scanningService.ts` | Unified platform-agnostic scan service |
| `src/data/architectureKnowledge.ts` | In-app AI knowledge base |
| `src/components/ar/ARLiDARScanMode.tsx` | LiDAR-specific scan UI |
| `src/components/ar/ARPhotogrammetryMode.tsx` | 360° photogrammetry UI |
| `src/components/studio/ElementPalette.tsx` | Structural/services element picker |
| `supabase/functions/ar-roomplan/index.ts` | Process RoomPlan scan data |
| `supabase/functions/ai-render/index.ts` | Creative render generation |
| `supabase/functions/generate-furniture-from-image/index.ts` | Image→3D furniture |

### Modified Files
| File | Change |
|------|--------|
| `src/screens/ar/ARScanScreen.tsx` | Add LiDAR + photogrammetry mode cards |
| `src/services/arService.ts` | Route to scanningService |
| `src/types/blueprint.ts` | Add StructuralElement type |
| `src/utils/ar/arToBlueprintConverter.ts` | Handle RoomPlan output |
| `supabase/functions/ai-generate/index.ts` | Massive system prompt upgrade |
| `src/components/ar/ARPhotoMode.tsx` | Upgrade to photogrammetry mode |

---

## 7. Tier Gating

| Feature | Tier |
|---------|------|
| LiDAR Precision Scan | Creator+ |
| ARCore Depth Scan | Creator+ |
| Photo Analysis (4-wall) | Creator+ |
| 360° Photogrammetry | Pro+ |
| Creative Renders (ai-render) | Pro+ |
| Image → Furniture | Pro+ |
| Structural/Services elements | Creator+ |
| Window/door freedom placement | Creator+ |
| Advanced atmosphere renders | Architect |

---

## 8. Implementation Phases

### Phase 1 — Unified Scanning (2 weeks)
- iOS ARKit/LiDAR native module + Swift implementation
- Unified ScanningService abstraction
- ARLiDARScanMode component
- ARPhotogrammetryMode component (360°)
- ar-roomplan edge function

### Phase 2 — AI Knowledge Base (1 week)
- architecture-knowledge-base.ts
- Updated ai-generate system prompt (all 10 modules)
- ai-render edge function
- Creative render UI in Studio (Pro+)

### Phase 3 — Studio Freedom Elements (1 week)
- blueprint.ts StructuralElement type
- ElementPalette component
- 2D SVG symbols for all element types
- 3D representations in R3F scene
- Snap-to-wall logic

### Phase 4 — Image-to-Furniture (3 days)
- generate-furniture-from-image edge function
- Image capture → pipeline UI
- Custom furniture library slot in Studio
