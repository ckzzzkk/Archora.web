import React from 'react';
import type { Vector3D } from '../../../types';

interface KitchenUnitProps {
  position: Vector3D;
  rotation: Vector3D;
  dimensions: Vector3D;
  color?: string;
  selected?: boolean;
}

export function KitchenUnit({ position, rotation, dimensions, color = '#D0D0D0', selected = false }: KitchenUnitProps) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  const topH = 0.04;
  const cabinetH = h - topH;

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      {/* Cabinet body */}
      <mesh position={[0, cabinetH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, cabinetH, d]} />
        <meshStandardMaterial color={c} roughness={0.5} metalness={0.05} />
      </mesh>

      {/* Countertop */}
      <mesh position={[0, h - topH / 2, 0]} castShadow>
        <boxGeometry args={[w + 0.04, topH, d + 0.04]} />
        <meshStandardMaterial color="#C0C8C0" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Sink (if wide enough) */}
      {w > 0.8 ? (
        <mesh position={[w * 0.2, h - topH + 0.01, 0]}>
          <boxGeometry args={[w * 0.35, 0.04, d * 0.55]} />
          <meshStandardMaterial color="#909090" roughness={0.2} metalness={0.7} />
        </mesh>
      ) : null}

      {/* Doors (vertical dividers) */}
      {Array.from({ length: Math.floor(w / 0.4) }).map((_, i) => {
        const doorX = -w / 2 + 0.2 + i * 0.4 + 0.2;
        return (
          <mesh key={i} position={[doorX, cabinetH / 2, d / 2 + 0.002]}>
            <boxGeometry args={[0.02, cabinetH * 0.9, 0.01]} />
            <meshStandardMaterial color="#808080" roughness={0.3} metalness={0.5} />
          </mesh>
        );
      })}

      {/* Handles */}
      {Array.from({ length: Math.floor(w / 0.4) }).map((_, i) => {
        const hx = -w / 2 + 0.2 + i * 0.4 + 0.1;
        return (
          <mesh key={`h${i}`} position={[hx, cabinetH * 0.55, d / 2 + 0.015]}>
            <boxGeometry args={[0.08, 0.015, 0.015]} />
            <meshStandardMaterial color="#C0C0C0" roughness={0.2} metalness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}
