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

export function GardenSofaSet({ position, rotation, dimensions, color = '#8A9080', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      <mesh position={[0, h * 0.2, -d * 0.1]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.4, d * 0.8]} />
        <meshStandardMaterial color="#5A6050" roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh position={[0, h * 0.45, -d * 0.1]} castShadow>
        <boxGeometry args={[w, h * 0.5, h * 0.12]} />
        <meshStandardMaterial color="#5A6050" roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh position={[0, h * 0.35, -d * 0.08]} castShadow>
        <boxGeometry args={[w - 0.1, h * 0.1, d * 0.75]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0} />
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

export function SunLounger({ position, rotation, dimensions, color = '#D8C8A0', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.12, d * 0.7]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
      </mesh>
      <mesh position={[0, h * 0.7, -d * 0.28]} rotation={[0.4, 0, 0]} castShadow>
        <boxGeometry args={[w, h * 0.1, d * 0.3]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
      </mesh>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * w * 0.42, h * 0.2, sz * d * 0.3]} castShadow>
          <boxGeometry args={[0.03, h * 0.4, 0.03]} />
          <meshStandardMaterial color="#808080" roughness={0.3} metalness={0.6} />
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

export function GardenDiningSet({ position, rotation, dimensions, color = '#6A5040', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Table */}
      <mesh position={[0, h, 0]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.7, h * 0.05, d * 0.7]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.05} />
      </mesh>
      {[-0.3, 0.3].map((t) => (
        <mesh key={t} position={[t * w * 0.55, h * 0.5, 0]} castShadow>
          <boxGeometry args={[0.05, h, 0.05]} />
          <meshStandardMaterial color={color} roughness={0.8} metalness={0.05} />
        </mesh>
      ))}
      {/* 4 chairs around table */}
      {[[0, d * 0.42], [0, -d * 0.42], [w * 0.42, 0], [-w * 0.42, 0]].map(([cx, cz], i) => (
        <mesh key={i} position={[cx, h * 0.45, cz]} castShadow receiveShadow>
          <boxGeometry args={[w * 0.25, h * 0.08, w * 0.25]} />
          <meshStandardMaterial color="#8A7060" roughness={0.8} metalness={0.05} />
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

export function Parasol({ position, rotation, dimensions, color = '#E8D0A0', selected }: Props) {
  const { x: w, y: h } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Pole */}
      <mesh position={[0, h * 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, h, 8]} />
        <meshStandardMaterial color="#E0D8C8" roughness={0.2} metalness={0.4} />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, h * 0.9, 0]} castShadow>
        <coneGeometry args={[w / 2, h * 0.2, 16]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0} />
      </mesh>
      {/* Base */}
      <mesh position={[0, h * 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.35, h * 0.06, 8]} />
        <meshStandardMaterial color="#606060" roughness={0.3} metalness={0.5} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <cylinderGeometry args={[w / 2 + 0.05, w / 2 + 0.05, h + 0.05, 16]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function OutdoorKitchen({ position, rotation, dimensions, color = '#808080', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      <mesh position={[0, h * 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.9, d]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, h * 0.92, 0]} castShadow>
        <boxGeometry args={[w + 0.02, h * 0.05, d + 0.02]} />
        <meshStandardMaterial color="#A8A8A8" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Grill grates */}
      {[-0.2, 0.2].map((t) => (
        <mesh key={t} position={[t, h * 0.96, 0]}>
          <boxGeometry args={[w * 0.3, 0.01, d * 0.7]} />
          <meshStandardMaterial color="#333333" roughness={0.5} metalness={0.5} wireframe />
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

export function Pergola({ position, rotation, dimensions, color = '#C0A870', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* 4 posts */}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * w * 0.46, h * 0.5, sz * d * 0.46]} castShadow>
          <boxGeometry args={[0.12, h, 0.12]} />
          <meshStandardMaterial color={color} roughness={0.8} metalness={0} />
        </mesh>
      )))}
      {/* Cross beams */}
      {[-0.33, 0, 0.33].map((t) => (
        <mesh key={t} position={[t * w, h * 1.0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.08, d]} />
          <meshStandardMaterial color={color} roughness={0.8} metalness={0} />
        </mesh>
      ))}
      {/* Main header beams */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, h * 1.0, s * d * 0.45]} castShadow>
          <boxGeometry args={[w, 0.12, 0.08]} />
          <meshStandardMaterial color={color} roughness={0.8} metalness={0} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h * 1.1 + 0.05, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function GardenShed({ position, rotation, dimensions, color = '#6A7850', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Walls */}
      <mesh position={[0, h * 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.8, d]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, h * 0.92, 0]} castShadow>
        <boxGeometry args={[w + 0.2, h * 0.04, d + 0.2]} />
        <meshStandardMaterial color="#4A3828" roughness={0.9} metalness={0} />
      </mesh>
      {/* Gable */}
      <mesh position={[0, h * 0.88, 0]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[Math.sqrt((w * 0.55) ** 2 + (d * 0.55) ** 2) / 2, h * 0.2, 4]} />
        <meshStandardMaterial color="#3A2818" roughness={0.9} metalness={0} />
      </mesh>
      {/* Door */}
      <mesh position={[0, h * 0.28, d * 0.51]}>
        <boxGeometry args={[w * 0.4, h * 0.55, 0.02]} />
        <meshStandardMaterial color="#5A4030" roughness={0.7} metalness={0} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.3, h * 1.3, d + 0.3]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function SwimmingPool({ position, rotation, dimensions, color = '#4090C0', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Pool shell */}
      <mesh position={[0, -h * 0.4, 0]} receiveShadow>
        <boxGeometry args={[w, h * 0.8, d]} />
        <meshStandardMaterial color="#E8F0F0" roughness={0.2} metalness={0.05} />
      </mesh>
      {/* Water */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[w - 0.1, h * 0.05, d - 0.1]} />
        <meshStandardMaterial color={color} roughness={0.05} metalness={0.1} transparent opacity={0.85} />
      </mesh>
      {/* Pool surround */}
      <mesh position={[0, h * 0.1, 0]}>
        <boxGeometry args={[w + 0.3, h * 0.05, d + 0.3]} />
        <meshStandardMaterial color="#D8D0C0" roughness={0.5} metalness={0} />
      </mesh>
      {selected && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[w + 0.4, h + 0.1, d + 0.4]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function HotTub({ position, rotation, dimensions, color = '#6090A0', selected }: Props) {
  const { x: w, y: h } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Tub shell */}
      <mesh position={[0, h * 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[w / 2, w / 2, h * 0.8, 16]} />
        <meshStandardMaterial color="#3A3A3A" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Water */}
      <mesh position={[0, h * 0.72, 0]}>
        <cylinderGeometry args={[w / 2 * 0.88, w / 2 * 0.88, h * 0.1, 16]} />
        <meshStandardMaterial color={color} roughness={0.05} metalness={0.1} transparent opacity={0.8} />
      </mesh>
      {/* Rim */}
      <mesh position={[0, h * 0.78, 0]} castShadow>
        <cylinderGeometry args={[w / 2 + 0.05, w / 2 + 0.03, h * 0.06, 16]} />
        <meshStandardMaterial color="#484848" roughness={0.3} metalness={0.2} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <cylinderGeometry args={[w / 2 + 0.1, w / 2 + 0.1, h + 0.05, 16]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function PlanterLarge({ position, rotation, dimensions, color = '#7A6050', selected }: Props) {
  const { x: w, y: h } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      <mesh position={[0, h * 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[w * 0.4, w * 0.35, h * 0.8, 8]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
      </mesh>
      {/* Soil / plant */}
      <mesh position={[0, h * 0.83, 0]}>
        <cylinderGeometry args={[w * 0.38, w * 0.38, h * 0.06, 8]} />
        <meshStandardMaterial color="#4A3828" roughness={1.0} metalness={0} />
      </mesh>
      <mesh position={[0, h * 1.1, 0]}>
        <sphereGeometry args={[w * 0.3, 8, 6]} />
        <meshStandardMaterial color="#3A6030" roughness={1.0} metalness={0} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <cylinderGeometry args={[w * 0.5, w * 0.5, h * 1.5, 8]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function PlanterSmall({ position, rotation, dimensions, color = '#7A6050', selected }: Props) {
  const { x: w, y: h } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      <mesh position={[0, h * 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.8, w]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, h * 0.85, 0]}>
        <boxGeometry args={[w * 0.9, h * 0.06, w * 0.9]} />
        <meshStandardMaterial color="#4A3828" roughness={1.0} metalness={0} />
      </mesh>
      <mesh position={[0, h * 1.05, 0]}>
        <sphereGeometry args={[w * 0.35, 6, 5]} />
        <meshStandardMaterial color="#4A7040" roughness={1.0} metalness={0} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h * 1.5, w + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function GardenBench({ position, rotation, dimensions, color = '#6A5040', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Seat */}
      <mesh position={[0, h * 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.07, d]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.05} />
      </mesh>
      {/* Back */}
      <mesh position={[0, h * 0.83, -d * 0.42]} castShadow>
        <boxGeometry args={[w, h * 0.35, h * 0.06]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.05} />
      </mesh>
      {/* 2 legs each side */}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * w * 0.4, h * 0.25, sz * d * 0.3]} castShadow>
          <boxGeometry args={[0.05, h * 0.5, 0.05]} />
          <meshStandardMaterial color="#707070" roughness={0.2} metalness={0.6} />
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

export function SwingSet({ position, rotation, dimensions, color = '#8A6848', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* A-frame posts */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * w * 0.4, 0, 0]}>
          <mesh position={[0, h * 0.5, -d * 0.2]} rotation={[0.3, 0, 0]} castShadow>
            <boxGeometry args={[0.06, h * 1.05, 0.06]} />
            <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
          </mesh>
          <mesh position={[0, h * 0.5, d * 0.2]} rotation={[-0.3, 0, 0]} castShadow>
            <boxGeometry args={[0.06, h * 1.05, 0.06]} />
            <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
          </mesh>
        </group>
      ))}
      {/* Top beam */}
      <mesh position={[0, h, 0]} castShadow>
        <boxGeometry args={[w, 0.08, 0.08]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
      </mesh>
      {/* Swings */}
      {[-0.25, 0.25].map((t) => (
        <group key={t} position={[t * w, 0, 0]}>
          <mesh position={[0, h * 0.5, 0]}>
            <boxGeometry args={[0.02, h * 0.9, 0.02]} />
            <meshStandardMaterial color="#C0A060" roughness={0.5} metalness={0} />
          </mesh>
          <mesh position={[0, h * 0.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.35, 0.04, 0.25]} />
            <meshStandardMaterial color="#4A3020" roughness={0.8} metalness={0} />
          </mesh>
        </group>
      ))}
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.1, h + 0.1, d + 0.1]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function Trampoline({ position, rotation, dimensions, color = '#1A1A1A', selected }: Props) {
  const { x: w, y: h } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Frame ring */}
      <mesh position={[0, h * 0.5, 0]} castShadow>
        <torusGeometry args={[w / 2, 0.06, 8, 32]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Mat */}
      <mesh position={[0, h * 0.48, 0]} receiveShadow>
        <cylinderGeometry args={[w / 2 * 0.92, w / 2 * 0.92, 0.02, 32]} />
        <meshStandardMaterial color="#1A4080" roughness={0.8} metalness={0} />
      </mesh>
      {/* 6 legs */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * w * 0.43, h * 0.22, Math.sin(angle) * w * 0.43]} castShadow>
            <boxGeometry args={[0.04, h * 0.45, 0.04]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
          </mesh>
        );
      })}
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <cylinderGeometry args={[w / 2 + 0.1, w / 2 + 0.1, h + 0.05, 16]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function Sandpit({ position, rotation, dimensions, color = '#D8C090', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Border */}
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#8A6040" roughness={0.9} metalness={0} />
      </mesh>
      {/* Sand fill */}
      <mesh position={[0, h * 0.85, 0]} receiveShadow>
        <boxGeometry args={[w - 0.1, h * 0.15, d - 0.1]} />
        <meshStandardMaterial color={color} roughness={1.0} metalness={0} />
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
