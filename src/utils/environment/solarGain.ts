/**
 * Per-room seasonal solar gain: window area × facade irradiance ÷ floor area.
 * Pure geometry — works on any blueprint regardless of how it was produced.
 */
import type { BlueprintData, Room } from '../../types/blueprint';
import { floorViews, associate, type FloorView, type Assoc } from '../geometry/architecturalQuality';
import { boundingBox } from '../geometry/polygonUtils';
import { facadeIrradiance, type Compass, type Season } from './sunPath';
import { resolveWallFacades } from './facades';
import type { ClimateZoneId, Hemisphere } from './climateData';

const WINDOW_TYPES = new Set(['window', 'skylight']);
const HABITABLE = new Set(['bedroom', 'living_room', 'kitchen', 'dining_room', 'office']);

export type Rating = 'excellent' | 'good' | 'fair' | 'poor';

export interface RoomSolar {
  roomId: string;
  roomName: string;
  roomType: string;
  floorIndex: number;
  /** Solar gain index per season: window·irradiance ÷ floor area, 0–1+ scale. */
  summer: number;
  winter: number;
  /** Dominant facade of this room's windows ('—' when windowless). */
  facade: Compass | '—';
  habitable: boolean;
}

export interface SolarAnalysis {
  perRoom: RoomSolar[];
  rating: Rating;
  issues: string[];
  /** 0–100: how well habitable rooms capture useful (winter) sun. */
  score: number;
}

function roomArea(room: Room, assoc: Assoc): number {
  if (room.area && Number.isFinite(room.area) && room.area > 0) return room.area;
  const poly = assoc.roomPoly.get(room.id);
  if (!poly) return 0;
  const bb = boundingBox(poly);
  return bb.width * bb.height;
}

function gainForRoom(
  room: Room,
  view: FloorView,
  assoc: Assoc,
  facades: ReturnType<typeof resolveWallFacades>,
  season: Season,
  hemisphere: Hemisphere,
  zone: ClimateZoneId,
): { gain: number; dominantFacade: Compass | '—' } {
  const walls = assoc.roomWalls.get(room.id);
  if (!walls) return { gain: 0, dominantFacade: '—' };
  const area = roomArea(room, assoc);
  if (area <= 0) return { gain: 0, dominantFacade: '—' };

  let total = 0;
  const byFacade = new Map<Compass, number>();
  for (const op of view.openings) {
    if (!WINDOW_TYPES.has(op.type) || !walls.has(op.wallId)) continue;
    const facade = facades.get(op.wallId);
    if (!facade) continue;
    const windowArea = (op.width || 0) * (op.height || 1.2);
    total += windowArea * facadeIrradiance(facade.compass, season, hemisphere, zone);
    byFacade.set(facade.compass, (byFacade.get(facade.compass) ?? 0) + windowArea);
  }

  let dominantFacade: Compass | '—' = '—';
  let best = 0;
  for (const [c, a] of byFacade) if (a > best) { best = a; dominantFacade = c; }

  return { gain: total / area, dominantFacade };
}

export function computeSolarGain(
  bp: BlueprintData,
  zone: ClimateZoneId,
  hemisphere: Hemisphere,
  orientation: Compass,
): SolarAnalysis {
  const views = floorViews(bp);
  const assocs = views.map(associate);
  const perRoom: RoomSolar[] = [];
  const issues: string[] = [];

  views.forEach((view, fi) => {
    const assoc = assocs[fi];
    const facades = resolveWallFacades(view.walls, orientation);
    for (const room of view.rooms) {
      const summer = gainForRoom(room, view, assoc, facades, 'summer', hemisphere, zone);
      const winter = gainForRoom(room, view, assoc, facades, 'winter', hemisphere, zone);
      perRoom.push({
        roomId: room.id,
        roomName: room.name,
        roomType: room.type,
        floorIndex: view.index,
        summer: summer.gain,
        winter: winter.gain,
        facade: winter.dominantFacade,
        habitable: HABITABLE.has(room.type),
      });
    }
  });

  // Score: habitable rooms should capture winter sun (gain index ≥ ~0.04
  // ≈ a 1.5m² well-oriented window in a 16m² room). Social rooms weigh double.
  let score = 100;
  const habitableRooms = perRoom.filter((r) => r.habitable);
  for (const r of habitableRooms) {
    const social = r.roomType === 'living_room' || r.roomType === 'dining_room';
    if (r.winter < 0.01) {
      issues.push(`"${r.roomName}" receives almost no winter sun (${r.facade === '—' ? 'no windows' : `windows face ${r.facade}`})`);
      score -= social ? 14 : 7;
    } else if (r.winter < 0.04 && social) {
      issues.push(`"${r.roomName}" gets weak winter sun — consider larger or better-oriented glazing`);
      score -= 6;
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const rating: Rating = score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor';
  return { perRoom, rating, issues, score };
}
