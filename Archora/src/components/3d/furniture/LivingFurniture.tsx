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

export function CurvedSofa({ position, rotation, dimensions, color = '#8A7A6A', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Base */}
      <mesh position={[0, h * 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.35, d]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
      </mesh>
      {/* Back — slightly curved via scale */}
      <mesh position={[0, h * 0.7, -d * 0.4]} scale={[1, 1, 0.15]} castShadow>
        <cylinderGeometry args={[h * 0.4, h * 0.38, w, 16, 1, false, -Math.PI * 0.1, Math.PI * 1.2]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
      </mesh>
      {/* Armrests */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * w * 0.45, h * 0.6, 0]} castShadow>
          <boxGeometry args={[w * 0.06, h * 0.6, d * 0.85]} />
          <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
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

export function LSofa({ position, rotation, dimensions, color = '#8A7A6A', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Main section */}
      <mesh position={[0, h * 0.2, -d * 0.25]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.35, d * 0.5]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
      </mesh>
      {/* L section */}
      <mesh position={[w * 0.25, h * 0.2, d * 0.25]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.5, h * 0.35, d * 0.5]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
      </mesh>
      {/* Backs */}
      <mesh position={[0, h * 0.7, -d * 0.48]} castShadow>
        <boxGeometry args={[w, h * 0.6, h * 0.12]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
      </mesh>
      <mesh position={[-w * 0.45, h * 0.7, d * 0.05]} castShadow>
        <boxGeometry args={[h * 0.12, h * 0.6, d * 0.45]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
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

export function SectionalSofa({ position, rotation, dimensions, color = '#8A7A6A', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* 3-section base */}
      {[-1, 0, 1].map((i) => (
        <mesh key={i} position={[i * w * 0.33, h * 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[w * 0.33, h * 0.4, d * 0.65]} />
          <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
        </mesh>
      ))}
      {/* Back */}
      <mesh position={[0, h * 0.75, -d * 0.3]} castShadow>
        <boxGeometry args={[w, h * 0.65, h * 0.12]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
      </mesh>
      {/* Corner chaise */}
      <mesh position={[w * 0.4, h * 0.22, d * 0.3]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.2, h * 0.4, d * 0.5]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
      </mesh>
      {/* Armrests */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * w * 0.46, h * 0.55, 0]} castShadow>
          <boxGeometry args={[w * 0.04, h * 0.5, d * 0.6]} />
          <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
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

export function BarUnit({ position, rotation, dimensions, color = '#8A6840', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Cabinet base */}
      <mesh position={[0, h * 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.6, d]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.05} />
      </mesh>
      {/* Counter top */}
      <mesh position={[0, h * 0.62, 0]} castShadow>
        <boxGeometry args={[w + 0.05, h * 0.04, d + 0.02]} />
        <meshStandardMaterial color="#D8C8A0" roughness={0.3} metalness={0.05} />
      </mesh>
      {/* Shelf / upper section */}
      <mesh position={[0, h * 0.85, -d * 0.3]} castShadow>
        <boxGeometry args={[w, h * 0.4, d * 0.05]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.05} />
      </mesh>
      {/* Glass bottles (decorative) */}
      {[-1, 0, 1].map((i) => (
        <mesh key={i} position={[i * w * 0.25, h * 1.05, -d * 0.28]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, h * 0.2, 8]} />
          <meshStandardMaterial color="#80A8B0" roughness={0.05} metalness={0.1} transparent opacity={0.7} />
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

export function RoomDivider({ position, rotation, dimensions, color = '#B8A890', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  const panelCount = 3;
  const panelW = w / panelCount;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {Array.from({ length: panelCount }).map((_, i) => {
        const angle = i % 2 === 0 ? 0 : Math.PI * 0.12;
        return (
          <group key={i} position={[(-w / 2) + panelW * i + panelW / 2, 0, 0]} rotation={[0, angle, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[panelW - 0.03, h, d]} />
              <meshStandardMaterial color={color} roughness={0.8} metalness={0} />
            </mesh>
            {/* Frame border */}
            <mesh>
              <boxGeometry args={[panelW - 0.01, h + 0.02, d + 0.01]} />
              <meshStandardMaterial color="#5A4830" roughness={0.5} metalness={0} wireframe />
            </mesh>
          </group>
        );
      })}
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h + 0.05, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}
