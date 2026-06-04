/**
 * architecturalQuality.ts — deterministic architect-grade quality scoring.
 *
 * Unlike blueprintValidator (which proves geometry is not BROKEN — closed loops,
 * no overlaps, sane dimensions), this module measures whether a plan is actually
 * GOOD: circulation logic, daylight/code basics, structural soundness, and
 * adjacency/zoning. Every check is deterministic code — no LLM judgement — so the
 * resulting per-category 0–100 scores are objective and reproducible.
 *
 * IMPORTANT: room→wall associations are derived GEOMETRICALLY (via wall-graph
 * polygon tracing + centroid-in-polygon matching), NOT from Room.wallIds — that
 * field is unreliable in practice (the procedural engine leaves it empty; the AI
 * is only asked to populate it). Working from coordinates makes scoring trustworthy
 * regardless of how the blueprint was produced.
 */

import type { BlueprintData, FloorData, Room, Opening, Wall, Vector2D } from '../../types/blueprint';
import { buildWallGraph } from './wallGraph';
import { pointInPolygon, boundingBox, polygonCentroid } from './polygonUtils';

const DOOR_TYPES = new Set(['door', 'sliding_door', 'french_door']);
const WINDOW_TYPES = new Set(['window', 'skylight']);
const HABITABLE: ReadonlySet<string> = new Set(['bedroom', 'living_room', 'kitchen', 'dining_room', 'office']);
const WET_ROOMS: ReadonlySet<string> = new Set(['bathroom', 'kitchen', 'laundry']);

export interface CategoryScore {
  score: number;        // 0–100
  issues: string[];     // human-readable specific failures
}

export interface ArchitecturalQualityReport {
  circulation: CategoryScore;
  daylightCode: CategoryScore;
  structural: CategoryScore;
  adjacency: CategoryScore;
  overall: number;      // average of the four, 0–100
}

interface FloorView {
  index: number;
  walls: Wall[];
  rooms: Room[];
  openings: Opening[];
}

/** Geometric association of rooms ↔ boundary walls, derived from coordinates. */
interface Assoc {
  roomPoly: Map<string, Vector2D[]>;     // roomId → boundary polygon vertices
  roomWalls: Map<string, Set<string>>;   // roomId → boundary wall ids
  wallToRooms: Map<string, string[]>;    // wallId → roomIds that border it
  centroidOf: (room: Room) => Vector2D;
}

// ── helpers ────────────────────────────────────────────────────────────────

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function floorViews(bp: BlueprintData): FloorView[] {
  if (bp.floors && bp.floors.length > 0) {
    return bp.floors.map((f: FloorData) => ({
      index: f.index,
      walls: f.walls ?? [],
      rooms: f.rooms ?? [],
      openings: f.openings ?? [],
    }));
  }
  return [{ index: 0, walls: bp.walls ?? [], rooms: bp.rooms ?? [], openings: bp.openings ?? [] }];
}

