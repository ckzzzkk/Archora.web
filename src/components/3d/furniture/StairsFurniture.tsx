import React from 'react';
import * as THREE from 'three';
import { DS } from '../../../theme/designSystem';
import {
  buildStraightStaircase,
  buildLStaircase,
  buildSpiralStaircase,
} from '../../../utils/procedural/stairGeometry';

interface Props {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  dimensions: { x: number; y: number; z: number };
  color?: string;
  secondaryColor?: string;
  roughness?: number;
  metalness?: number;
  modelVariant?: string;
  selected?: boolean;
}

const outline = (selected?: boolean) => (selected ? DS.colors.warning : 'transparent');

// ---------------------------------------------------------------------------
// Straight staircase
// ---------------------------------------------------------------------------

export function StraightStaircase({
  position,
  rotation,
  dimensions,
  color = '#C0B8A8',
  secondaryColor = '#8A7060',
  roughness = 0.6,
  metalness = 0.05,
  selected,
}: Props) {
  const { x: width, y: totalRise, z: depth } = dimensions;
  const stepCount = 12;
  const geometry = buildStraightStaircase(width, totalRise, stepCount, 0.025, true);

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      <mesh castShadow receiveShadow geometry={geometry}>
        <meshStandardMaterial color={selected ? '#4A90D9' : color} roughness={roughness} metalness={metalness} />
      </mesh>
      {selected && (
        <mesh geometry={geometry}>
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// L staircase
// ---------------------------------------------------------------------------

export function LStaircase({
  position,
  rotation,
  dimensions,
  color = '#C0B8A8',
  secondaryColor = '#8A7060',
  roughness = 0.6,
  metalness = 0.05,
  selected,
}: Props) {
  const { x: width, y: totalRise, z: depth } = dimensions;
  const stepCount = 12;
  const stepH = totalRise / stepCount;
  const stepsPerFlight = Math.floor(stepCount / 2);
  const treadDepth = 0.25;
  const flight1Len = stepsPerFlight * treadDepth;

  const geometry = buildLStaircase(width, totalRise, stepCount, 0.025, true);

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      <mesh castShadow receiveShadow geometry={geometry}>
        <meshStandardMaterial color={selected ? '#4A90D9' : color} roughness={roughness} metalness={metalness} />
      </mesh>

      {/* Left stringer */}
      <mesh position={[-width / 2 - 0.04, totalRise / 2, -flight1Len / 2]} castShadow>
        <boxGeometry args={[0.06, totalRise * 0.92, flight1Len * 1.1]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Right stringer (at turn) */}
      <mesh position={[0, stepH * stepsPerFlight + totalRise / 2, -flight1Len]} castShadow>
        <boxGeometry args={[flight1Len * 1.1, totalRise * 0.92, 0.06]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Balusters */}
      {Array.from({ length: Math.floor(stepsPerFlight / 2) }).map((_, i) => (
        <mesh
          key={`bal-${i}`}
          position={[-width / 2, stepH * 2 * i + stepH / 2, -treadDepth * 2 * i + treadDepth]}
          castShadow
        >
          <boxGeometry args={[0.02, stepH * 0.8, 0.02]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.5} metalness={0.1} />
        </mesh>
      ))}

      {selected && (
        <mesh geometry={geometry}>
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Spiral staircase
// ---------------------------------------------------------------------------

export function SpiralStaircase({
  position,
  rotation,
  dimensions,
  color = '#A08060',
  secondaryColor = '#808080',
  roughness = 0.6,
  metalness = 0.05,
  selected,
}: Props) {
  const { x: width, y: totalRise, z: depth } = dimensions;
  const stepCount = 12;
  const geometry = buildSpiralStaircase(
    width,
    totalRise,
    stepCount,
    width * 0.33,  // innerRadius
    Math.PI * 2,   // sweepAngle full rotation
    0.025,
    false,
  );

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      <mesh castShadow receiveShadow geometry={geometry}>
        <meshStandardMaterial color={selected ? '#4A90D9' : color} roughness={roughness} metalness={metalness} />
      </mesh>
      {selected && (
        <mesh geometry={geometry}>
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}