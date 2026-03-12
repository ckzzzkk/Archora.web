import React, { useMemo } from 'react';
import { getRoomCenter } from '../../utils/procedural/geometry';
import { MATERIAL_COLORS } from '../../utils/procedural/geometry';
import type { Room, Wall, MaterialType } from '../../types';

interface ProceduralFloorProps {
  room: Room;
  walls: Wall[];
  selected?: boolean;
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
};

export function ProceduralFloor({ room, walls, selected = false }: ProceduralFloorProps) {
  const center = useMemo(() => getRoomCenter(room, walls), [room, walls]);
  const color = selected ? '#4A90D9' : FLOOR_COLORS[room.floorMaterial] ?? '#808080';

  // Estimate floor size from room area (square approximation)
  const side = Math.sqrt(Math.max(room.area, 1));

  return (
    <mesh
      position={[center.x, 0.01, center.z]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[side, side]} />
      <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
    </mesh>
  );
}
