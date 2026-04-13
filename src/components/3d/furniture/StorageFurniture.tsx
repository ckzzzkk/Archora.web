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

export function WalkInWardrobe({ position, rotation, dimensions, color = '#C0B8A8', secondaryColor = '#B0A890', roughness = 0.5, metalness = 0.05, selected }: Props) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Main cabinet body */}
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>
      {/* Door panels (4 sliding doors) */}
      {[-0.375, -0.125, 0.125, 0.375].map((t, i) => (
        <mesh key={i} position={[t * w, h * 0.5, d * 0.51]}>
          <boxGeometry args={[w * 0.24, h * 0.95, 0.02]} />
          <meshStandardMaterial color={secondaryColor} roughness={roughness * 0.8} metalness={metalness} />
        </mesh>
      ))}
      {/* Handles */}
      {[-0.375, -0.125, 0.125, 0.375].map((t, i) => (
        <mesh key={i} position={[t * w + w * 0.08, h * 0.5, d * 0.52]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.6} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h + 0.05, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function FullWallBookcase({ position, rotation, dimensions, color = '#9A7850', secondaryColor = '#5A4830', roughness = 0.6, metalness = 0.0, selected }: Props) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  const shelfCount = 5;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Back panel */}
      <mesh position={[0, h * 0.5, -d * 0.45]} castShadow receiveShadow>
        <boxGeometry args={[w, h, 0.02]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>
      {/* Side panels */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * w * 0.49, h * 0.5, 0]} castShadow>
          <boxGeometry args={[0.03, h, d]} />
          <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
        </mesh>
      ))}
      {/* Shelves */}
      {Array.from({ length: shelfCount }).map((_, i) => (
        <mesh key={i} position={[0, h * (i / (shelfCount - 1)), 0]} castShadow>
          <boxGeometry args={[w, 0.03, d]} />
          <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
        </mesh>
      ))}
      {/* Books decoration */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[(-w / 2 + 0.1) + i * (w / 7), h * 0.5, 0]} castShadow>
          <boxGeometry args={[0.04, h * 0.14, d * 0.7]} />
          <meshStandardMaterial color={['#C83030', '#3050A0', '#205020', '#A04010', '#601060', '#808020'][i]} roughness={0.8} metalness={0} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h + 0.05, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function ModularShelving({ position, rotation, dimensions, color = '#C8C0B0', secondaryColor = '#808080', roughness = 0.5, metalness = 0.05, selected }: Props) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Vertical uprights */}
      {[-0.5, -0.17, 0.17, 0.5].map((t) => (
        <mesh key={t} position={[t * w, h * 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.025, h, d]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.3} metalness={0.7} />
        </mesh>
      ))}
      {/* Shelves */}
      {[0.15, 0.38, 0.62, 0.85].map((t) => (
        <mesh key={t} position={[0, t * h, 0]} castShadow>
          <boxGeometry args={[w, 0.025, d]} />
          <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h + 0.05, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function HomeOfficeDesk({ position, rotation, dimensions, color = '#A08060', secondaryColor = '#333333', roughness = 0.4, metalness = 0.05, selected }: Props) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Main desk surface */}
      <mesh position={[0, h, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.05, d]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>
      {/* Left pedestal */}
      <mesh position={[-w * 0.4, h * 0.5, 0]} castShadow>
        <boxGeometry args={[w * 0.2, h, d * 0.8]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>
      {/* Right leg */}
      <mesh position={[w * 0.42, h * 0.5, 0]} castShadow>
        <boxGeometry args={[0.05, h, 0.05]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.4} metalness={0.05} />
      </mesh>
      {/* Monitor */}
      <mesh position={[-w * 0.05, h * 1.45, -d * 0.3]} castShadow>
        <boxGeometry args={[w * 0.4, h * 0.55, 0.03]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.3} metalness={0.3} />
      </mesh>
      {/* Keyboard */}
      <mesh position={[0, h * 1.04, d * 0.1]} castShadow>
        <boxGeometry args={[w * 0.3, 0.02, d * 0.15]} />
        <meshStandardMaterial color="#333333" roughness={0.6} metalness={0.1} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h * 2 + 0.05, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function CornerDesk({ position, rotation, dimensions, color = '#A08060', secondaryColor = '#8A7060', roughness = 0.4, metalness = 0.05, selected }: Props) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* L-shaped surface — two rectangles */}
      <mesh position={[0, h, -d * 0.25]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.05, d * 0.5]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>
      <mesh position={[-w * 0.25, h, d * 0.25]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.5, h * 0.05, d * 0.5]} />
        <meshStandardMaterial color={c} roughness={roughness} metalness={metalness} />
      </mesh>
      {/* 3 corner legs */}
      {[[-w * 0.46, -d * 0.46], [w * 0.46, -d * 0.46], [-w * 0.46, d * 0.46]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, h * 0.5, lz]} castShadow>
          <boxGeometry args={[0.05, h, 0.05]} />
          <meshStandardMaterial color={secondaryColor} roughness={roughness} metalness={metalness} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h * 1.5, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}
