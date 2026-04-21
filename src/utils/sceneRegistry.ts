/**
 * sceneRegistry.ts
 *
 * Global singleton registry for 3D meshes — O(1) lookup by node ID.
 * Provides both a master Map (nodes) and type-indexed Sets (byType)
 * for batch operations.
 *
 * Exported as a plain object — no React dependency.
 */

import type * as THREE from 'three';

export type SceneNodeType = 'wall' | 'room' | 'opening' | 'furniture' | 'floor' | 'staircase' | 'elevator';

export const sceneRegistry = {
  // Master lookup: nodeId → THREE.Object3D
  nodes: new Map<string, THREE.Object3D>(),

  // Categorized lookups: type → Set of node IDs
  byType: {
    wall: new Set<string>(),
    room: new Set<string>(),
    opening: new Set<string>(),
    furniture: new Set<string>(),
    floor: new Set<string>(),
    staircase: new Set<string>(),
    elevator: new Set<string>(),
  } as Record<SceneNodeType, Set<string>>,

  /** Remove all entries. Call on scene unload to prevent stale 3D refs. */
  clear() {
    this.nodes.clear();
    for (const set of Object.values(this.byType)) {
      set.clear();
    }
  },
};

export type SceneRegistry = typeof sceneRegistry;