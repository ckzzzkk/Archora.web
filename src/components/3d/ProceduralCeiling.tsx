import React, { useMemo } from 'react';
import * as THREE from 'three';
import { buildCeilingGeometry } from '../../utils/procedural/ceilingGeometry';
import type { Ceiling } from '../../types/blueprint';

export interface ProceduralCeilingProps {
  ceiling: Ceiling;
  selected?: boolean;
  /** Opacity multiplier (0–1), e.g. 0.2 for ghost floors */
  opacity?: number;
}

// ---------------------------------------------------------------------------
// Material presets per ceiling type
// ---------------------------------------------------------------------------

const CEILING_MATERIALS: Record<string, { color: string; roughness: number; metalness: number }> = {
  flat_white:     { color: '#F0EDE8', roughness: 0.9,  metalness: 0 },
  flat_dark:      { color: '#222222', roughness: 0.8,  metalness: 0 },
  coffered:       { color: '#8B7355', roughness: 0.7,  metalness: 0 },
  tray:           { color: '#F0EDE8', roughness: 0.85, metalness: 0 },
  vaulted:        { color: '#F0EDE8', roughness: 0.8,  metalness: 0 },
  exposed_beams:  { color: '#6B4E31', roughness: 0.6,  metalness: 0 },
  concrete:       { color: '#888888', roughness: 0.95, metalness: 0 },
  wood_planks:    { color: '#A0522D', roughness: 0.7,  metalness: 0 },
  acoustic_panels:{ color: '#D4C8B8', roughness: 0.9,  metalness: 0 },
  barrel_vault:   { color: '#F0EDE8', roughness: 0.8,  metalness: 0 },
  dropped:        { color: '#F0EDE8', roughness: 0.85, metalness: 0 },
};

function getMaterial(ceilingType: string): { color: string; roughness: number; metalness: number } {
  return CEILING_MATERIALS[ceilingType] ?? CEILING_MATERIALS['flat_white'];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProceduralCeiling({ ceiling, selected, opacity = 1 }: ProceduralCeilingProps) {
  const geometry = useMemo(() => buildCeilingGeometry(ceiling), [ceiling]);

  const { color, roughness, metalness } = getMaterial(ceiling.ceilingType);

  return (
    <group>
      {/* Main ceiling mesh */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          roughness={roughness}
          metalness={metalness}
          transparent={opacity < 1}
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Selection highlight */}
      {selected && (
        <mesh geometry={geometry}>
          <meshBasicMaterial
            color="#C8C8C8"
            wireframe
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}