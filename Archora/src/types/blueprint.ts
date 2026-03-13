export type RoomType =
  | 'bedroom' | 'bathroom' | 'kitchen' | 'living_room'
  | 'dining_room' | 'hallway' | 'garage' | 'office'
  | 'laundry' | 'storage' | 'balcony';

export type OpeningType = 'door' | 'window' | 'sliding_door' | 'french_door' | 'skylight';

export type MaterialType =
  | 'hardwood' | 'tile' | 'carpet' | 'concrete'
  | 'marble' | 'vinyl' | 'stone' | 'parquet'
  | 'oak' | 'walnut' | 'pine' | 'engineered_wood' | 'laminate'
  | 'polished_concrete' | 'resin' | 'travertine' | 'slate'
  | 'ceramic' | 'porcelain' | 'terrazzo' | 'cork' | 'bamboo'
  | 'herringbone_parquet' | 'chevron_parquet' | 'rubber';

export type WallTexture =
  | 'plain_white' | 'plain_grey' | 'plain_charcoal'
  | 'exposed_brick' | 'painted_brick' | 'concrete' | 'polished_concrete'
  | 'marble' | 'stone' | 'render' | 'textured_plaster'
  | 'wood_panelling' | 'shiplap' | 'board_and_batten'
  | 'glass' | 'mirror_panels'
  | 'geometric_tiles' | 'subway_tiles' | 'herringbone_tiles' | 'terrazzo_tiles'
  | 'wallpaper_stripe' | 'wallpaper_geometric' | 'wallpaper_floral';

export type CeilingType =
  | 'flat_white' | 'flat_dark' | 'coffered' | 'tray' | 'vaulted'
  | 'exposed_beams' | 'concrete' | 'wood_planks'
  | 'acoustic_panels' | 'barrel_vault' | 'dropped';

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
}

export interface BlueprintData {
  id: string;
  version: number;
  metadata: BuildingMetadata;
  walls: Wall[];
  rooms: Room[];
  openings: Opening[];
  furniture: FurniturePiece[];
  customAssets: CustomAsset[];
  chatHistory: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type SceneObjectType = 'wall' | 'room' | 'opening' | 'furniture';

export interface SceneObject {
  id: string;
  type: SceneObjectType;
  data: Wall | Room | Opening | FurniturePiece;
  selected: boolean;
  locked: boolean;
}
