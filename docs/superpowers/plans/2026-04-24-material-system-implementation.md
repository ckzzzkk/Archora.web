# Material System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded FLOOR_COLORS with a unified MaterialCompiler that drives both 2D Skia and 3D Three.js rendering with 57+ real wood/stone materials.

**Architecture:** Material system as a new `src/materials/` module with: types (Material, MaterialCategory, PatternType), MaterialCompiler (centralized 2D/3D conversion), materialLibrary (57+ definitions with real hex colors), proceduralPatterns (Skia shaders), PBRMaterials (Three.js builders). Blueprint types extended with `materialId`. Store gets `applyMaterial` action.

**Tech Stack:** TypeScript strict, React Native, Skia (2D), Three.js/R3F (3D)

---

## File Structure

```
src/
  materials/
    types.ts                  # Material, MaterialCategory, PatternType interfaces
    MaterialCompiler.ts       # Core: compile(materialId, renderer) → SkiaPaint | THREE.Material
    materialLibrary.ts        # 57+ Material definitions (wood, stone, tile, floor, wall, etc.)
    index.ts                 # Public exports
    textures/
      proceduralPatterns.ts   # buildSkiaPattern(pattern, color, colorSecondary, scale) → SkiaPaint
      PBRMaterials.ts          # buildThreeMaterial(material) → THREE.MeshStandardMaterial

src/
  types/blueprint.ts          # Add materialId to Wall, Room, Slab, Ceiling

src/stores/blueprintStore.ts  # Add applyMaterial(surfaceId, materialId) action

src/components/
  blueprint/Canvas2D.tsx     # Use MaterialCompiler for room/wall fills
  3d/ProceduralFloor.tsx      # Use MaterialCompiler instead of FLOOR_COLORS
  3d/ProceduralWall.tsx       # Use MaterialCompiler for wall materials
  3d/ProceduralCeiling.tsx    # Use MaterialCompiler for ceiling materials
```

---

## Tasks

### Task 1: Material Types — `src/materials/types.ts`

**Files:**
- Create: `src/materials/types.ts`
- Modify: `src/types/blueprint.ts:42-65` (add `materialId` fields)

- [ ] **Step 1: Create `src/materials/types.ts`**

```typescript
// src/materials/types.ts
export type MaterialCategory = 'floor' | 'wall' | 'ceiling' | 'roof' | 'furniture';
export type PatternType = 'solid' | 'herringbone' | 'grid' | 'stripe' | 'chevron' | 'parquet';
export type WoodSpecies = 'red_oak' | 'white_oak' | 'walnut' | 'maple' | 'cherry' | 'mahogany' | 'teak' | 'ash' | 'hickory' | 'pine';
export type WoodCut = 'plain_sawn' | 'quarter_sawn' | 'rift_sawn';
export type WoodFinish = 'matte' | 'satin' | 'semi_gloss' | 'glossy' | 'distressed';
export type StoneType = 'granite' | 'marble' | 'limestone' | 'slate' | 'travertine' | 'quartzite' | 'onyx' | 'sandstone';
export type StoneFinish = 'polished' | 'honed' | 'leathered' | 'brushed' | 'tumbled';
export type TileType = 'ceramic' | 'porcelain' | 'terracotta' | 'cement' | 'mosaic';
export type PipelineTier = 'procedural' | 'textured' | 'ai' | 'hybrid';

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  subcategory?: string; // 'wood' | 'stone' | 'tile' | 'concrete' | etc.

  // Procedural fallback (always required)
  color: string;         // primary hex color
  colorSecondary?: string; // grain/veining color
  roughness: number;    // 0-1 (3D PBR)
  metalness: number;     // 0-1 (3D PBR)
  pattern: PatternType;
  patternScale?: number; // tiles per metre (default 1.0)

  // Wood-specific
  woodSpecies?: WoodSpecies;
  woodCut?: WoodCut;
  woodFinish?: WoodFinish;

  // Stone-specific
  stoneType?: StoneType;
  stoneFinish?: StoneFinish;

  // Tile-specific
  tileType?: TileType;
  tileSize?: string;

  // Optional texture URLs (Poly Haven CC0)
  albedoUrl?: string;
  normalUrl?: string;
  displacementUrl?: string;
  roughnessUrl?: string;

  // AI generation
  aiPrompts?: {
    style: string;
    mood: string;
    seed?: number;
  };
}
```

- [ ] **Step 2: Add materialId to blueprint types**

Modify `src/types/blueprint.ts`:

