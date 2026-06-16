/**
 * Cross-ventilation feasibility: a room can flush heat when it has openings on
 * walls whose outward normals differ by ≥ 90° — opposing facades or adjacent
 * (corner) facades both create a pressure differential and a flow path.
 */
import type { BlueprintData } from '../../types/blueprint';
import { floorViews, associate } from '../geometry/architecturalQuality';
import { resolveWallFacades, planDirAngle } from './facades';
import { CLIMATE_BRIEFS, type ClimateZoneId } from './climateData';
import type { Rating } from './solarGain';
import type { Compass } from './sunPath';

const VENT_OPENINGS = new Set(['window', 'sliding_door', 'french_door', 'skylight']);
const HABITABLE = new Set(['bedroom', 'living_room', 'kitchen', 'dining_room', 'office']);

export interface RoomVentilation {
  roomId: string;
  roomName: string;
  floorIndex: number;
  hasOpposedOpenings: boolean;
  openingCount: number;
  habitable: boolean;
}

export interface VentilationAnalysis {
  perRoom: RoomVentilation[];
  rating: Rating;
  issues: string[];
  score: number;
}

export function computeCrossVentilation(
  bp: BlueprintData,
  zone: ClimateZoneId,
  orientation: Compass,
): VentilationAnalysis {
  const brief = CLIMATE_BRIEFS[zone] ?? CLIMATE_BRIEFS.temperate;
  const views = floorViews(bp);
  const perRoom: RoomVentilation[] = [];
  const issues: string[] = [];

  views.forEach((view) => {
    const assoc = associate(view);
    const facades = resolveWallFacades(view.walls, orientation);
    for (const room of view.rooms) {
      const walls = assoc.roomWalls.get(room.id);
      const habitable = HABITABLE.has(room.type);
      if (!walls) {
        perRoom.push({ roomId: room.id, roomName: room.name, floorIndex: view.index, hasOpposedOpenings: false, openingCount: 0, habitable });
        continue;
      }
      const dirs: (ReturnType<typeof resolveWallFacades> extends Map<string, infer V> ? V : never)[] = [];
      let count = 0;
      for (const op of view.openings) {
        if (!VENT_OPENINGS.has(op.type) || !walls.has(op.wallId)) continue;
        count++;
        const f = facades.get(op.wallId);
        if (f) dirs.push(f);
      }
      let opposed = false;
      for (let i = 0; i < dirs.length && !opposed; i++) {
        for (let j = i + 1; j < dirs.length; j++) {
          if (planDirAngle(dirs[i].planDir, dirs[j].planDir) >= 90) { opposed = true; break; }
        }
      }
      perRoom.push({ roomId: room.id, roomName: room.name, floorIndex: view.index, hasOpposedOpenings: opposed, openingCount: count, habitable });
    }
  });

  // Penalty weight scales with how much this climate depends on ventilation.
  const weight = brief.crossVentilationPriority === 'critical' ? 10 : brief.crossVentilationPriority === 'recommended' ? 5 : 2;
  let score = 100;
  for (const r of perRoom) {
    if (!r.habitable) continue;
    if (r.openingCount === 0) continue; // windowless habitable rooms are the solar/daylight module's complaint
    if (!r.hasOpposedOpenings) {
      if (brief.crossVentilationPriority !== 'optional') {
        issues.push(`"${r.roomName}" has no cross-ventilation path (all openings on one side)`);
      }
      score -= weight;
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const rating: Rating = score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor';
  return { perRoom, rating, issues, score };
}
