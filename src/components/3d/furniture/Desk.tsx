import React from 'react';
import type { Vector3D } from '../../../types';

interface DeskProps {
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

export function Desk({
  position,
  rotation,
  dimensions,
  color = '#8B7355',
  secondaryColor = '#2D2D2D',
  roughness = 0.6,
  metalness = 0.05,
  modelVariant = 'standard',
  selected = false,
}: DeskProps) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  const topH = 0.04;
  const legH = h - topH;

  const isModern = modelVariant === 'modern';
  const isClassic = modelVariant === 'classic';

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      {/* Desktop */}
      <mesh position={[0, h - topH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topH, d]} />
        <meshStandardMaterial color={c} roughness={isModern ? 0.2 : roughness} metalness={isModern ? 0.5 : metalness} />
      </mesh>

      {/* Modesty panel / back panel — standard/classic */}
      {!isModern && (
        <mesh position={[0, legH / 2, -d / 2 + 0.015]} castShadow>
          <boxGeometry args={[w - 0.08, legH * 0.8, 0.02]} />
          <meshStandardMaterial color={secondaryColor} roughness={roughness} metalness={metalness} />
        </mesh>
      )}

      {/* Side panels — standard */}
      {!isModern && (
        <>
          <mesh position={[-w / 2 + 0.02, legH / 2, 0]} castShadow>
            <boxGeometry args={[0.04, legH, d - 0.04]} />
            <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
          </mesh>
          <mesh position={[w / 2 - 0.02, legH / 2, 0]} castShadow>
            <boxGeometry args={[0.04, legH, d - 0.04]} />
            <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
          </mesh>
        </>
      )}

      {/* Drawer unit — classic */}
      {isClassic && (
        <mesh position={[-w / 2 + 0.14, legH * 0.4, 0]} castShadow>
          <boxGeometry args={[0.24, legH * 0.7, d - 0.06]} />
          <meshStandardMaterial color={secondaryColor} roughness={roughness} metalness={metalness} />
        </mesh>
      )}

      {/* Cable tray — modern */}
      {isModern && (
        <mesh position={[0, h - topH - 0.03, d / 2 - 0.04]} castShadow>
          <boxGeometry args={[w * 0.6, 0.03, 0.06]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.3} metalness={0.6} />
        </mesh>
      )}

      {/* Legs */}
      {isModern ? (
        // Metal hairpin legs
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <mesh key={i} position={[sx * (w / 2 - 0.06), legH / 2, sz * (d / 2 - 0.06)]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, legH, 8]} />
            <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.8} />
          </mesh>
        ))
      ) : isClassic ? (
        // Turned wooden legs
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <mesh key={i} position={[sx * (w / 2 - 0.07), legH / 2, sz * (d / 2 - 0.07)]} castShadow>
            <cylinderGeometry args={[0.035, 0.022, legH, 8]} />
            <meshStandardMaterial color={secondaryColor} roughness={0.6} metalness={0.05} />
          </mesh>
        ))
      ) : (
        // Standard box legs
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <mesh key={i} position={[sx * (w / 2 - 0.05), legH / 2, sz * (d / 2 - 0.05)]} castShadow>
            <boxGeometry args={[0.05, legH, 0.05]} />
            <meshStandardMaterial color={secondaryColor} roughness={roughness} metalness={metalness} />
          </mesh>
        ))
      )}

      {/* Monitor (decorative) */}
      <mesh position={[0, h + 0.22, -d / 2 + 0.12]} castShadow>
        <boxGeometry args={[0.5, 0.32, 0.04]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.3} metalness={0.6} />
      </mesh>

      {selected && (
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w + 0.05, h + 0.05, d + 0.05]} />
          <meshStandardMaterial color="#4A90D9" wireframe />
        </mesh>
      )}
    </group>
  );
}
