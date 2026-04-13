# Plan A: AI Architectural Knowledge Base + Creative Renders

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the minimal 50-line `ai-generate` system prompt with a 10-module architectural knowledge base covering building physics, structural rules, interior design, landscape, architectural schools, feng shui, accessibility, weather, and creative render atmospheres — and add a new `ai-render` edge function for AI-generated visual renders.

**Architecture:** The knowledge base is embedded statically in the Supabase Edge Function system prompt (no runtime fetch). A mirror TypeScript file in `src/data/` makes the same knowledge available to the in-app Studio AI assistant. A new `ai-render` edge function takes a blueprint + atmosphere params and calls Claude + SDXL to generate visual renders.

**Tech Stack:** Deno TypeScript (Edge Functions), Claude claude-sonnet-4-6 API, Replicate SDXL (existing), Supabase Storage, React Native + NativeWind

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `supabase/functions/ai-generate/index.ts` | Modify | Expanded system prompt + new request schema fields |
| `src/data/architectureKnowledge.ts` | Create | In-app knowledge constants for Studio AI assistant |
| `supabase/functions/ai-render/index.ts` | Create | Blueprint + atmosphere → Claude description → SDXL image |
| `src/components/blueprint/RenderSheet.tsx` | Create | Pro+ Creative Render UI (atmosphere selector + result display) |

---

## Task 1: Create `architectureKnowledge.ts`

**Files:**
- Create: `src/data/architectureKnowledge.ts`

- [ ] **Step 1.1: Write the file**

