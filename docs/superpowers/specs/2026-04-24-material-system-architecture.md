# Material/Texture System Architecture
**Date:** 2026-04-24
**Status:** Draft

---

## 1. Overview

A unified material/texture system spanning both 2D (Skia) and 3D (React Three Fiber) renderers. A single material definition drives visual output in both renderers with graceful degradation across 4 pipeline tiers.

---

## 2. Design Decisions

| Decision | Choice | Rationale |
|----------|--------|------------|
| Scope | All categories, 5-8 materials each (~40 total) | Floor, Wall, Ceiling, Roof, Furniture |
| Material definition | Flat data + optional texture URLs + AI params | All tiers supported, always renders |
| Renderer pipeline | MaterialCompiler centralized conversion | Clean separation, consistent output |
| Pipeline tiers | All 4 (Procedural / Hand-Crafted / AI / Hybrid) | Hybrid selected as default |
| Material picker UI | Simple scrollable palette (Option A) | Minimal, fast, on-brand |
| Selection interaction | Select surface first, then material palette | Standard editing workflow |

---

## 3. Material Categories

### Floors (8 materials)
- Hardwood, Tile, Marble, Concrete, Carpet, Laminate, Vinyl, Parquet

### Walls (8 materials)
- Drywall, Exposed Brick, Stone, Marble, Subway Tile, Plaster, Concrete, Wood

### Ceilings (6 materials)
- Flat, Coffered, Vaulted, Beam-Exposed, Plaster, Tin

### Roofs (5 materials)
- Asphalt Shingle, Clay Tile, Metal, Membrane, Cedar Shake

### Furniture (13 materials)
- Fabric, Leather, Wood, Metal, Glass, Plastic, Velvet + variants

### Pattern Types (6)
- Solid, Herringbone, Grid, Stripe, Chevron, Parquet

---

## 4. Material Definition Schema

```typescript
interface Material {
  id: string                    // unique identifier (e.g., "hardwood_oak")
  name: string                  // display name
  category: MaterialCategory    // floor | wall | ceiling | roof | furniture

  // Procedural fallback (always required)
  color: string                 // hex color
  roughness: number            // 0-1 (3D PBR)
  metalness: number            // 0-1 (3D PBR)
  pattern: PatternType         // solid | herringbone | grid | stripe | chevron | parquet

  // Optional texture URLs (enhancement when available)
  albedoUrl?: string
  normalUrl?: string
  displacementUrl?: string
  roughnessUrl?: string

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

  // Internal: resolve pipeline tier
  private resolveTier(material: Material): 'procedural' | 'textured' | 'ai' | 'hybrid'

  // Internal: build Skia paint from material
  private buildSkiaPaint(material: Material, tier: PipelineTier): SkiaPaint

  // Internal: build Three.js material from material
  private buildThreeMaterial(material: Material, tier: PipelineTier): THREE.Material

  // Cache compiled outputs
  private cache: Map<string, SkiaPaint | THREE.Material>
}
```

**Resolution priority:**
1. If `albedoUrl` exists → load texture, build PBR (textured/hybrid)
2. If `aiPrompts` configured → generate via SDXL, build PBR (ai/hybrid)
3. Fall back to procedural (color + pattern)

---

## 6. Pipeline Tiers

| Tier | Trigger | 3D Output | 2D Output |
|------|---------|-----------|----------|
| Procedural | No URLs, no AI prompts | Flat PBR (color, roughness, metalness) | Color + procedural pattern |
| Hand-Crafted | albedoUrl available | PBR with texture maps | Color with pattern overlay |
| AI | aiPrompts configured | Generated texture → PBR | Color with pattern overlay |
| Hybrid | Both URLs + AI prompts | Best available (textured preferred) | Color with pattern overlay |

---

## 7. 2D Pattern Rendering

Patterns rendered via Skia `Shader` or `ImageFilter`:

| Pattern | Skia Implementation |
|---------|---------------------|
| Solid | Flat color |
| Herringbone | Rotated rect tiles at 45°/135° |
| Grid | Perpendicular lines at scale |
| Stripe | Parallel lines at scale |
| Chevron | V-shaped repeats |
| Parquet | Rect tiles with wood-grain direction |

Pattern scale controlled by `patternScale` property (default 1.0 = 1m per tile).

---

## 8. Interaction Flow

```
User taps surface (wall/floor/room)
        ↓
Surface selected → highlight in 2D and 3D
        ↓
Material palette slides in (scrollable grid)
Current material pre-selected (highlighted border)
        ↓
User scrolls palette → taps new material
        ↓
Material applied to surface
Palette remains open for additional edits
Tap outside palette → close
```

---

## 9. File Structure

```
src/
  materials/
    MaterialCompiler.ts        # Core conversion logic (~150 lines)
    materialLibrary.ts         # ~40 material definitions (~200 lines)
    index.ts                   # Public exports
    textures/
      proceduralPatterns.ts    # 2D Skia pattern shaders (~100 lines)
      PBRMaterials.ts          # Three.js material builders (~100 lines)
    AI/
      textureGenerator.ts      # SDXL integration (~80 lines)
```

---

## 10. Implementation Order

1. `MaterialCompiler.ts` — core logic, type definitions, cache
2. `materialLibrary.ts` — all material definitions (~40)
3. `proceduralPatterns.ts` — 2D pattern shaders for Skia
4. `PBRMaterials.ts` — Three.js material builders
5. `textureGenerator.ts` — AI integration (defer if needed)
6. Canvas2D integration — apply MaterialCompiler to walls/floors
7. ProceduralFloor/Wall integration — apply MaterialCompiler to 3D
8. Material picker UI — scrollable palette
9. Selection sync — 2D↔3D surface selection

---

## 11. Open Questions

- Texture hosting: Cloudflare CDN or repo-committed files?
- AI generation: realtime on-demand or pre-generate and cache?
- Pattern scale: user-adjustable or material-fixed?

---

## 12. Related Files (to modify)

| File | Change |
|------|--------|
| `src/types/blueprint.ts` | Add `materialId` to Wall, Floor, Room types |
| `src/components/blueprint/Canvas2D.tsx` | Integrate MaterialCompiler for wall/floor fills |
| `src/components/3d/ProceduralWall.tsx` | Replace hardcoded colors with MaterialCompiler |
| `src/components/3d/ProceduralFloor.tsx` | Replace FLOOR_COLORS with MaterialCompiler |
| `src/stores/blueprintStore.ts` | Add `applyMaterial(surfaceId, materialId)` action |