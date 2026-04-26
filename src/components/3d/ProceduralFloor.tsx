import React, { useMemo } from 'react';
import { buildSlabGeometry } from '../../utils/procedural/slabGeometry';
import type { Slab, Wall } from '../../types';
import { MaterialCompiler } from '../../materials/MaterialCompiler';

interface SlabMeshProps {
  slab: Slab;
  walls?: Wall[];
  selected?: boolean;
  opacity?: number;
}

interface ProceduralFloorProps {
  slab: Slab;
  walls?: Wall[];
  selected?: boolean;
  opacity?: number;
  floorMaterial?: string;
}

export function ProceduralFloor({
  slab,
  walls = [],
  selected = false,
  opacity = 1,
  floorMaterial = 'concrete',
}: ProceduralFloorProps) {
  const geometry = useMemo(
    () => buildSlabGeometry(slab.polygon, slab.holes, slab.elevation),
    [slab.polygon, slab.holes, slab.elevation],
  );

  const mat = MaterialCompiler.compile(floorMaterial, 'threejs');
  const color = selected ? '#4A90D9' : mat.color;
  const roughness = mat.roughness ?? 0.9;
  const metalness = mat.metalness ?? 0;
  const isTransparent = opacity < 1;

  return (
    <mesh geometry={geometry} receiveShadow={!isTransparent}>
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        transparent={isTransparent}
        opacity={opacity}
      />
    </mesh>
  );
}