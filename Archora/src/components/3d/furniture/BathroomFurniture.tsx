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

export function FreestandingBath({ position, rotation, dimensions, color = '#F5F5F5', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Main tub body — slightly tapered using scale */}
      <mesh position={[0, h * 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.75, d]} />
        <meshStandardMaterial color={color} roughness={0.1} metalness={0.05} />
      </mesh>
      {/* Inner water area */}
      <mesh position={[0, h * 0.7, 0]}>
        <boxGeometry args={[w * 0.8, h * 0.1, d * 0.8]} />
        <meshStandardMaterial color="#C0D8E0" roughness={0.05} metalness={0.1} transparent opacity={0.7} />
      </mesh>
      {/* Rim */}
      <mesh position={[0, h * 0.78, 0]} castShadow>
        <boxGeometry args={[w + 0.04, h * 0.04, d + 0.04]} />
        <meshStandardMaterial color={color} roughness={0.08} metalness={0.05} />
      </mesh>
      {/* Claw feet */}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * w * 0.36, h * 0.06, sz * d * 0.38]} castShadow>
          <cylinderGeometry args={[0.04, 0.06, h * 0.12, 6]} />
          <meshStandardMaterial color="#C8B888" roughness={0.2} metalness={0.5} />
        </mesh>
      )))}
      {/* Tap */}
      <mesh position={[0, h * 0.85, -d * 0.42]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, h * 0.2, 8]} />
        <meshStandardMaterial color="#C8C8C8" roughness={0.1} metalness={0.8} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.1, h + 0.05, d + 0.1]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function CornerBath({ position, rotation, dimensions, color = '#F5F5F5', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Corner triangular base — use two boxes */}
      <mesh position={[0, h * 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.7, d]} />
        <meshStandardMaterial color={color} roughness={0.1} metalness={0.05} />
      </mesh>
      {/* Inner basin */}
      <mesh position={[0, h * 0.65, 0]}>
        <boxGeometry args={[w * 0.75, h * 0.15, d * 0.75]} />
        <meshStandardMaterial color="#C0D8E0" roughness={0.05} metalness={0.1} transparent opacity={0.7} />
      </mesh>
      {/* Rim */}
      <mesh position={[0, h * 0.73, 0]} castShadow>
        <boxGeometry args={[w + 0.02, h * 0.03, d + 0.02]} />
        <meshStandardMaterial color={color} roughness={0.08} metalness={0.05} />
      </mesh>
      {/* Jets panel */}
      <mesh position={[-w * 0.42, h * 0.5, 0]} castShadow>
        <boxGeometry args={[0.02, h * 0.4, d * 0.6]} />
        <meshStandardMaterial color="#E8E8E8" roughness={0.2} metalness={0.1} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h + 0.05, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}
