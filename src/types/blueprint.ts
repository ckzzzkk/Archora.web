export type ClimateZone = 'tropical' | 'subtropical' | 'temperate' | 'arid' | 'cold' | 'alpine';

export interface SimulationReport {
  overall: number;
  structural: number;
  weather: number;
  flow: number;
  codeCompliance: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  strengths: string[];
  recommendations: Array<{
    category: 'structural' | 'weather' | 'flow' | 'code';
    severity: 'critical' | 'major' | 'minor';
    issue: string;
    fix: string;
  }>;
  weatherProfile: {
    solarGain: 'excellent' | 'good' | 'fair' | 'poor';
    windResistance: 'excellent' | 'good' | 'fair' | 'poor';
    rainProtection: 'excellent' | 'good' | 'fair' | 'poor';
    thermalMass: 'excellent' | 'good' | 'fair' | 'poor';
  };
  structuralProfile: {
    loadPath: 'excellent' | 'good' | 'fair' | 'poor';
    spanIntegrity: 'excellent' | 'good' | 'fair' | 'poor';
    foundationFit: 'excellent' | 'good' | 'fair' | 'poor';
    shearWalls: 'excellent' | 'good' | 'fair' | 'poor';
  };
  generatedAt: string;
  available?: boolean;
  error?: string;
}

export type RoomType =
  | 'bedroom' | 'bathroom' | 'kitchen' | 'living_room'
  | 'dining_room' | 'hallway' | 'garage' | 'office'
  | 'laundry' | 'storage' | 'balcony';

export type OpeningType = 'door' | 'window' | 'sliding_door' | 'french_door' | 'skylight';

export type MaterialType =
  // Legacy
  | 'hardwood' | 'tile' | 'carpet' | 'concrete'
  | 'marble' | 'vinyl' | 'stone' | 'parquet'
  | 'oak' | 'walnut' | 'pine' | 'engineered_wood' | 'laminate'
  | 'polished_concrete' | 'resin' | 'travertine' | 'slate'
  | 'ceramic' | 'porcelain' | 'terrazzo' | 'cork' | 'bamboo'
  | 'herringbone_parquet' | 'chevron_parquet' | 'rubber'
  // Extended hardwoods
  | 'oak_hardwood' | 'walnut_hardwood' | 'pine_hardwood'
  | 'maple_hardwood' | 'dark_hardwood' | 'bleached_oak'
  | 'herringbone_oak' | 'chevron_oak'
  // Engineered / laminate
  | 'engineered_light' | 'engineered_dark'
  | 'laminate_light' | 'laminate_dark'
  // Concrete / resin
  | 'raw_concrete'
  // Stone / marble
  | 'white_marble' | 'grey_marble' | 'black_marble' | 'sandstone'
  // Ceramic
  | 'white_ceramic' | 'grey_ceramic' | 'black_ceramic'
  | 'encaustic_tiles' | 'hexagon_tiles'
  // Soft
  | 'carpet_grey' | 'carpet_cream'
  // Specialty
  | 'rubber_floor';

export type WallTexture =
  // Plain colours
  | 'plain_white' | 'plain_cream' | 'plain_warm_grey' | 'plain_cool_grey'
  | 'plain_grey' | 'plain_charcoal' | 'plain_navy' | 'plain_forest_green'
  | 'plain_terracotta' | 'plain_blush_pink' | 'plain_sage' | 'plain_mustard' | 'plain_black'
  // Brick
  | 'exposed_brick' | 'exposed_brick_grey' | 'painted_brick' | 'whitewashed_brick'
  // Concrete
  | 'concrete' | 'polished_concrete' | 'concrete_board_formed'
  // Stone / marble
  | 'marble' | 'marble_white' | 'marble_grey' | 'marble_black'
  | 'travertine' | 'limestone' | 'sandstone' | 'stone' | 'stone_random' | 'stone_coursed'
  // Plaster / render
  | 'render' | 'render_white' | 'render_grey' | 'textured_plaster'
  // Wood
  | 'wood_panelling' | 'wood_panelling_light' | 'wood_panelling_dark'
  | 'shiplap' | 'shiplap_white' | 'shiplap_grey'
  | 'board_and_batten' | 'board_and_batten_white' | 'board_and_batten_black'
  | 'timber_cladding' | 'cedar_cladding'
  // Tile
  | 'subway_tiles' | 'subway_tiles_grey' | 'geometric_tiles'
  | 'herringbone_tiles' | 'moroccan_tiles' | 'terrazzo_tiles'
  // Glass / metal
  | 'glass' | 'glass_frosted' | 'mirror_panels' | 'stainless_steel'
  // Wallpaper
  | 'wallpaper_stripe' | 'wallpaper_geometric' | 'wallpaper_floral' | 'wallpaper_textured'
  // Natural
  | 'bamboo_wall' | 'cork_wall';

