import React from 'react';
import type { Vector3D } from '../../../types';

interface CoffeeTableProps {
  position: Vector3D;
  rotation: Vector3D;
  dimensions: Vector3D;
  color?: string;
  secondaryColor?: string;
  roughness?: number;
  metalness?: number;
  modelVariant?: string;
  selected?: boolean;
}

export function CoffeeTable({
  position,
  rotation,
  dimensions,
  color = '#9A7850',
  secondaryColor = '#2D2D2D',
  roughness = 0.5,
  metalness = 0.0,
  modelVariant = 'standard',
  selected = false,
}: CoffeeTableProps) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  const topH = 0.04;
  const legH = h - topH;

  const isModern = modelVariant === 'modern';
  const isGlass = modelVariant === 'glass';
  const isClassic = modelVariant === 'classic';

  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Tabletop */}
      <mesh position={[0, h - topH / 2, 0]} castShadow receiveShadow>
        {isGlass ? (
          <boxGeometry args={[w, topH, d]} />
        ) : (
          <boxGeometry args={[w, topH, d]} />
        )}
        <meshStandardMaterial
          color={isGlass ? '#C0D8E8' : c}
          roughness={isGlass ? 0.05 : roughness}
          metalness={isGlass ? 0.3 : metalness}
          transparent={isGlass}
          opacity={isGlass ? 0.4 : 1.0}
        />
      </mesh>

      {/* Lower shelf — standard/classic only */}
      {!isModern && (
        <mesh position={[0, h * 0.22, 0]} receiveShadow>
          <boxGeometry args={[w * 0.75, 0.025, d * 0.75]} />
          <meshStandardMaterial color={isClassic ? secondaryColor : c} roughness={roughness + 0.1} metalness={metalness} />
        </mesh>
      )}

      {/* Legs */}
      {isModern ? (
        // Hairpin metal legs
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <mesh key={i} position={[sx * (w / 2 - 0.05), legH / 2, sz * (d / 2 - 0.05)]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, legH, 6]} />
            <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.8} />
          </mesh>
        ))
      ) : isGlass ? (
        // Transparent acrylic legs
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <mesh key={i} position={[sx * (w / 2 - 0.06), legH / 2, sz * (d / 2 - 0.06)]} castShadow>
            <boxGeometry args={[0.03, legH, 0.03]} />
            <meshStandardMaterial color="#D0D0D0" roughness={0.1} metalness={0.1} transparent opacity={0.6} />
          </mesh>
        ))
      ) : (
        // Wooden tapered legs
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <mesh key={i} position={[sx * (w / 2 - 0.05), legH / 2, sz * (d / 2 - 0.05)]} castShadow>
            <cylinderGeometry args={[0.03, 0.02, legH, 8]} />
            <meshStandardMaterial color={secondaryColor} roughness={roughness} metalness={metalness} />
          </mesh>
        ))
      )}

      {selected && (
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w + 0.05, h + 0.05, d + 0.05]} />
          <meshStandardMaterial color="#4A90D9" wireframe />
        </mesh>
      )}
    </group>
  );
}