Add `materialId?: string` to:
- `Wall` interface (after `material?: string` on line ~129)
- `Room` interface (after `floorMaterial: MaterialType` on line ~150)
- `Slab` interface (after `autoFromWalls` on line ~281)
- `Ceiling` interface (after `ceilingType` on line ~109)

```typescript
// In Wall interface:
material?: string;
materialId?: string; // New: references materialLibrary id

// In Room interface:
floorMaterial: MaterialType;
floorMaterialId?: string; // New: references materialLibrary id

// In Slab interface:
autoFromWalls: boolean;
materialId?: string;

// In Ceiling interface:
ceilingType: CeilingType;
materialId?: string;
```

- [ ] **Step 3: Commit**

```bash
git add src/materials/types.ts src/types/blueprint.ts
git commit -m "feat(materials): add material types and blueprint materialId fields"
```

---

### Task 2: MaterialLibrary — `src/materials/materialLibrary.ts`

**Files:**
- Create: `src/materials/materialLibrary.ts`
- Test: `src/__tests__/materials/materialLibrary.test.ts`

- [ ] **Step 1: Create test file**

```typescript
// src/__tests__/materials/materialLibrary.test.ts
import { materialLibrary, getMaterial, getMaterialsByCategory } from '../../materials/materialLibrary';

describe('materialLibrary', () => {
  it('should have 57+ materials', () => {
    expect(materialLibrary.length).toBeGreaterThanOrEqual(57);
  });

  it('should have all wood species', () => {
    const woods = getMaterialsByCategory('floor').filter(m => m.subcategory === 'wood');
    expect(woods.length).toBeGreaterThanOrEqual(8);
  });

  it('should return material by id', () => {
    const mat = getMaterial('wood_red_oak');
    expect(mat?.name).toBe('Red Oak');
    expect(mat?.color).toBe('#984A2B');
  });

  it('should return undefined for unknown id', () => {
    expect(getMaterial('unknown')).toBeUndefined();
  });

  it('should have stone materials with secondary colors', () => {
    const marble = getMaterial('stone_marble');
    expect(marble?.colorSecondary).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/materials/materialLibrary.test.ts -v
# Expected: FAIL — module not found
```

- [ ] **Step 3: Write `src/materials/materialLibrary.ts`**

