import * as THREE from 'three';
import type { FurnitureType } from './furniture';

/**
 * Shared Three.js material definitions for the 3D scene.
 * Used by furniture components and building elements.
 */
export const MATERIALS = {
  oak_wood: new THREE.MeshStandardMaterial({
    color: 0xB8865A,
    roughness: 0.7,
    metalness: 0.0,
  }),
  walnut_wood: new THREE.MeshStandardMaterial({
    color: 0x5C3A1E,
    roughness: 0.6,
    metalness: 0.0,
  }),
  white_painted: new THREE.MeshStandardMaterial({
    color: 0xF5F5F0,
    roughness: 0.9,
    metalness: 0.0,
  }),
  concrete: new THREE.MeshStandardMaterial({
    color: 0x9E9E9E,
    roughness: 0.95,
    metalness: 0.0,
  }),
  marble_white: new THREE.MeshStandardMaterial({
    color: 0xF0EDE8,
    roughness: 0.1,
    metalness: 0.1,
  }),
  brushed_steel: new THREE.MeshStandardMaterial({
    color: 0xC0C0C0,
    roughness: 0.3,
    metalness: 0.9,
  }),
  black_leather: new THREE.MeshStandardMaterial({
    color: 0x1A1A1A,
    roughness: 0.8,
    metalness: 0.0,
  }),
  grey_fabric: new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 1.0,
    metalness: 0.0,
  }),
  glass: new THREE.MeshStandardMaterial({
    color: 0xADD8E6,
    roughness: 0.0,
    metalness: 0.0,
    transparent: true,
    opacity: 0.3,
  }),
  brass: new THREE.MeshStandardMaterial({
    color: 0xB5A642,
    roughness: 0.4,
    metalness: 0.8,
  }),
} as const;

export type MaterialKey = keyof typeof MATERIALS;

/** Returns a clone of the named material (safe to mutate per-instance). */
export function getMaterial(key: MaterialKey): THREE.MeshStandardMaterial {
  return MATERIALS[key].clone();
}

/** Maps furniture categories to sensible default materials. */
export function getMaterialForFurnitureType(type: FurnitureType): MaterialKey {
  if (
    ['sofa', 'curved_sofa', 'l_sofa', 'sectional_sofa', 'chair', 'bar_stool',
     'garden_sofa_set', 'garden_bench', 'sun_lounger'].includes(type)
  ) return 'grey_fabric';

  if (
    ['dining_table', 'round_dining_table', 'oval_dining_table', 'desk', 'coffee_table',
     'bookshelf', 'full_wall_bookcase', 'home_office_desk', 'corner_desk',
     'modular_shelving', 'vanity_desk'].includes(type)
  ) return 'oak_wood';

  if (
    ['bed_double', 'bed_single', 'king_bed', 'platform_bed', 'bunk_bed',
     'crib', 'toddler_bed'].includes(type)
  ) return 'white_painted';

  if (
    ['wardrobe', 'walk_in_wardrobe', 'kitchen_counter', 'kitchen_island',
     'kitchen_island_seating'].includes(type)
  ) return 'white_painted';

  if (
    ['bathtub', 'freestanding_bath', 'corner_bath', 'bathroom_sink', 'toilet'].includes(type)
  ) return 'marble_white';

  if (
    ['floor_lamp', 'pendant_light', 'outdoor_light_post'].includes(type)
  ) return 'brushed_steel';

  if (
    ['tv_media_unit', 'floating_tv_shelf', 'fireplace_unit', 'electric_fireplace'].includes(type)
  ) return 'concrete';

  if (
    ['room_divider', 'changing_table', 'dining_chair'].includes(type)
  ) return 'oak_wood';

  return 'white_painted';
}
