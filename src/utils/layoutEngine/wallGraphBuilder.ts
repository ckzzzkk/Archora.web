/**
 * wallGraphBuilder.ts — derive a clean, shared wall graph from tiled rooms.
 *
 * Replaces wallBuilder.ts, which emitted 4 independent walls per room; the
 * duplicates broke the polygon tracing the quality scorer relies on. Tiles
 * from partition.ts cover the footprint exactly, so every wall is either
 * shared by exactly two rooms or exterior — derived here by an axis sweep:
 *
 * For each axis-aligned line that carries at least one tile edge, split the
 * line at the union of all edge endpoints on it; for each elementary
 * interval, the rooms on either side (point-in-tile test at the midpoint)
 * determine ONE wall segment with `adjacentRooms: [a, b|null]`. Consecutive
 * intervals with identical adjacency merge back into a single segment.
 */

import type { LayoutRoom, WallSegment } from './types';

const EPS = 1e-6;
const PROBE = 0.02; // probe distance either side of a line (≪ smallest room)

function key(v: number): string {
  return v.toFixed(3);
}

function roomAt(tiles: LayoutRoom[], x: number, y: number): LayoutRoom | null {
  // Strict interior test (probe points never sit on a boundary)
  for (const t of tiles) {
    if (x > t.x + EPS && x < t.x + t.width - EPS && y > t.y + EPS && y < t.y + t.height - EPS) {
      return t;
    }
  }
  return null;
}

interface Interval { from: number; to: number; sideA: string | null; sideB: string | null }

function sweepAxis(
  tiles: LayoutRoom[],
  axis: 'v' | 'h',
  makeId: () => string,
): WallSegment[] {
  // Collect lines: for vertical walls the line is an x-coordinate carrying
  // tile left/right edges; spans are y-ranges (and vice versa for horizontal).
  const lines = new Map<string, { coord: number; breaks: Set<number> }>();

  for (const t of tiles) {
    const edges = axis === 'v'
      ? [{ coord: t.x, from: t.y, to: t.y + t.height }, { coord: t.x + t.width, from: t.y, to: t.y + t.height }]
      : [{ coord: t.y, from: t.x, to: t.x + t.width }, { coord: t.y + t.height, from: t.x, to: t.x + t.width }];
    for (const e of edges) {
      const k = key(e.coord);
      const line = lines.get(k) ?? { coord: e.coord, breaks: new Set<number>() };
      line.breaks.add(e.from);
      line.breaks.add(e.to);
      lines.set(k, line);
    }
  }

  const segments: WallSegment[] = [];

  for (const { coord, breaks } of lines.values()) {
    const points = [...breaks].sort((a, b) => a - b);

    // Classify each elementary interval by the rooms either side of the line
    const intervals: Interval[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const from = points[i];
      const to = points[i + 1];
      if (to - from < EPS) continue;
      const mid = (from + to) / 2;
      const before = axis === 'v' ? roomAt(tiles, coord - PROBE, mid) : roomAt(tiles, mid, coord - PROBE);
      const after = axis === 'v' ? roomAt(tiles, coord + PROBE, mid) : roomAt(tiles, mid, coord + PROBE);
      // A gap between collinear edges of distant tiles has no room on either
      // side — no wall there. (Same room both sides cannot happen with exact
      // tiling; guard against numeric surprises anyway.)
      if (!before && !after) continue;
      if (before && after && before.id === after.id) continue;
      intervals.push({ from, to, sideA: before?.id ?? null, sideB: after?.id ?? null });
    }

    // Merge consecutive intervals with identical adjacency, then emit
    let open: Interval | null = null;
    const flush = () => {
      if (!open) return;
      const primary = open.sideA ?? open.sideB!;
      const secondary = open.sideA && open.sideB ? open.sideB : null;
      segments.push({
        id: makeId(),
        start: axis === 'v' ? { x: coord, y: open.from } : { x: open.from, y: coord },
        end: axis === 'v' ? { x: coord, y: open.to } : { x: open.to, y: coord },
        isExterior: secondary === null,
        adjacentRooms: [primary, secondary],
      });
      open = null;
    };

    for (const iv of intervals) {
      if (open && open.to >= iv.from - EPS && open.sideA === iv.sideA && open.sideB === iv.sideB) {
        open.to = iv.to;
      } else {
        flush();
        open = { ...iv };
      }
    }
    flush();
  }

  return segments;
}

/**
 * Build the shared wall graph for one floor's tiles.
 * Every segment borders 1 (exterior) or 2 (shared) rooms.
 */
export function buildWallsFromTiles(tiles: LayoutRoom[]): WallSegment[] {
  let counter = 0;
  const makeId = () => `wall-f${tiles[0]?.floorIndex ?? 0}-${counter++}`;
  return [...sweepAxis(tiles, 'v', makeId), ...sweepAxis(tiles, 'h', makeId)];
}
