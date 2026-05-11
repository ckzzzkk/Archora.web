/**
 * useDirtyProcessor.ts
 *
 * useFrame-based dirty batching hook.
 *
 * Each frame, reads dirtyNodes from blueprintStore, looks up each mesh via
 * sceneRegistry, calls the registered updateGeometryFn, then clears the dirty flag.
 *
 * Throttled: processes at most MAX_UPDATES_PER_FRAME dirty nodes per frame
 * (~60 FPS → ~60 updates/frame cap). Remaining dirty nodes wait for next frame.
 *
 * The geometry update logic is pluggable — pass an updateGeometryFn via ref.
 * This keeps the hook decoupled from specific geometry implementations.
 *
 * Usage:
 *   const updateFnRef = useRef<(nodeId: string, mesh: THREE.Object3D) => void>(
 *     (nodeId, mesh) => { /* update mesh geometry *\/ }
 *   );
 *   useDirtyProcessor(updateFnRef);
 */

import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';

import { sceneRegistry } from '../utils/sceneRegistry';
import { useBlueprintStore } from '../stores/blueprintStore';

const MAX_UPDATES_PER_FRAME = 60;

export function useDirtyProcessor(
  updateGeometryFnRef: React.MutableRefObject<
    ((nodeId: string, mesh: THREE.Object3D) => void) | null
  >,
): void {
  useFrame(() => {
    const dirtyNodes = useBlueprintStore.getState().dirtyNodes;
    if (!dirtyNodes || dirtyNodes.length === 0) return;

    const updateFn = updateGeometryFnRef.current;
    if (!updateFn) return;

    // Take at most MAX_UPDATES_PER_FRAME dirty IDs this frame
    const toProcess = Array.from(dirtyNodes).slice(0, MAX_UPDATES_PER_FRAME);

    for (const nodeId of toProcess) {
      const mesh = sceneRegistry.nodes.get(nodeId);
      if (!mesh) {
        // Mesh not yet registered or already removed — just clear dirty
        useBlueprintStore.getState().actions.clearDirty(nodeId);
        continue;
      }

      try {
        updateFn(nodeId, mesh);
      } catch (err) {
        console.warn(`[useDirtyProcessor] updateGeometryFn failed for node ${nodeId}:`, err);
      }

      useBlueprintStore.getState().actions.clearDirty(nodeId);
    }
  });
}