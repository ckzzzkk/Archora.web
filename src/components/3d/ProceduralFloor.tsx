import React, { useMemo } from 'react';
import { buildSlabGeometry } from '../../utils/procedural/slabGeometry';
import type { Slab, Wall } from '../../types';

interface SlabMeshProps {
  slab: Slab;
  walls?: Wall[];
  selected?: boolean;
  opacity?: number;
}

const FLOOR_COLORS: Record<string, string> = {
  hardwood: '#7C4E28',
  tile: '#B0B0B0',
  carpet: '#6A5A7A',
  concrete: '#787878',
  marble: '#D8D0C8',
  vinyl: '#908070',
  stone: '#605850',
  parquet: '#8C6030',
  oak: '#9E7040',
  walnut: '#5C3A1E',
  pine: '#C8A464',
  engineered_wood: '#A07848',
  laminate: '#B89060',
  polished_concrete: '#909090',
  resin: '#C0B8B0',
  travertine: '#D4C8B0',
  slate: '#505860',
  ceramic: '#C8C4BC',
  porcelain: '#D0CCC8',
  terrazzo: '#B8A898',
  cork: '#B8945A',
  bamboo: '#C8B464',
  herringbone_parquet: '#906830',
  chevron_parquet: '#8C6428',
  rubber: '#484848',
  // Extended hardwoods
  oak_hardwood: '#A07040',
  walnut_hardwood: '#5C3A1E',
  pine_hardwood: '#C8A464',
  maple_hardwood: '#D4B882',
  dark_hardwood: '#3A2010',
  bleached_oak: '#D8C8A0',
  herringbone_oak: '#906830',
  chevron_oak: '#8C6428',
  engineered_light: '#C8A878',
  engineered_dark: '#604020',
  laminate_light: '#C8B890',
  laminate_dark: '#706050',
  raw_concrete: '#888888',
  white_marble: '#F0EDE8',
  grey_marble: '#C0BBB8',
  black_marble: '#282828',
  sandstone: '#C8A870',
  white_ceramic: '#F0EDE8',
  grey_ceramic: '#B0B0B0',
  black_ceramic: '#282828',
  encaustic_tiles: '#8A6040',
  hexagon_tiles: '#A0A0A0',
  carpet_grey: '#888090',
  carpet_cream: '#D8D0C0',
  rubber_floor: '#484848',
};

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

  const color = selected ? '#4A90D9' : FLOOR_COLORS[floorMaterial] ?? '#808080';
  const isTransparent = opacity < 1;

  return (
    // @ts-expect-error geometry prop is valid for R3F mesh but types are incomplete
    <mesh geometry={geometry} receiveShadow={!isTransparent}>
      <meshStandardMaterial
        color={color}
        roughness={0.9}
        metalness={0}
        transparent={isTransparent}
        opacity={opacity}
      />
    </mesh>
  );
}