```typescript
// src/data/architectureKnowledge.ts
// Structured architectural knowledge used by the in-app Studio AI assistant.
// Mirror of the knowledge embedded in ai-generate Edge Function system prompt.

export const BUILDING_CODE_MINIMUMS = {
  roomSizes: {
    masterBedroom: 12,        // m²
    standardBedroom: 9,
    bathroom: 3.5,
    ensuite: 4.5,
    kitchen: 7,
    livingRoom: 15,
    dining: 10,
    hallwayWidth: 0.9,        // metres
    accessibleHallwayWidth: 1.2,
  },
  ceilingHeights: {
    habitable: 2.4,
    bathroom: 2.1,
    preferred: 2.7,
  },
  doorWidths: {
    mainEntry: 0.9,
    internal: 0.76,
    accessible: 0.9,
    garage: 2.4,
  },
  windows: {
    minAreaRatioOfFloor: 0.10,   // 10% of floor area
    minVentilationRatio: 0.05,   // 5% openable
    bedroomEgressMinHeight: 0.5, // metres clear opening
    bedroomEgressMinWidth: 0.45,
  },
  stairs: {
    minRise: 0.150, maxRise: 0.220,   // metres
    minGoing: 0.220, maxGoing: 0.300,
    minWidth: 0.9,
    handrailHeight: { min: 0.85, max: 1.0 },
    maxConsecutiveSteps: 18,
  },
} as const;

export const STRUCTURAL_RULES = {
  wallThickness: {
    exterior: 0.2,   // metres (blueprint representation)
    interior: 0.1,
    loadBearing: 0.2,
  },
  loadBearingIndicators: [
    'All exterior walls are load-bearing',
    'Walls perpendicular to floor joists above are likely load-bearing',
    'Walls directly above beams, columns, or foundations are load-bearing',
    'Center spine wall of house is typically load-bearing',
  ],
  beamSpans: {
    floorJoistMaxSpan: 6,   // metres (timber, residential)
    ridgeBeamMaxSpan: 4.5,  // between support posts
  },
  foundationTypes: {
    stripFoundation: 'Standard residential on stable soil',
    raftSlab: 'Soft ground, uniform load distribution',
    pileFoundation: 'Poor bearing capacity, coastal, clay-rich soil',
    padFoundation: 'Isolated columns',
  },
} as const;

export const PASSIVE_SOLAR = {
  northernHemisphere: {
    primaryGlazing: 'SOUTH (receives winter sun, low angle)',
    southWindowFloorRatio: { min: 0.07, max: 0.15 },
    avoidGlazing: 'NORTH (cold, no direct sun)',
    eastLight: 'Morning — ideal for bedrooms and kitchens',
    westLight: 'Afternoon — overheating risk, use overhangs',
    overhangRatioOfWindowHeight: 0.28,  // depth = 0.28 × window height
  },
  southernHemisphere: {
    primaryGlazing: 'NORTH (receives winter sun)',
    northWindowFloorRatio: { min: 0.07, max: 0.15 },
    avoidGlazing: 'SOUTH (cold, no direct sun)',
    eastLight: 'Morning — ideal for bedrooms and kitchens',
    westLight: 'Afternoon — overheating risk, use overhangs',
    overhangRatioOfWindowHeight: 0.28,
  },
  windowToWallRatio: { optimal: 0.25, max: 0.40 },
  thermalMass: 'Place within 4.5m of primary glazing',
} as const;

export const FURNITURE_CLEARANCES = {
  mainCirculation: 0.9,        // metres minimum
  preferredCirculation: 1.05,
  aroundBed: { oneSide: 0.6, bothSides: 0.75 },
  diningChairPullout: 0.9,
  diningPassBehind: 0.6,
  tvDistanceMultiplier: 1.5,   // × diagonal screen size minimum
  kitchenWorkTriangle: { min: 4, max: 8 }, // perimeter metres
  sofaConversationZone: { min: 2.1, max: 3.0 }, // between facing seats
  coffeeTableToSofa: { min: 0.3, max: 0.45 },
} as const;

export const ARCHITECTURAL_STYLES = {
  bauhaus: {
    principles: ['Form follows function', 'Eliminate ornament', 'Industrial materials'],
    roofType: 'flat',
    palette: 'white/grey/black with bold primary accents',
    windows: 'ribbon windows, horizontal bands',
    materials: ['glass', 'steel', 'concrete'],
  },
  scandinavian: {
    principles: ['Hygge - warmth and comfort', 'Maximum natural light', 'Functional simplicity'],
    roofType: 'pitched gable',
    palette: 'white walls, light woods, natural textiles',
    windows: 'large, multiple, simple frames',
    materials: ['pine', 'birch', 'wool', 'linen'],
  },
  japandi: {
    principles: ['Wabi-sabi - embrace imperfection', 'Low furniture', 'Artisanal craft'],
    roofType: 'low pitched or flat',
    palette: 'greige, warm white, charcoal, forest green',
    windows: 'shoji-inspired, floor-to-ceiling sliding',
    materials: ['bamboo', 'washi', 'natural linen', 'dark wood'],
  },
  artDeco: {
    principles: ['Geometric ornamentation', 'Luxury materials', 'Symmetry and grandeur'],
    roofType: 'flat or stepped (ziggurat)',
    palette: 'black + gold, navy + brass, ivory + chrome',
    windows: 'vertical bands, geometric grids',
    materials: ['marble', 'brass', 'lacquered wood', 'velvet'],
  },
  mediterranean: {
    principles: ['Courtyard at center', 'Passive cooling', 'Outdoor living integration'],
    roofType: 'hip or barrel vault with terracotta tiles',
    palette: 'terracotta, warm white, cobalt blue, olive',
    windows: 'deep reveals, arched, shuttered',
    materials: ['terracotta', 'lime plaster', 'wrought iron', 'stone'],
  },
  tropical: {
    principles: ['Elevated floors', 'Deep overhanging eaves', 'Cross-ventilation mandatory'],
    roofType: 'steeply pitched with large overhangs (600mm+ eaves)',
    palette: 'natural materials, white or pale render',
    windows: 'louvres, jalousies, large openings',
    materials: ['teak', 'bamboo', 'limestone', 'corrugated iron'],
  },
  industrial: {
    principles: ['Exposed structure', 'Raw materials finished', 'High ceilings 3.5–5m'],
    roofType: 'flat or sawtooth skylights',
    palette: 'raw concrete, steel, dark brick, black metal',
    windows: 'steel-framed multi-pane factory grid',
    materials: ['steel', 'concrete', 'brick', 'iron pipe'],
  },
  victorian: {
    principles: ['Bay windows', 'Fireplaces in every principal room', 'Symmetrical facades'],
    roofType: 'pitched gable or hip with decorative elements',
    palette: 'deep jewel tones, cream, burgundy, forest green',
    windows: 'sash windows, bay windows, decorative surrounds',
    materials: ['brick', 'timber joinery', 'plaster', 'tile'],
  },
} as const;

export const LANDSCAPE_PRINCIPLES = {
  siteAnalysisPriorities: [
    'Map sun path: mark shadow at winter solstice',
    'Identify prevailing wind: place shelter windward',
    'Drainage: 2% minimum slope away from building (20mm/m)',
    'Note soil type: affects planting, drainage, foundation',
    'Orient main rooms to best views, screen poor views',
  ],
  outdoorZones: {
    public: { distanceFromStreet: '0–3m', treatment: 'hard landscaping, manicured' },
    semiPrivate: { location: 'side passages', treatment: 'transition, screening planting' },
    private: { location: 'rear garden', treatment: 'informal planting, outdoor living' },
    service: { location: 'hidden side/rear', treatment: 'bins, utilities, HVAC, screened' },
  },
  planting: {
    rule: '60% groundcover/lawn, 30% shrubs, 10% focal trees',
    layers: 'canopy trees + mid-shrub layer + groundcover',
    paths: 'Curved paths feel natural; straight paths feel formal',
  },
  poolPlacement: {
    minFromBuilding: 1.5,  // metres
    minFromBoundary: 1.0,
    orientation: 'North/northeast (Northern Hemisphere) for max sun',
    safetyFence: '1.2m min with self-latching gate',
  },
} as const;

export const RENDER_ATMOSPHERES = {
  goldenHour: {
    label: 'Golden Hour',
    description: 'Warm amber light at low angle, long shadows, magic hour glow',
    lightTemp: '2700K',
    shadowLength: 'long (70–80% of object height)',
    sky: 'gradient orange-amber at horizon, pale blue zenith',
  },
  overcastDay: {
    label: 'Overcast Day',
    description: 'Soft diffuse light, no hard shadows, even illumination',
    lightTemp: '5500K',
    shadowLength: 'soft, near-zero',
    sky: 'flat white-grey, no direct sun',
  },
  nightInterior: {
    label: 'Night Interior',
    description: 'Warm artificial pools from fixtures, dark voids beyond glass',
    lightTemp: '2700K interior, 4000K exterior moonlight',
    shadowLength: 'hard pools from fixtures',
    sky: 'deep navy, city ambient glow',
  },
  twilight: {
    label: 'Twilight',
    description: 'Purple-blue sky, interior lights glow warm, silhouette contrast',
    lightTemp: '3200K interior, 6500K exterior blue hour',
    shadowLength: 'near-zero, diffuse blue tint',
    sky: 'gradient navy → indigo → deep orange at horizon',
  },
  rainStorm: {
    label: 'Rainstorm',
    description: 'Dramatic sky, puddle reflections, rain streaks on glass',
    lightTemp: '4500K grey-green',
    shadowLength: 'diffuse, wet reflections on surfaces',
    sky: 'dark cumulus clouds, lightning-lit atmosphere',
  },
  snow: {
    label: 'Snowfall',
    description: 'White ground plane, soft blue shadows, atmospheric scatter',
    lightTemp: '5000K cool-white',
    shadowLength: 'soft blue-grey',
    sky: 'flat white-grey, snow particles',
  },
} as const;

export const FENG_SHUI_BASICS = {
  entry: [
    'Main door visible from street — no obstructions',
    'Door must not face stairs directly (energy drains away)',
    'Entry area: welcoming, well-lit, min 2m² foyer to pause',
    'No toilet directly facing front door',
  ],
  roomPlacement: {
    masterBedroom: 'Back of house, quietest, farthest from street',
    kitchen: 'Not visible from front door',
    bathroom: 'Not at house center — stagnates energy',
    office: 'Near entry or separate wing — business energy',
  },
} as const;

export const ACCESSIBILITY = {
  wheelchairTurningRadius: 0.75,  // metres (radius, 1.5m diameter)
  accessibleDoorWidth: 0.86,      // metres clear
  rampGradient: { max: 1 / 14, preferred: 1 / 20 },
  bathroom: {
    minFloorSpace: { width: 1.8, depth: 1.8 }, // metres
    grabRailHeight: 0.7,
    rollInShower: { width: 1.1, depth: 0.9 },
  },
  kitchen: {
    counterHeight: 0.85,    // vs standard 0.9m
    kneeClrHeight: 0.7,
    kneeClrDepth: 0.6,
  },
  accessibleParking: { minWidth: 3.2, maxFromEntry: 30 },
} as const;
```

