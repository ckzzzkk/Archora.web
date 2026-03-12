import React from 'react';
import type { Vector3D } from '../../../types';

interface DiningTableProps {
  position: Vector3D;
  rotation: Vector3D;
  dimensions: Vector3D;
  color?: string;
  selected?: boolean;
}

export function DiningTable({ position, rotation, dimensions, color = '#8B6914', selected = false }: DiningTableProps) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  const topH = 0.05;
  const legH = h - topH;

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      {/* Tabletop */}
      <mesh position={[0, h - topH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topH, d]} />
        <meshStandardMaterial color={c} roughness={0.5} metalness={0.05} />
      </mesh>

      {/* 4 legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (w / 2 - 0.06), legH / 2, sz * (d / 2 - 0.06)]} castShadow>
          <boxGeometry args={[0.05, legH, 0.05]} />
          <meshStandardMaterial color={c} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}
