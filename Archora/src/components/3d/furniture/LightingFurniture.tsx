import React from 'react';
import type { Vector3D } from '../../../types/blueprint';

interface Props {
  position: Vector3D;
  rotation: Vector3D;
  dimensions: Vector3D;
  color?: string;
  selected?: boolean;
  isOn?: boolean;
}

const outline = (selected?: boolean) => selected ? '#FFD700' : '#000000';

export function FloorLamp({ position, rotation, dimensions, color = '#C0C0C0', selected, isOn = true }: Props) {
  const { x: w, y: h } = dimensions;
  const poleRadius = w * 0.03;
  const baseRadius = w * 0.18;
  const shadeRadius = w * 0.22;
  const shadeHeight = h * 0.18;
  const poleHeight = h * 0.72;
  const shadeY = h * 0.86;

  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Base disc */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[baseRadius, baseRadius * 1.1, 0.04, 24]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Pole */}
      <mesh position={[0, poleHeight * 0.5 + 0.04, 0]} castShadow>
        <cylinderGeometry args={[poleRadius, poleRadius, poleHeight, 12]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Shade (cone) */}
      <mesh position={[0, shadeY, 0]} castShadow>
        <coneGeometry args={[shadeRadius, shadeHeight, 20, 1, true]} />
        <meshStandardMaterial color="#E8D8B0" roughness={0.8} metalness={0.0} side={2} />
      </mesh>

      {/* Shade top cap */}
      <mesh position={[0, shadeY + shadeHeight * 0.5, 0]}>
        <cylinderGeometry args={[shadeRadius * 0.18, shadeRadius * 0.18, 0.01, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Point light at shade */}
      {isOn && (
        <pointLight
          position={[0, shadeY - shadeHeight * 0.2, 0]}
          intensity={1.5}
          distance={4}
          decay={2}
          color="#FFF5E0"
          castShadow
        />
      )}

      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w * 0.6 + 0.05, h + 0.05, w * 0.6 + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function PendantLight({ position, rotation, dimensions, color = '#B0A030', selected, isOn = true }: Props) {
  const { x: w, y: h } = dimensions;
  const cableRadius = 0.008;
  const cableLength = h * 0.55;
  const shadeRadius = w * 0.28;
  const shadeHeight = h * 0.28;
  const shadeY = h - cableLength - shadeHeight * 0.5;

  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Ceiling mount */}
      <mesh position={[0, h - 0.02, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.04, 12]} />
        <meshStandardMaterial color="#808080" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Cable */}
      <mesh position={[0, h - 0.04 - cableLength * 0.5, 0]}>
        <cylinderGeometry args={[cableRadius, cableRadius, cableLength, 8]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.9} metalness={0.0} />
      </mesh>

      {/* Shade (inverted cone) */}
      <mesh position={[0, shadeY, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[shadeRadius, shadeHeight, 24, 1, true]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} side={2} />
      </mesh>

      {/* Bottom rim */}
      <mesh position={[0, shadeY - shadeHeight * 0.5, 0]}>
        <torusGeometry args={[shadeRadius, 0.008, 8, 32]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Point light */}
      {isOn && (
        <pointLight
          position={[0, shadeY - shadeHeight * 0.3, 0]}
          intensity={2.0}
          distance={5}
          decay={2}
          color="#FFF8E8"
          castShadow
        />
      )}

      {selected && (
        <mesh position={[0, shadeY, 0]}>
          <boxGeometry args={[shadeRadius * 2 + 0.05, shadeHeight + 0.05, shadeRadius * 2 + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}
