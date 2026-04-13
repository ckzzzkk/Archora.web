import React from 'react';
import type { Vector3D } from '../../../types';

interface KitchenUnitProps {
  position: Vector3D;
  rotation: Vector3D;
  dimensions: Vector3D;
  color?: string;
  secondaryColor?: string;
  roughness?: number;
  metalness?: number;
  modelVariant?: string;
  selected?: boolean;
  /** Set to true when placing kitchen_island_seating to render with bar stools */
  hasSeating?: boolean;
}

export function KitchenUnit({
  position,
  rotation,
  dimensions,
  color = '#D0D0D0',
  secondaryColor = '#C0C8C0',
  roughness = 0.5,
  metalness = 0.05,
  modelVariant = 'standard',
  selected = false,
  hasSeating = false,
}: KitchenUnitProps) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  const topH = 0.04;
  const cabinetH = h - topH;

  const isModern = modelVariant === 'modern';
  const isClassic = modelVariant === 'classic';

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      {/* Cabinet body */}
      <mesh position={[0, cabinetH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, cabinetH, d]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>

      {/* Countertop */}
      <mesh position={[0, h - topH / 2, 0]} castShadow>
        <boxGeometry args={[w + 0.04, topH, d + 0.04]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Sink (if wide enough) */}
      {w > 0.8 ? (
        <mesh position={[w * 0.2, h - topH + 0.01, 0]}>
          <boxGeometry args={[w * 0.35, 0.04, d * 0.55]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.7} />
        </mesh>
      ) : null}

      {/* Doors — modern has fewer large panels, classic has more detail */}
      {isModern ? (
        // 2 large panels for modern
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * w * 0.25, cabinetH / 2, d / 2 + 0.002]}>
            <boxGeometry args={[w * 0.45, cabinetH * 0.9, 0.01]} />
            <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
          </mesh>
        ))
      ) : (
        // Standard/classic vertical dividers
        Array.from({ length: Math.floor(w / 0.4) }).map((_, i) => {
          const doorX = -w / 2 + 0.2 + i * 0.4 + 0.2;
          return (
            <mesh key={i} position={[doorX, cabinetH / 2, d / 2 + 0.002]}>
              <boxGeometry args={[0.02, cabinetH * 0.9, 0.01]} />
              <meshStandardMaterial color={secondaryColor} roughness={0.3} metalness={0.5} />
            </mesh>
          );
        })
      )}

      {/* Handles — integrated horizontal for modern */}
      {isModern ? (
        <mesh position={[0, cabinetH * 0.5, d / 2 + 0.018]}>
          <boxGeometry args={[w * 0.4, 0.018, 0.018]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.8} />
        </mesh>
      ) : isClassic ? (
        // Round knobs for classic
        Array.from({ length: Math.floor(w / 0.4) }).map((_, i) => {
          const hx = -w / 2 + 0.2 + i * 0.4 + 0.1;
          return (
            <mesh key={`knob-${i}`} position={[hx, cabinetH * 0.5, d / 2 + 0.018]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.8} />
            </mesh>
          );
        })
      ) : (
        // Standard bar handles
        Array.from({ length: Math.floor(w / 0.4) }).map((_, i) => {
          const hx = -w / 2 + 0.2 + i * 0.4 + 0.1;
          return (
            <mesh key={`h${i}`} position={[hx, cabinetH * 0.55, d / 2 + 0.015]}>
              <boxGeometry args={[0.08, 0.015, 0.015]} />
              <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.9} />
            </mesh>
          );
        })
      )}

      {/* Bar stools for kitchen_island_seating */}
      {hasSeating && [-0.3, 0, 0.3].map((offset, i) => (
        <group key={i} position={[offset * w, 0, d / 2 + 0.25]}>
          {/* Seat */}
          <mesh position={[0, h * 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.16, 0.04, 12]} />
            <meshStandardMaterial color={c} roughness={0.7} metalness={0.05} />
          </mesh>
          {/* Pole */}
          <mesh position={[0, h * 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, h * 0.5, 8]} />
            <meshStandardMaterial color={secondaryColor} roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Base */}
          <mesh position={[0, 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.04, 12]} />
            <meshStandardMaterial color={secondaryColor} roughness={0.3} metalness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function KitchenIslandSeating({ position, rotation, dimensions, color = '#D0D0D0', secondaryColor = '#C0C8C0', roughness = 0.5, metalness = 0.05, selected = false }: KitchenUnitProps) {
  return (
    <KitchenUnit
      position={position}
      rotation={rotation}
      dimensions={dimensions}
      color={color}
      secondaryColor={secondaryColor}
      roughness={roughness}
      metalness={metalness}
      selected={selected}
      hasSeating={true}
    />
  );
}
