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

export function GardenPath({ position, rotation, dimensions, color = '#A09080', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      <mesh receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
      </mesh>
      {/* Path stones */}
      {Array.from({ length: Math.floor(d / 0.5) }).map((_, i) => (
        <mesh key={i} position={[0, h * 0.55, (-d / 2) + 0.3 + i * 0.5]} receiveShadow>
          <boxGeometry args={[w * 0.8, h * 0.1, 0.4]} />
          <meshStandardMaterial color="#B8B0A0" roughness={0.8} metalness={0} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[w + 0.05, h + 0.1, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function Driveway({ position, rotation, dimensions, color = '#808080', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      <mesh receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.05} />
      </mesh>
      {/* Centre line */}
      <mesh position={[0, h * 0.6, 0]} receiveShadow>
        <boxGeometry args={[0.05, h * 0.2, d * 0.9]} />
        <meshStandardMaterial color="#E0E0E0" roughness={0.7} metalness={0} />
      </mesh>
      {selected && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[w + 0.05, h + 0.1, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function GarageDoor({ position, rotation, dimensions, color = '#C0C0C0', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Door panels */}
      {[0, 0.33, 0.66].map((t) => (
        <mesh key={t} position={[0, h * (t + 0.17), 0]} castShadow receiveShadow>
          <boxGeometry args={[w, h * 0.33, d]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
        </mesh>
      ))}
      {/* Frame */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * w * 0.5, h * 0.5, 0]} castShadow>
          <boxGeometry args={[0.06, h, d]} />
          <meshStandardMaterial color="#A0A0A0" roughness={0.4} metalness={0.3} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.1, h + 0.05, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function GardenWall({ position, rotation, dimensions, color = '#A09080', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={1.0} metalness={0} />
      </mesh>
      {/* Coping */}
      <mesh position={[0, h * 1.02, 0]} castShadow>
        <boxGeometry args={[w + 0.04, h * 0.06, d + 0.04]} />
        <meshStandardMaterial color="#C0B8A8" roughness={0.6} metalness={0} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h * 1.1, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function FencePanel({ position, rotation, dimensions, color = '#8A7060', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Pickets */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} position={[(i - 3) * (w / 7), h * 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[w / 8, h, d]} />
          <meshStandardMaterial color={color} roughness={0.8} metalness={0} />
        </mesh>
      ))}
      {/* Rails */}
      {[0.25, 0.75].map((t) => (
        <mesh key={t} position={[0, h * t, 0]} castShadow>
          <boxGeometry args={[w, h * 0.04, d * 2]} />
          <meshStandardMaterial color={color} roughness={0.8} metalness={0} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h + 0.05, d + 0.1]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function Gate({ position, rotation, dimensions, color = '#8A7060', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Gate frame */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * w * 0.46, h * 0.5, 0]} castShadow>
          <boxGeometry args={[w * 0.06, h, d]} />
          <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
        </mesh>
      ))}
      {/* Rails */}
      {[0.2, 0.8].map((t) => (
        <mesh key={t} position={[0, h * t, 0]} castShadow>
          <boxGeometry args={[w, h * 0.05, d]} />
          <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
        </mesh>
      ))}
      {/* Vertical bars */}
      {[-0.33, 0, 0.33].map((t) => (
        <mesh key={t} position={[t * w, h * 0.5, 0]} castShadow>
          <boxGeometry args={[w * 0.04, h * 0.9, d]} />
          <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
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

export function DeckArea({ position, rotation, dimensions, color = '#C0A070', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Deck platform */}
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
      </mesh>
      {/* Board lines */}
      {Array.from({ length: Math.floor(d / 0.15) }).map((_, i) => (
        <mesh key={i} position={[0, h * 1.01, (-d / 2) + 0.1 + i * 0.15]}>
          <boxGeometry args={[w, h * 0.02, 0.01]} />
          <meshStandardMaterial color="#9A8060" roughness={0.7} metalness={0} />
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

export function Steps({ position, rotation, dimensions, color = '#A09080', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  const stepCount = 3;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {Array.from({ length: stepCount }).map((_, i) => (
        <mesh key={i} position={[0, (h / stepCount) * (i + 0.5), (d / stepCount) * (i - stepCount / 2 + 0.5)]} castShadow receiveShadow>
          <boxGeometry args={[w, h / stepCount, d / stepCount]} />
          <meshStandardMaterial color={color} roughness={0.8} metalness={0} />
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

export function RetainingWall({ position, rotation, dimensions, color = '#909080', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
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

export function RaisedGardenBed({ position, rotation, dimensions, color = '#6A4830', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Timber frame */}
      {[-1, 1].flatMap((sx) => (
        <mesh key={sx} position={[sx * (w * 0.47), h * 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.06, h, d]} />
          <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
        </mesh>
      ))}
      {[-1, 1].map((sz) => (
        <mesh key={sz} position={[0, h * 0.5, sz * (d * 0.47)]} castShadow receiveShadow>
          <boxGeometry args={[w, h, 0.06]} />
          <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
        </mesh>
      ))}
      {/* Soil */}
      <mesh position={[0, h * 0.8, 0]} receiveShadow>
        <boxGeometry args={[w - 0.1, h * 0.4, d - 0.1]} />
        <meshStandardMaterial color="#3A2818" roughness={1.0} metalness={0} />
      </mesh>
      {/* Plants */}
      {[-0.3, 0, 0.3].map((t) => (
        <mesh key={t} position={[t * w, h * 1.3, 0]}>
          <sphereGeometry args={[0.15, 6, 5]} />
          <meshStandardMaterial color="#3A6030" roughness={1.0} metalness={0} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h * 2, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function WaterFeature({ position, rotation, dimensions, color = '#608090', selected }: Props) {
  const { x: w, y: h } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Basin */}
      <mesh position={[0, h * 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[w / 2, w * 0.55, h * 0.4, 16]} />
        <meshStandardMaterial color="#808080" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Water */}
      <mesh position={[0, h * 0.38, 0]}>
        <cylinderGeometry args={[w / 2 * 0.88, w / 2 * 0.88, h * 0.05, 16]} />
        <meshStandardMaterial color={color} roughness={0.05} metalness={0.1} transparent opacity={0.8} />
      </mesh>
      {/* Column */}
      <mesh position={[0, h * 0.65, 0]} castShadow>
        <cylinderGeometry args={[w * 0.08, w * 0.1, h * 0.5, 8]} />
        <meshStandardMaterial color="#909090" roughness={0.5} metalness={0.1} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <cylinderGeometry args={[w / 2 + 0.1, w / 2 + 0.1, h + 0.1, 16]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function Fountain({ position, rotation, dimensions, color = '#708890', selected }: Props) {
  const { x: w, y: h } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* 3-tier fountain */}
      {[0.15, 0.5, 0.85].map((tier, i) => {
        const r = (w / 2) * (1 - i * 0.3);
        return (
          <group key={i}>
            <mesh position={[0, tier * h, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[r, r * 1.05, h * 0.06, 16]} />
              <meshStandardMaterial color="#C0C0C0" roughness={0.3} metalness={0.2} />
            </mesh>
            <mesh position={[0, tier * h + h * 0.03, 0]}>
              <cylinderGeometry args={[r * 0.9, r * 0.9, h * 0.03, 16]} />
              <meshStandardMaterial color={color} roughness={0.05} metalness={0.1} transparent opacity={0.7} />
            </mesh>
          </group>
        );
      })}
      {/* Centre column */}
      <mesh position={[0, h * 0.5, 0]} castShadow>
        <cylinderGeometry args={[w * 0.04, w * 0.05, h, 8]} />
        <meshStandardMaterial color="#B0B0B0" roughness={0.3} metalness={0.2} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <cylinderGeometry args={[w / 2 + 0.1, w / 2 + 0.1, h + 0.1, 16]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function Letterbox({ position, rotation, dimensions, color = '#C8C0B0', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Post */}
      <mesh position={[0, h * 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.05, h * 0.6, 0.05]} />
        <meshStandardMaterial color="#606060" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Box */}
      <mesh position={[0, h * 0.7, 0]} castShadow>
        <boxGeometry args={[w, h * 0.45, d]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
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

export function GatePost({ position, rotation, dimensions, color = '#808080', selected }: Props) {
  const { x: w, y: h } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Cap */}
      <mesh position={[0, h * 1.04, 0]} castShadow>
        <boxGeometry args={[w * 1.2, h * 0.08, w * 1.2]} />
        <meshStandardMaterial color="#909090" roughness={0.4} metalness={0.3} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h + 0.1, w + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function OutdoorLightPost({ position, rotation, dimensions, color = '#707070', selected }: Props) {
  const { x: w, y: h } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Pole */}
      <mesh position={[0, h * 0.5, 0]} castShadow>
        <cylinderGeometry args={[w * 0.5, w * 0.6, h, 8]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.6} />
      </mesh>
      {/* Light head */}
      <mesh position={[0, h * 0.97, 0]} castShadow>
        <cylinderGeometry args={[w * 2, w * 1.5, h * 0.06, 8]} />
        <meshStandardMaterial color="#C8C8C8" roughness={0.2} metalness={0.5} />
      </mesh>
      {/* Bulb glow */}
      <mesh position={[0, h * 0.94, 0]}>
        <sphereGeometry args={[w * 1.2, 8, 6]} />
        <meshStandardMaterial color="#C8C8C8" emissive="#555555" emissiveIntensity={0.8} roughness={0.5} metalness={0} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <cylinderGeometry args={[w * 3, w * 3, h + 0.1, 8]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function BicycleStorage({ position, rotation, dimensions, color = '#707878', selected }: Props) {
  const { x: w, y: h, z: d } = dimensions;
  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Frame */}
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Door grille */}
      <mesh position={[0, h * 0.5, d * 0.51]}>
        <boxGeometry args={[w * 0.9, h * 0.9, 0.02]} />
        <meshStandardMaterial color="#505858" roughness={0.3} metalness={0.5} wireframe />
      </mesh>
      {/* Roof slope */}
      <mesh position={[0, h * 1.04, -d * 0.1]} rotation={[0.1, 0, 0]} castShadow>
        <boxGeometry args={[w + 0.1, 0.04, d + 0.2]} />
        <meshStandardMaterial color="#505858" roughness={0.3} metalness={0.4} />
      </mesh>
      {selected && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[w + 0.05, h * 1.1 + 0.05, d + 0.05]} />
          <meshStandardMaterial color={outline(selected)} wireframe />
        </mesh>
      )}
    </group>
  );
}
