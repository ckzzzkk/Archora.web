import React from 'react';
import type { Vector3D } from '../../../types';

interface WardrobeProps {
  position: Vector3D;
  rotation: Vector3D;
  dimensions: Vector3D;
  color?: string;
  selected?: boolean;
}

export function Wardrobe({ position, rotation, dimensions, color = '#5C4A2A', selected = false }: WardrobeProps) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      {/* Body */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={c} roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Door divider */}
      <mesh position={[0, h / 2, d / 2 + 0.002]}>
        <boxGeometry args={[0.02, h - 0.04, 0.01]} />
        <meshStandardMaterial color="#2D2D2D" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Left door handle */}
      <mesh position={[-0.06, h * 0.5, d / 2 + 0.015]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#C0C0C0" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Right door handle */}
      <mesh position={[0.06, h * 0.5, d / 2 + 0.015]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#C0C0C0" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}
