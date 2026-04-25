# Material/Texture System Architecture
**Date:** 2026-04-24
**Status:** Approved

---

## 1. Overview

A unified material/texture system spanning both 2D (Skia) and 3D (React Three Fiber) renderers. A single material definition drives visual output in both renderers with graceful degradation across 4 pipeline tiers.

---

## 2. Design Decisions

| Decision | Choice | Rationale |
|----------|--------|------------|
| Scope | All categories, 40+ materials | Floor, Wall, Ceiling, Roof, Furniture |
| Material definition | Flat data + optional texture URLs + AI params | All tiers supported, always renders |
| Renderer pipeline | MaterialCompiler centralized conversion | Clean separation, consistent output |
| Pipeline tiers | All 4 (Procedural / Hand-Crafted / AI / Hybrid) | Hybrid selected as default |
| Material picker UI | Simple scrollable palette (Option A) | Minimal, fast, on-brand |
| Selection interaction | Select surface first, then material palette | Standard editing workflow |
| Texture sources | Poly Haven (CC0) primary, ambientCG, 3dtextures.me | Free, high-quality PBR at 8K+ |

---

## 3. Material Categories — Full Library

### Wood Species (10)

| ID | Name | Color Range | Janka | Grain | Pattern |
|----|------|-------------|-------|-------|---------|
| `wood_red_oak` | Red Oak | #984A2B → #B86B4A | 1,290 lbf | Open, prominent | Herringbone, Parquet |
| `wood_white_oak` | White Oak | #C9A86C → #D4B896 | 1,360 lbf | Medium, straight | Plain, Quarter-sawn |
| `wood_walnut` | Black Walnut | #5C4033 → #6B4423 | 1,010 lbf | Straight, coarse | All cuts |
| `wood_maple` | Hard Maple | #C4A882 → #E8D9B5 | 1,450 lbf | Fine, uniform | Strip, Parquet |
| `wood_cherry` | Cherry | #9B4F34 → #B87333 | 995 lbf | Fine, satiny | All cuts |
| `wood_mahogany` | Mahogany | #8B4513 → #D4A574 | 800 lbf | Interlocked, ribbon | Quarter-sawn |
| `wood_teak` | Teak | #B8860B → #CD853F | 1,155 lbf | Straight, oily | Strip, Plank |
| `wood_ash` | Ash | #E8D9B5 → #C4A882 | 1,320 lbf | Pronounced, ring-porous | Strip, Herringbone |
| `wood_hickory` | Hickory | #E8D9B5 → #8B7355 | 1,820 lbf | Bold, dramatic | Strip, Plank |
| `wood_pine` | Pine | #F5ECD7 → #CD853F | 380-870 lbf | Resin canals, distinct | Strip, Plain-sawn |

**Wood Cuts:** Plain-sawn (cathedral grain), Quarter-sawn (ray fleck, ribbon), Rift-sawn (tight consistent grain)
**Finishes:** Matte, Satin, Semi-Gloss, Glossy, Distressed

### Stone Types (8)

| ID | Name | Colors | Porosity | Finish | Notes |
|----|------|--------|----------|--------|-------|
| `stone_granite` | Granite | White/gray/pink | <0.5% | Polished, honed | Very dense, stain-resistant |
| `stone_marble` | Marble | White/black/pink | Moderate | Polished, honed | Swirls + veins, needs seal |
| `stone_limestone` | Limestone | White/tan/gray | 0.1-40% | Honed, natural cleft | Layered, sedimentary |
| `stone_slate` | Slate | Gray/purple/green | <0.4% | Natural cleft, honed | Low absorption, gauged |
| `stone_travertine` | Travertine | Cream/tan/white | 10-70% | Polished, tumbled | Fossil pits, needs seal |
| `stone_quartzite` | Quartzite | White/gray/pink | Low | Polished, leathered | Mohs 7, hard |
| `stone_onyx` | Onyx | Black/white/red | Variable | Polished | Translucent, dramatic |
| `stone_sandstone` | Sandstone | Tan/brown/red | Moderate | Natural cleft, honed | Quartz arenite |

**Stone Finishes:** Polished (high gloss), Honed (matte sheen), Leathered (textured sueded), Brushed (wire textured), Tumbled (rounded weathered)

### Tile Types (5)

| ID | Name | Water Absorption | Sizes | Finish |
|----|------|------------------|-------|--------|
| `tile_ceramic` | Ceramic | Varies | 3×6, 4×12, 6×6 | Gloss, Matte |
| `tile_porcelain` | Porcelain | ≤0.5% | 12×12 → 24×48 | Glazed, Unglazed, Textured |
| `tile_terracotta` | Terracotta | High | 6×6, 8×8, 12×12 | Natural, Glazed |
| `tile_cement` | Cement Tile | Low | 8×8, 12×12 | Matte, Semi-polished |
| `tile_mosaic` | Mosaic | Varies | 1×1, 2×2, Hexagon | Various |

