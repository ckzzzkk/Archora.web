/**
 * GltfFurniture — R3F component that loads and renders a GLTF mesh from a URL.
 * Used for VIGA-reconstructed furniture meshes stored in Supabase Storage.
 */
import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei/native';
import type { Group, Mesh } from 'three';

interface GltfFurnitureProps {
  /** GLTF URL from Supabase Storage */
  url: string;
  /** Position in world space (metres) */
  position?: [number, number, number];
  /** Rotation around Y axis (radians) */
  rotation?: number;
  /** Uniform scale factor */
  scale?: number;
  selected?: boolean;
  onSelect?: () => void;
}

export function GltfFurniture({
  url,
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
  selected = false,
  onSelect,
}: GltfFurnitureProps) {
  const { scene } = useGLTF(url);

  const mesh = useMemo(() => {
    const group = scene.clone() as Group;

    group.scale.setScalar(scale);
    group.position.set(...position);
    group.rotation.y = rotation;

    group.traverse((child) => {
      if ((child as Mesh).isMesh) {
        (child as Mesh).userData.selected = selected;
      }
    });

    return group;
  }, [scene, position, rotation, scale, selected]);

  return <primitive object={mesh} onClick={onSelect} />;
}

/** Preload a GLTF at module level so it is cached before first render. */
export const preloadGltf = (url: string): void => {
  useGLTF.preload(url);
};
