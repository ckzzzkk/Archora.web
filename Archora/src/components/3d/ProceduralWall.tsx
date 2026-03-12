import React, { useMemo } from 'react';
import { buildWallGeometry, getSharedMaterial } from '../../utils/procedural/geometry';
import type { Wall } from '../../types';

interface ProceduralWallProps {
  wall: Wall;
  selected?: boolean;
  color?: string;
  onPress?: (id: string) => void;
}

export function ProceduralWall({ wall, selected = false, color = '#C8C8C8' }: ProceduralWallProps) {
  const { position, rotation, length } = useMemo(() => buildWallGeometry(wall), [wall]);

  const wallColor = selected ? '#4A90D9' : color;
  const material = useMemo(
    () => getSharedMaterial(wallColor, 0.8, 0.05),
    [wallColor],
  );

  return (
    <mesh
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[length, wall.height, wall.thickness]} />
      <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.05} />
    </mesh>
  );
}
