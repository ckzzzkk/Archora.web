import * as THREE from 'three';
import type { BlueprintData } from '../../types';

/** Camera presets for different view modes */
export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export function computeOrbitPreset(blueprint: BlueprintData): CameraPreset {
  // Find bounding box of all walls
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const wall of blueprint.walls) {
    minX = Math.min(minX, wall.start.x, wall.end.x);
    maxX = Math.max(maxX, wall.start.x, wall.end.x);
    minZ = Math.min(minZ, wall.start.y, wall.end.y);
    maxZ = Math.max(maxZ, wall.start.y, wall.end.y);
  }

  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const span = Math.max(maxX - minX, maxZ - minZ, 4);
  const camDist = span * 0.9;

  return {
    position: [cx + camDist * 0.6, camDist * 0.6, cz + camDist * 0.6],
    target: [cx, 0, cz],
    fov: 45,
  };
}

export function computeFirstPersonPreset(blueprint: BlueprintData): CameraPreset {
  // Start at the centroid of the first room, eye-level
  const room = blueprint.rooms[0];
  const cx = room?.centroid.x ?? 0;
  const cz = room?.centroid.y ?? 0;

  return {
    position: [cx, 1.65, cz], // average eye height
    target: [cx + 1, 1.65, cz],
    fov: 75,
  };
}

/** Build a simple ambient + directional lighting setup */
export interface LightingConfig {
  ambientIntensity: number;
  ambientColor: string;
  sunPosition: [number, number, number];
  sunIntensity: number;
  sunColor: string;
  fillPosition: [number, number, number];
  fillIntensity: number;
}

export const DEFAULT_LIGHTING: LightingConfig = {
  ambientIntensity: 0.4,
  ambientColor: '#ffffff',
  sunPosition: [8, 10, 6],
  sunIntensity: 1.2,
  sunColor: '#FFF5E0',
  fillPosition: [-6, 4, -4],
  fillIntensity: 0.3,
};

/** Grid helper dimensions based on blueprint */
export function gridDimensions(blueprint: BlueprintData): { size: number; divisions: number } {
  let maxExtent = 10;
  for (const wall of blueprint.walls) {
    maxExtent = Math.max(maxExtent, Math.abs(wall.start.x), Math.abs(wall.end.x), Math.abs(wall.start.y), Math.abs(wall.end.y));
  }
  const size = Math.ceil(maxExtent * 2 / 5) * 5;
  return { size, divisions: size };
}

/** Parse a colour string to a normalised THREE.Color compatible hex */
export function parseColor(color: string | undefined, fallback: string): string {
  if (!color) return fallback;
  // Accept hex with or without #
  if (/^[0-9A-Fa-f]{6}$/.test(color)) return `#${color}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color;
  return fallback;
}

/** Simple screenshot helper — returns base64 PNG */
export function captureSnapshot(gl: THREE.WebGLRenderer): string {
  return gl.domElement.toDataURL('image/png');
}
