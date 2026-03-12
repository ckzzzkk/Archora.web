import React from 'react';
import type { Vector3D } from '../../../types';

interface BedProps {
  position: Vector3D;
  rotation: Vector3D;
  dimensions: Vector3D;
  color?: string;
  selected?: boolean;
}

export function Bed({ position, rotation, dimensions, color = '#C8A882', selected = false }: BedProps) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  const frameH = h * 0.4;
  const mattressH = h * 0.25;
  const headboardH = h * 1.2;

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      {/* Frame */}
      <mesh position={[0, frameH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, frameH, d]} />
        <meshStandardMaterial color="#5C4A2A" roughness={0.7} />
      </mesh>

      {/* Mattress */}
      <mesh position={[0, frameH + mattressH / 2, 0]} castShadow>
        <boxGeometry args={[w - 0.05, mattressH, d - 0.1]} />
        <meshStandardMaterial color="#F0EDE8" roughness={0.9} />
      </mesh>

      {/* Pillow(s) */}
      <mesh position={[w * 0.15, frameH + mattressH + 0.06, -d / 2 + 0.25]} castShadow>
        <boxGeometry args={[w * 0.3, 0.1, 0.45]} />
        <meshStandardMaterial color="#FFFFFF" roughness={1} />
      </mesh>
      <mesh position={[-w * 0.15, frameH + mattressH + 0.06, -d / 2 + 0.25]} castShadow>
        <boxGeometry args={[w * 0.3, 0.1, 0.45]} />
        <meshStandardMaterial color="#FFFFFF" roughness={1} />
      </mesh>

      {/* Headboard */}
      <mesh position={[0, headboardH / 2, -d / 2 - 0.04]} castShadow>
        <boxGeometry args={[w, headboardH, 0.08]} />
        <meshStandardMaterial color={c} roughness={0.6} />
      </mesh>

      {/* Legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (w / 2 - 0.07), 0.04, sz * (d / 2 - 0.07)]} castShadow>
          <boxGeometry args={[0.06, 0.08, 0.06]} />
          <meshStandardMaterial color="#2D2D2D" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