export type CeilingType =
  | 'flat_white' | 'flat_dark' | 'coffered' | 'tray' | 'vaulted'
  | 'exposed_beams' | 'concrete' | 'wood_planks'
  | 'acoustic_panels' | 'barrel_vault' | 'dropped';

export interface Ceiling {
  id: string;
  polygon: [number, number][];    // [x, z][] boundary
  holes: [number, number][][];      // cutout holes
  holeMetadata: { source: 'manual' | 'stair' | 'opening'; id?: string }[];
  height: number;                  // ceiling height in metres (from floor)
  ceilingType: CeilingType;        // 'flat_white' | 'flat_dark' | 'coffered' | 'tray' | 'vaulted' | 'exposed_beams' | 'concrete' | 'wood_planks' | 'acoustic_panels' | 'barrel_vault' | 'dropped'
  autoFromWalls: boolean;          // compute polygon from enclosing walls
}

export type ExteriorFinish =
  | 'brick' | 'render' | 'stone' | 'timber_cladding'
  | 'metal_cladding' | 'glass_facade' | 'concrete' | 'stucco';

export interface Vector2D { x: number; y: number; }
export interface Vector3D { x: number; y: number; z: number; }

export interface Wall {
  id: string;
  start: Vector2D;
  end: Vector2D;
  thickness: number;
  height: number;
  texture?: WallTexture;
  exteriorFinish?: ExteriorFinish;
  isLoadbearing?: boolean;
  material?: string;
  /** Curve offset for curved walls (arc deviation in metres) */
  curveOffset?: number;
}

export interface Opening {
  id: string;
  wallId: string;
  type: OpeningType;
  position: number;
  width: number;
  height: number;
  sillHeight: number;
  style?: string;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  wallIds: string[];
  floorMaterial: MaterialType;
  ceilingHeight: number;
  ceilingType?: CeilingType;
  area: number;
  centroid: Vector2D;
  naturalLightRating?: string;
  ventilationRating?: string;
}

export interface FurniturePiece {
  id: string;
  name: string;
  category: string;
  roomId: string;
  position: Vector3D;
  rotation: Vector3D;
  dimensions: Vector3D;
  procedural: boolean;
  meshUrl?: string;
  materialOverride?: string;
  /** Controls color/material presets — default | modern | rustic | mid_century | industrial | luxury */
  styleVariant?: string;
  /** Controls shape sub-type — e.g. sofa has standard | classic | modern | sleeper */
  modelVariant?: string;
  isCustom?: boolean;
  thumbnailUrl?: string;
}

