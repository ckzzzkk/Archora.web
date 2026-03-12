import React from 'react';
import type { Vector3D } from '../../../types';

interface BookshelfProps {
  position: Vector3D;
  rotation: Vector3D;
  dimensions: Vector3D;
  color?: string;
  selected?: boolean;
}

export function Bookshelf({ position, rotation, dimensions, color = '#8B7355', selected = false }: BookshelfProps) {
  const c = selected ? '#4A90D9' : color;
  const { x: w, y: h, z: d } = dimensions;
  const shelfCount = Math.max(3, Math.floor(h / 0.4));
  const shelfSpacing = h / shelfCount;

  const BOOK_COLORS = ['#C04848', '#4870C0', '#48A878', '#C09848', '#8048C0', '#C07048'];

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      {/* Back panel */}
      <mesh position={[0, h / 2, -d / 2 + 0.02]} castShadow receiveShadow>
        <boxGeometry args={[w, h, 0.02]} />
        <meshStandardMaterial color={c} roughness={0.7} />
      </mesh>

      {/* Side panels */}
      <mesh position={[-w / 2 + 0.02, h / 2, 0]} castShadow>
        <boxGeometry args={[0.03, h, d]} />
        <meshStandardMaterial color={c} roughness={0.7} />
      </mesh>
      <mesh position={[w / 2 - 0.02, h / 2, 0]} castShadow>
        <boxGeometry args={[0.03, h, d]} />
        <meshStandardMaterial color={c} roughness={0.7} />
      </mesh>

      {/* Shelves */}
      {Array.from({ length: shelfCount + 1 }).map((_, i) => (
        <mesh key={`shelf-${i}`} position={[0, i * shelfSpacing + 0.015, 0]} receiveShadow>
          <boxGeometry args={[w - 0.06, 0.025, d]} />
          <meshStandardMaterial color={c} roughness={0.7} />
        </mesh>
      ))}

      {/* Books on each shelf */}
      {Array.from({ length: shelfCount }).map((_, si) =>
        Array.from({ length: Math.floor((w - 0.08) / 0.06) }).map((_, bi) => {
          const bookColor = BOOK_COLORS[(si * 5 + bi) % BOOK_COLORS.length];
          const bookW = 0.04 + (((si * 7 + bi * 3) % 4) * 0.01);
          const bookH = shelfSpacing * 0.7 - 0.02;
          const bookX = -w / 2 + 0.06 + bi * 0.06 + bookW / 2;
          const bookY = si * shelfSpacing + shelfSpacing * 0.5;
          return (
            <mesh key={`book-${si}-${bi}`} position={[bookX, bookY, -d / 2 + d * 0.3]} castShadow>
              <boxGeometry args={[bookW, bookH, d * 0.5]} />
              <meshStandardMaterial color={bookColor} roughness={0.9} />
            </mesh>
          );
        }),
      )}
    </group>
  );
}
