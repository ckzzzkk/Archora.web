import { DS } from '../../../theme/designSystem';
import React from 'react';
import type { Vector3D } from '../../../types/blueprint';

interface Props {
  position: Vector3D;
  rotation: Vector3D;
  dimensions: Vector3D;
  color?: string;
  selected?: boolean;
}

const outline = (selected?: boolean) => selected ? DS.colors.warning : 'transparent';

export function TVMediaUnit({ position, rotation, dimensions, color = '#4A3830', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Cabinet body */}
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.05} />
      </mesh>
      {/* 3 door panels */}
      {[-0.33, 0, 0.33].map((t, i) => (
        <mesh key={i} position={[t * w, h * 0.38, d * 0.51]}>
          <boxGeometry args={[w * 0.3, h * 0.7, 0.015]} />
          <meshStandardMaterial color="#5A4840" roughness={0.35} metalness={0.05} />
        </mesh>
      ))}
      {/* Top shelf */}
      <mesh position={[0, h * 0.94, 0]} castShadow>
        <boxGeometry args={[w + 0.02, 0.02, d + 0.02]} />
        <meshStandardMaterial color="#6A5848" roughness={0.3} metalness={0.05} />
      </mesh>
      {/* Legs */}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * w * 0.44, h * 0.04, sz * d * 0.44]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, h * 0.08, 8]} />
          <meshStandardMaterial color="#B8A880" roughness={0.2} metalness={0.5} />
        </mesh>
      )))}
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h + 0.05, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function FloatingTVShelf({ position, rotation, dimensions, color = '#4A3830', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Shelf */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} />
      </mesh>
      {/* Wall bracket (hidden) */}
      <mesh position={[0, -h * 0.6, -d * 0.4]}>
        <boxGeometry args={[w * 0.6, h * 0.1, d * 0.4]} />
        <meshStandardMaterial color="#606060" roughness={0.3} metalness={0.7} />
      </mesh>
      {selected && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[w + 0.05, h + 0.05, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function FireplaceUnit({ position, rotation, dimensions, color = '#808080', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Surround body */}
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.05} />
      </mesh>
      {/* Fire opening */}
      <mesh position={[0, h * 0.3, d * 0.51]}>
        <boxGeometry args={[w * 0.6, h * 0.5, 0.01]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.9} metalness={0} />
      </mesh>
      {/* Flame glow (emissive) */}
      <mesh position={[0, h * 0.25, d * 0.49]}>
        <boxGeometry args={[w * 0.5, h * 0.35, 0.01]} />
        <meshStandardMaterial color="#FF6020" emissive="#FF4010" emissiveIntensity={0.5} roughness={1} metalness={0} />
      </mesh>
      {/* Mantle shelf */}
      <mesh position={[0, h * 1.02, 0]} castShadow>
        <boxGeometry args={[w + 0.1, h * 0.05, d + 0.08]} />
        <meshStandardMaterial color="#A09080" roughness={0.6} metalness={0} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h * 1.1 + 0.05, d + 0.12]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function ElectricFireplace({ position, rotation, dimensions, color = '#303030', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Slim unit body */}
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.3} />
      </mesh>
      {/* Screen / fire display */}
      <mesh position={[0, h * 0.5, d * 0.51]}>
        <boxGeometry args={[w * 0.9, h * 0.75, 0.01]} />
        <meshStandardMaterial color="#FF5010" emissive="#E04010" emissiveIntensity={0.6} roughness={0.5} metalness={0} />
      </mesh>
      {/* Frame */}
      <mesh position={[0, h * 0.5, d * 0.52]}>
        <boxGeometry args={[w * 0.94, h * 0.79, 0.005]} />
        <meshStandardMaterial color="#505050" roughness={0.2} metalness={0.5} wireframe />
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