- [ ] **Step 1.2: Verify TypeScript compiles**

```bash
cd /home/chisanga/Archora/Archora && npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

Expected: no errors relating to `architectureKnowledge.ts`

- [ ] **Step 1.3: Commit**

```bash
cd /home/chisanga/Archora/Archora && git add src/data/architectureKnowledge.ts && git commit -m "feat(knowledge): add structured architectural knowledge base module"
```

---

## Task 2: Update `ai-generate` Edge Function — Expanded System Prompt

**Files:**
- Modify: `supabase/functions/ai-generate/index.ts`

The current system prompt is ~30 lines. Replace with a 10-module knowledge prompt plus update the request schema to accept `hemisphere`, `climateZone`, and `detailLevel` fields.

- [ ] **Step 2.1: Write the updated edge function**

```typescript
// supabase/functions/ai-generate/index.ts
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireAuth } from '../_shared/auth.ts';
import { checkQuota } from '../_shared/quota.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const requestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  buildingType: z.enum(['house', 'apartment', 'office', 'studio', 'villa', 'commercial']),
  style: z.string().min(1),
  roomCount: z.number().int().min(1).max(20).optional(),
  plotSize: z.number().positive().optional(),
  plotUnit: z.enum(['m2', 'ft2']).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  livingAreas: z.number().int().min(0).max(10).optional(),
  hasGarage: z.boolean().optional(),
  hasGarden: z.boolean().optional(),
  hasPool: z.boolean().optional(),
  poolSize: z.enum(['small', 'medium', 'large']).optional(),
  hemisphere: z.enum(['northern', 'southern']).optional(),
  climateZone: z.enum(['tropical', 'subtropical', 'temperate', 'arid', 'cold', 'alpine']).optional(),
  detailLevel: z.enum(['starter', 'creator', 'pro', 'architect']).optional(),
  referenceImageUrl: z.string().url().optional(),
  additionalNotes: z.string().max(1000).optional(),
  transcript: z.string().max(1000).optional(),
});

