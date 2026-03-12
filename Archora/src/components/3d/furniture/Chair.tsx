import React from 'react';
import type { Vector3D } from '../../../types';

interface ChairProps {
  position: Vector3D;
  rotation: Vector3D;
  dimensions: Vector3D;
  color?: string;
  selected?: boolean;
}

export function Chair({ position, rotation, dimensions, color = '#718096', selected = false }: ChairProps) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  const seatH = h * 0.45;
  const legH = seatH - 0.02;

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      {/* Seat */}
      <mesh position={[0, seatH, 0]} castShadow>
        <boxGeometry args={[w, 0.05, d]} />
        <meshStandardMaterial color={c} roughness={0.7} />
      </mesh>

      {/* Back */}
      <mesh position={[0, seatH + h * 0.25, -d / 2 + 0.04]} castShadow>
        <boxGeometry args={[w, h * 0.5, 0.05]} />
        <meshStandardMaterial color={c} roughness={0.7} />
      </mesh>

      {/* 4 legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (w / 2 - 0.04), legH / 2, sz * (d / 2 - 0.04)]} castShadow>
          <boxGeometry args={[0.04, legH, 0.04]} />
          <meshStandardMaterial color="#2D2D2D" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
