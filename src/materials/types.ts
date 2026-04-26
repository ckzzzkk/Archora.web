export type MaterialCategory = 'floor' | 'wall' | 'ceiling' | 'roof' | 'furniture';
export type PatternType = 'solid' | 'herringbone' | 'grid' | 'stripe' | 'chevron' | 'parquet' | 'strip';
export type WoodSpecies = 'red_oak' | 'white_oak' | 'walnut' | 'maple' | 'cherry' | 'mahogany' | 'teak' | 'ash' | 'hickory' | 'pine';
export type WoodCut = 'plain_sawn' | 'quarter_sawn' | 'rift_sawn';
export type WoodFinish = 'matte' | 'satin' | 'semi_gloss' | 'glossy' | 'distressed';
export type StoneType = 'granite' | 'marble' | 'limestone' | 'slate' | 'travertine' | 'quartzite' | 'onyx' | 'sandstone';
export type StoneFinish = 'polished' | 'honed' | 'leathered' | 'brushed' | 'tumbled' | 'natural_cleft';
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
