/**
 * useRegistry.ts
 *
 * R3F hook that registers a mesh with the sceneRegistry.
 * Uses useLayoutEffect so registration happens synchronously
 * before paint — critical for O(1) lookup correctness.
 *
 * Usage:
 *   const ref = useRef<THREE.Mesh>(null);
 *   useRegistry(nodeId, 'wall', ref);
 *   return <mesh ref={ref}>...</mesh>;
 */

import { useLayoutEffect } from 'react';
import type * as THREE from 'three';
import { sceneRegistry, type SceneNodeType } from '../utils/sceneRegistry';

export function useRegistry(
  id: string,
  type: SceneNodeType,
  ref: React.RefObject<THREE.Object3D>,
): void {
  useLayoutEffect(() => {
    const obj = ref.current;
    if (!obj) return;

    // Add to master map
    sceneRegistry.nodes.set(id, obj);

    // Add to type-specific set
    sceneRegistry.byType[type]?.add(id);

    return () => {
      sceneRegistry.nodes.delete(id);
      sceneRegistry.byType[type]?.delete(id);
    };
  }, [id, type, ref]);
}