const SYSTEM_PROMPT = `You are ASORIA, an expert architectural AI with deep knowledge across all aspects of building design. You generate complete, professional-quality BlueprintData JSON objects.

═══════════════════════════════════════════════════════
MODULE 1 — BUILDING CODE MINIMUMS
═══════════════════════════════════════════════════════
Room size minimums (m²): master bedroom 12 | standard bedroom 9 | bathroom 3.5 | ensuite 4.5 | kitchen 7 (galley) / 10 (standard) | living room 15 | dining 10 | hallway width 900mm | accessible hallway 1200mm
Ceiling heights: habitable min 2.4m | bathroom min 2.1m | preferred 2.7m
Door widths: main entry 900mm | internal 760mm | accessible 900mm | garage 2400mm
Window area: min 10% of floor area per habitable room | min 5% openable for ventilation
Bedroom egress: min 500mm height × 450mm width clear opening
Stairs: rise 150–220mm | going 220–300mm | R+G = 550–700mm | min width 900mm | handrail 850–1000mm from nosing | max 18 consecutive steps

═══════════════════════════════════════════════════════
MODULE 2 — STRUCTURAL RULES
═══════════════════════════════════════════════════════
Load-bearing walls: ALL exterior walls | walls perpendicular to floor joists | walls above beams/columns/foundations | center spine wall
Wall thickness (blueprint): exterior 200mm | interior 100mm | load-bearing 200mm
Beam spans (timber residential): floor joists 3–6m | ridge beam max 4.5m between posts
Lintels over openings: opening width + 150mm bearing each side
Foundation by soil: strip (stable soil) | raft/slab (soft ground) | pile (poor bearing/coastal/clay) | pad (isolated columns)
CRITICAL: Never float walls. Every wall must connect to at least one other wall or be load-bearing exterior.

═══════════════════════════════════════════════════════
MODULE 3 — PASSIVE SOLAR & BUILDING PHYSICS
═══════════════════════════════════════════════════════
NORTHERN HEMISPHERE: Primary glazing faces SOUTH (low winter sun). South windows: 7–15% of floor area. Avoid excess NORTH glazing. EAST = morning light (bedrooms/kitchens). WEST = afternoon heat risk (use overhangs).
SOUTHERN HEMISPHERE: REVERSE N/S. Primary glazing faces NORTH.
Overhang depth = window height × 0.28 (blocks high summer sun, admits low winter sun).
Window-to-wall ratio: optimal 20–30% | above 40% = overheating/thermal bridging risk.
Thermal mass: concrete/brick/tile floors within 4.5m of primary glazing.
Cross-ventilation: openings on opposite walls, 30–45° offset catches prevailing winds.
Ceiling height 2.7–3m dramatically improves natural air circulation.

═══════════════════════════════════════════════════════
MODULE 4 — INTERIOR DESIGN & FURNITURE CLEARANCES
═══════════════════════════════════════════════════════
Main circulation paths: min 900mm | ideal 1050mm
Around bed: min 600mm one side | 750mm both sides (master)
Dining: 900mm chair pull-out + 600mm pass-behind
Kitchen work triangle: sink–fridge–cooktop perimeter 4–8m
Sofa conversation zone: 2.1–3.0m between facing seats | coffee table 300–450mm from sofa
TV distance: 1.5× diagonal screen width minimum

Focal points: Living room → fireplace/TV/window | Bedroom → headboard wall | Dining → pendant light centred on table | Kitchen → island or range hood

Logical room placement:
- Bedrooms: away from street, quieter back of house
- Kitchen: adjacent to dining | sink on exterior wall (plumbing)
- Bathrooms: accessible from bedrooms | ensuites where possible
- Living room: faces garden or best natural light
- Utility/laundry: adjacent to kitchen or garage
- Garage: street-facing, not between living spaces

═══════════════════════════════════════════════════════
MODULE 5 — ARCHITECTURAL STYLES
═══════════════════════════════════════════════════════
Bauhaus/International: flat roof | ribbon windows | open plan | white/grey/black + bold accent | glass/steel/concrete | eliminate ornament
Scandinavian: pitched gable | large windows | white walls + light woods | hygge warmth | functional simplicity
Japandi: low-pitched/flat | shoji-inspired sliding windows | greige/charcoal/forest green | wabi-sabi | bamboo/dark wood
Art Deco: flat/stepped ziggurat roof | geometric window grids | black+gold/navy+brass | symmetrical grand facade
Mediterranean: hip/barrel vault terracotta roof | deep-reveal arched windows | courtyard center | terracotta/lime plaster/stone
Tropical: steep pitch + large overhangs 600mm+ | louvres/jalousies | elevated floor | cross-ventilation essential | teak/bamboo
Industrial: flat/sawtooth | steel-frame multi-pane factory windows | exposed structure | concrete/steel/brick | ceiling 3.5–5m
Victorian: pitched gable/hip | sash/bay windows | symmetrical facade | fireplaces in all principal rooms | brick/timber
Minimalist: flat/mono-pitch | large simple openings | monochrome palette | hidden storage | pure geometric forms
Contemporary: mixed roof forms | floor-to-ceiling glass possible | neutral + one accent | clean lines + organic curves
Rustic: pitched with exposed beams | small cottage windows | stone/wood dominant | natural textures | warm earthy palette
Coastal: elevated floor | large picture windows facing water | natural timber + white render | overhangs for salt protection

═══════════════════════════════════════════════════════
MODULE 6 — LANDSCAPE & OUTDOOR DESIGN
═══════════════════════════════════════════════════════
Site zones: public (0–3m from street) | semi-private (side passages) | private (rear garden) | service (hidden: bins/HVAC)
Drainage: minimum 2% slope (20mm/m) away from all building faces
Pool: min 1.5m from building | min 1.0m from boundary | NORTH/NE face (Northern Hemisphere) for maximum sun | 1.2m safety fence
Driveway: single 2.7–3.0m wide | double 5.5–6.0m | max gradient 1:6 (16.7%)
Planting: 60% groundcover/lawn, 30% shrubs, 10% focal trees | 3-layer planting: canopy + mid-shrub + groundcover
Garden paths: curves = informal/natural | straight = formal/urban
Patio: extends from main living area | min 12m² for outdoor furniture arrangement
Outdoor lighting zones: pathway (low), entertaining (ambient 50–150lux), feature trees (uplighting)

═══════════════════════════════════════════════════════
MODULE 7 — FENG SHUI & CULTURAL PRINCIPLES
═══════════════════════════════════════════════════════
Entry: main door visible from street | door must NOT face stairs directly | welcoming foyer min 2m²
Room placement: master bedroom = back/quietest | kitchen not visible from front door | bathroom not at center of house
Natural light: living spaces → morning AND afternoon sun | bedrooms → east (gentle wake) | kitchen → good daylight
Chi flow: clear 900mm+ circulation paths everywhere | rounded furniture edges (aligns with ASORIA oval aesthetic)

═══════════════════════════════════════════════════════
MODULE 8 — UNIVERSAL ACCESSIBILITY (ADA/AS 1428)
═══════════════════════════════════════════════════════
Wheelchair turning: 1500mm diameter circle (750mm radius)
Accessible door: min 860mm clear opening (900mm leaf)
Ramp: max 1:14 gradient | preferred 1:20
Accessible bathroom: min 1800×1800mm floor clear | grab rails at 700mm height | roll-in shower min 1100×900mm (no lip)
Accessible kitchen: counter 850mm (vs 900mm standard) | knee clearance 700mm high × 600mm deep under counter
Accessible parking: min 3200mm wide | max 30m from building entry | tactile indicators at hazards

═══════════════════════════════════════════════════════
MODULE 9 — WEATHER & CLIMATE ADAPTATIONS
═══════════════════════════════════════════════════════
Tropical: deep overhanging eaves 600mm+ | cross-ventilation essential | elevated floor 600mm | louvred walls | termite protection
Subtropical: covered outdoor living integral | shade trees north/west | ceiling fans in all rooms | pool feasible
Temperate: passive solar priority | thermal mass | double-glazing | sheltered outdoor space with sun orientation
Arid/Desert: high thermal mass | small windows (east/west) | courtyard with water feature for evaporative cooling | thick walls
Cold/Alpine: triple glazing | vestibule airlock at entries | south-facing solar | heated paths if extreme | R-7.0 ceiling insulation
Coastal: salt-resistant materials (aluminium, SS, treated timber) | elevated floor 600mm above flood level | dune setback 50m | storm shutters

Rain protection: minimum roof pitch 15° for tiles | 3° for metal | gutter sizing 100mm² per 1m² roof catchment | 600mm eaves in high-rainfall
Wind: cyclonic zones require metal frames + hurricane straps on every rafter | brace all corners

═══════════════════════════════════════════════════════
MODULE 10 — CREATIVE RENDER & ATMOSPHERE
═══════════════════════════════════════════════════════
Golden Hour: low-angle warm amber 2700K light | shadows 70% of object height | sky gradient orange→pale blue
Overcast: flat diffuse 5500K | soft zero-length shadows | white-grey sky
Night Interior: warm 2700K pools from fixtures | dark voids at glazing | deep navy sky with ambient city glow
Twilight: purple-blue sky gradient, interior lights glow 3200K warm | blue-hour atmosphere
Rainstorm: dark cumulus sky | wet surface reflections | rain streaks on glass | 4500K grey-green ambient
Snow: flat white-grey sky | soft blue shadow tint | white ground plane | 5000K cool light

Material render properties:
Polished concrete: 10–20% reflectance, speckled grey texture, slight specularity
Timber (oak): warm amber grain, 5% sheen, directional wood grain
Marble: 40% specular, white/grey veins, slight subsurface scatter
Brick: rough, 3–5% reflectance, visible mortar joints
Glass: 90% transmittance, 8% reflectance, slight blue-green tint
Steel (brushed): anisotropic sheen, silver-grey, directional grain

Composition for renders: rule of thirds | include human figure at entry for scale | foreground planting adds depth | leading lines (path/driveway) draw eye to building

═══════════════════════════════════════════════════════
BLUEPRINTDATA OUTPUT SCHEMA
═══════════════════════════════════════════════════════
{
  "id": "<uuid>",
  "version": 1,
  "metadata": {
    "buildingType": "house"|"apartment"|"office"|"studio"|"villa"|"commercial",
    "style": "<styleId>",
    "totalArea": <number m²>,
    "roomCount": <number>,
    "generatedFrom": "ai_generation"
  },
  "floors": [{
    "id": "<uuid>",
    "label": "G",
    "index": 0,
    "height": 2.7,
    "walls": [
      { "id": "<uuid>", "start": {"x": <m>, "y": <m>}, "end": {"x": <m>, "y": <m>}, "thickness": 0.2, "height": 2.7, "texture": "plain_white", "isLoadbearing": true|false }
    ],
    "rooms": [
      { "id": "<uuid>", "name": "Living Room", "type": "living_room", "color": "#F0EDE8", "area": <m²>, "centroid": {"x": <m>, "y": <m>}, "wallIds": ["<uuid>",...], "floorMaterial": "hardwood", "ceilingHeight": 2.7, "ceilingType": "flat_white" }
    ],
    "openings": [
      { "id": "<uuid>", "wallId": "<uuid>", "type": "window"|"door"|"sliding_door"|"skylight", "position": <metres along wall from start>, "width": <m>, "height": <m>, "sillHeight": <m> }
    ],
    "furniture": [
      { "id": "<uuid>", "name": "Sofa", "category": "living", "roomId": "<uuid>", "position": {"x": <m>, "y": <m>, "z": 0}, "rotation": {"x": 0, "y": <degrees>, "z": 0}, "dimensions": {"x": <m>, "y": <m>, "z": <m>}, "procedural": true }
    ],
    "staircases": [],
    "elevators": []
  }],
  "walls": [...same as floors[0].walls...],
  "rooms": [...same as floors[0].rooms...],
  "openings": [...same as floors[0].openings...],
  "furniture": [...same as floors[0].furniture...],
  "customAssets": [],
  "chatHistory": [],
  "createdAt": "<ISO8601>",
  "updatedAt": "<ISO8601>"
}

═══════════════════════════════════════════════════════
GENERATION RULES (APPLY EVERY TIME)
═══════════════════════════════════════════════════════
1. All coordinates in METRES (1 unit = 1 metre). Grid snap: 100mm (0.1m).
2. SELF-VALIDATE before outputting: (a) no rooms overlap (b) every room has ≥1 door (c) windows on exterior walls only (d) all walls connect (e) all dimensions realistic
3. Apply MODULE 3 passive solar based on hemisphere field (default: northern)
4. Apply MODULE 5 style rules for roof type, window style, materials
5. Apply MODULE 6 outdoor rules if hasGarden/hasPool requested
6. Starter detail: walls + doors + windows only. Creator+: add furniture. Pro+: add openings details + outdoor. Architect: add service points.
7. Roof type MUST match style: flat→Bauhaus/minimalist/industrial | pitched gable→Scandinavian/Victorian/rustic | hip→Mediterranean/colonial | barrel vault→Mediterranean
8. Return ONLY valid JSON. No markdown fences. No prose. No explanation.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { userId, supabase } = await requireAuth(req);
    await checkQuota(supabase, userId, 'ai_generation');

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const {
      prompt, buildingType, style, roomCount, plotSize, plotUnit,
      bedrooms, bathrooms, livingAreas, hasGarage, hasGarden, hasPool, poolSize,
      hemisphere, climateZone, detailLevel, additionalNotes, transcript,
    } = parsed.data;

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI_NOT_CONFIGURED', message: 'AI service not available' }),
        { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const userPrompt = [
      `Building type: ${buildingType}`,
      `Architectural style: ${style}`,
      plotSize ? `Plot/area size: ${plotSize}${plotUnit === 'ft2' ? ' ft²' : ' m²'}` : '',
      bedrooms !== undefined ? `Bedrooms: ${bedrooms}` : '',
      bathrooms !== undefined ? `Bathrooms: ${bathrooms}` : '',
      livingAreas !== undefined ? `Living areas: ${livingAreas}` : '',
      roomCount ? `Target room count: ${roomCount}` : '',
      hasGarage ? 'Include: garage' : '',
      hasGarden ? 'Include: garden/outdoor area' : '',
      hasPool ? `Include: pool (${poolSize ?? 'medium'} size)` : '',
      hemisphere ? `Hemisphere: ${hemisphere}` : 'Hemisphere: northern',
      climateZone ? `Climate zone: ${climateZone}` : '',
      detailLevel ? `Detail level: ${detailLevel}` : 'Detail level: creator',
      additionalNotes ? `Additional notes: ${additionalNotes}` : '',
      transcript ? `Voice notes: ${transcript}` : '',
      `User description: ${prompt}`,
    ].filter(Boolean).join('\n');

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('Anthropic error:', errText);
      return new Response(
        JSON.stringify({ error: 'AI_ERROR', message: 'AI generation failed' }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const aiData = await aiResponse.json() as {
      content: Array<{ type: string; text: string }>;
    };

    const rawText = aiData.content.find((c) => c.type === 'text')?.text ?? '';

    let blueprint;
    try {
      // Strip any accidental markdown fences
      const cleaned = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
      blueprint = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse blueprint JSON:', rawText.slice(0, 500));
      return new Response(
        JSON.stringify({ error: 'PARSE_ERROR', message: 'AI returned invalid JSON', raw: rawText.slice(0, 200) }),
        { status: 422, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ blueprint }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('ai-generate error:', message);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
```