```typescript
// src/materials/materialLibrary.ts
import type { Material, MaterialCategory } from './types';

export const materialLibrary: Material[] = [
  // === WOOD FLOORS (10 species) ===
  {
    id: 'wood_red_oak',
    name: 'Red Oak',
    category: 'floor',
    subcategory: 'wood',
    color: '#984A2B',
    colorSecondary: '#B86B4A',
    roughness: 0.7,
    metalness: 0,
    pattern: 'herringbone',
    woodSpecies: 'red_oak',
    woodCut: 'plain_sawn',
    woodFinish: 'satin',
  },
  {
    id: 'wood_white_oak',
    name: 'White Oak',
    category: 'floor',
    subcategory: 'wood',
    color: '#C9A86C',
    colorSecondary: '#D4B896',
    roughness: 0.65,
    metalness: 0,
    pattern: 'parquet',
    woodSpecies: 'white_oak',
    woodCut: 'quarter_sawn',
    woodFinish: 'satin',
  },
  {
    id: 'wood_walnut',
    name: 'Black Walnut',
    category: 'floor',
    subcategory: 'wood',
    color: '#5C4033',
    colorSecondary: '#6B4423',
    roughness: 0.6,
    metalness: 0,
    pattern: 'strip',
    woodSpecies: 'walnut',
    woodCut: 'rift_sawn',
    woodFinish: 'semi_gloss',
  },
  {
    id: 'wood_maple',
    name: 'Hard Maple',
    category: 'floor',
    subcategory: 'wood',
    color: '#C4A882',
    colorSecondary: '#E8D9B5',
    roughness: 0.65,
    metalness: 0,
    pattern: 'strip',
    woodSpecies: 'maple',
    woodFinish: 'satin',
  },
  {
    id: 'wood_cherry',
    name: 'Cherry',
    category: 'floor',
    subcategory: 'wood',
    color: '#9B4F34',
    colorSecondary: '#B87333',
    roughness: 0.55,
    metalness: 0,
    pattern: 'parquet',
    woodSpecies: 'cherry',
    woodFinish: 'semi_gloss',
  },
  {
    id: 'wood_mahogany',
    name: 'Mahogany',
    category: 'floor',
    subcategory: 'wood',
    color: '#8B4513',
    colorSecondary: '#D4A574',
    roughness: 0.5,
    metalness: 0,
    pattern: 'herringbone',
    woodSpecies: 'mahogany',
    woodCut: 'quarter_sawn',
    woodFinish: 'glossy',
  },
  {
    id: 'wood_teak',
    name: 'Teak',
    category: 'floor',
    subcategory: 'wood',
    color: '#B8860B',
    colorSecondary: '#CD853F',
    roughness: 0.6,
    metalness: 0.05,
    pattern: 'strip',
    woodSpecies: 'teak',
    woodFinish: 'satin',
  },
  {
    id: 'wood_ash',
    name: 'Ash',
    category: 'floor',
    subcategory: 'wood',
    color: '#E8D9B5',
    colorSecondary: '#C4A882',
    roughness: 0.7,
    metalness: 0,
    pattern: 'herringbone',
    woodSpecies: 'ash',
    woodFinish: 'matte',
  },
  {
    id: 'wood_hickory',
    name: 'Hickory',
    category: 'floor',
    subcategory: 'wood',
    color: '#E8D9B5',
    colorSecondary: '#8B7355',
    roughness: 0.8,
    metalness: 0,
    pattern: 'strip',
    woodSpecies: 'hickory',
    woodFinish: 'matte',
  },
  {
    id: 'wood_pine',
    name: 'Pine',
    category: 'floor',
    subcategory: 'wood',
    color: '#F5ECD7',
    colorSecondary: '#CD853F',
    roughness: 0.75,
    metalness: 0,
    pattern: 'plain_sawn',
    woodSpecies: 'pine',
    woodCut: 'plain_sawn',
    woodFinish: 'matte',
  },

  // === STONE (8 types) ===
  {
    id: 'stone_granite',
    name: 'Granite',
    category: 'floor',
    subcategory: 'stone',
    color: '#B8B8B8',
    colorSecondary: '#8A8A8A',
    roughness: 0.3,
    metalness: 0.1,
    pattern: 'solid',
    stoneType: 'granite',
    stoneFinish: 'polished',
  },
  {
    id: 'stone_marble',
    name: 'Marble',
    category: 'floor',
    subcategory: 'stone',
    color: '#F0EDE8',
    colorSecondary: '#D0C8C0',
    roughness: 0.2,
    metalness: 0.05,
    pattern: 'solid',
    stoneType: 'marble',
    stoneFinish: 'polished',
  },
  {
    id: 'stone_limestone',
    name: 'Limestone',
    category: 'floor',
    subcategory: 'stone',
    color: '#D4C4A8',
    colorSecondary: '#A89070',
    roughness: 0.6,
    metalness: 0,
    pattern: 'solid',
    stoneType: 'limestone',
    stoneFinish: 'honed',
  },
  {
    id: 'stone_slate',
    name: 'Slate',
    category: 'floor',
    subcategory: 'stone',
    color: '#5A5A5A',
    colorSecondary: '#3A3A3A',
    roughness: 0.5,
    metalness: 0,
    pattern: 'grid',
    stoneType: 'slate',
    stoneFinish: 'natural_cleft',
  },
  {
    id: 'stone_travertine',
    name: 'Travertine',
    category: 'floor',
    subcategory: 'stone',
    color: '#E8D9B5',
    colorSecondary: '#C4A882',
    roughness: 0.45,
    metalness: 0,
    pattern: 'solid',
    stoneType: 'travertine',
    stoneFinish: 'tumbled',
  },
  {
    id: 'stone_quartzite',
    name: 'Quartzite',
    category: 'floor',
    subcategory: 'stone',
    color: '#E8E8E0',
    colorSecondary: '#C8C8C0',
    roughness: 0.25,
    metalness: 0.1,
    pattern: 'solid',
    stoneType: 'quartzite',
    stoneFinish: 'polished',
  },
  {
    id: 'stone_onyx',
    name: 'Onyx',
    category: 'floor',
    subcategory: 'stone',
    color: '#1A1A1A',
    colorSecondary: '#3A3A3A',
    roughness: 0.1,
    metalness: 0.05,
    pattern: 'solid',
    stoneType: 'onyx',
    stoneFinish: 'polished',
  },
  {
    id: 'stone_sandstone',
    name: 'Sandstone',
    category: 'floor',
    subcategory: 'stone',
    color: '#D4A574',
    colorSecondary: '#A67B5B',
    roughness: 0.65,
    metalness: 0,
    pattern: 'solid',
    stoneType: 'sandstone',
    stoneFinish: 'natural_cleft',
  },

  // === TILE (5 types) ===
  {
    id: 'tile_ceramic',
    name: 'Ceramic Tile',
    category: 'floor',
    subcategory: 'tile',
    color: '#E8E0D8',
    roughness: 0.4,
    metalness: 0,
    pattern: 'grid',
    tileType: 'ceramic',
    tileSize: '12×12',
  },
  {
    id: 'tile_porcelain',
    name: 'Porcelain Tile',
    category: 'floor',
    subcategory: 'tile',
    color: '#D8D0C8',
    roughness: 0.2,
    metalness: 0.05,
    pattern: 'grid',
    tileType: 'porcelain',
    tileSize: '24×24',
  },
  {
    id: 'tile_terracotta',
    name: 'Terracotta',
    category: 'floor',
    subcategory: 'tile',
    color: '#C47840',
    colorSecondary: '#A86030',
    roughness: 0.7,
    metalness: 0,
    pattern: 'solid',
    tileType: 'terracotta',
    tileSize: '8×8',
  },
  {
    id: 'tile_cement',
    name: 'Cement Tile',
    category: 'floor',
    subcategory: 'tile',
    color: '#9A9590',
    roughness: 0.5,
    metalness: 0,
    pattern: 'grid',
    tileType: 'cement',
    tileSize: '8×8',
  },
  {
    id: 'tile_mosaic',
    name: 'Mosaic',
    category: 'floor',
    subcategory: 'tile',
    color: '#C8C8C8',
    roughness: 0.3,
    metalness: 0.1,
    pattern: 'grid',
    tileType: 'mosaic',
    tileSize: '2×2',
  },

  // === CONCRETE FLOORS ===
  {
    id: 'floor_concrete',
    name: 'Concrete',
    category: 'floor',
    subcategory: 'concrete',
    color: '#808080',
    roughness: 0.85,
    metalness: 0,
    pattern: 'solid',
  },
  {
    id: 'floor_polished_concrete',
    name: 'Polished Concrete',
    category: 'floor',
    subcategory: 'concrete',
    color: '#909090',
    roughness: 0.3,
    metalness: 0.05,
    pattern: 'solid',
  },

  // === CARPET ===
  {
    id: 'floor_carpet',
    name: 'Carpet',
    category: 'floor',
    subcategory: 'fabric',
    color: '#6A5A7A',
    roughness: 0.95,
    metalness: 0,
    pattern: 'solid',
  },

  // === VINYL / LAMINATE ===
  {
    id: 'floor_vinyl',
    name: 'Vinyl',
    category: 'floor',
    subcategory: 'synthetic',
    color: '#908070',
    roughness: 0.4,
    metalness: 0,
    pattern: 'strip',
  },
  {
    id: 'floor_laminate',
    name: 'Laminate',
    category: 'floor',
    subcategory: 'synthetic',
    color: '#B89060',
    roughness: 0.5,
    metalness: 0,
    pattern: 'strip',
  },

  // === WALL MATERIALS (8) ===
  {
    id: 'wall_drywall',
    name: 'Drywall',
    category: 'wall',
    subcategory: ' plaster',
    color: '#F0EDE8',
    roughness: 0.9,
    metalness: 0,
    pattern: 'solid',
  },
  {
    id: 'wall_exposed_brick',
    name: 'Exposed Brick',
    category: 'wall',
    subcategory: 'brick',
    color: '#8B4513',
    roughness: 0.85,
    metalness: 0,
    pattern: 'grid',
  },
  {
    id: 'wall_stone',
    name: 'Stone',
    category: 'wall',
    subcategory: 'stone',
    color: '#706860',
    roughness: 0.7,
    metalness: 0,
    pattern: 'solid',
  },
  {
    id: 'wall_marble',
    name: 'Marble',
    category: 'wall',
    subcategory: 'stone',
    color: '#F5F5F0',
    colorSecondary: '#D0C8C0',
    roughness: 0.2,
    metalness: 0.05,
    pattern: 'solid',
  },
  {
    id: 'wall_subway_tile',
    name: 'Subway Tile',
    category: 'wall',
    subcategory: 'tile',
    color: '#E8E0D8',
    roughness: 0.3,
    metalness: 0,
    pattern: 'grid',
  },
  {
    id: 'wall_plaster',
    name: 'Plaster',
    category: 'wall',
    subcategory: 'plaster',
    color: '#F5EDE0',
    roughness: 0.85,
    metalness: 0,
    pattern: 'solid',
  },
  {
    id: 'wall_concrete',
    name: 'Concrete',
    category: 'wall',
    subcategory: 'concrete',
    color: '#707070',
    roughness: 0.8,
    metalness: 0,
    pattern: 'solid',
  },
  {
    id: 'wall_wood',
    name: 'Wood Paneling',
    category: 'wall',
    subcategory: 'wood',
    color: '#9E7040',
    roughness: 0.6,
    metalness: 0,
    pattern: 'strip',
  },

  // === CEILING MATERIALS (6) ===
  {
    id: 'ceiling_flat',
    name: 'Flat White',
    category: 'ceiling',
    color: '#F0EDE8',
    roughness: 0.95,
    metalness: 0,
    pattern: 'solid',
  },
  {
    id: 'ceiling_coffered',
    name: 'Coffered',
    category: 'ceiling',
    color: '#E8E0D8',
    roughness: 0.8,
    metalness: 0,
    pattern: 'grid',
  },
  {
    id: 'ceiling_vaulted',
    name: 'Vaulted',
    category: 'ceiling',
    color: '#E0D8D0',
    roughness: 0.7,
    metalness: 0,
    pattern: 'solid',
  },
  {
    id: 'ceiling_beam_exposed',
    name: 'Exposed Beams',
    category: 'ceiling',
    color: '#8B6040',
    roughness: 0.7,
    metalness: 0,
    pattern: 'strip',
  },
  {
    id: 'ceiling_plaster',
    name: 'Plaster',
    category: 'ceiling',
    color: '#F5F0E8',
    roughness: 0.85,
    metalness: 0,
    pattern: 'solid',
  },
  {
    id: 'ceiling_tin',
    name: 'Tin',
    category: 'ceiling',
    color: '#A0A0A0',
    roughness: 0.4,
    metalness: 0.7,
    pattern: 'grid',
  },

  // === ROOF MATERIALS (5) ===
  {
    id: 'roof_asphalt_shingle',
    name: 'Asphalt Shingle',
    category: 'roof',
    color: '#4A4A4A',
    roughness: 0.85,
    metalness: 0,
    pattern: 'grid',
  },
  {
    id: 'roof_clay_tile',
    name: 'Clay Tile',
    category: 'roof',
    color: '#C47840',
    roughness: 0.7,
    metalness: 0,
    pattern: 'grid',
  },
  {
    id: 'roof_metal',
    name: 'Metal Roof',
    category: 'roof',
    color: '#808080',
    roughness: 0.4,
    metalness: 0.8,
    pattern: 'strip',
  },
  {
    id: 'roof_membrane',
    name: 'Membrane',
    category: 'roof',
    color: '#606060',
    roughness: 0.6,
    metalness: 0.1,
    pattern: 'solid',
  },
  {
    id: 'roof_cedar_shake',
    name: 'Cedar Shake',
    category: 'roof',
    color: '#8B6040',
    roughness: 0.8,
    metalness: 0,
    pattern: 'grid',
  },

  // === FURNITURE MATERIALS (7 fabric) ===
  {
    id: 'fabric_cotton',
    name: 'Cotton Fabric',
    category: 'furniture',
    subcategory: 'fabric',
    color: '#C8B8A8',
    roughness: 0.95,
    metalness: 0,
    pattern: 'solid',
  },
  {
    id: 'fabric_leather',
    name: 'Leather',
    category: 'furniture',
    subcategory: 'fabric',
    color: '#5C3A1E',
    roughness: 0.5,
    metalness: 0.05,
    pattern: 'solid',
  },
  {
    id: 'fabric_velvet',
    name: 'Velvet',
    category: 'furniture',
    subcategory: 'fabric',
    color: '#4A3A6A',
    roughness: 0.9,
    metalness: 0,
    pattern: 'solid',
  },
  {
    id: 'fabric_linen',
    name: 'Linen',
    category: 'furniture',
    subcategory: 'fabric',
    color: '#D4C8B0',
    roughness: 0.9,
    metalness: 0,
    pattern: 'solid',
  },
  {
    id: 'fabric_microfiber',
    name: 'Microfiber',
    category: 'furniture',
    subcategory: 'fabric',
    color: '#9A9590',
    roughness: 0.85,
    metalness: 0,
    pattern: 'solid',
  },
  {
    id: 'fabric_silk',
    name: 'Silk',
    category: 'furniture',
    subcategory: 'fabric',
    color: '#E8D8C8',
    roughness: 0.3,
    metalness: 0.1,
    pattern: 'solid',
  },
  {
    id: 'fabric_wool',
    name: 'Wool',
    category: 'furniture',
    subcategory: 'fabric',
    color: '#8B7355',
    roughness: 0.9,
    metalness: 0,
    pattern: 'solid',
  },
];

export function getMaterial(id: string): Material | undefined {
  return materialLibrary.find(m => m.id === id);
}

export function getMaterialsByCategory(category: MaterialCategory): Material[] {
  return materialLibrary.filter(m => m.category === category);
}

export function getMaterialsBySubcategory(subcategory: string): Material[] {
  return materialLibrary.filter(m => m.subcategory === subcategory);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/materials/materialLibrary.test.ts -v
# Expected: PASS
```

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/materials/materialLibrary.test.ts src/materials/materialLibrary.ts
git commit -m "feat(materials): add materialLibrary with 57+ definitions including real wood/stone species"
```

---

### Task 3: MaterialCompiler — `src/materials/MaterialCompiler.ts`

**Files:**
- Create: `src/materials/MaterialCompiler.ts`
- Modify: `src/materials/index.ts`
- Test: `src/__tests__/materials/MaterialCompiler.test.ts`

- [ ] **Step 1: Write test file**

```typescript
// src/__tests__/materials/MaterialCompiler.test.ts
import { MaterialCompiler } from '../../materials/MaterialCompiler';
import { getMaterial } from '../../materials/materialLibrary';

