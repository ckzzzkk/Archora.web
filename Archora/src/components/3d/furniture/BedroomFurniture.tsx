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

export function KingBed({ position, rotation, dimensions, color = '#D0C8B8', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Frame */}
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#5A4030" roughness={0.6} metalness={0} />
      </mesh>
      {/* Mattress */}
      <mesh position={[0, h * 1.1, 0]} castShadow>
        <boxGeometry args={[w - 0.06, h * 0.3, d - 0.06]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
      </mesh>
      {/* Tall headboard */}
      <mesh position={[0, h * 1.5, -d * 0.47]} castShadow>
        <boxGeometry args={[w, h * 1.5, h * 0.1]} />
        <meshStandardMaterial color="#4A3020" roughness={0.5} metalness={0} />
      </mesh>
      {/* Pillows */}
      {[-0.3, 0.3].map((offset) => (
        <mesh key={offset} position={[offset, h * 1.3, -d * 0.3]} castShadow>
          <boxGeometry args={[0.5, 0.14, 0.7]} />
          <meshStandardMaterial color="#F0EDE8" roughness={0.95} metalness={0} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h * 2 + 0.05, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function PlatformBed({ position, rotation, dimensions, color = '#5A4030', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Low platform frame */}
      <mesh position={[0, h * 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.1, h * 0.5, d + 0.1]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Mattress */}
      <mesh position={[0, h * 0.75, 0]} castShadow>
        <boxGeometry args={[w - 0.02, h * 0.3, d - 0.02]} />
        <meshStandardMaterial color="#E8E4DC" roughness={0.9} metalness={0} />
      </mesh>
      {/* Low headboard */}
      <mesh position={[0, h * 0.8, -d * 0.48]} castShadow>
        <boxGeometry args={[w + 0.1, h * 0.7, h * 0.08]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.05} />
      </mesh>
      {/* Pillows */}
      {[-0.3, 0.3].map((offset) => (
        <mesh key={offset} position={[offset, h * 0.95, -d * 0.28]} castShadow>
          <boxGeometry args={[0.45, 0.12, 0.65]} />
          <meshStandardMaterial color="#F5F5F0" roughness={0.95} metalness={0} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.15, h * 1.5, d + 0.15]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function BunkBed({ position, rotation, dimensions, color = '#9A7850', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  const frameH = h * 0.1;
  const mattressH = h * 0.08;
  const tier1Y = h * 0.2;
  const tier2Y = h * 0.6;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* 4 corner posts */}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * (w * 0.45), h * 0.5, sz * (d * 0.45)]} castShadow>
          <boxGeometry args={[0.06, h, 0.06]} />
          <meshStandardMaterial color={color} roughness={0.6} metalness={0} />
        </mesh>
      )))}
      {/* Bottom bunk frame */}
      <mesh position={[0, tier1Y, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.08, frameH, d - 0.08]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0} />
      </mesh>
      <mesh position={[0, tier1Y + frameH / 2 + mattressH / 2, 0]} castShadow>
        <boxGeometry args={[w - 0.12, mattressH, d - 0.12]} />
        <meshStandardMaterial color="#E8E4DC" roughness={0.9} metalness={0} />
      </mesh>
      {/* Top bunk frame */}
      <mesh position={[0, tier2Y, 0]} castShadow>
        <boxGeometry args={[w - 0.08, frameH, d - 0.08]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0} />
      </mesh>
      <mesh position={[0, tier2Y + frameH / 2 + mattressH / 2, 0]} castShadow>
        <boxGeometry args={[w - 0.12, mattressH, d - 0.12]} />
        <meshStandardMaterial color="#E8E4DC" roughness={0.9} metalness={0} />
      </mesh>
      {/* Ladder */}
      <mesh position={[w * 0.45, h * 0.4, d * 0.4]} castShadow>
        <boxGeometry args={[0.04, h * 0.6, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0} />
      </mesh>
      {[0.25, 0.5].map((t) => (
        <mesh key={t} position={[w * 0.45, h * t, d * 0.4]} castShadow>
          <boxGeometry args={[0.2, 0.03, 0.04]} />
          <meshStandardMaterial color={color} roughness={0.6} metalness={0} />
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

export function Crib({ position, rotation, dimensions, color = '#FFFFFF', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Base mattress platform */}
      <mesh position={[0, h * 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.1, h * 0.08, d - 0.1]} />
        <meshStandardMaterial color="#E8E4DC" roughness={0.9} metalness={0} />
      </mesh>
      {/* Corner posts */}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * (w * 0.46), h * 0.5, sz * (d * 0.46)]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, h, 8]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0} />
        </mesh>
      )))}
      {/* Rails — vertical slats */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} position={[(i - 3) * (w / 7), h * 0.65, d * 0.45]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, h * 0.65, 6]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0} />
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

export function ToddlerBed({ position, rotation, dimensions, color = '#FFFFFF', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Frame */}
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0} />
      </mesh>
      {/* Mattress */}
      <mesh position={[0, h * 1.1, 0]} castShadow>
        <boxGeometry args={[w - 0.06, h * 0.25, d - 0.06]} />
        <meshStandardMaterial color="#F0EDE8" roughness={0.9} metalness={0} />
      </mesh>
      {/* Headboard */}
      <mesh position={[0, h * 1.4, -d * 0.48]} castShadow>
        <boxGeometry args={[w, h * 0.8, h * 0.06]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0} />
      </mesh>
      {/* Guard rail */}
      <mesh position={[w * 0.3, h * 1.3, d * 0.46]} castShadow>
        <boxGeometry args={[w * 0.4, h * 0.5, 0.03]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0} />
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

export function VanityDesk({ position, rotation, dimensions, color = '#D8D0C8', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Desk */}
      <mesh position={[0, h * 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.5, d * 0.5]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.05} />
      </mesh>
      {/* Mirror */}
      <mesh position={[0, h * 0.72, -d * 0.15]} castShadow>
        <boxGeometry args={[w * 0.8, h * 0.45, 0.03]} />
        <meshStandardMaterial color="#D0E0E0" roughness={0.05} metalness={0.8} />
      </mesh>
      {/* Mirror frame */}
      <mesh position={[0, h * 0.72, -d * 0.155]}>
        <boxGeometry args={[w * 0.84, h * 0.49, 0.025]} />
        <meshStandardMaterial color="#C0A878" roughness={0.3} metalness={0.3} wireframe />
      </mesh>
      {/* Stool */}
      <mesh position={[0, h * 0.15, d * 0.4]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.6, h * 0.22, d * 0.35]} />
        <meshStandardMaterial color="#D8C8B0" roughness={0.7} metalness={0} />
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

export function ChangingTable({ position, rotation, dimensions, color = '#FFFFFF', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Base cabinet */}
      <mesh position={[0, h * 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.7, d]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0} />
      </mesh>
      {/* Changing pad */}
      <mesh position={[0, h * 0.74, 0]} castShadow>
        <boxGeometry args={[w - 0.04, h * 0.07, d - 0.04]} />
        <meshStandardMaterial color="#90C090" roughness={0.9} metalness={0} />
      </mesh>
      {/* Raised sides */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * w * 0.46, h * 0.85, 0]} castShadow>
          <boxGeometry args={[h * 0.04, h * 0.25, d]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0} />
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
