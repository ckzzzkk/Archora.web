import React from 'react';
import type { Vector3D } from '../../../types/blueprint';

interface Props {
  position: Vector3D;
  rotation: Vector3D;
  dimensions: Vector3D;
  color?: string;
  selected?: boolean;
}

const outline = (selected?: boolean) => selected ? '#FFD700' : '#000000';

export function RoundDiningTable({ position, rotation, dimensions, color = '#9A7850', selected }: Props) {
  const { x: w, y: h } = dimensions;
  const radius = w / 2;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Tabletop */}
      <mesh position={[0, h, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, h * 0.05, 32]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.05} />
      </mesh>
      {/* Pedestal */}
      <mesh position={[0, h * 0.5, 0]} castShadow>
        <cylinderGeometry args={[radius * 0.12, radius * 0.15, h * 0.9, 16]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0} />
      </mesh>
      {/* Base */}
      <mesh position={[0, h * 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.4, radius * 0.4, h * 0.04, 16]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <cylinderGeometry args={[radius + 0.05, radius + 0.05, h + 0.05, 32]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function OvalDiningTable({ position, rotation, dimensions, color = '#9A7850', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Oval top — use scaled cylinder */}
      <mesh position={[0, h, 0]} scale={[1, 1, d / w]} castShadow receiveShadow>
        <cylinderGeometry args={[w / 2, w / 2, h * 0.05, 32]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.05} />
      </mesh>
      {/* Two pedestal legs */}
      {[-0.3, 0.3].map((t) => (
        <mesh key={t} position={[t * w, h * 0.5, 0]} castShadow>
          <boxGeometry args={[0.06, h * 0.9, 0.06]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0} />
        </mesh>
      ))}
      {/* Base runners */}
      {[-0.3, 0.3].map((t) => (
        <mesh key={t} position={[t * w, h * 0.04, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.04, 0.04, d * 0.7]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.1, h + 0.05, d + 0.1]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function BarStool({ position, rotation, dimensions, color = '#6A4828', selected }: Props) {
  const { x: w, y: h } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Seat */}
      <mesh position={[0, h * 0.95, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[w * 0.45, w * 0.4, h * 0.08, 16]} />
        <meshStandardMaterial color="#8A7A6A" roughness={0.7} metalness={0} />
      </mesh>
      {/* Post */}
      <mesh position={[0, h * 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, h * 0.85, 8]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.7} />
      </mesh>
      {/* Footrest ring */}
      <mesh position={[0, h * 0.35, 0]} castShadow>
        <torusGeometry args={[w * 0.3, 0.015, 8, 24]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.7} />
      </mesh>
      {/* Base */}
      <mesh position={[0, h * 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[w * 0.35, w * 0.38, h * 0.03, 6]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.7} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <cylinderGeometry args={[w * 0.5 + 0.03, w * 0.5 + 0.03, h + 0.05, 16]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}