function dist(a: Vector2D, b: Vector2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Associate each semantic room with the traced wall polygon that encloses it,
 * picking the SMALLEST enclosing polygon (the room itself, not the building shell).
 */
function associate(view: FloorView): Assoc {
  const graph = buildWallGraph(view.walls);
  const roomPoly = new Map<string, Vector2D[]>();
  const roomWalls = new Map<string, Set<string>>();
  const wallToRooms = new Map<string, string[]>();

  for (const room of view.rooms) {
    const c = room.centroid && Number.isFinite(room.centroid.x) ? room.centroid : null;
    if (!c) continue;
    const enclosing = graph.tracedRooms
      .filter((tr) => pointInPolygon(c, tr.vertices))
      .sort((a, b) => a.area - b.area)[0];
    if (!enclosing) continue;
    roomPoly.set(room.id, enclosing.vertices);
    roomWalls.set(room.id, new Set(enclosing.wallIds));
    for (const wid of enclosing.wallIds) {
      wallToRooms.set(wid, [...(wallToRooms.get(wid) ?? []), room.id]);
    }
  }

  const centroidOf = (room: Room): Vector2D => {
    if (room.centroid && Number.isFinite(room.centroid.x)) return room.centroid;
    const poly = roomPoly.get(room.id);
    return poly ? polygonCentroid(poly) : { x: 0, y: 0 };
  };

  return { roomPoly, roomWalls, wallToRooms, centroidOf };
}

interface CircGraph {
  adj: Map<string, Set<string>>;
  entryRoomIds: Set<string>;
}

function buildCirculationGraph(rooms: Room[], openings: Opening[], assoc: Assoc): CircGraph {
  const adj = new Map<string, Set<string>>();
  for (const r of rooms) adj.set(r.id, new Set());
  const entryRoomIds = new Set<string>();

  for (const op of openings) {
    if (!DOOR_TYPES.has(op.type)) continue;
    const borders = assoc.wallToRooms.get(op.wallId) ?? [];
    if (borders.length >= 2) {
      for (let i = 0; i < borders.length; i++) {
        for (let j = i + 1; j < borders.length; j++) {
          adj.get(borders[i])?.add(borders[j]);
          adj.get(borders[j])?.add(borders[i]);
        }
      }
    } else if (borders.length === 1) {
      entryRoomIds.add(borders[0]);
    }
  }
  return { adj, entryRoomIds };
}

function reachableFrom(entry: Set<string>, adj: Map<string, Set<string>>, skip?: string): Set<string> {
  const seen = new Set<string>();
  const queue = [...entry].filter((id) => id !== skip);
  for (const id of queue) seen.add(id);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const next of adj.get(cur) ?? []) {
      if (next === skip || seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

// ── category scorers ─────────────────────────────────────────────────────────

function scoreCirculation(views: FloorView[], assocs: Assoc[]): CategoryScore {
  const issues: string[] = [];
  let score = 100;

  views.forEach((view, fi) => {
    if (view.rooms.length < 2) return;
    const assoc = assocs[fi];
    const { adj, entryRoomIds } = buildCirculationGraph(view.rooms, view.openings, assoc);
    const roomById = new Map(view.rooms.map((r) => [r.id, r]));

    let entry = entryRoomIds;
    if (entry.size === 0) {
      const front = [...view.rooms].sort((a, b) => assoc.centroidOf(a).y - assoc.centroidOf(b).y)[0];
      if (front) entry = new Set([front.id]);
    }

    const reachable = reachableFrom(entry, adj);
    for (const r of view.rooms) {
      if (!reachable.has(r.id)) {
        issues.push(`Floor ${view.index}: "${r.name}" is unreachable (no door path from the entrance)`);
        score -= 12;
      }
    }

    for (const r of view.rooms) {
      if (r.type !== 'bedroom') continue;
      const without = reachableFrom(entry, adj, r.id);
      const isolated = view.rooms.filter((o) => o.id !== r.id && reachable.has(o.id) && !without.has(o.id));
      if (isolated.length > 0) {
        issues.push(`Floor ${view.index}: must walk through bedroom "${r.name}" to reach ${isolated.map((o) => o.name).join(', ')}`);
        score -= 18;
      }
    }

    for (const r of view.rooms) {
      if (r.type !== 'bedroom' && r.type !== 'bathroom') continue;
      const neighbours = [...(adj.get(r.id) ?? [])].map((id) => roomById.get(id)).filter(Boolean) as Room[];
      const hasHall = neighbours.some((n) => n.type === 'hallway');
      const badDirect = neighbours.filter((n) =>
        n.type === 'living_room' || n.type === 'dining_room' || (r.type === 'bathroom' && n.type === 'kitchen'),
      );
      if (badDirect.length > 0) {
        issues.push(`Floor ${view.index}: ${r.type} "${r.name}" opens directly onto ${badDirect.map((n) => n.type).join(', ')} (should be off a hallway)`);
        score -= 8;
      } else if (!hasHall && neighbours.length > 0 && view.rooms.some((x) => x.type === 'hallway')) {
        issues.push(`Floor ${view.index}: ${r.type} "${r.name}" is not connected to a hallway`);
        score -= 4;
      }
    }
  });

  return { score: clamp(score), issues };
}

function scoreDaylightCode(views: FloorView[], assocs: Assoc[], buildingType: string): CategoryScore {
  const issues: string[] = [];
  let score = 100;

  const groundRooms = views.find((v) => v.index === 0)?.rooms ?? views[0]?.rooms ?? [];
  const totalRooms = views.reduce((n, v) => n + v.rooms.length, 0);

  views.forEach((view, fi) => {
    const assoc = assocs[fi];
    const windowWalls = new Set(view.openings.filter((o) => WINDOW_TYPES.has(o.type)).map((o) => o.wallId));
    for (const r of view.rooms) {
      if (!HABITABLE.has(r.type)) continue;
      const walls = assoc.roomWalls.get(r.id);
      const hasWindow = walls ? [...walls].some((id) => windowWalls.has(id)) : false;
      if (!hasWindow) {
        issues.push(`Floor ${view.index}: habitable room "${r.name}" has no window`);
        score -= 10;
      }
    }
    for (const r of view.rooms) {
      if (r.type !== 'hallway') continue;
      const poly = assoc.roomPoly.get(r.id);
      if (!poly) continue;
      const bb = boundingBox(poly);
      if (Math.min(bb.width, bb.height) < 0.9) {
        issues.push(`Floor ${view.index}: hallway "${r.name}" is ${Math.min(bb.width, bb.height).toFixed(2)}m wide (min 0.9m)`);
        score -= 6;
      }
    }
  });

  const isDwelling = ['house', 'villa', 'apartment', 'studio'].includes(buildingType);
  if (isDwelling && totalRooms > 3 && !groundRooms.some((r) => r.type === 'bathroom')) {
    issues.push('No WC/bathroom on the ground floor');
    score -= 10;
  }

  return { score: clamp(score), issues };
}

function scoreStructural(views: FloorView[], assocs: Assoc[]): CategoryScore {
  const issues: string[] = [];
  let score = 100;

  views.forEach((view, fi) => {
    const assoc = assocs[fi];
    for (const r of view.rooms) {
      const poly = assoc.roomPoly.get(r.id);
      if (!poly) continue;
      const bb = boundingBox(poly);
      if (Math.max(bb.width, bb.height) > 6.0) {
        issues.push(`Floor ${view.index}: "${r.name}" spans ${Math.max(bb.width, bb.height).toFixed(1)}m — needs a beam/support`);
        score -= 6;
      }
    }
  });

  const sorted = [...views].sort((a, b) => a.index - b.index);
  for (let i = 1; i < sorted.length; i++) {
    const upper = sorted[i];
    const lower = sorted[i - 1];

    const lowerLB = lower.walls.filter((w) => w.isLoadbearing);
    for (const w of upper.walls.filter((x) => x.isLoadbearing)) {
      const mid = { x: (w.start.x + w.end.x) / 2, y: (w.start.y + w.end.y) / 2 };
      const supported = lowerLB.some((lw) => {
        const lmid = { x: (lw.start.x + lw.end.x) / 2, y: (lw.start.y + lw.end.y) / 2 };
        return dist(mid, lmid) < 1.5;
      });
      if (!supported && lowerLB.length > 0) {
        issues.push(`Floor ${upper.index}: loadbearing wall has no support on the floor below`);
        score -= 4;
        break;
      }
    }

    const lowerWet = lower.rooms.filter((r) => WET_ROOMS.has(r.type)).map((r) => r.centroid).filter((c): c is Vector2D => !!c && Number.isFinite(c.x));
    for (const r of upper.rooms.filter((x) => WET_ROOMS.has(x.type))) {
      if (!r.centroid) continue;
      const stacked = lowerWet.some((c) => dist(r.centroid, c) < 3.0);
      if (!stacked && lowerWet.length > 0) {
        issues.push(`Floor ${upper.index}: wet room "${r.name}" is not stacked above a wet room (shared soil pipe)`);
        score -= 4;
      }
    }
  }

  return { score: clamp(score), issues };
}

function scoreAdjacency(views: FloorView[], assocs: Assoc[]): CategoryScore {
  const issues: string[] = [];
  let score = 100;

  views.forEach((view, fi) => {
    const assoc = assocs[fi];
    const byType = (t: string) => view.rooms.filter((r) => r.type === t);
    const sharesWall = (a: Room, b: Room) => {
      const wa = assoc.roomWalls.get(a.id);
      const wb = assoc.roomWalls.get(b.id);
      if (!wa || !wb) return false;
      for (const id of wa) if (wb.has(id)) return true;
      return false;
    };

    const kitchens = byType('kitchen');
    const dinings = byType('dining_room');
    if (kitchens.length && dinings.length) {
      const near = kitchens.some((k) => dinings.some((d) => sharesWall(k, d) || dist(assoc.centroidOf(k), assoc.centroidOf(d)) < 6));
      if (!near) { issues.push(`Floor ${view.index}: kitchen and dining are not adjacent`); score -= 8; }
    }

    const laundries = byType('laundry');
    if (kitchens.length && laundries.length) {
      const near = laundries.some((l) => kitchens.some((k) => dist(assoc.centroidOf(l), assoc.centroidOf(k)) < 8));
      if (!near) { issues.push(`Floor ${view.index}: laundry/utility is far from the kitchen`); score -= 4; }
    }

    const bedrooms = byType('bedroom');
    const socials = byType('living_room');
    if (bedrooms.length && socials.length) {
      const entryY = Math.min(...view.rooms.map((r) => assoc.centroidOf(r).y));
      const avgBed = bedrooms.reduce((s, r) => s + (assoc.centroidOf(r).y - entryY), 0) / bedrooms.length;
      const avgSocial = socials.reduce((s, r) => s + (assoc.centroidOf(r).y - entryY), 0) / socials.length;
      if (avgBed < avgSocial) {
        issues.push(`Floor ${view.index}: bedrooms sit closer to the entrance than living areas (weak private/social zoning)`);
        score -= 6;
      }
    }
  });

  return { score: clamp(score), issues };
}

/** Full architect-grade assessment. Run blueprintValidator first to ensure geometry is sound. */
export function assessArchitecturalQuality(bp: BlueprintData): ArchitecturalQualityReport {
  const views = floorViews(bp);
  const assocs = views.map(associate);
  const buildingType = bp.metadata?.buildingType ?? 'house';

  const circulation = scoreCirculation(views, assocs);
  const daylightCode = scoreDaylightCode(views, assocs, buildingType);
  const structural = scoreStructural(views, assocs);
  const adjacency = scoreAdjacency(views, assocs);

  const overall = Math.round((circulation.score + daylightCode.score + structural.score + adjacency.score) / 4);
  return { circulation, daylightCode, structural, adjacency, overall };
}
