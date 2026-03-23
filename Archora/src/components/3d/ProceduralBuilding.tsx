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
import { FloorLamp, PendantLight } from './furniture/LightingFurniture';
import { getFloorYOffset } from '../../utils/floorHelpers';
import type { BlueprintData, FurniturePiece, FloorData, Room, Wall, Opening } from '../../types';

interface ProceduralBuildingProps {
  blueprint: BlueprintData;
  selectedId?: string | null;
  showFurniture?: boolean;
  onSelectWall?: (id: string) => void;
  onSelectFurniture?: (id: string) => void;
  wallColor?: string;
  // Multi-floor: when provided, renders all floors stacked with ghost effect
  allFloors?: FloorData[];
  currentFloorIndex?: number;
}

function FurnitureMesh({
  piece,
  selected,
  onSelect,
}: {
  piece: FurniturePiece;
  selected: boolean;
  onSelect?: (id: string) => void;
}) {
  const props = {
    position: piece.position,
    rotation: piece.rotation,
    dimensions: piece.dimensions,
    color: piece.materialOverride,
    selected,
  };

  const name = piece.name.toLowerCase();
  const handleClick = onSelect ? () => onSelect(piece.id) : undefined;
  const wrapper = (child: React.ReactNode) => (
    // @ts-expect-error r3f group supports onClick events
    <group onClick={handleClick}>{child}</group>
  );

  if (name.includes('sofa')) return wrapper(<Sofa {...props} />);
  if (name.includes('chair') && !name.includes('dining')) return wrapper(<Chair {...props} />);
  if (name.includes('dining') && name.includes('table')) return wrapper(<DiningTable {...props} />);
  if (name.includes('dining') && name.includes('chair')) return wrapper(<Chair {...props} />);
  if (name.includes('bed')) return wrapper(<Bed {...props} />);
  if (name.includes('desk')) return wrapper(<Desk {...props} />);
  if (name.includes('wardrobe')) return wrapper(<Wardrobe {...props} />);
  if (name.includes('coffee')) return wrapper(<CoffeeTable {...props} />);
  if (name.includes('bookshelf') || name.includes('book')) return wrapper(<Bookshelf {...props} />);
  if (name.includes('kitchen') || name.includes('counter') || name.includes('island')) return wrapper(<KitchenUnit {...props} />);
  if (name.includes('floor lamp') || name.includes('floor_lamp')) return wrapper(<FloorLamp {...props} />);
  if (name.includes('pendant')) return wrapper(<PendantLight {...props} />);

  return wrapper(
    <mesh
      position={[piece.position.x, piece.position.y + piece.dimensions.y / 2, piece.position.z]}
      rotation={[piece.rotation.x, piece.rotation.y, piece.rotation.z]}
      castShadow
    >
      <boxGeometry args={[piece.dimensions.x, piece.dimensions.y, piece.dimensions.z]} />
      <meshStandardMaterial color={piece.materialOverride ?? '#5A5A5A'} roughness={0.7} />
    </mesh>,
  );
}

function FloorGroup({
  rooms,
  walls,
  openings = [],
  furniture,
  selectedId,
  showFurniture,
  wallColor,
  ghost,
  onSelectWall,
  onSelectFurniture,
}: {
  rooms: Room[];
  walls: Wall[];
  openings?: Opening[];
  furniture: FurniturePiece[];
  selectedId?: string | null;
  showFurniture: boolean;
  wallColor?: string;
  ghost: boolean;
  onSelectWall?: (id: string) => void;
  onSelectFurniture?: (id: string) => void;
}) {
  return (
    <group>
      {rooms.map((room) => (
        <ProceduralFloor
          key={`floor-${room.id}`}
          room={room}
          walls={walls}
          selected={!ghost && selectedId === room.id}
          opacity={ghost ? 0.2 : 1}
        />
      ))}
      {walls.map((wall) => (
        <ProceduralWall
          key={wall.id}
          wall={wall}
          openings={openings.filter((o) => o.wallId === wall.id)}
          selected={!ghost && selectedId === wall.id}
          color={wallColor}
          opacity={ghost ? 0.2 : 1}
          onClick={!ghost && onSelectWall ? () => onSelectWall(wall.id) : undefined}
        />
      ))}
      {showFurniture
        ? furniture.map((piece) => (
            <FurnitureMesh
              key={piece.id}
              piece={piece}
              selected={!ghost && selectedId === piece.id}
              onSelect={!ghost ? onSelectFurniture : undefined}
            />
          ))
        : null}
    </group>
  );
}

export function ProceduralBuilding({
  blueprint,
  selectedId,
  showFurniture = true,
  wallColor,
  allFloors,
  currentFloorIndex = 0,
  onSelectWall,
  onSelectFurniture,
}: ProceduralBuildingProps) {
  // Multi-floor mode: render all floors stacked
  if (allFloors && allFloors.length > 0) {
    return (
      <group>
        {allFloors.map((floor, i) => (
          <group
            key={floor.id}
            position={[0, getFloorYOffset(floor.index), 0]}
          >
            <FloorGroup
              rooms={floor.rooms}
              walls={floor.walls}
              openings={floor.openings}
              furniture={floor.furniture}
              selectedId={selectedId}
              showFurniture={showFurniture}
              wallColor={wallColor}
              ghost={i !== currentFloorIndex}
              onSelectWall={onSelectWall}
              onSelectFurniture={onSelectFurniture}
            />
          </group>
        ))}
      </group>
    );
  }

  // Single-floor mode: backward-compatible rendering from blueprint flat fields
  return (
    <FloorGroup
      rooms={blueprint.rooms}
      walls={blueprint.walls}
      openings={blueprint.openings}
      furniture={blueprint.furniture}
      selectedId={selectedId}
      showFurniture={showFurniture}
      wallColor={wallColor}
      ghost={false}
      onSelectWall={onSelectWall}
      onSelectFurniture={onSelectFurniture}
    />
  );
}
