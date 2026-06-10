import { useEffect, useRef } from 'react';
import { useBlueprintStore } from '../stores/blueprintStore';
import { detectRooms } from '../utils/roomDetection';
import type { Wall, Room } from '../types/blueprint';

function generateId(): string {
  return `room_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function centroidsClose(
  a: { x: number; y: number },
  b: { x: number; y: number },
  threshold = 0.5,
): boolean {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2) < threshold;
}

export function useRoomDetection(): void {
  const walls = useBlueprintStore((s) => s.blueprint?.walls);
  const existingRooms = useBlueprintStore((s) => s.blueprint?.rooms);
  const setRoomsDirectly = useBlueprintStore((s) => s.actions.setRoomsDirectly);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const generation = ++generationRef.current;

    timerRef.current = setTimeout(() => {
      if (generation !== generationRef.current) return;

      const currentWalls = walls ?? [];
      if (currentWalls.length < 3) return;

      const detected = detectRooms(currentWalls);
      const current = existingRooms ?? [];

      // Merge by centroid proximity — preserve existing room names/types
      const merged: Room[] = detected.map((d) => {
        const match = current.find((r) => centroidsClose(r.centroid, d.centroid));
        if (match) {
          return {
            ...match,
            wallIds: d.wallIds,
            area: d.area,
            centroid: d.centroid,
          };
        }
        // New room
        return {
          id: generateId(),
          name: 'Room',
          type: 'living_room' as const,
          wallIds: d.wallIds,
          floorMaterial: 'hardwood' as const,
          ceilingHeight: 2.4,
          area: d.area,
          centroid: d.centroid,
        };
      });

      setRoomsDirectly(merged);
    }, 100);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [walls, existingRooms, setRoomsDirectly]);
}
