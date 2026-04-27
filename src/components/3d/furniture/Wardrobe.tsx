import React from 'react';
import type { Vector3D } from '../../../types';

interface WardrobeProps {
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

export function Wardrobe({
  position,
  rotation,
  dimensions,
  color = '#5C4A2A',
  secondaryColor = '#2D2D2D',
  roughness = 0.6,
  metalness = 0.05,
  modelVariant = 'standard',
  selected = false,
}: WardrobeProps) {
  const { x: w, y: h, z: d } = dimensions;

  const isModern = modelVariant === 'modern';
  const isClassic = modelVariant === 'classic';
  const isMidCentury = modelVariant === 'mid_century';
  const hasCrownMolding = isClassic;
  const hasIntegratedHandle = isModern;
  const handleColor = isModern ? secondaryColor : '#C0C0C0';
  const handleMetalness = isModern ? 0.7 : 0.8;

  // Mid-century walnut tones
  const wardrobeColor = isMidCentury ? '#8B6914' : color;
  const wardrobeSec = isMidCentury ? '#5A4020' : secondaryColor;
  const c = selected ? '#4A90D9' : wardrobeColor;

  // Panel layout
  const panelCount = w > 1.4 ? 3 : 2;
  const panelW = w / panelCount;

  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Body */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>

      {/* Crown molding — classic */}
      {hasCrownMolding && (
        <mesh position={[0, h + 0.04, 0]} castShadow>
          <boxGeometry args={[w + 0.04, 0.08, d + 0.04]} />
          <meshStandardMaterial color={wardrobeSec} roughness={roughness * 0.9} metalness={metalness} />
        </mesh>
      )}

      {/* Kickplate at base */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[w - 0.04, 0.08, d - 0.02]} />
        <meshStandardMaterial color={wardrobeSec} roughness={roughness} metalness={metalness} />
      </mesh>

      {/* Door panels */}
      {Array.from({ length: panelCount }).map((_, i) => {
        const xPos = -w / 2 + panelW * (i + 0.5);
        return (
          <mesh key={i} position={[xPos, h * 0.5, d / 2 + 0.001]}>
            <boxGeometry args={[panelW - 0.04, h - 0.12, 0.015]} />
            <meshStandardMaterial color={isClassic ? wardrobeSec : wardrobeSec} roughness={roughness} metalness={metalness} />
          </mesh>
        );
      })}

      {/* Panel reveal lines */}
      {Array.from({ length: panelCount - 1 }).map((_, i) => (
        <mesh key={`divider-${i}`} position={[-w / 2 + panelW * (i + 1), h * 0.5, d / 2 + 0.002]}>
          <boxGeometry args={[0.012, h - 0.12, 0.01]} />
          <meshStandardMaterial color={wardrobeSec} roughness={0.4} metalness={0.6} />
        </mesh>
      ))}

      {/* Handles */}
      {hasIntegratedHandle ? (
        // Modern: long horizontal handle
        <mesh position={[0, h * 0.5, d / 2 + 0.018]}>
          <boxGeometry args={[panelW * 0.6, 0.018, 0.018]} />
          <meshStandardMaterial color={handleColor} roughness={0.2} metalness={handleMetalness} />
        </mesh>
      ) : (
        // Classic/standard: round knobs
        Array.from({ length: panelCount }).map((_, i) => {
          const xPos = -w / 2 + panelW * (i + 0.5);
          return (
            <mesh key={`knob-${i}`} position={[xPos, h * 0.5, d / 2 + 0.02]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshStandardMaterial color={handleColor} roughness={0.2} metalness={handleMetalness} />
            </mesh>
          );
        })
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
