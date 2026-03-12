export type RoomType =
  | 'bedroom' | 'bathroom' | 'kitchen' | 'living_room'
  | 'dining_room' | 'hallway' | 'garage' | 'office'
  | 'laundry' | 'storage' | 'balcony';

export type OpeningType = 'door' | 'window' | 'sliding_door' | 'french_door' | 'skylight';

export type MaterialType =
  | 'hardwood' | 'tile' | 'carpet' | 'concrete'
  | 'marble' | 'vinyl' | 'stone' | 'parquet';

export interface Vector2D { x: number; y: number; }
export interface Vector3D { x: number; y: number; z: number; }

export interface Wall {
  id: string;
  start: Vector2D;
  end: Vector2D;
  thickness: number; // metres, typically 0.2
  height: number;   // metres, min 2.4
}

export interface Opening {
  id: string;
  wallId: string;
  type: OpeningType;
  position: number; // distance along wall in metres
  width: number;
  height: number;
  sillHeight: number;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  wallIds: string[];
  floorMaterial: MaterialType;
  ceilingHeight: number; // min 2.4
  area: number;          // m²
  centroid: Vector2D;
}

export interface FurniturePiece {
  id: string;
  name: string;
  roomId: string;
  position: Vector3D;
  rotation: Vector3D;   // euler angles in radians
  dimensions: Vector3D; // width, height, depth in metres
  procedural: boolean;
  meshUrl?: string;
  materialOverride?: string;
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