- [ ] **Step 2.2: Verify Deno types check (no build errors)**

```bash
cd /home/chisanga/Archora/Archora && npx supabase functions serve ai-generate --no-verify-jwt 2>&1 | head -10
```

Expected: function starts without import errors (Ctrl+C after checking)

- [ ] **Step 2.3: Commit**

```bash
cd /home/chisanga/Archora/Archora && git add supabase/functions/ai-generate/index.ts && git commit -m "feat(ai): expand ai-generate system prompt with 10-module architectural knowledge base"
```

---

## Task 3: Create `ai-render` Edge Function

**Files:**
- Create: `supabase/functions/ai-render/index.ts`

This function takes a blueprint summary + atmosphere params, generates a rich scene description with Claude, then passes it to Replicate SDXL for a photorealistic render.

- [ ] **Step 3.1: Write the edge function**

```typescript
// supabase/functions/ai-render/index.ts
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireAuth } from '../_shared/auth.ts';
import { checkQuota } from '../_shared/quota.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const requestSchema = z.object({
  blueprintSummary: z.object({
    buildingType: z.string(),
    style: z.string(),
    totalArea: z.number(),
    roomCount: z.number(),
    floors: z.number().optional(),
    hasPool: z.boolean().optional(),
    hasGarden: z.boolean().optional(),
    exteriorFinish: z.string().optional(),
  }),
  atmosphere: z.enum([
    'golden_hour', 'overcast_day', 'night_interior',
    'twilight', 'rain_storm', 'snow', 'sunny_midday',
  ]),
  viewType: z.enum(['exterior_front', 'exterior_aerial', 'interior_living', 'interior_kitchen', 'interior_bedroom', 'garden']),
  hemisphere: z.enum(['northern', 'southern']).optional(),
});

const RENDER_SYSTEM_PROMPT = `You are an architectural visualisation prompt engineer. Generate a detailed, photorealistic Stable Diffusion prompt for architectural renders.

