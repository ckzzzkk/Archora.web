import React from 'react';
import type { Vector3D } from '../../../types';

interface SofaProps {
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

export function Sofa({
  position,
  rotation,
  dimensions,
  color = '#8A7A6A',
  secondaryColor = '#2D2D2D',
  roughness = 0.7,
  metalness = 0.0,
  modelVariant = 'standard',
  selected = false,
}: SofaProps) {
  const c = selected ? '#4A90D9' : color;
  const legColor = secondaryColor;
  const legRoughness = roughness * 0.8;
  const legMetalness = metalness + 0.1;
  const { x: w, y: h, z: d } = dimensions;

  const isClassic = modelVariant === 'classic';
  const isModern = modelVariant === 'modern';
  const isSleeper = modelVariant === 'sleeper';

  // Base proportions vary by variant
  const baseH = isClassic ? h * 0.42 : isModern ? h * 0.38 : h * 0.45;
  const backH = isClassic ? h * 0.85 : isModern ? h * 0.75 : h * 0.8;
  const armH = isClassic ? h * 0.6 : isModern ? h * 0.5 : h * 0.55;
  const armW = isModern ? w * 0.04 : w * 0.1;
  const hasSkirt = isClassic;
  const hasCushionSeams = !isModern;

  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Base / seat platform */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, baseH, d]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>

      {/* Seat cushions — 3 sections */}
      {hasCushionSeams ? (
        [-1, 0, 1].map((i) => (
          <mesh key={i} position={[i * w * 0.33, baseH + 0.04, 0]} castShadow>
            <boxGeometry args={[w * 0.3, 0.08, d * 0.88]} />
            <meshStandardMaterial color={c} roughness={roughness + 0.1} metalness={metalness} />
          </mesh>
        ))
      ) : (
        /* Solid seat — modern */
        <mesh position={[0, baseH + 0.04, 0]} castShadow>
          <boxGeometry args={[w, 0.06, d * 0.88]} />
          <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
        </mesh>
      )}

      {/* Back rest */}
      <mesh position={[0, baseH + backH / 2, -d / 2 + 0.06]} castShadow>
        <boxGeometry args={[w, backH * 0.7, d * (isModern ? 0.08 : 0.14)]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>

      {/* Classic: rolled arms | Modern: slab arms | Standard: cushioned arms */}
      {isClassic ? (
        <>
          <mesh position={[-w / 2 + armW * 0.6, baseH + armH * 0.55, 0]} castShadow>
            <boxGeometry args={[armW * 1.2, armH * 0.9, d * 0.88]} />
            <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
          </mesh>
          <mesh position={[w / 2 - armW * 0.6, baseH + armH * 0.55, 0]} castShadow>
            <boxGeometry args={[armW * 1.2, armH * 0.9, d * 0.88]} />
            <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
          </mesh>
        </>
      ) : isModern ? (
        <>
          <mesh position={[-w / 2 + armW / 2, baseH + armH / 2, 0]} castShadow>
            <boxGeometry args={[armW, armH, d]} />
            <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
          </mesh>
          <mesh position={[w / 2 - armW / 2, baseH + armH / 2, 0]} castShadow>
            <boxGeometry args={[armW, armH, d]} />
            <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[-w / 2 + armW / 2, baseH + armH / 2, 0]} castShadow>
            <boxGeometry args={[armW, armH, d]} />
            <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
          </mesh>
          <mesh position={[w / 2 - armW / 2, baseH + armH / 2, 0]} castShadow>
            <boxGeometry args={[armW, armH, d]} />
            <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
          </mesh>
        </>
      )}

      {/* Skirt — classic only */}
      {hasSkirt && (
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[w - 0.02, 0.06, d - 0.02]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.8} metalness={0.0} />
        </mesh>
      )}

      {/* Legs */}
      {isModern ? (
        // Metal hairpin legs
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <mesh key={i} position={[sx * (w / 2 - 0.06), 0.04, sz * (d / 2 - 0.06)]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.08, 6]} />
            <meshStandardMaterial color={legColor} roughness={0.2} metalness={0.8} />
          </mesh>
        ))
      ) : (
        // Wooden legs
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <mesh key={i} position={[sx * (w / 2 - 0.06), 0.04, sz * (d / 2 - 0.06)]} castShadow>
            <boxGeometry args={[0.05, 0.08, 0.05]} />
            <meshStandardMaterial color={legColor} roughness={legRoughness} metalness={legMetalness} />
          </mesh>
        ))
      )}

      {/* Sleeper: mattress crease line */}
      {isSleeper && (
        <mesh position={[0, baseH + 0.065, 0]}>
          <boxGeometry args={[w * 0.02, 0.01, d * 0.9]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.9} metalness={0} />
        </mesh>
      )}

      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h + 0.05, d + 0.05]} />
          <meshStandardMaterial color="#4A90D9" wireframe />
        </mesh>
      )}
    </group>
  );
}
