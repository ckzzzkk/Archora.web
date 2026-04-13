import React from 'react';
import type { Vector3D } from '../../../types';

interface DiningTableProps {
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

export function DiningTable({
  position,
  rotation,
  dimensions,
  color = '#8B6914',
  secondaryColor = '#2D2D2D',
  roughness = 0.6,
  metalness = 0.0,
  modelVariant = 'standard',
  selected = false,
}: DiningTableProps) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  const topH = 0.05;
  const legH = h - topH;

  const isModern = modelVariant === 'modern';
  const isClassic = modelVariant === 'classic';
  const hasApron = !isModern;
  const legStyle = isModern ? 'metal' : isClassic ? 'turned' : 'straight';

  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Tabletop */}
      <mesh position={[0, h - topH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topH, d]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>

      {/* Apron/frame beneath tabletop */}
      {hasApron && (
        <>
          <mesh position={[0, h - topH - 0.04, 0]} castShadow>
            <boxGeometry args={[w - 0.08, 0.06, d - 0.08]} />
            <meshStandardMaterial color={secondaryColor} roughness={roughness * 0.9} metalness={metalness * 0.5} />
          </mesh>
        </>
      )}

      {/* Legs */}
      {legStyle === 'metal' ? (
        // Metal hairpin/slim legs
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <mesh key={i} position={[sx * (w / 2 - 0.07), legH / 2, sz * (d / 2 - 0.07)]} castShadow>
            <cylinderGeometry args={[0.025, 0.02, legH, 8]} />
            <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.8} />
          </mesh>
        ))
      ) : legStyle === 'turned' ? (
        // Tapered turned legs
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <mesh key={i} position={[sx * (w / 2 - 0.07), legH / 2, sz * (d / 2 - 0.07)]} castShadow>
            <cylinderGeometry args={[0.04, 0.025, legH, 8]} />
            <meshStandardMaterial color={secondaryColor} roughness={0.6} metalness={0.05} />
          </mesh>
        ))
      ) : (
        // Straight legs
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <mesh key={i} position={[sx * (w / 2 - 0.06), legH / 2, sz * (d / 2 - 0.06)]} castShadow>
            <boxGeometry args={[0.05, legH, 0.05]} />
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