Your prompts must:
1. Be specific about architecture style, materials, and construction details
2. Include precise lighting description from the atmosphere module
3. Reference real architectural photography techniques
4. Include quality boosters appropriate for architecture renders
5. Stay under 400 words

ATMOSPHERE REFERENCE:
Golden Hour: "warm amber backlit sunlight at 10-degree elevation, long horizontal shadows, golden-hour photography, 2700K colour temperature, soft orange glow on facade materials, magic hour architecture photography"
Overcast Day: "soft overcast lighting, diffuse illumination, no harsh shadows, flat 5500K daylight, studio-quality even exposure, architectural documentation photography"
Night Interior: "warm interior lighting 2700K, glowing windows in dark exterior, atmospheric night architecture, uplighting on facade, city ambient glow on horizon"
Twilight: "blue hour photography, purple-blue sky gradient, warm interior window glow contrasting cool exterior, twilight architecture, 20 minutes after sunset"
Rainstorm: "dramatic stormlit sky, wet reflections on pavement, rain on glass, dark cumulus clouds, 4500K cool grey-green ambient, atmospheric moody architecture"
Snow: "winter architecture photography, snow-covered ground and roof, soft blue shadow tones, overcast white sky, serene winter light"
Sunny Midday: "bright direct sunlight, crisp shadows, blue sky with white clouds, vibrant colours, high-contrast architectural photography"

QUALITY BOOSTERS (always append): "ultra-detailed, photorealistic render, 8K, architectural photography, professional DSLR, sharp focus, depth of field, volumetric lighting, award-winning architecture photo"

NEGATIVE PROMPT (always include): "cartoon, illustration, low quality, blurry, distorted proportions, unrealistic, sketch, watercolour"

Return JSON: { "positivePrompt": "...", "negativePrompt": "...", "styleNotes": "..." }`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { userId, supabase } = await requireAuth(req);
    await checkQuota(supabase, userId, 'ai_render');

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const { blueprintSummary, atmosphere, viewType, hemisphere } = parsed.data;

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    const replicateKey = Deno.env.get('REPLICATE_API_KEY');

    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'AI_NOT_CONFIGURED' }),
        { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const userPrompt = `Generate an architectural render prompt for:
Building: ${blueprintSummary.buildingType}, style: ${blueprintSummary.style}
Area: ${blueprintSummary.totalArea}m², ${blueprintSummary.roomCount} rooms
Exterior: ${blueprintSummary.exteriorFinish ?? 'render/plaster'}
Hemisphere: ${hemisphere ?? 'northern'}
Features: ${[blueprintSummary.hasPool && 'pool', blueprintSummary.hasGarden && 'garden'].filter(Boolean).join(', ') || 'none'}
Atmosphere: ${atmosphere.replace(/_/g, ' ')}
View: ${viewType.replace(/_/g, ' ')}`;

    const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: RENDER_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!claudeResp.ok) {
      return new Response(
        JSON.stringify({ error: 'CLAUDE_ERROR' }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const claudeData = await claudeResp.json() as { content: Array<{ type: string; text: string }> };
    const rawText = claudeData.content.find((c) => c.type === 'text')?.text ?? '{}';

    let prompts: { positivePrompt: string; negativePrompt: string; styleNotes: string };
    try {
      const cleaned = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
      prompts = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({ error: 'PROMPT_PARSE_ERROR', raw: rawText.slice(0, 200) }),
        { status: 422, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // If no Replicate key, return prompt only (user can test manually)
    if (!replicateKey) {
      return new Response(
        JSON.stringify({ renderUrl: null, prompts, message: 'Replicate not configured — prompt generated only' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // Kick off Replicate SDXL prediction
    const replicateResp = await fetch('https://api.replicate.com/v1/models/stability-ai/sdxl/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${replicateKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify({
        input: {
          prompt: prompts.positivePrompt,
          negative_prompt: prompts.negativePrompt,
          width: 1024,
          height: 768,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          num_outputs: 1,
        },
      }),
    });

    if (!replicateResp.ok) {
      const errBody = await replicateResp.text();
      console.error('Replicate error:', errBody);
      return new Response(
        JSON.stringify({ renderUrl: null, prompts, error: 'REPLICATE_ERROR' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const prediction = await replicateResp.json() as { output?: string[] };
    const renderUrl = prediction.output?.[0] ?? null;

    // Optionally store render URL in renders table
    if (renderUrl) {
      await supabase.from('renders').insert({
        user_id: userId,
        render_url: renderUrl,
        atmosphere,
        view_type: viewType,
        created_at: new Date().toISOString(),
      }).then(() => {}); // fire-and-forget, don't block response
    }

    return new Response(
      JSON.stringify({ renderUrl, prompts }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('ai-render error:', message);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
```

