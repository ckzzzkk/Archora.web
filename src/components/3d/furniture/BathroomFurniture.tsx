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
  isOn?: boolean;
}

const outline = (selected?: boolean) => selected ? DS.colors.warning : 'transparent';

export function FreestandingBath({ position, rotation, dimensions, color = '#F5F5F5', secondaryColor = '#C8B888', roughness = 0.1, metalness = 0.05, selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Main tub body */}
      <mesh position={[0, h * 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.75, d]} />
        <meshStandardMaterial color={selected ? '#4A90D9' : color} roughness={roughness} metalness={metalness} />
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
          <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.5} />
        </mesh>
      )))}
      {/* Tap */}
      <mesh position={[0, h * 0.85, -d * 0.42]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, h * 0.2, 8]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.1} metalness={0.8} />
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

export function Toilet({ position, rotation, dimensions, color = '#E8E8E8', secondaryColor = '#C0C0C0', roughness = 0.3, metalness = 0.05, selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  const c = selected ? '#4A90D9' : color;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Tank */}
      <mesh position={[0, h * 0.65, -d * 0.25]} castShadow>
        <boxGeometry args={[w * 0.9, h * 0.4, d * 0.35]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>
      {/* Tank lid */}
      <mesh position={[0, h * 0.86, -d * 0.25]} castShadow>
        <boxGeometry args={[w * 0.95, h * 0.06, d * 0.38]} />
        <meshStandardMaterial color={c} roughness={roughness * 0.7} metalness={metalness} />
      </mesh>
      {/* Bowl — flattened sphere */}
      <mesh position={[0, h * 0.25, d * 0.08]} castShadow>
        <sphereGeometry args={[w * 0.42, 16, 12]} />
        <meshStandardMaterial color={c} roughness={roughness * 0.7} metalness={metalness} />
      </mesh>
      {/* Seat disc */}
      <mesh position={[0, h * 0.34, d * 0.12]}>
        <cylinderGeometry args={[w * 0.38, w * 0.38, 0.04, 20]} />
        <meshStandardMaterial color={c} roughness={roughness * 0.5} metalness={metalness} />
      </mesh>
      {/* Base */}
      <mesh position={[0, h * 0.08, d * 0.05]} castShadow>
        <boxGeometry args={[w * 0.5, h * 0.15, d * 0.55]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.1, h + 0.1, d + 0.1]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function BathroomSink({ position, rotation, dimensions, color = '#E8E8E8', secondaryColor = '#C0B8A8', roughness = 0.4, metalness = 0.05, selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  const c = selected ? '#4A90D9' : color;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Vanity cabinet */}
      <mesh position={[0, h * 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.85, d]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>
      {/* Cabinet door divider */}
      <mesh position={[0, h * 0.45, d / 2 + 0.002]}>
        <boxGeometry args={[0.015, h * 0.8, 0.01]} />
        <meshStandardMaterial color={secondaryColor} roughness={roughness} metalness={metalness * 2} />
      </mesh>
      {/* Door handles */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.04, h * 0.45, d / 2 + 0.015]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.8} />
        </mesh>
      ))}
      {/* Basin — flattened hemisphere on top */}
      <mesh position={[0, h * 0.9, 0]} scale={[1, 0.45, 1]} castShadow>
        <sphereGeometry args={[Math.min(w, d) * 0.42, 16, 12]} />
        <meshStandardMaterial color={c} roughness={0.1} metalness={0.05} />
      </mesh>
      {/* Tap */}
      <mesh position={[0, h * 1.05, d * 0.2]} rotation={[Math.PI * 0.1, 0, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, h * 0.2, 8]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Tap head */}
      <mesh position={[0, h * 1.14, d * 0.24]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.1} metalness={0.8} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.08, h + 0.08, d + 0.08]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function Bathtub({ position, rotation, dimensions, color = '#F5F5F5', secondaryColor = '#C8B888', roughness = 0.1, metalness = 0.05, selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  const c = selected ? '#4A90D9' : color;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Tub body */}
      <mesh position={[0, h * 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.75, d]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>
      {/* Inner hollow */}
      <mesh position={[0, h * 0.62, 0]}>
        <boxGeometry args={[w * 0.82, h * 0.35, d * 0.82]} />
        <meshStandardMaterial color="#C8D8E0" roughness={0.05} metalness={0.05} transparent opacity={0.6} />
      </mesh>
      {/* Rim top */}
      <mesh position={[0, h * 0.78, 0]} castShadow>
        <boxGeometry args={[w + 0.04, h * 0.04, d + 0.04]} />
        <meshStandardMaterial color={c} roughness={0.08} metalness={0.05} />
      </mesh>
      {/* Claw feet */}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * w * 0.38, h * 0.06, sz * d * 0.4]} castShadow>
          <cylinderGeometry args={[0.04, 0.06, h * 0.12, 6]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.5} />
        </mesh>
      )))}
      {/* Tap */}
      <mesh position={[w * 0.38, h * 0.85, -d * 0.35]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, h * 0.22, 8]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.1} metalness={0.8} />
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

export function CornerBath({ position, rotation, dimensions, color = '#F5F5F5', secondaryColor = '#C0C0C0', roughness = 0.1, metalness = 0.05, selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  const c = selected ? '#4A90D9' : color;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Corner triangular base */}
      <mesh position={[0, h * 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.7, d]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>
      {/* Inner basin */}
      <mesh position={[0, h * 0.65, 0]}>
        <boxGeometry args={[w * 0.75, h * 0.15, d * 0.75]} />
        <meshStandardMaterial color="#C0D8E0" roughness={0.05} metalness={0.1} transparent opacity={0.7} />
      </mesh>
      {/* Rim */}
      <mesh position={[0, h * 0.73, 0]} castShadow>
        <boxGeometry args={[w + 0.02, h * 0.03, d + 0.02]} />
        <meshStandardMaterial color={c} roughness={0.08} metalness={0.05} />
      </mesh>
      {/* Jets panel */}
      <mesh position={[-w * 0.42, h * 0.5, 0]} castShadow>
        <boxGeometry args={[0.02, h * 0.4, d * 0.6]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.1} />
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
