import React from 'react';
import type { Vector3D } from '../../../types';

interface CoffeeTableProps {
  position: Vector3D;
  rotation: Vector3D;
  dimensions: Vector3D;
  color?: string;
  selected?: boolean;
}

export function CoffeeTable({ position, rotation, dimensions, color = '#7C5C3C', selected = false }: CoffeeTableProps) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  const topH = 0.04;
  const legH = h - topH;

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      {/* Tabletop */}
      <mesh position={[0, h - topH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topH, d]} />
        <meshStandardMaterial color={c} roughness={0.5} />
      </mesh>

      {/* Lower shelf */}
      <mesh position={[0, h * 0.25, 0]} receiveShadow>
        <boxGeometry args={[w * 0.8, 0.025, d * 0.8]} />
        <meshStandardMaterial color={c} roughness={0.6} />
      </mesh>

      {/* 4 slim legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (w / 2 - 0.05), legH / 2, sz * (d / 2 - 0.05)]} castShadow>
          <boxGeometry args={[0.04, legH, 0.04]} />
          <meshStandardMaterial color="#2D2D2D" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
