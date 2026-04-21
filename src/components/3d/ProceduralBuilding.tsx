import React from 'react';
import { ProceduralWall } from './ProceduralWall';
import { ProceduralFloor } from './ProceduralFloor';
import { ProceduralRoof } from './ProceduralRoof';
import { getModelVariant } from '../../data/designStyles';

// Base components
import { Sofa } from './furniture/Sofa';
import { Chair } from './furniture/Chair';
import { DiningTable } from './furniture/DiningTable';
import { Bed } from './furniture/Bed';
import { Desk } from './furniture/Desk';
import { Wardrobe } from './furniture/Wardrobe';
import { CoffeeTable } from './furniture/CoffeeTable';
import { Bookshelf } from './furniture/Bookshelf';
import { KitchenUnit, KitchenIslandSeating } from './furniture/KitchenUnit';
import { FloorLamp, PendantLight } from './furniture/LightingFurniture';

// Category: Living
import { CurvedSofa, LSofa, SectionalSofa, BarUnit, RoomDivider } from './furniture/LivingFurniture';

// Category: Bedroom
import { KingBed, PlatformBed, BunkBed, Crib, ToddlerBed, VanityDesk, ChangingTable } from './furniture/BedroomFurniture';

// Category: Storage
import { WalkInWardrobe, FullWallBookcase, ModularShelving, HomeOfficeDesk, CornerDesk } from './furniture/StorageFurniture';

// Category: Media
import { TVMediaUnit, FloatingTVShelf, FireplaceUnit, ElectricFireplace, TVStand } from './furniture/MediaFurniture';

// Category: Bathroom
import { FreestandingBath, CornerBath, Toilet, BathroomSink, Bathtub } from './furniture/BathroomFurniture';

// Category: Tables
import { RoundDiningTable, OvalDiningTable, BarStool } from './furniture/TablesFurniture';

// Category: Outdoor
import {
  GardenSofaSet, SunLounger, GardenDiningSet, GardenBench,
  SwingSet, Trampoline, Sandpit, Parasol, OutdoorKitchen,
  Pergola, GardenShed, SwimmingPool, HotTub,
  PlanterLarge, PlanterSmall,
} from './furniture/OutdoorFurniture';

// Category: Outdoor Structures
import {
  GardenPath, Driveway, GarageDoor, GardenWall,
  FencePanel, Gate, DeckArea, Steps, RetainingWall,
  RaisedGardenBed, WaterFeature, Fountain,
  Letterbox, GatePost, OutdoorLightPost, BicycleStorage,
} from './furniture/OutdoorStructures';

// Category: Stairs
import { SpiralStaircase, LStaircase } from './furniture/StairsFurniture';

import { getFloorYOffset } from '../../utils/floorHelpers';
import { getFurnitureVariant } from '../../data/designStyles';
import type { BlueprintData, FurniturePiece, FloorData, Room, Wall, Opening, Slab, Ceiling, Roof, RoofSegment } from '../../types';
import { ProceduralCeiling } from './ProceduralCeiling';

