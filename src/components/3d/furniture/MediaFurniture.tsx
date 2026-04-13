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

export function TVMediaUnit({ position, rotation, dimensions, color = '#4A3830', secondaryColor = '#B8A880', roughness = 0.4, metalness = 0.05, selected }: Props) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Cabinet body */}
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>
      {/* 3 door panels */}
      {[-0.33, 0, 0.33].map((t, i) => (
        <mesh key={i} position={[t * w, h * 0.38, d * 0.51]}>
          <boxGeometry args={[w * 0.3, h * 0.7, 0.015]} />
          <meshStandardMaterial color={secondaryColor} roughness={roughness} metalness={metalness} />
        </mesh>
      ))}
      {/* Top shelf */}
      <mesh position={[0, h * 0.94, 0]} castShadow>
        <boxGeometry args={[w + 0.02, 0.02, d + 0.02]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.3} metalness={0.05} />
      </mesh>
      {/* Legs */}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * w * 0.44, h * 0.04, sz * d * 0.44]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, h * 0.08, 8]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.5} />
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

export function FloatingTVShelf({ position, rotation, dimensions, color = '#4A3830', secondaryColor = '#606060', roughness = 0.35, metalness = 0.05, selected }: Props) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Shelf */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>
      {/* Wall bracket */}
      <mesh position={[0, -h * 0.6, -d * 0.4]}>
        <boxGeometry args={[w * 0.6, h * 0.1, d * 0.4]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.3} metalness={0.7} />
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

export function FireplaceUnit({ position, rotation, dimensions, color = '#808080', secondaryColor = '#A09080', roughness = 0.8, metalness = 0.05, selected }: Props) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Surround body */}
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
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
        <meshStandardMaterial color={secondaryColor} roughness={0.6} metalness={0} />
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

export function TVStand({ position, rotation, dimensions, color = '#4A3830', secondaryColor = '#C0C0C0', roughness = 0.4, metalness = 0.05, selected }: Props) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Wide low cabinet */}
      <mesh position={[0, h * 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.55, d]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>
      {/* Two cabinet doors */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * w * 0.25, h * 0.26, d / 2 + 0.002]}>
          <boxGeometry args={[w * 0.45, h * 0.5, 0.015]} />
          <meshStandardMaterial color={secondaryColor} roughness={roughness * 0.9} metalness={metalness} />
        </mesh>
      ))}
      {/* Door handles */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.05, h * 0.26, d / 2 + 0.018]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.8} />
        </mesh>
      ))}
      {/* Open shelf gap */}
      <mesh position={[0, h * 0.58, d / 2 + 0.002]}>
        <boxGeometry args={[w * 0.5, h * 0.08, 0.01]} />
        <meshStandardMaterial color="#2A2018" roughness={0.6} metalness={0.05} />
      </mesh>
      {/* Two end pedestals/legs */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * w * 0.43, h * 0.06, 0]} castShadow>
          <boxGeometry args={[0.06, h * 0.12, d * 0.85]} />
          <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, h * 0.28, 0]}>
          <boxGeometry args={[w + 0.05, h * 0.6 + 0.05, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function ElectricFireplace({ position, rotation, dimensions, color = '#303030', secondaryColor = '#505050', roughness = 0.2, metalness = 0.3, selected }: Props) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Slim unit body */}
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>
      {/* Screen / fire display */}
      <mesh position={[0, h * 0.5, d * 0.51]}>
        <boxGeometry args={[w * 0.9, h * 0.75, 0.01]} />
        <meshStandardMaterial color="#FF5010" emissive="#E04010" emissiveIntensity={0.6} roughness={0.5} metalness={0} />
      </mesh>
      {/* Frame */}
      <mesh position={[0, h * 0.5, d * 0.52]}>
        <boxGeometry args={[w * 0.94, h * 0.79, 0.005]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.5} wireframe />
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
