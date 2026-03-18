import React, { useMemo } from 'react';
import { buildWallGeometry, getSharedMaterial } from '../../utils/procedural/geometry';
import type { Wall } from '../../types';

interface ProceduralWallProps {
  wall: Wall;
  selected?: boolean;
  color?: string;
  opacity?: number;
  onClick?: () => void;
}

export function ProceduralWall({ wall, selected = false, color = '#C8C8C8', opacity = 1, onClick }: ProceduralWallProps) {
  const { position, rotation, length } = useMemo(() => buildWallGeometry(wall), [wall]);
  const wallColor = selected ? '#4A90D9' : color;
  const isTransparent = opacity < 1;

  return (
    <mesh
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
      castShadow={!isTransparent}
      receiveShadow={!isTransparent}
      onClick={onClick}
    >
      <boxGeometry args={[length, wall.height, wall.thickness]} />
      <meshStandardMaterial
        color={wallColor}
        roughness={0.8}
        metalness={0.05}
        transparent={isTransparent}
        opacity={opacity}
      />
    </mesh>
  );
}
