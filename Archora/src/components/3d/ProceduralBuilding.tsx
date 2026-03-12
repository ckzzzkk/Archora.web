import React, { useMemo } from 'react';
import { ProceduralWall } from './ProceduralWall';
import { ProceduralFloor } from './ProceduralFloor';
import { Sofa } from './furniture/Sofa';
import { Chair } from './furniture/Chair';
import { DiningTable } from './furniture/DiningTable';
import { Bed } from './furniture/Bed';
import { Desk } from './furniture/Desk';
import { Wardrobe } from './furniture/Wardrobe';
import { CoffeeTable } from './furniture/CoffeeTable';
import { Bookshelf } from './furniture/Bookshelf';
import { KitchenUnit } from './furniture/KitchenUnit';
import type { BlueprintData, FurniturePiece } from '../../types';

interface ProceduralBuildingProps {
  blueprint: BlueprintData;
  selectedId?: string | null;
  showFurniture?: boolean;
  onSelectWall?: (id: string) => void;
  onSelectFurniture?: (id: string) => void;
  wallColor?: string;
}

function FurnitureMesh({ piece, selected }: { piece: FurniturePiece; selected: boolean }) {
  const props = {
    position: piece.position,
    rotation: piece.rotation,
    dimensions: piece.dimensions,
    color: piece.materialOverride,
    selected,
  };

  const name = piece.name.toLowerCase();
  if (name.includes('sofa')) return <Sofa {...props} />;
  if (name.includes('chair') && !name.includes('dining')) return <Chair {...props} />;
  if (name.includes('dining') && name.includes('table')) return <DiningTable {...props} />;
  if (name.includes('dining') && name.includes('chair')) return <Chair {...props} />;
  if (name.includes('bed')) return <Bed {...props} />;
  if (name.includes('desk')) return <Desk {...props} />;
  if (name.includes('wardrobe')) return <Wardrobe {...props} />;
  if (name.includes('coffee')) return <CoffeeTable {...props} />;
  if (name.includes('bookshelf') || name.includes('book')) return <Bookshelf {...props} />;
  if (name.includes('kitchen') || name.includes('counter') || name.includes('island')) return <KitchenUnit {...props} />;

  // Generic fallback box
  return (
    <mesh
      position={[piece.position.x, piece.position.y + piece.dimensions.y / 2, piece.position.z]}
      rotation={[piece.rotation.x, piece.rotation.y, piece.rotation.z]}
      castShadow
    >
      <boxGeometry args={[piece.dimensions.x, piece.dimensions.y, piece.dimensions.z]} />
      <meshStandardMaterial color={piece.materialOverride ?? '#5A5A5A'} roughness={0.7} />
    </mesh>
  );
}

export function ProceduralBuilding({
  blueprint,
  selectedId,
  showFurniture = true,
  wallColor,
}: ProceduralBuildingProps) {
  return (
    <group>
      {/* Floors */}
      {blueprint.rooms.map((room) => (
        <ProceduralFloor
          key={`floor-${room.id}`}
          room={room}
          walls={blueprint.walls}
          selected={selectedId === room.id}
        />
      ))}

      {/* Walls */}
      {blueprint.walls.map((wall) => (
        <ProceduralWall
          key={wall.id}
          wall={wall}
          selected={selectedId === wall.id}
          color={wallColor}
        />
      ))}

      {/* Furniture */}
      {showFurniture
        ? blueprint.furniture.map((piece) => (
            <FurnitureMesh
              key={piece.id}
              piece={piece}
              selected={selectedId === piece.id}
            />
          ))
        : null}
    </group>
  );
}
