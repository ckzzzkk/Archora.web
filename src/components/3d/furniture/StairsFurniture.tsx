import { DS } from '../../../theme/designSystem';
import React from 'react';
import type { Vector3D } from '../../../types/blueprint';

interface Props {
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

const outline = (selected?: boolean) => selected ? DS.colors.warning : 'transparent';

export function SpiralStaircase({ position, rotation, dimensions, color = '#A08060', secondaryColor = '#808080', roughness = 0.6, metalness = 0.05, selected }: Props) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  const steps = 12;
  const poleRadius = 0.05;
  const stepHeight = h / steps;

  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Central pole */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[poleRadius, poleRadius, h, 10]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Steps in helix */}
      {Array.from({ length: steps }).map((_, i) => {
        const angle = (i / steps) * Math.PI * 2;
        const stepW = w * 0.42;
        const stepD = d * 0.4;
        const sx = Math.cos(angle) * w * 0.3;
        const sz = Math.sin(angle) * d * 0.3;
        return (
          <group key={i} position={[sx, stepHeight * i + stepHeight / 2, sz]} rotation={[0, angle, 0]}>
            <mesh position={[stepW / 2, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[stepW, stepHeight * 0.85, stepD]} />
              <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
            </mesh>
            {/* Guard rail post */}
            <mesh position={[stepW, 0, -stepD / 2 + 0.04]}>
              <boxGeometry args={[0.02, stepHeight * 0.5, 0.02]} />
              <meshStandardMaterial color={secondaryColor} roughness={0.3} metalness={0.6} />
            </mesh>
          </group>
        );
      })}

      {/* Top platform */}
      <mesh position={[0, h - stepHeight * 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[w * 0.38, w * 0.38, stepHeight, 16]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>

      {selected && (
        <mesh position={[0, h / 2, 0]}>
          <cylinderGeometry args={[w * 0.45, w * 0.45, h + 0.05, 12]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function LStaircase({ position, rotation, dimensions, color = '#C0B8A8', secondaryColor = '#8A7060', roughness = 0.6, metalness = 0.05, selected }: Props) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  const flights = 2;
  const stepsPerFlight = 8;
  const totalSteps = stepsPerFlight * flights;
  const stepHeight = h / totalSteps;
  const stepDepth = d / stepsPerFlight;

  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Flight 1 — runs along Z axis (going up) */}
      {Array.from({ length: stepsPerFlight }).map((_, i) => (
        <mesh
          key={`f1-${i}`}
          position={[0, stepHeight * i + stepHeight / 2, -stepDepth * i + stepDepth / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[w, stepHeight * 0.85, stepDepth * 0.9]} />
          <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
        </mesh>
      ))}

      {/* Landing platform between flights */}
      <mesh position={[0, stepHeight * stepsPerFlight - stepHeight / 2, -stepDepth * stepsPerFlight + stepDepth / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, stepHeight * 0.85, stepDepth * 1.2]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>

      {/* Flight 2 — runs along X axis (90° turn) */}
      {Array.from({ length: stepsPerFlight }).map((_, i) => (
        <mesh
          key={`f2-${i}`}
          position={[stepDepth * i - stepDepth / 2, stepHeight * stepsPerFlight + stepHeight * i + stepHeight / 2, -stepDepth * stepsPerFlight + stepDepth / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[stepDepth * 0.9, stepHeight * 0.85, w]} />
          <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
        </mesh>
      ))}

      {/* Stringer (side beam) */}
      <mesh position={[-w / 2 - 0.04, h / 2, -stepDepth * (stepsPerFlight - 1) / 2]} castShadow>
        <boxGeometry args={[0.06, h * 0.92, stepDepth * stepsPerFlight * 1.1]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[0, stepHeight * stepsPerFlight + h / 2, -stepDepth * stepsPerFlight + stepDepth / 2]} castShadow>
        <boxGeometry args={[stepDepth * stepsPerFlight * 1.1, h * 0.92, 0.06]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Balusters */}
      {Array.from({ length: Math.floor(stepsPerFlight / 2) }).map((_, i) => (
        <mesh key={`bal-${i}`} position={[-w / 2, stepHeight * 2 * i + stepHeight / 2, -stepDepth * 2 * i + stepDepth]} castShadow>
          <boxGeometry args={[0.02, stepHeight * 0.8, 0.02]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.5} metalness={0.1} />
        </mesh>
      ))}

      {selected && (
        <mesh position={[0, h / 2, -stepDepth * (stepsPerFlight - 1) / 2]}>
          <boxGeometry args={[w + 0.2, h + 0.05, stepDepth * stepsPerFlight + 0.2]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}
