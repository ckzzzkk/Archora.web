import type { BlueprintData, Room, FurniturePiece, Wall } from '../types/blueprint';

export interface BlueprintDiff {
  roomChanges: { added: string[]; removed: string[]; resized: { name: string; from: number; to: number }[] };
  furnitureChanges: { added: string[]; moved: string[]; removed: string[] };
  wallChanges: { added: number; removed: number };
  floorChanges: { added: number; removed: number };
  summary: string;
}

/** Compares two BlueprintData snapshots and returns a human-readable diff. */
export function diffBlueprints(
  original: BlueprintData,
  modified: BlueprintData,
  currentFloorIndex = 0,
): BlueprintDiff {
  const origFloors = original.floors ?? [];
  const modFloors = modified.floors ?? [];

  // Diff floors
  const addedFloors = Math.max(0, modFloors.length - origFloors.length);
  const removedFloors = Math.max(0, origFloors.length - modFloors.length);

  // Use the active floor for room/furniture diff (currentFloorIndex)
  const origActive = origFloors[currentFloorIndex] ?? { rooms: [], walls: [], furniture: [] };
  const modActive = modFloors[currentFloorIndex] ?? { rooms: [], walls: [], furniture: [] };

  const origRooms = origActive.rooms ?? [];
  const modRooms = modActive.rooms ?? [];
  const origFurniture = origActive.furniture ?? [];
  const modFurniture = modActive.furniture ?? [];
  const origWalls = origActive.walls ?? [];
  const modWalls = modActive.walls ?? [];

  // Rooms
  const origRoomIds = new Set(origRooms.map((r) => r.id));
  const modRoomIds = new Set(modRooms.map((r) => r.id));
  const addedRooms = modRooms.filter((r) => !origRoomIds.has(r.id)).map((r) => r.name);
  const removedRooms = origRooms.filter((r) => !modRoomIds.has(r.id)).map((r) => r.name);
  const resizedRooms = modRooms
    .filter((mod: Room) => {
      const orig = origRooms.find((r: Room) => r.id === mod.id);
      return orig && Math.abs(orig.area - mod.area) > 0.5;
    })
    .map((mod: Room) => {
      const orig = origRooms.find((r: Room) => r.id === mod.id)!;
      return { name: mod.name, from: Math.round(orig.area * 10) / 10, to: Math.round(mod.area * 10) / 10 };
    });

  // Furniture
  const origFurIds = new Set(origFurniture.map((f) => f.id));
  const modFurIds = new Set(modFurniture.map((f) => f.id));
  const addedFurniture = modFurniture.filter((f: FurniturePiece) => !origFurIds.has(f.id)).map((f: FurniturePiece) => f.name);
  const removedFurniture = origFurniture.filter((f: FurniturePiece) => !modFurIds.has(f.id)).map((f: FurniturePiece) => f.name);
  const movedFurniture = modFurniture
    .filter((mod: FurniturePiece) => {
      const orig = origFurniture.find((f: FurniturePiece) => f.id === mod.id);
      return orig && (orig.position.x !== mod.position.x || orig.position.z !== mod.position.z);
    })
    .map((f: FurniturePiece) => f.name);

  // Walls
  const origWallIds = new Set(origWalls.map((w) => w.id));
  const modWallIds = new Set(modWalls.map((w) => w.id));
  const addedWalls = modWalls.filter((w: Wall) => !origWallIds.has(w.id)).length;
  const removedWalls = origWalls.filter((w: Wall) => !modWallIds.has(w.id)).length;

  // Build summary string
  const parts: string[] = [];
  if (addedFloors > 0) parts.push(`+${addedFloors} floor${addedFloors > 1 ? 's' : ''}`);
  if (removedFloors > 0) parts.push(`-${removedFloors} floor${removedFloors > 1 ? 's' : ''}`);
  if (addedRooms.length) parts.push(`+room: ${addedRooms.join(', ')}`);
  if (removedRooms.length) parts.push(`-room: ${removedRooms.join(', ')}`);
  if (resizedRooms.length) parts.push(`resized: ${resizedRooms.map((r) => `${r.name} (${r.from}m² → ${r.to}m²)`).join(', ')}`);
  if (addedFurniture.length) parts.push(`+furniture: ${addedFurniture.join(', ')}`);
  if (movedFurniture.length) parts.push(`moved: ${movedFurniture.join(', ')}`);
  if (removedFurniture.length) parts.push(`-furniture: ${removedFurniture.join(', ')}`);
  if (addedWalls > 0) parts.push(`+${addedWalls} wall${addedWalls > 1 ? 's' : ''}`);
  if (removedWalls > 0) parts.push(`-${removedWalls} wall${removedWalls > 1 ? 's' : ''}`);

  return {
    roomChanges: { added: addedRooms, removed: removedRooms, resized: resizedRooms },
    furnitureChanges: { added: addedFurniture, moved: movedFurniture, removed: removedFurniture },
    wallChanges: { added: addedWalls, removed: removedWalls },
    floorChanges: { added: addedFloors, removed: removedFloors },
    summary: parts.length > 0 ? parts.join(' · ') : 'Blueprint updated',
  };
}