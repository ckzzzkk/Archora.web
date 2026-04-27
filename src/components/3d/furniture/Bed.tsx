import React from 'react';
import type { Vector3D } from '../../../types';

interface BedProps {
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

export function Bed({
  position,
  rotation,
  dimensions,
  color = '#C8A882',
  secondaryColor = '#4A3020',
  roughness = 0.7,
  metalness = 0.0,
  modelVariant = 'standard',
  selected = false,
}: BedProps) {
  const { x: w, y: h, z: d } = dimensions;

  const isPlatform = modelVariant === 'platform' || modelVariant === 'modern';
  const isClassic = modelVariant === 'classic';
  const isMidCentury = modelVariant === 'mid_century';

  // Mid-century walnut tones
  const bedColor = isMidCentury ? '#8B6914' : color;
  const bedSec = isMidCentury ? '#5A4020' : secondaryColor;
  const c = selected ? '#4A90D9' : bedColor;

  const frameH = isPlatform ? h * 0.25 : h * 0.4;
  const mattressH = isPlatform ? h * 0.5 : h * 0.28;
  const headboardH = isPlatform ? h * 1.0 : h * 1.2;
  const headboardThick = isPlatform ? 0.1 : 0.08;
  const hasFootboard = !isPlatform;
  const hasBedroomBench = isClassic;

  // Pillow count based on width
  const pillowCount = w >= 1.8 ? 3 : 2;

  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Frame */}
      <mesh position={[0, frameH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, frameH, d]} />
        <meshStandardMaterial color={bedSec} roughness={roughness} metalness={metalness} />
      </mesh>

      {/* Mattress */}
      <mesh position={[0, frameH + mattressH / 2, 0]} castShadow>
        <boxGeometry args={[w - 0.04, mattressH, d - 0.08]} />
        <meshStandardMaterial color="#F0EDE8" roughness={0.9} metalness={0} />
      </mesh>

      {/* Duvet / bedding */}
      <mesh position={[0, frameH + mattressH + 0.02, 0.08]} castShadow>
        <boxGeometry args={[w - 0.06, 0.06, d * 0.55]} />
        <meshStandardMaterial color={c} roughness={roughness + 0.05} metalness={metalness} />
      </mesh>

      {/* Pillows */}
      {Array.from({ length: pillowCount }).map((_, i) => {
        const offset = (i - (pillowCount - 1) / 2) * w * 0.28;
        return (
          <mesh key={i} position={[offset, frameH + mattressH + 0.07, -d / 2 + 0.28]} castShadow>
            <boxGeometry args={[w * 0.28, 0.1, 0.44]} />
            <meshStandardMaterial color="#FFFFFF" roughness={1} metalness={0} />
          </mesh>
        );
      })}

      {/* Headboard */}
      <mesh position={[0, frameH + headboardH / 2, -d / 2 - headboardThick / 2]} castShadow>
        <boxGeometry args={[w, headboardH, headboardThick]} />
        <meshStandardMaterial color={isPlatform ? c : bedSec} roughness={isPlatform ? roughness : roughness * 0.8} metalness={metalness} />
      </mesh>

      {/* Footboard */}
      {hasFootboard && (
        <mesh position={[0, frameH + h * 0.25 / 2, d / 2 + 0.025]} castShadow>
          <boxGeometry args={[w, h * 0.5, 0.05]} />
          <meshStandardMaterial color={bedSec} roughness={roughness} metalness={metalness} />
        </mesh>
      )}

      {/* Bedroom bench at foot — classic only */}
      {hasBedroomBench && (
        <mesh position={[0, frameH * 0.3, d / 2 + 0.2]} castShadow receiveShadow>
          <boxGeometry args={[w * 0.55, frameH * 0.55, 0.38]} />
          <meshStandardMaterial color={bedSec} roughness={roughness + 0.1} metalness={metalness} />
        </mesh>
      )}

      {/* Legs */}
      {isPlatform ? (
        // Low platform base — no visible legs, just a thin base
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[w, 0.04, d]} />
          <meshStandardMaterial color={bedSec} roughness={roughness} metalness={metalness} />
        </mesh>
      ) : (
        // Standard bed legs
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <mesh key={i} position={[sx * (w / 2 - 0.07), 0.04, sz * (d / 2 - 0.07)]} castShadow>
            <boxGeometry args={[0.06, 0.08, 0.06]} />
            <meshStandardMaterial color={bedSec} roughness={0.4} metalness={0.5} />
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