### Additional Categories

**Floors:** Hardwood, Tile, Marble, Concrete, Carpet, Laminate, Vinyl, Parquet
**Walls:** Drywall, Exposed Brick, Stone, Marble, Subway Tile, Plaster, Concrete, Wood
**Ceilings:** Flat, Coffered, Vaulted, Beam-Exposed, Plaster, Tin
**Roofs:** Asphalt Shingle, Clay Tile, Metal, Membrane, Cedar Shake
**Furniture:** Fabric, Leather, Wood, Metal, Glass, Plastic, Velvet

**Pattern Types (6):** Solid, Herringbone, Grid, Stripe, Chevron, Parquet

---

## 4. Material Definition Schema

```typescript
interface Material {
  id: string                    // unique identifier (e.g., "wood_red_oak")
  name: string                  // display name
  category: MaterialCategory    // floor | wall | ceiling | roof | furniture
  subcategory?: string          // e.g., "wood", "stone", "tile"

  // Procedural fallback (always required)
  color: string                 // hex color
  colorSecondary?: string       // secondary color for grain/veining
  roughness: number            // 0-1 (3D PBR)
  metalness: number            // 0-1 (3D PBR)
  pattern: PatternType         // solid | herringbone | grid | stripe | chevron | parquet
  patternScale?: number        // tiles per metre (default 1.0)

  // Wood-specific
  woodSpecies?: 'red_oak' | 'white_oak' | 'walnut' | 'maple' | 'cherry' | 'mahogany' | 'teak' | 'ash' | 'hickory' | 'pine'
  woodCut?: 'plain_sawn' | 'quarter_sawn' | 'rift_sawn'
  woodFinish?: 'matte' | 'satin' | 'semi_gloss' | 'glossy' | 'distressed'

  // Stone-specific
  stoneType?: 'granite' | 'marble' | 'limestone' | 'slate' | 'travertine' | 'quartzite' | 'onyx' | 'sandstone'
  stoneFinish?: 'polished' | 'honed' | 'leathered' | 'brushed' | 'tumbled'

  // Tile-specific
  tileType?: 'ceramic' | 'porcelain' | 'terracotta' | 'cement' | 'mosaic'
  tileSize?: string            // e.g., "12×12", "6×24"

  // Optional texture URLs (enhancement when available)
  albedoUrl?: string
  normalUrl?: string
  displacementUrl?: string
  roughnessUrl?: string
  // Poly Haven format: `https://dl.polyhaven.org/file/ph-assets/Textures/{format}/1k/{name}_{format}_1k.jpg`

  // AI generation params (for on-demand generation)
  aiPrompts?: {
    style: string
    mood: string
    seed?: number
  }
}

type MaterialCategory = 'floor' | 'wall' | 'ceiling' | 'roof' | 'furniture'
type PatternType = 'solid' | 'herringbone' | 'grid' | 'stripe' | 'chevron' | 'parquet'
```

---

## 5. MaterialCompiler

Centralized conversion layer. Takes materialId + target renderer, returns appropriate output.

```typescript
class MaterialCompiler {
  // Get Skia Paint for 2D rendering
  compile(materialId: string, renderer: 'skia'): SkiaPaint

  // Get Three.js material for 3D rendering
  compile(materialId: string, renderer: 'threejs'): THREE.Material

  // Get material definition
  getMaterial(materialId: string): Material | undefined

  // Invalidate cache for a material
  invalidate(materialId: string): void

  // Cache
  private cache: Map<string, SkiaPaint | THREE.Material>
}
```

**Resolution priority:**
1. If `albedoUrl` exists → load texture, build PBR (textured/hybrid)
2. If `aiPrompts` configured → generate via SDXL, build PBR (ai/hybrid)
3. Fall back to procedural (color + pattern)

**Texture URL format (Poly Haven):**
```
https://dl.polyhaven.org/file/ph-assets/Textures/{format}/1k/{name}_{format}_1k.jpg
Formats: diffuse/albedo, normal, displacement, roughness
```

---

## 6. Pipeline Tiers

| Tier | Trigger | 3D Output | 2D Output |
|------|---------|-----------|----------|
| Procedural | No URLs, no AI prompts | Flat PBR (color, roughness, metalness) | Color + procedural pattern |
| Hand-Crafted | albedoUrl available | PBR with texture maps from Poly Haven | Color with pattern overlay |
| AI | aiPrompts configured | Generated texture → PBR | Color with pattern overlay |
| Hybrid | Both URLs + AI prompts | Best available (textured preferred) | Color with pattern overlay |

---

## 7. 2D Pattern Rendering

Patterns rendered via Skia `Shader` or `ImageFilter`:

| Pattern | Skia Implementation |
|---------|---------------------|
| Solid | Flat color fill |
| Herringbone | Rotated rect tiles at 45°/135°, alternating |
| Grid | Perpendicular lines at scale |
| Stripe | Parallel lines at scale |
| Chevron | V-shaped repeating pattern |
| Parquet | Rect tiles with directional grain (colorSecondary for grain lines) |

Pattern scale controlled by `patternScale` property (default 1.0 = 1m per tile).
ColorSecondary used for grain lines in wood patterns.

---

## 8. Interaction Flow

```
User taps surface (wall/floor/room)
        ↓