interface ProceduralBuildingProps {
  blueprint: BlueprintData;
  selectedId?: string | null;
  showFurniture?: boolean;
  onSelectWall?: (id: string) => void;
  onSelectFurniture?: (id: string) => void;
  wallColor?: string;
  allFloors?: FloorData[];
  currentFloorIndex?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FurnitureComponent = React.ComponentType<any>;

/** Maps FurnitureType key → 3D component. Order-sensitive for overlapping types. */
const FURNITURE_COMPONENTS: [string | string[], FurnitureComponent][] = [
  // Sofas / seating
  [['curved_sofa'], CurvedSofa],
  [['l_sofa'], LSofa],
  [['sectional_sofa'], SectionalSofa],
  [['sofa'], Sofa],
  [['bar_stool'], BarStool],
  [['dining_chair'], Chair],
  [['chair'], Chair],
  // Tables
  [['round_dining_table'], RoundDiningTable],
  [['oval_dining_table'], OvalDiningTable],
  [['dining_table'], DiningTable],
  [['coffee_table'], CoffeeTable],
  // Beds
  [['king_bed'], KingBed],
  [['platform_bed'], PlatformBed],
  [['bunk_bed'], BunkBed],
  [['crib'], Crib],
  [['toddler_bed'], ToddlerBed],
  [['bed_double'], Bed],
  [['bed_single'], Bed],
  [['bed'], Bed],
  // Desks
  [['vanity_desk'], VanityDesk],
  [['corner_desk'], CornerDesk],
  [['home_office_desk'], HomeOfficeDesk],
  [['desk'], Desk],
  // Storage
  [['walk_in_wardrobe'], WalkInWardrobe],
  [['full_wall_bookcase'], FullWallBookcase],
  [['modular_shelving'], ModularShelving],
  [['wardrobe'], Wardrobe],
  [['bookshelf'], Bookshelf],
  [['tv_stand'], TVStand],
  // Kitchen
  [['kitchen_island_seating'], KitchenIslandSeating],
  [['kitchen_island'], KitchenUnit],
  [['kitchen_counter'], KitchenUnit],
  // Bathroom
  [['toilet'], Toilet],
  [['bathroom_sink'], BathroomSink],
  [['bathtub'], Bathtub],
  [['freestanding_bath'], FreestandingBath],
  [['corner_bath'], CornerBath],
  // Media
  [['tv_media_unit'], TVMediaUnit],
  [['floating_tv_shelf'], FloatingTVShelf],
  [['fireplace_unit'], FireplaceUnit],
  [['electric_fireplace'], ElectricFireplace],
  // Living / decor
  [['bar_unit'], BarUnit],
  [['room_divider'], RoomDivider],
  // Baby
  [['changing_table'], ChangingTable],
  // Stairs
  [['spiral_staircase'], SpiralStaircase],
  [['l_staircase'], LStaircase],
  // Lighting
  [['floor_lamp'], FloorLamp],
  [['pendant_light'], PendantLight],
  // Outdoor seating
  [['garden_sofa_set'], GardenSofaSet],
  [['sun_lounger'], SunLounger],
  [['garden_bench'], GardenBench],
  // Outdoor structures / dining
  [['garden_dining_set'], GardenDiningSet],
  [['parasol'], Parasol],
  [['swing_set'], SwingSet],
  [['trampoline'], Trampoline],
  [['sandpit'], Sandpit],
  [['outdoor_kitchen'], OutdoorKitchen],
  [['pergola'], Pergola],
  [['garden_shed'], GardenShed],
  [['swimming_pool'], SwimmingPool],
  [['hot_tub'], HotTub],
  [['planter_large'], PlanterLarge],
  [['planter_small'], PlanterSmall],
  // Outdoor landscaping / structures
  [['garden_path'], GardenPath],
  [['driveway'], Driveway],
  [['garage_door'], GarageDoor],
  [['garden_wall'], GardenWall],
  [['fence_panel'], FencePanel],
  [['gate'], Gate],
  [['deck_area'], DeckArea],
  [['steps'], Steps],
  [['retaining_wall'], RetainingWall],
  [['raised_garden_bed'], RaisedGardenBed],
  [['water_feature'], WaterFeature],
  [['fountain'], Fountain],
  [['letterbox'], Letterbox],
  [['gate_post'], GatePost],
  [['outdoor_light_post'], OutdoorLightPost],
  [['bicycle_storage'], BicycleStorage],
];

function resolveComponent(category: string): FurnitureComponent | null {
  for (const [keys, Component] of FURNITURE_COMPONENTS) {
    const keyList = Array.isArray(keys) ? keys : [keys];
    if (keyList.includes(category)) return Component;
  }
  return null;
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
  const variant = getFurnitureVariant(piece.styleVariant ?? 'default');
  const modelVar = getModelVariant(piece.category, piece.modelVariant);
  const color = piece.materialOverride ?? variant.primary;
  const secondaryColor = modelVar.accentColor;
  const roughness = variant.roughness;
  const metalness = variant.metalness;

  const props = {
    position: piece.position,
    rotation: piece.rotation,
    dimensions: piece.dimensions,
    color,
    secondaryColor,
    roughness,
    metalness,
    modelVariant: piece.modelVariant ?? 'standard',
    selected,
  };

  const handleClick = onSelect ? () => onSelect(piece.id) : undefined;
  const wrapper = (child: React.ReactNode) => (
    <group onClick={handleClick}>{child}</group>
  );

  const Component = resolveComponent(piece.category);
  if (!Component) {
    return wrapper(
      <mesh
        position={[piece.position.x, piece.position.y + piece.dimensions.y / 2, piece.position.z]}
        rotation={[piece.rotation.x, piece.rotation.y, piece.rotation.z]}
        castShadow
      >
        <boxGeometry args={[piece.dimensions.x, piece.dimensions.y, piece.dimensions.z]} />
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
      </mesh>,
    );
  }

  return wrapper(<Component {...props} />);
}

function FloorGroup({
  rooms,
  walls,
  openings = [],
  furniture,
  slabs = [],
  ceilings = [],
  roofs = [],
  roofSegments = [],
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
  slabs?: Slab[];
  ceilings?: Ceiling[];
  roofs?: Roof[];
  roofSegments?: RoofSegment[];
  selectedId?: string | null;
  showFurniture: boolean;
  wallColor?: string;
  ghost: boolean;
  onSelectWall?: (id: string) => void;
  onSelectFurniture?: (id: string) => void;
}) {
  return (
    <group>
      {slabs.length > 0
        ? slabs.map((slab) => (
            <ProceduralFloor
              key={`slab-${slab.id}`}
              slab={slab}
              selected={!ghost && selectedId === slab.id}
              opacity={ghost ? 0.2 : 1}
            />
          ))
        : rooms.map((room) => (
            <ProceduralFloor
              key={`floor-${room.id}`}
              slab={{
                id: room.id,
                polygon: [],
                holes: [],
                holeMetadata: [],
                elevation: 0.05,
                autoFromWalls: false,
              }}
              walls={walls}
              selected={!ghost && selectedId === room.id}
              opacity={ghost ? 0.2 : 1}
              floorMaterial={room.floorMaterial}
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
      {ceilings.map((ceiling) => (
        <ProceduralCeiling
          key={ceiling.id}
          ceiling={ceiling}
          selected={!ghost && selectedId === ceiling.id}
          opacity={ghost ? 0.2 : 1}
        />
      ))}
      {roofs.map((roof) => (
        <ProceduralRoof
          key={roof.id}
          roof={roof}
          segments={roofSegments}
          selected={!ghost && selectedId === roof.id}
          opacity={ghost ? 0.2 : 1}
        />
      ))}
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
  if (allFloors && allFloors.length > 0) {
    return (
      <group>
        {allFloors.map((floor) => (
          <group
            key={floor.id}
            position={[0, getFloorYOffset(floor.index), 0]}
          >
            <FloorGroup
              rooms={floor.rooms}
              walls={floor.walls}
              openings={floor.openings}
              furniture={floor.furniture}
              slabs={floor.slabs}
              ceilings={floor.ceilings}
              roofs={floor.roofs}
              roofSegments={floor.roofSegments}
              selectedId={selectedId}
              showFurniture={showFurniture}
              wallColor={wallColor}
              ghost={floor.index !== currentFloorIndex}
              onSelectWall={onSelectWall}
              onSelectFurniture={onSelectFurniture}
            />
          </group>
        ))}
      </group>
    );
  }

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