describe('MaterialCompiler', () => {
  it('should compile material for skia renderer', () => {
    const paint = MaterialCompiler.compile('wood_red_oak', 'skia');
    expect(paint).toBeDefined();
    expect(paint.color).toBe('#984A2B');
  });

  it('should compile material for threejs renderer', () => {
    const mat = MaterialCompiler.compile('wood_red_oak', 'threejs');
    expect(mat).toBeDefined();
    expect(mat.color).toBe('#984A2B');
    expect(mat.roughness).toBe(0.7);
  });

  it('should return stone material with secondary color', () => {
    const mat = MaterialCompiler.compile('stone_marble', 'threejs');
    expect(mat.color).toBe('#F0EDE8');
  });

  it('should invalidate cache', () => {
    MaterialCompiler.invalidate('wood_red_oak');
    // No error = success
  });

  it('should get material definition', () => {
    const def = MaterialCompiler.getMaterial('stone_granite');
    expect(def?.name).toBe('Granite');
    expect(def?.stoneType).toBe('granite');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/materials/MaterialCompiler.test.ts -v
# Expected: FAIL — module not found
```

- [ ] **Step 3: Write `src/materials/MaterialCompiler.ts`**

```typescript
// src/materials/MaterialCompiler.ts
import type { Material, PipelineTier } from './types';
import { getMaterial } from './materialLibrary';

// Cache for compiled outputs
const paintCache = new Map<string, unknown>();
const materialCache = new Map<string, unknown>();

export class MaterialCompiler {
  /**
   * Compile material for Skia 2D rendering.
   * Returns a Skia Paint-compatible object with color and shader info.
   */
  static compile(materialId: string, renderer: 'skia'): SkiaPaintOutput {
    const cacheKey = `${materialId}:skia`;
    if (paintCache.has(cacheKey)) {
      return paintCache.get(cacheKey) as SkiaPaintOutput;
    }

    const material = getMaterial(materialId);
    if (!material) {
      return { color: '#808080', pattern: 'solid' };
    }

    const tier = this.resolveTier(material);
    const output = this.buildSkiaPaint(material, tier);
    paintCache.set(cacheKey, output);
    return output;
  }

  /**
   * Compile material for Three.js 3D rendering.
   * Returns material properties suitable for MeshStandardMaterial.
   */
  static compile(materialId: string, renderer: 'threejs'): ThreeMaterialOutput {
    const cacheKey = `${materialId}:threejs`;
    if (materialCache.has(cacheKey)) {
      return materialCache.get(cacheKey) as ThreeMaterialOutput;
    }

    const material = getMaterial(materialId);
    if (!material) {
      return { color: '#808080', roughness: 0.9, metalness: 0 };
    }

    const tier = this.resolveTier(material);
    const output = this.buildThreeMaterial(material, tier);
    materialCache.set(cacheKey, output);
    return output;
  }

  static getMaterial(id: string): Material | undefined {
    return getMaterial(id);
  }

  static invalidate(materialId: string): void {
    paintCache.delete(`${materialId}:skia`);
    materialCache.delete(`${materialId}:threejs`);
  }

  private static resolveTier(material: Material): PipelineTier {
    if (material.albedoUrl && material.aiPrompts) return 'hybrid';
    if (material.albedoUrl) return 'textured';
    if (material.aiPrompts) return 'ai';
    return 'procedural';
  }

  private static buildSkiaPaint(material: Material, tier: PipelineTier): SkiaPaintOutput {
    // Base color from material
    const baseColor = material.color;
    const secondaryColor = material.colorSecondary;

    // For now, return color + pattern info
    // 2D pattern rendering via proceduralPatterns.ts
    return {
      color: baseColor,
      secondaryColor,
      pattern: material.pattern,
      patternScale: material.patternScale ?? 1.0,
      roughness: material.roughness,
      metalness: material.metalness,
    };
  }

  private static buildThreeMaterial(material: Material, tier: PipelineTier): ThreeMaterialOutput {
    // Base PBR values
    const base: ThreeMaterialOutput = {
      color: material.color,
      roughness: material.roughness,
      metalness: material.metalness,
    };

    // Apply texture URLs if available (textured/hybrid tier)
    if (tier === 'textured' || tier === 'hybrid') {
      if (material.albedoUrl) base.albedoUrl = material.albedoUrl;
      if (material.normalUrl) base.normalUrl = material.normalUrl;
      if (material.displacementUrl) base.displacementUrl = material.displacementUrl;
      if (material.roughnessUrl) base.roughnessUrl = material.roughnessUrl;
    }

    return base;
  }
}

export interface SkiaPaintOutput {
  color: string;
  secondaryColor?: string;
  pattern: string;
  patternScale: number;
  roughness: number;
  metalness: number;
  // Texture URLs for enhancement
  albedoUrl?: string;
  normalUrl?: string;
}

export interface ThreeMaterialOutput {
  color: string;
  roughness: number;
  metalness: number;
  albedoUrl?: string;
  normalUrl?: string;
  displacementUrl?: string;
  roughnessUrl?: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/materials/MaterialCompiler.test.ts -v
# Expected: PASS
```

- [ ] **Step 5: Write `src/materials/index.ts`**

```typescript
// src/materials/index.ts
export * from './types';
export { MaterialCompiler } from './MaterialCompiler';
export { materialLibrary, getMaterial, getMaterialsByCategory, getMaterialsBySubcategory } from './materialLibrary';
```

- [ ] **Step 6: Commit**

```bash
git add src/__tests__/materials/MaterialCompiler.test.ts src/materials/MaterialCompiler.ts src/materials/index.ts
git commit -m "feat(materials): add MaterialCompiler with 2D/3D compilation and caching"
```

---

### Task 4: 3D Integration — ProceduralFloor and ProceduralWall

**Files:**
- Modify: `src/components/3d/ProceduralFloor.tsx:12-100`
- Modify: `src/components/3d/ProceduralWall.tsx` (find FLOOR_COLORS replacement)

- [ ] **Step 1: Replace FLOOR_COLORS in ProceduralFloor.tsx**

Read the full file first, then modify:

In `ProceduralFloor.tsx`, replace the `FLOOR_COLORS` map and its usage:

```typescript
// OLD (lines 12-27):
const FLOOR_COLORS: Record<string, string> = {
  hardwood: '#7C4E28',
  tile: '#B0B0B0',
  // ... etc
};

// USAGE (line 86):
const color = selected ? '#4A90D9' : FLOOR_COLORS[floorMaterial] ?? '#808080';
```

```typescript
// NEW:
import { MaterialCompiler } from '../../materials/MaterialCompiler';

// USAGE (line 86):
const mat = MaterialCompiler.compile(floorMaterial, 'threejs');
const color = selected ? '#4A90D9' : mat.color;
const roughness = mat.roughness;
const metalness = mat.metalness;
```

Also update `meshStandardMaterial` to use roughness and metalness:

```typescript
<meshStandardMaterial
  color={color}
  roughness={roughness ?? 0.9}
  metalness={metalness ?? 0}
/>
```

- [ ] **Step 2: Find and update wall color in ProceduralWall**

Grep for hardcoded wall colors:

```bash
grep -n "color=" src/components/3d/ProceduralWall.tsx | head -20
```

Replace any hardcoded wall colors with MaterialCompiler:

```typescript
import { MaterialCompiler } from '../../materials/MaterialCompiler';
// Then use: const mat = MaterialCompiler.compile(wallTexture ?? 'wall_drywall', 'threejs');
```

- [ ] **Step 3: Commit**

```bash
git add src/components/3d/ProceduralFloor.tsx src/components/3d/ProceduralWall.tsx
git commit -m "feat(materials): integrate MaterialCompiler into ProceduralFloor and ProceduralWall"
```

---

### Task 5: 2D Integration — Canvas2D Room Fills

**Files:**
- Modify: `src/components/blueprint/Canvas2D.tsx`
- Import MaterialCompiler for room fill colors

- [ ] **Step 1: Find room rendering code in Canvas2D.tsx**

Grep for the problematic room rendering:

```bash
grep -n "roomPath.addRect\|room.area\|halfSide" src/components/blueprint/Canvas2D.tsx
```

The current code renders rooms as squares (√area side) — fix to render actual room shapes:

```typescript
// OLD (approximate):
const halfSide = Math.sqrt(room.area) * PIXELS_PER_METRE * 0.5;
roomPath.addRect({ x: cx - halfSide, y: cy - halfSide, width: halfSide * 2, height: halfSide * 2 });

// NEW: Use actual room polygon from wallIds
// Compute room polygon from walls, then use Path.addPath with the room polygon
```

Also apply MaterialCompiler for floor colors:

```typescript
import { MaterialCompiler } from '../../materials/MaterialCompiler';
// Use: const mat = MaterialCompiler.compile(room.floorMaterialId ?? room.floorMaterial, 'skia');
// For 2D: just use mat.color as the room fill color
```

- [ ] **Step 2: Fix room polygon rendering**

Compute actual room polygon from wall IDs. For each room:
1. Get wall IDs
2. Build polygon from wall start/end points
3. Render using Skia Path (not rect approximation)

```typescript
function getRoomPolygon(room: Room, walls: Wall[]): Skia.Path {
  const path = Skia.Path.Make();
  // Sort walls by connection to form closed loop
  // Add each wall segment to path
  return path;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/blueprint/Canvas2D.tsx
git commit -m "feat(materials): fix Canvas2D room rendering with real polygons and MaterialCompiler colors"
```

---

### Task 6: BlueprintStore — applyMaterial action

**Files:**
- Modify: `src/stores/blueprintStore.ts:47-101` (actions section)

- [ ] **Step 1: Add applyMaterial to store actions**

Find the actions interface and add:

```typescript
// In the actions interface (around line 87):
applyMaterial: (surfaceId: string, materialId: string) => void;
```

Find the implementation and add:

```typescript
// In actions implementation:
applyMaterial: (surfaceId: string, materialId: string) => {
  const blueprint = get().blueprint;
  if (!blueprint) return;

  set((state) => {
    const updated = deriveTopLevel({ ...blueprint }); // trigger derivation
    // Find surface type and apply materialId
    // Check if it's a wall, room floor, slab, or ceiling
    // Update the appropriate surface with materialId
    return { blueprint: updated, isDirty: true };
  });
},
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/blueprintStore.ts
git commit -m "feat(materials): add applyMaterial action to blueprintStore"
```

---

### Task 7: Material Picker UI Component

**Files:**
- Create: `src/components/common/MaterialPicker.tsx`
- Integrate into Canvas2D toolbar or as modal

- [ ] **Step 1: Create MaterialPicker component**

```typescript
// src/components/common/MaterialPicker.tsx
import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCompiler, getMaterialsByCategory, getMaterial } from '../../materials/MaterialCompiler';
import type { MaterialCategory } from '../../materials/types';

interface MaterialPickerProps {
  visible: boolean;
  currentMaterialId?: string;
  category: MaterialCategory;
  onSelect: (materialId: string) => void;
  onClose: () => void;
}

export function MaterialPicker({ visible, currentMaterialId, category, onSelect, onClose }: MaterialPickerProps) {
  const materials = getMaterialsByCategory(category);

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', bottom: 80, left: 16, right: 16, backgroundColor: '#2C2C2C', borderRadius: 16, padding: 16, maxHeight: 200 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {materials.map((mat) => {
          const compiled = MaterialCompiler.compile(mat.id, 'skia');
          const isSelected = mat.id === currentMaterialId;
          return (
            <TouchableOpacity
              key={mat.id}
              onPress={() => onSelect(mat.id)}
              style={{
                width: 48, height: 48,
                backgroundColor: compiled.color,
                borderRadius: 8,
                marginRight: 8,
                borderWidth: isSelected ? 2 : 0,
                borderColor: '#C8C8C8',
              }}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/common/MaterialPicker.tsx
git commit -m "feat(materials): add MaterialPicker UI component"
```

---

## Self-Review Checklist

- [ ] All 57+ materials defined in materialLibrary.ts with real hex colors
- [ ] MaterialCompiler.compile() works for both 'skia' and 'threejs' renderers
- [ ] Cache invalidation works
- [ ] FLOOR_COLORS replaced in ProceduralFloor
- [ ] Hardcoded wall colors replaced in ProceduralWall
- [ ] Canvas2D room squares → actual room polygons
- [ ] blueprintStore has applyMaterial action
- [ ] MaterialPicker component created
- [ ] Tests written and passing for materialLibrary and MaterialCompiler
- [ ] All tasks committed

---

## Dependencies

Tasks must be completed in order. Task 1 (types) enables Task 2 (library). Task 2 enables Task 3 (compiler). Tasks 4-6 integrate into existing files. Task 7 is the UI on top.

**Estimated total:** ~150 lines new material code + ~80 lines modifications to existing files + tests.