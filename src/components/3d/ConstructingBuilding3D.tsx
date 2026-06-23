import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

/**
 * ConstructingBuilding3D — the generation "payoff" animation.
 *
 * A building massing assembles itself: foundation slab fades up, walls rise out
 * of the ground in sequence (each flashing amber as it locks in), the roof drops
 * on top, then furniture pops in — while the camera slowly orbits. Driven by the
 * real generation `phase` (0–4) so it tracks actual pipeline progress.
 *
 * Solid ink massing on dark, one amber accent light — muted-editorial, on-brand.
 */

const INK = '#CFC9C0';
const AMBER = 0xd4a84b;

type PartType = 'slab' | 'rise' | 'drop' | 'pop';
interface Part {
  key: string; type: PartType;
  w: number; h: number; d: number;
  x: number; z: number; baseY: number;
  start: number; dur: number;
}

const Y = 0.15; // walls sit on top of the slab
const PARTS: Part[] = [
  { key: 'slab',   type: 'slab', w: 4.4,  h: 0.15, d: 3.4, x: 0,     z: 0,     baseY: 0,     start: 0.04, dur: 0.10 },
  { key: 'back',   type: 'rise', w: 4.4,  h: 1.6,  d: 0.12, x: 0,    z: -1.7,  baseY: Y,     start: 0.16, dur: 0.10 },
  { key: 'left',   type: 'rise', w: 0.12, h: 1.6,  d: 3.4, x: -2.2,  z: 0,     baseY: Y,     start: 0.22, dur: 0.10 },
  { key: 'right',  type: 'rise', w: 0.12, h: 1.6,  d: 3.4, x: 2.2,   z: 0,     baseY: Y,     start: 0.28, dur: 0.10 },
  { key: 'frontL', type: 'rise', w: 1.5,  h: 1.6,  d: 0.12, x: -1.45, z: 1.7,  baseY: Y,     start: 0.34, dur: 0.08 },
  { key: 'frontR', type: 'rise', w: 1.5,  h: 1.6,  d: 0.12, x: 1.45,  z: 1.7,  baseY: Y,     start: 0.39, dur: 0.08 },
  { key: 'inner',  type: 'rise', w: 0.12, h: 1.6,  d: 1.9, x: 0.3,   z: -0.75, baseY: Y,     start: 0.44, dur: 0.08 },
  { key: 'roof',   type: 'drop', w: 4.7,  h: 0.16, d: 3.7, x: 0,     z: 0,     baseY: Y + 1.6, start: 0.50, dur: 0.12 },
  { key: 'sofa',   type: 'pop',  w: 1.3,  h: 0.5,  d: 0.7, x: -1.0,  z: 0.6,   baseY: Y,     start: 0.62, dur: 0.08 },
  { key: 'table',  type: 'pop',  w: 0.8,  h: 0.4,  d: 0.8, x: 0.9,   z: -0.7,  baseY: Y,     start: 0.68, dur: 0.08 },
  { key: 'bed',    type: 'pop',  w: 1.2,  h: 0.45, d: 0.9, x: 1.1,   z: 0.9,   baseY: Y,     start: 0.74, dur: 0.08 },
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeBack = (t: number) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

function Building({ target }: { target: number }) {
  const group = useRef<THREE.Group>(null);
  const prog = useRef(0);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, dt) => {
    // ease the live progress toward the phase target so stage changes feel smooth
    prog.current += (target - prog.current) * Math.min(1, dt * 2.2);
    const u = prog.current;
    if (group.current) group.current.rotation.y += dt * 0.35;

    PARTS.forEach((part, i) => {
      const m = refs.current[i];
      if (!m) return;
      const local = clamp01((u - part.start) / part.dur);
      const p = easeOut(local);
      const mat = m.material as THREE.MeshStandardMaterial;

      if (part.type === 'slab' || part.type === 'rise') {
        const s = Math.max(0.001, p);
        m.scale.set(1, s, 1);
        m.position.y = part.baseY + (part.h * s) / 2;
      } else if (part.type === 'drop') {
        m.scale.set(1, 1, 1);
        m.position.y = part.baseY + part.h / 2 + (1 - p) * 3;
      } else {
        const s = Math.max(0.001, easeBack(local));
        m.scale.setScalar(s);
        m.position.y = part.baseY + part.h / 2;
      }

      mat.opacity = p * 0.96;
      // amber flash just as the part finishes locking in
      const glow = Math.max(0, 1 - Math.abs((u - (part.start + part.dur)) / 0.08));
      mat.emissiveIntensity = glow * 0.7;
    });
  });

  return (
    <group ref={group}>
      {PARTS.map((part, i) => (
        <mesh
          key={part.key}
          ref={(el: THREE.Mesh | null) => { refs.current[i] = el; }}
          position={[part.x, part.baseY, part.z]}
        >
          <boxGeometry args={[part.w, part.h, part.d]} />
          <meshStandardMaterial
            color={INK}
            roughness={0.65}
            metalness={0.05}
            flatShading
            transparent
            opacity={0}
            emissive={AMBER}
            emissiveIntensity={0}
          />
        </mesh>
      ))}
    </group>
  );
}

export function ConstructingBuilding3D({ phase }: { phase: number }) {
  // phase 0..4 → build target 0.2..1.0 (so something is always visible)
  const target = clamp01((phase + 1) / 5);
  return (
    <Canvas
      camera={{ position: [6, 4.2, 7], fov: 40 }}
      gl={{ alpha: true }}
      style={{ flex: 1, backgroundColor: 'transparent' }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 9, 4]} intensity={0.95} />
      <pointLight position={[-4, 3, -3]} color={AMBER} intensity={0.7} />
      <Building target={target} />
    </Canvas>
  );
}
