import React from 'react';
import type { Vector3D } from '../../../types';

interface ChairProps {
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

export function Chair({
  position,
  rotation,
  dimensions,
  color = '#8A7A6A',
  secondaryColor = '#2D2D2D',
  roughness = 0.7,
  metalness = 0.0,
  modelVariant = 'standard',
  selected = false,
}: ChairProps) {
  const isLounge = modelVariant === 'lounge';
  const isClassic = modelVariant === 'classic';
  const isModern = modelVariant === 'modern';
  const isMidCentury = modelVariant === 'mid_century';

  // Mid-century walnut tones
  const chairColor = isMidCentury ? '#8B6914' : color;
  const chairSec = isMidCentury ? '#5A4020' : secondaryColor;

  const c = selected ? '#4A90D9' : chairColor;
  const legColor = chairSec;
  const { x: w, y: h, z: d } = dimensions;

  const seatH = isLounge ? h * 0.4 : h * 0.45;
  const seatDepth = isLounge ? d * 0.95 : d;
  const backH = isLounge ? h * 0.8 : isClassic ? h * 1.1 : isMidCentury ? h * 0.55 : h * 0.5;
  const backDepth = isModern ? 0.04 : 0.06;
  const hasUpholstery = isLounge || isClassic;
  const hasCushion = hasUpholstery;

  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Seat */}
      <mesh position={[0, seatH, 0]} castShadow>
        {hasCushion ? (
          <boxGeometry args={[w, 0.06, seatDepth]} />
        ) : (
          <boxGeometry args={[w, 0.05, seatDepth]} />
        )}
        <meshStandardMaterial color={c} roughness={hasUpholstery ? roughness + 0.1 : roughness} metalness={metalness} />
      </mesh>

      {/* Back rest */}
      <mesh position={[0, seatH + backH / 2, -d / 2 + backDepth / 2]} castShadow>
        <boxGeometry args={[w, backH, backDepth]} />
        <meshStandardMaterial color={hasUpholstery ? c : legColor} roughness={hasUpholstery ? roughness + 0.1 : roughness * 0.8} metalness={hasUpholstery ? metalness : metalness + 0.2} />
      </mesh>

      {/* Lounge: armrests */}
      {isLounge && (
        <>
          <mesh position={[-w / 2 + 0.04, seatH + h * 0.25, 0]} castShadow>
            <boxGeometry args={[0.04, h * 0.5, d * 0.7]} />
            <meshStandardMaterial color={legColor} roughness={roughness} metalness={metalness * 0.5} />
          </mesh>
          <mesh position={[w / 2 - 0.04, seatH + h * 0.25, 0]} castShadow>
            <boxGeometry args={[0.04, h * 0.5, d * 0.7]} />
            <meshStandardMaterial color={legColor} roughness={roughness} metalness={metalness * 0.5} />
          </mesh>
        </>
      )}

      {/* Classic: turned legs | Modern: metal legs | Mid-century: tapered | Standard: wooden legs */}
      {isModern ? (
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <mesh key={i} position={[sx * (w / 2 - 0.04), seatH / 2, sz * (d / 2 - 0.04)]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, seatH, 8]} />
            <meshStandardMaterial color={legColor} roughness={0.2} metalness={0.8} />
          </mesh>
        ))
      ) : isMidCentury ? (
        // Tapered mid-century legs
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <mesh key={i} position={[sx * (w / 2 - 0.05), seatH / 2, sz * (d / 2 - 0.05)]} castShadow>
            <cylinderGeometry args={[0.028, 0.016, seatH, 8]} />
            <meshStandardMaterial color={legColor} roughness={0.5} metalness={0.1} />
          </mesh>
        ))
      ) : isClassic ? (
        // Tapered turned legs
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <mesh key={i} position={[sx * (w / 2 - 0.05), seatH / 2, sz * (d / 2 - 0.05)]} castShadow>
            <cylinderGeometry args={[0.025, 0.018, seatH, 8]} />
            <meshStandardMaterial color={legColor} roughness={0.6} metalness={0.05} />
          </mesh>
        ))
      ) : (
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <mesh key={i} position={[sx * (w / 2 - 0.04), seatH / 2, sz * (d / 2 - 0.04)]} castShadow>
            <boxGeometry args={[0.04, seatH, 0.04]} />
            <meshStandardMaterial color={legColor} roughness={0.5} metalness={0.3} />
          </mesh>
        ))
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
