import React from 'react';
import type { Vector3D } from '../../../types';

interface SofaProps {
  position: Vector3D;
  rotation: Vector3D;
  dimensions: Vector3D;
  color?: string;
  selected?: boolean;
}

export function Sofa({ position, rotation, dimensions, color = '#4A5568', selected = false }: SofaProps) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  const baseH = h * 0.45;
  const backH = h * 0.8;
  const armH = h * 0.55;
  const armW = w * 0.1;

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      {/* Base / seat */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, baseH, d]} />
        <meshStandardMaterial color={c} roughness={0.8} />
      </mesh>

      {/* Back rest */}
      <mesh position={[0, baseH + backH / 2, -d / 2 + 0.08]} castShadow>
        <boxGeometry args={[w, backH, d * 0.15]} />
        <meshStandardMaterial color={c} roughness={0.8} />
      </mesh>

      {/* Left arm */}
      <mesh position={[-w / 2 + armW / 2, baseH + armH / 2, 0]} castShadow>
        <boxGeometry args={[armW, armH, d]} />
        <meshStandardMaterial color={c} roughness={0.8} />
      </mesh>

      {/* Right arm */}
      <mesh position={[w / 2 - armW / 2, baseH + armH / 2, 0]} castShadow>
        <boxGeometry args={[armW, armH, d]} />
        <meshStandardMaterial color={c} roughness={0.8} />
      </mesh>

      {/* Legs (4 corners) */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (w / 2 - 0.06), 0.04, sz * (d / 2 - 0.06)]} castShadow>
          <boxGeometry args={[0.05, 0.08, 0.05]} />
          <meshStandardMaterial color="#2D2D2D" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
