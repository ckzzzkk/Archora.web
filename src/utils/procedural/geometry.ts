import * as THREE from 'three';
import type { Wall, Room, FurniturePiece, Vector3D } from '../../types';

/** Convert blueprint Vector3D to a THREE.Vector3 */
export function toVec3(v: Vector3D): THREE.Vector3 {
  return new THREE.Vector3(v.x, v.y, v.z);
}

/** Build a box geometry for a wall segment */
export function buildWallGeometry(wall: { start: { x: number; y: number }; end: { x: number; y: number }; thickness: number; height: number }): {
  geometry: THREE.BoxGeometry;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  length: number;
} {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  const midX = (wall.start.x + wall.end.x) / 2;
  const midY = (wall.start.y + wall.end.y) / 2;

  const geometry = new THREE.BoxGeometry(length, wall.height, wall.thickness);
  const position = new THREE.Vector3(midX, wall.height / 2, midY);
  // Rotate around Y axis to align with wall direction (XZ plane in Three.js)
  const rotation = new THREE.Euler(0, -angle, 0);

  return { geometry, position, rotation, length };
}

/** Compute a floor plane for a room given its walls */
export function buildFloorGeometry(room: Room, walls: Wall[]): THREE.PlaneGeometry {
  // Approximate room as bounding box of its walls
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  const roomWalls = walls.filter((w) => room.wallIds.includes(w.id));
  for (const w of roomWalls) {
    minX = Math.min(minX, w.start.x, w.end.x);
    maxX = Math.max(maxX, w.start.x, w.end.x);
    minY = Math.min(minY, w.start.y, w.end.y);
    maxY = Math.max(maxY, w.start.y, w.end.y);
  }

  const width = Math.max(maxX - minX, 0.5);
  const depth = Math.max(maxY - minY, 0.5);

  return new THREE.PlaneGeometry(width, depth);
}

/** Get floor center from room walls */
export function getRoomCenter(room: Room, walls: Wall[]): THREE.Vector3 {
  const roomWalls = walls.filter((w) => room.wallIds.includes(w.id));
  let sumX = 0, sumY = 0, count = 0;

  for (const w of roomWalls) {
    sumX += w.start.x + w.end.x;
    sumY += w.start.y + w.end.y;
    count += 2;
  }

  if (count === 0) return new THREE.Vector3(room.centroid.x, 0, room.centroid.y);
  return new THREE.Vector3(sumX / count, 0, sumY / count);
}

/** Convert 2D blueprint coordinates to 3D scene coordinates.
 *  Blueprint uses XY plane; Three.js uses XZ plane (Y is up). */
export function blueprintToScene(x: number, y: number, elevation = 0): THREE.Vector3 {
  return new THREE.Vector3(x, elevation, y);
}

/** Material colour palette for procedural furniture */
export const MATERIAL_COLORS: Record<string, string> = {
  hardwood: '#7C4E28',
  tile: '#B8B8B8',
  carpet: '#6A5A7A',
  concrete: '#787878',
  marble: '#D0C8C0',
  vinyl: '#908070',
  stone: '#605850',
  parquet: '#8C6030',
  // Furniture defaults
  sofa: '#4A5568',
  chair: '#718096',
  table: '#8B6914',
  bed: '#C8A882',
  wardrobe: '#5C4A2A',
  shelf: '#8B7355',
  white: '#F0EDE8',
  metal: '#9CA3AF',
};

/** Shared material cache to avoid creating duplicate materials */
const _matCache = new Map<string, THREE.MeshStandardMaterial>();

export function getSharedMaterial(color: string, roughness = 0.7, metalness = 0.1): THREE.MeshStandardMaterial {
  const key = `${color}:${roughness}:${metalness}`;
  if (!_matCache.has(key)) {
    _matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
  }
  return _matCache.get(key)!;
}

/** Dispose all cached materials (call on scene teardown) */
export function disposeMaterialCache(): void {
  _matCache.forEach((m) => m.dispose());
  _matCache.clear();
}

/** Compute bounding box dimensions for a furniture piece */
export function furnitureBounds(piece: FurniturePiece): { w: number; h: number; d: number } {
  return { w: piece.dimensions.x, h: piece.dimensions.y, d: piece.dimensions.z };
}