- [ ] **Step 3.2: Add `renders` table migration**

Create file: `supabase/migrations/013_renders.sql`

```sql
-- 013_renders.sql
create table if not exists renders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  blueprint_id uuid references projects(id) on delete set null,
  render_url  text not null,
  atmosphere  text not null,
  view_type   text not null,
  created_at  timestamptz not null default now()
);

alter table renders enable row level security;

create policy "Users own their renders"
  on renders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index renders_user_id_idx on renders(user_id, created_at desc);
```

- [ ] **Step 3.3: Apply migration (local dev)**

```bash
cd /home/chisanga/Archora/Archora && npx supabase db push --local 2>&1 | tail -5
```

Expected: `Schema migrations applied`

- [ ] **Step 3.4: Commit**

```bash
cd /home/chisanga/Archora/Archora && git add supabase/functions/ai-render/index.ts supabase/migrations/013_renders.sql && git commit -m "feat(ai): add ai-render edge function for photorealistic render generation"
```

---

## Task 4: Creative Render Sheet UI (Pro+)

**Files:**
- Create: `src/components/blueprint/RenderSheet.tsx`

A bottom sheet that lets Pro+ users select atmosphere + view, request a render, and view the result.

- [ ] **Step 4.1: Write RenderSheet component**

```tsx
// src/components/blueprint/RenderSheet.tsx
import React, { useState, useCallback } from 'react';
import { View, ScrollView, Image, Pressable, Linking } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { ArchText } from '../common/ArchText';
import { OvalButton } from '../common/OvalButton';
import { CompassRoseLoader } from '../common/CompassRoseLoader';
import { TierGate } from '../common/TierGate';
import { DS } from '../../theme/designSystem';
import { SUNRISE } from '../../theme/sunrise';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { supabase } from '../../utils/supabaseClient';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

type Atmosphere = 'golden_hour' | 'overcast_day' | 'night_interior' | 'twilight' | 'rain_storm' | 'snow' | 'sunny_midday';
type ViewType = 'exterior_front' | 'exterior_aerial' | 'interior_living' | 'interior_kitchen' | 'interior_bedroom' | 'garden';

const ATMOSPHERES: { id: Atmosphere; label: string; emoji: string }[] = [
  { id: 'golden_hour', label: 'Golden Hour', emoji: '🌅' },
  { id: 'sunny_midday', label: 'Sunny Day', emoji: '☀️' },
  { id: 'overcast_day', label: 'Overcast', emoji: '☁️' },
  { id: 'twilight', label: 'Twilight', emoji: '🌆' },
  { id: 'night_interior', label: 'Night', emoji: '🌙' },
  { id: 'rain_storm', label: 'Storm', emoji: '⛈️' },
  { id: 'snow', label: 'Snow', emoji: '❄️' },
];

const VIEW_TYPES: { id: ViewType; label: string; emoji: string }[] = [
  { id: 'exterior_front', label: 'Front Exterior', emoji: '🏠' },
  { id: 'exterior_aerial', label: 'Aerial View', emoji: '🛸' },
  { id: 'interior_living', label: 'Living Room', emoji: '🛋️' },
  { id: 'interior_kitchen', label: 'Kitchen', emoji: '🍳' },
  { id: 'interior_bedroom', label: 'Bedroom', emoji: '🛏️' },
  { id: 'garden', label: 'Garden', emoji: '🌿' },
];

interface RenderSheetProps {
  onClose: () => void;
}

export function RenderSheet({ onClose }: RenderSheetProps) {
  return (
    <TierGate feature="aiGenerationsPerMonth" featureLabel="Creative Renders">
      <RenderSheetContent onClose={onClose} />
    </TierGate>
  );
}

function RenderSheetContent({ onClose }: RenderSheetProps) {
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const [atmosphere, setAtmosphere] = useState<Atmosphere>('golden_hour');
  const [viewType, setViewType] = useState<ViewType>('exterior_front');
  const [isLoading, setIsLoading] = useState(false);
  const [renderUrl, setRenderUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRender = useCallback(async () => {
    if (!blueprint) return;
    setIsLoading(true);
    setError(null);
    setRenderUrl(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/ai-render`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          blueprintSummary: {
            buildingType: blueprint.metadata.buildingType,
            style: blueprint.metadata.style,
            totalArea: blueprint.metadata.totalArea,
            roomCount: blueprint.metadata.roomCount,
          },
          atmosphere,
          viewType,
          hemisphere: 'northern',
        }),
      });

      const data = await resp.json() as { renderUrl?: string | null; error?: string };
      if (!resp.ok || data.error) throw new Error(data.error ?? 'Render failed');
      setRenderUrl(data.renderUrl ?? null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate render');
    } finally {
      setIsLoading(false);
    }
  }, [blueprint, atmosphere, viewType]);

  return (
    <View style={{ flex: 1, backgroundColor: SUNRISE.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
      {/* Handle */}
      <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: SUNRISE.glass.subtleBorder }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
          <ArchText variant="body" style={{ fontFamily: DS.font.heading, fontSize: 22, color: SUNRISE.gold }}>
            Creative Render
          </ArchText>
          <Pressable onPress={onClose}>
            <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 14, color: SUNRISE.textSecondary }}>✕</ArchText>
          </Pressable>
        </View>

        {/* Atmosphere selector */}
        <ArchText variant="body" style={{ fontFamily: DS.font.medium, fontSize: 13, color: SUNRISE.textSecondary, marginBottom: 10 }}>
          ATMOSPHERE
        </ArchText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {ATMOSPHERES.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => setAtmosphere(a.id)}
                style={{
                  borderRadius: 50,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  backgroundColor: atmosphere === a.id ? SUNRISE.gold + '22' : SUNRISE.glass.subtleBg,
                  borderWidth: 1,
                  borderColor: atmosphere === a.id ? SUNRISE.gold : SUNRISE.glass.subtleBorder,
                }}
              >
                <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 13, color: atmosphere === a.id ? SUNRISE.gold : SUNRISE.textSecondary }}>
                  {a.emoji} {a.label}
                </ArchText>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* View selector */}
        <ArchText variant="body" style={{ fontFamily: DS.font.medium, fontSize: 13, color: SUNRISE.textSecondary, marginBottom: 10 }}>
          VIEW
        </ArchText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
          {VIEW_TYPES.map((v) => (
            <Pressable
              key={v.id}
              onPress={() => setViewType(v.id)}
              style={{
                borderRadius: 50,
                paddingHorizontal: 14,
                paddingVertical: 8,
                backgroundColor: viewType === v.id ? SUNRISE.gold + '22' : SUNRISE.glass.subtleBg,
                borderWidth: 1,
                borderColor: viewType === v.id ? SUNRISE.gold : SUNRISE.glass.subtleBorder,
              }}
            >
              <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 12, color: viewType === v.id ? SUNRISE.gold : SUNRISE.textSecondary }}>
                {v.emoji} {v.label}
              </ArchText>
            </Pressable>
          ))}
        </View>

        {/* Generate button */}
        <OvalButton
          label={isLoading ? 'Rendering...' : 'Generate Render'}
          onPress={handleRender}
          loading={isLoading}
          fullWidth
          variant="filled"
        />

        {/* Error */}
        {error && (
          <View style={{ marginTop: 16, borderRadius: 12, backgroundColor: DS.colors.error + '18', padding: 14, borderWidth: 1, borderColor: DS.colors.error + '40' }}>
            <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 13, color: DS.colors.error, textAlign: 'center' }}>{error}</ArchText>
          </View>
        )}

        {/* Loading state */}
        {isLoading && (
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <CompassRoseLoader size={60} />
            <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 13, color: SUNRISE.textSecondary, marginTop: 12 }}>
              Generating your render...
            </ArchText>
          </View>
        )}

        {/* Render result */}
        {renderUrl && (
          <View style={{ marginTop: 20 }}>
            <Image
              source={{ uri: renderUrl }}
              style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 16, backgroundColor: DS.colors.surface }}
              resizeMode="cover"
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
              <OvalButton
                label="Save to Photos"
                onPress={() => Linking.openURL(renderUrl)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <OvalButton
                label="New Render"
                onPress={() => setRenderUrl(null)}
                variant="ghost"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 4.2: Wire RenderSheet into BlueprintWorkspaceScreen**

Find the file that manages the workspace toolbar sheets:

```bash
grep -n "RenderSheet\|FurnitureLibrary\|StyleSelector" /home/chisanga/Archora/Archora/src/screens/workspace/BlueprintWorkspaceScreen.tsx | head -20
```

Add the RenderSheet import and a trigger button to the Studio toolbar. Open `BlueprintWorkspaceScreen.tsx`, find the toolbar area, and add:

```tsx
// Near top with other imports:
import { RenderSheet } from '../../components/blueprint/RenderSheet';

// In component state:
const [showRenderSheet, setShowRenderSheet] = useState(false);

// In the bottom sheet/modal section (alongside FurnitureLibrarySheet, StyleSelectorSheet etc):
{showRenderSheet && (
  <Modal transparent animationType="slide" onRequestClose={() => setShowRenderSheet(false)}>
    <Pressable style={{ flex: 1 }} onPress={() => setShowRenderSheet(false)} />
    <View style={{ maxHeight: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>
      <RenderSheet onClose={() => setShowRenderSheet(false)} />
    </View>
  </Modal>
)}

// Add render button to toolbar actions (find where StyleSelector, FurnitureLibrary buttons are):
<Pressable onPress={() => setShowRenderSheet(true)} style={{ /* match existing toolbar button style */ }}>
  <Text style={{ fontSize: 18 }}>🎨</Text>
</Pressable>
```

- [ ] **Step 4.3: TypeScript check**

```bash
cd /home/chisanga/Archora/Archora && npx tsc --noEmit --skipLibCheck 2>&1 | grep "RenderSheet\|ai-render" | head -10
```

Expected: no errors for the new files

- [ ] **Step 4.4: Commit**

```bash
cd /home/chisanga/Archora/Archora && git add src/components/blueprint/RenderSheet.tsx src/screens/workspace/BlueprintWorkspaceScreen.tsx && git commit -m "feat(studio): add Creative Render sheet with atmosphere and view type selection (Pro+)"
```

---

## Self-Review

- [x] Module 1 (building codes) → Task 2 system prompt MODULE 1
- [x] Module 2 (structural) → Task 2 system prompt MODULE 2
- [x] Module 3 (passive solar) → Task 2 system prompt MODULE 3
- [x] Module 4 (interior design) → Task 2 + architectureKnowledge.ts
- [x] Module 5 (architectural styles) → Task 2 system prompt MODULE 5 + architectureKnowledge.ts
- [x] Module 6 (landscape) → Task 2 system prompt MODULE 6
- [x] Module 7 (feng shui) → Task 2 system prompt MODULE 7
- [x] Module 8 (accessibility) → Task 2 system prompt MODULE 8
- [x] Module 9 (weather/climate) → Task 2 system prompt MODULE 9
- [x] Module 10 (creative renders) → Task 2 MODULE 10 + Task 3 ai-render + Task 4 RenderSheet
- [x] No TBDs or placeholders
- [x] Type consistency: `Atmosphere` and `ViewType` types match between RenderSheet.tsx and ai-render/index.ts
