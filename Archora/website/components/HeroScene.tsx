'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function WireframeHouse() {
  const groupRef = useRef<THREE.Group>(null);
  const wallMaterial = new THREE.MeshBasicMaterial({
    color: '#C9FFFD',
    wireframe: true,
    transparent: true,
    opacity: 0.6,
  });

  const roofMaterial = new THREE.MeshBasicMaterial({
    color: '#FFEE8C',
    wireframe: true,
    transparent: true,
    opacity: 0.5,
  });

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Gentle float
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.05;

    // Animate children rising up
    groupRef.current.children.forEach((child, i) => {
      const delay = i * 0.3;
      const progress = Math.min(Math.max((t - delay) / 1.5, 0), 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      child.scale.setScalar(eased);
      child.position.y = child.userData.targetY * eased;
    });
  });

  return (
    <group ref={groupRef}>
      {/* Front wall */}
      <mesh material={wallMaterial} userData={{ targetY: 0.5 }}>
        <boxGeometry args={[2, 1, 0.05]} />
      </mesh>

      {/* Back wall */}
      <mesh material={wallMaterial} position={[0, 0.5, -1.5]} userData={{ targetY: 0.5 }}>
        <boxGeometry args={[2, 1, 0.05]} />
      </mesh>

      {/* Left wall */}
      <mesh material={wallMaterial} position={[-1, 0.5, -0.75]} rotation={[0, Math.PI / 2, 0]} userData={{ targetY: 0.5 }}>
        <boxGeometry args={[1.5, 1, 0.05]} />
      </mesh>

      {/* Right wall */}
      <mesh material={wallMaterial} position={[1, 0.5, -0.75]} rotation={[0, Math.PI / 2, 0]} userData={{ targetY: 0.5 }}>
        <boxGeometry args={[1.5, 1, 0.05]} />
      </mesh>

      {/* Floor */}
      <mesh material={wallMaterial} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.75]} userData={{ targetY: 0 }}>
        <planeGeometry args={[2, 1.5]} />
      </mesh>

      {/* Roof */}
      <mesh material={roofMaterial} position={[0, 1.3, -0.75]} rotation={[0, 0, 0]} userData={{ targetY: 1.3 }}>
        <coneGeometry args={[1.5, 0.8, 4]} />
      </mesh>

      {/* Door */}
      <mesh material={wallMaterial} position={[0, 0.3, 0.03]} userData={{ targetY: 0.3 }}>
        <boxGeometry args={[0.4, 0.6, 0.02]} />
      </mesh>

      {/* Window left */}
      <mesh material={wallMaterial} position={[-0.6, 0.6, 0.03]} userData={{ targetY: 0.6 }}>
        <boxGeometry args={[0.3, 0.3, 0.02]} />
      </mesh>

      {/* Window right */}
      <mesh material={wallMaterial} position={[0.6, 0.6, 0.03]} userData={{ targetY: 0.6 }}>
        <boxGeometry args={[0.3, 0.3, 0.02]} />
      </mesh>
    </group>
  );
}

function FloatingParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 50;
  const dummy = new THREE.Object3D();

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const seed = i * 137.5;
      dummy.position.set(
        Math.sin(seed + t * 0.1) * 4,
        Math.cos(seed * 0.7 + t * 0.15) * 3,
        Math.sin(seed * 1.3 + t * 0.08) * 4,
      );
      dummy.scale.setScalar(0.02 + Math.sin(seed + t) * 0.01);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#C9FFFD" transparent opacity={0.3} />
    </instancedMesh>
  );
}

export default function HeroScene() {
  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas
        camera={{ position: [3, 2, 3], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <WireframeHouse />
        <FloatingParticles />
        <OrbitControls
          autoRotate
          autoRotateSpeed={1.5}
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.5}
        />
      </Canvas>
    </div>
  );
}