export interface CustomAsset {
  id: string;
  name: string;
  prompt: string;
  style: string;
  meshUrl?: string;
  textureUrl?: string;
  thumbnailUrl?: string;
  dimensions: Vector3D;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface BuildingMetadata {
  style: string;
  buildingType: 'house' | 'apartment' | 'office' | 'studio' | 'villa';
  totalArea: number;
  roomCount: number;
  generatedFrom: string;
  enrichedPrompt?: string;
  simulationReport?: SimulationReport;
  structuralNotes?: string[];
  architectInfluence?: string;
}

export type StaircaseType = 'straight' | 'l_shape' | 'spiral';

export interface StairSegment {
  id: string;
  segmentType: 'stair' | 'landing';
  width: number;
  length: number;
  height: number;
  stepCount: number;
  attachmentSide?: 'front' | 'left' | 'right';
  thickness: number;
  fillToFloor: boolean;
}

export interface StaircaseData {
  id: string;
  type: StaircaseType;
  position: Vector2D;
  connectsFloors: [number, number];
  width?: number;              // stair width in metres (default 0.9)
  totalRise?: number;          // total rise height in metres (default 3.0)
  stepCount?: number;          // number of steps (default 12)
  thickness?: number;          // tread/thickness in metres (default 0.025)
  fillToFloor?: boolean;       // fill void below stairs (default true)
  innerRadius?: number;        // for curved/spiral: inner radius (default 0.3)
  sweepAngle?: number;         // for curved: total sweep in radians (default PI/2)
  railingMode?: 'none' | 'left' | 'right' | 'both';  // default 'left'
  railingHeight?: number;      // railing height in metres (default 0.9)
  slabOpeningMode?: 'none' | 'below' | 'above' | 'both';  // default 'below'
  children?: string[];         // StairSegmentId[] for multi-segment stairs
}

export interface ElevatorData {
  id: string;
  position: Vector2D;
  servesFloors: number[];
}

export interface Roof {
  id: string;
  position: Vector3D;       // [x, y, z] world position
  rotation: number;         // Y-axis rotation in radians
  children: string[];      // RoofSegmentId[] — segments belonging to this roof
  style?: string;          // material/style hint
}

export interface RoofSegment {
  id: string;
  roofType: 'hip' | 'gable' | 'shed' | 'gambrel' | 'dutch' | 'mansard' | 'flat';
  width: number;           // X dimension in metres
  depth: number;           // Z dimension in metres
  wallHeight: number;      // top of wall height (where roof starts)
  roofHeight: number;      // peak height above wall top
  wallThickness: number;  // for overhang computation
  deckThickness: number;  // roof deck thickness
  overhang: number;       // overhang beyond wall face
  shingleThickness: number; // shingle layer thickness
}

export interface RoofMesh {
  id: string;
  roofId: string;          // parent roof
  materialGroup: number;   // which material group (0=wall, 1=edge, 2=inner void, 3=top/shingle)
}

export interface Slab {
  id: string;
  polygon: [number, number][];  // [x, z][] pairs forming closed polygon
  holes: [number, number][][];   // array of hole polygons [x, z][]
  holeMetadata: { source: 'manual' | 'stair' | 'opening'; id?: string }[];
  elevation: number;             // height above floor level in metres (default 0.05)
  autoFromWalls: boolean;       // auto-compute polygon from enclosing wall loop
}

export interface FloorData {
  id: string;
  label: string;         // 'B2' | 'B1' | 'G' | '1' | '2' ...
  index: number;         // 0 = ground, negative = basement
  walls: Wall[];
  rooms: Room[];
  openings: Opening[];
  furniture: FurniturePiece[];
  staircases: StaircaseData[];
  elevators: ElevatorData[];
  slabs: Slab[];
  ceilings: Ceiling[];
  roofs: Roof[];
  roofSegments: RoofSegment[];
}

export interface BlueprintData {
  id: string;
  version: number;
  metadata: BuildingMetadata;
  floors: FloorData[];          // canonical multi-floor storage
  // Top-level flat fields mirror the active floor — kept for renderer backward compat
  walls: Wall[];
  rooms: Room[];
  openings: Opening[];
  furniture: FurniturePiece[];
  customAssets: CustomAsset[];
  chatHistory: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  simulationReport?: SimulationReport;
}

export type SceneObjectType = 'wall' | 'room' | 'opening' | 'furniture';

export interface SceneObject {
  id: string;
  type: SceneObjectType;
  data: Wall | Room | Opening | FurniturePiece;
  selected: boolean;
  locked: boolean;
}
