import { useCallback } from 'react';
import type { BlueprintData } from '../types/blueprint';

interface FurnitureSuggestion {
  furnitureType: string;
  position: string;
  reason: string;
}

function getAutoCompleteSuggestions(type: string, area: number): FurnitureSuggestion[] {
  switch (type) {
    case 'kitchen':
      return [
        { furnitureType: 'bathroom_sink', position: 'north_wall', reason: 'Near exterior wall for plumbing' },
        { furnitureType: 'kitchen_counter', position: 'perimeter', reason: 'Standard counter layout' },
      ];
    case 'bathroom':
      return [
        { furnitureType: 'toilet', position: 'corner', reason: 'Standard placement' },
        { furnitureType: 'bathroom_sink', position: 'adjacent_toilet', reason: 'Near toilet' },
        { furnitureType: area > 6 ? 'bathtub' : 'bathtub', position: 'far_wall', reason: 'Standard layout' },
      ];
    case 'bedroom':
      return [
        { furnitureType: area >= 12 ? 'king_bed' : 'bed_double', position: 'centre_far_wall', reason: 'Natural focal point' },
      ];
    case 'living_room':
      return [
        { furnitureType: 'sofa', position: 'centre', reason: 'Main seating area' },
        { furnitureType: 'coffee_table', position: 'front_sofa', reason: 'Standard layout' },
      ];
    case 'office':
      return [
        { furnitureType: 'desk', position: 'window_wall', reason: 'Natural light for work' },
        { furnitureType: 'chair', position: 'at_desk', reason: 'Standard placement' },
      ];
    default:
      return [];
  }
}

export function useRoomAutoComplete(blueprint: BlueprintData | null) {
  const suggestForRoom = useCallback((roomId: string): FurnitureSuggestion[] => {
    const room = (blueprint?.rooms ?? []).find((r) => r.id === roomId);
    if (!room) return [];
    const area = room.area;
    return getAutoCompleteSuggestions(room.type, area);
  }, [blueprint]);

  return { suggestForRoom };
}
