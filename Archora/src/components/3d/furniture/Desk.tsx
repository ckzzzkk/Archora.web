import React from 'react';
import type { Vector3D } from '../../../types';

interface DeskProps {
  position: Vector3D;
  rotation: Vector3D;
  dimensions: Vector3D;
  color?: string;
  selected?: boolean;
}

export function Desk({ position, rotation, dimensions, color = '#8B7355', selected = false }: DeskProps) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  const topH = 0.04;
  const legH = h - topH;

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      {/* Desktop */}
      <mesh position={[0, h - topH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topH, d]} />
        <meshStandardMaterial color={c} roughness={0.4} metalness={0.05} />
      </mesh>

      {/* Left panel leg */}
      <mesh position={[-w / 2 + 0.02, legH / 2, 0]} castShadow>
        <boxGeometry args={[0.04, legH, d - 0.04]} />
        <meshStandardMaterial color={c} roughness={0.6} />
      </mesh>

      {/* Right panel leg */}
      <mesh position={[w / 2 - 0.02, legH / 2, 0]} castShadow>
        <boxGeometry args={[0.04, legH, d - 0.04]} />
        <meshStandardMaterial color={c} roughness={0.6} />
      </mesh>

      {/* Monitor (decorative) */}
      <mesh position={[0, h + 0.22, -d / 2 + 0.12]} castShadow>
        <boxGeometry args={[0.5, 0.32, 0.04]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  );
}