Surface selected → highlight in 2D and 3D
        ↓
Material palette slides in (scrollable grid, categorized)
Current material pre-selected (highlighted border)
        ↓
User scrolls palette → taps new material
        ↓
Material applied to surface (blueprintStore.applyMaterial)
Palette remains open for additional edits
Tap outside palette → close
```

---

## 9. File Structure

```
src/
  materials/
    MaterialCompiler.ts        # Core conversion logic
    materialLibrary.ts         # 40+ material definitions with real hex colors
    index.ts                   # Public exports
    textures/
      proceduralPatterns.ts    # 2D Skia pattern shaders
      PBRMaterials.ts          # Three.js material builders
    AI/
      textureGenerator.ts      # SDXL integration (defer)
    types.ts                   # Material, MaterialCategory, PatternType interfaces
```

---

## 10. Implementation Order

1. `src/materials/types.ts` — type definitions
2. `src/materials/MaterialCompiler.ts` — core logic, cache, compile methods
3. `src/materials/materialLibrary.ts` — all 40+ material definitions with real colors
4. `src/materials/textures/proceduralPatterns.ts` — 2D Skia pattern shaders
5. `src/materials/textures/PBRMaterials.ts` — Three.js PBR material builders
6. `src/types/blueprint.ts` — add `materialId` to Wall, Room, Slab types
7. `src/stores/blueprintStore.ts` — add `applyMaterial(surfaceId, materialId)` action
8. `src/components/blueprint/Canvas2D.tsx` — integrate MaterialCompiler for wall/floor/room fills
9. `src/components/3d/ProceduralWall.tsx` — replace hardcoded colors with MaterialCompiler
10. `src/components/3d/ProceduralFloor.tsx` — replace FLOOR_COLORS with MaterialCompiler
11. Material picker UI — scrollable palette component
12. 2D↔3D selection sync — highlight selected surface in both renderers

---

## 11. Open Questions (Resolved)

- **Texture hosting:** Poly Haven CDN (CC0, free, 8K+ PBR textures)
- **AI generation:** Deferred — procedural + hand-crafted sufficient for v1
- **Pattern scale:** Material-fixed defaults, user-adjustable via future UI

---

## 12. Related Files (to modify)

| File | Change |
|------|--------|
| `src/types/blueprint.ts` | Add `materialId: string` to Wall, Room, Slab, Ceiling, RoofSegment |
| `src/stores/blueprintStore.ts` | Add `applyMaterial(surfaceId: string, materialId: string)` action |
| `src/components/blueprint/Canvas2D.tsx` | Use MaterialCompiler for room fills, wall renders |
| `src/components/3d/ProceduralWall.tsx` | Use MaterialCompiler instead of hardcoded wall color |
| `src/components/3d/ProceduralFloor.tsx` | Use MaterialCompiler instead of FLOOR_COLORS map |
| `src/components/3d/ProceduralCeiling.tsx` | Use MaterialCompiler for ceiling materials |

---

## 13. Material Library — Complete List

### Wood (10)
`wood_red_oak`, `wood_white_oak`, `wood_walnut`, `wood_maple`, `wood_cherry`, `wood_mahogany`, `wood_teak`, `wood_ash`, `wood_hickory`, `wood_pine`

### Stone (8)
`stone_granite`, `stone_marble`, `stone_limestone`, `stone_slate`, `stone_travertine`, `stone_quartzite`, `stone_onyx`, `stone_sandstone`

### Tile (5)
`tile_ceramic`, `tile_porcelain`, `tile_terracotta`, `tile_cement`, `tile_mosaic`

### Floor (8)
`floor_hardwood`, `floor_tile`, `floor_marble`, `floor_concrete`, `floor_carpet`, `floor_laminate`, `floor_vinyl`, `floor_parquet`

### Wall (8)
`wall_drywall`, `wall_exposed_brick`, `wall_stone`, `wall_marble`, `wall_subway_tile`, `wall_plaster`, `wall_concrete`, `wall_wood`

### Ceiling (6)
`ceiling_flat`, `ceiling_coffered`, `ceiling_vaulted`, `ceiling_beam_exposed`, `ceiling_plaster`, `ceiling_tin`

### Roof (5)
`roof_asphalt_shingle`, `roof_clay_tile`, `roof_metal`, `roof_membrane`, `roof_cedar_shake`

### Furniture Fabric (7)
`fabric_cotton`, `fabric_leather`, `fabric_velvet`, `fabric_linen`, `fabric_microfiber`, `fabric_silk`, `fabric_wool`

**Total: 57+ materials with variations**