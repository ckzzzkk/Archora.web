import React, { useMemo } from 'react';
import { getRoomCenter } from '../../utils/procedural/geometry';
import { MATERIAL_COLORS } from '../../utils/procedural/geometry';
import type { Room, Wall, MaterialType } from '../../types';

interface ProceduralFloorProps {
  room: Room;
  walls: Wall[];
  selected?: boolean;
  opacity?: number;
}

const FLOOR_COLORS: Record<MaterialType, string> = {
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
  // New entries
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

export function ProceduralFloor({ room, walls, selected = false, opacity = 1 }: ProceduralFloorProps) {
  const center = useMemo(() => getRoomCenter(room, walls), [room, walls]);
  const color = selected ? '#4A90D9' : FLOOR_COLORS[room.floorMaterial] ?? '#808080';
  const side = Math.sqrt(Math.max(room.area, 1));
  const isTransparent = opacity < 1;

  return (
    <mesh
      position={[center.x, 0.01, center.z]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow={!isTransparent}
    >
      <planeGeometry args={[side, side]} />
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
