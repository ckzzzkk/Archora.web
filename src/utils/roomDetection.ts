import type { Wall } from '../types/blueprint';

export interface DetectedRoom {
  wallIds: string[];
  area: number;           // m²
  centroid: { x: number; y: number };
}

/** Bresenham line rasterization onto a Uint8Array grid */
function rasterizeLine(
  grid: Uint8Array,
  gridW: number,
  x0: number, y0: number,
  x1: number, y1: number,
): void {
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    if (x0 >= 0 && y0 >= 0 && x0 < gridW) {
      grid[y0 * gridW + x0] = 1; // wall cell
    }
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx)  { err += dx; y0 += sy; }
  }
}

/**
 * Detect rooms by rasterized flood-fill.
 * @param walls - array of Wall objects (positions in metres)
 * @param resolution - grid cell size in metres (default 0.1m)
 */
export function detectRooms(walls: Wall[], resolution = 0.1): DetectedRoom[] {
  if (walls.length < 3) return [];

  // 1. Compute bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const w of walls) {
    minX = Math.min(minX, w.start.x, w.end.x);
    minY = Math.min(minY, w.start.y, w.end.y);
    maxX = Math.max(maxX, w.start.x, w.end.x);
    maxY = Math.max(maxY, w.start.y, w.end.y);
  }

  // Add 1m padding
  const pad = 1;
  minX -= pad; minY -= pad; maxX += pad; maxY += pad;

  const gridW = Math.min(Math.ceil((maxX - minX) / resolution), 500);
  const gridH = Math.min(Math.ceil((maxY - minY) / resolution), 500);

  if (gridW <= 0 || gridH <= 0) return [];

  // 2. Rasterize walls
  const grid = new Uint8Array(gridW * gridH); // 0=empty, 1=wall

  for (const w of walls) {
    const x0 = Math.round((w.start.x - minX) / resolution);
    const y0 = Math.round((w.start.y - minY) / resolution);
    const x1 = Math.round((w.end.x   - minX) / resolution);
    const y1 = Math.round((w.end.y   - minY) / resolution);
    rasterizeLine(grid, gridW, x0, y0, x1, y1);
  }

  // 3. BFS flood-fill from border → mark exterior (value=2)
  const exterior = new Uint8Array(gridW * gridH); // 0=unknown,1=exterior,2=interior
  const queue: number[] = [];

  const enqueue = (r: number, c: number) => {
    const idx = r * gridW + c;
    if (r < 0 || r >= gridH || c < 0 || c >= gridW) return;
    if (exterior[idx] !== 0 || grid[idx] === 1) return;
    exterior[idx] = 1;
    queue.push(r * gridW + c);
  };

  // Seed border cells
  for (let c = 0; c < gridW; c++) { enqueue(0, c); enqueue(gridH - 1, c); }
  for (let r = 0; r < gridH; r++) { enqueue(r, 0); enqueue(r, gridW - 1); }

  const dirs = [-1, 0, 1, 0, 0, -1, 0, 1];
  while (queue.length > 0) {
    const idx = queue.shift()!;
    const r = Math.floor(idx / gridW);
    const c = idx % gridW;
    for (let d = 0; d < 4; d++) {
      enqueue(r + dirs[d * 2], c + dirs[d * 2 + 1]);
    }
  }

  // 4. Connected-component labeling on non-exterior, non-wall cells
  const label = new Int32Array(gridW * gridH).fill(-1);
  let nextLabel = 0;
  const components: { cells: number[]; wallIds: string[] }[] = [];

  for (let r = 0; r < gridH; r++) {
    for (let c = 0; c < gridW; c++) {
      const idx = r * gridW + c;
      if (grid[idx] === 1 || exterior[idx] === 1 || label[idx] !== -1) continue;

      // BFS this component
      const compCells: number[] = [];
      const bfsQ: number[] = [idx];
      label[idx] = nextLabel;
      while (bfsQ.length > 0) {
        const curr = bfsQ.shift()!;
        compCells.push(curr);
        const cr = Math.floor(curr / gridW);
        const cc = curr % gridW;
        for (let d = 0; d < 4; d++) {
          const nr = cr + dirs[d * 2];
          const nc = cc + dirs[d * 2 + 1];
          if (nr < 0 || nr >= gridH || nc < 0 || nc >= gridW) continue;
          const ni = nr * gridW + nc;
          if (grid[ni] === 1 || exterior[ni] === 1 || label[ni] !== -1) continue;
          label[ni] = nextLabel;
          bfsQ.push(ni);
        }
      }
      components.push({ cells: compCells, wallIds: [] });
      nextLabel++;
    }
  }

  // 5. Build DetectedRoom from each component
  const rooms: DetectedRoom[] = [];
  for (const comp of components) {
    const cellCount = comp.cells.length;
    if (cellCount < 4) continue; // skip tiny noise (< 0.04m²)

    const area = cellCount * resolution * resolution;
    if (area < 0.5) continue; // skip sub-0.5m² fragments

    let sumR = 0, sumC = 0;
    for (const ci of comp.cells) {
      sumR += Math.floor(ci / gridW);
      sumC += ci % gridW;
    }
    const centroid = {
      x: sumC / cellCount * resolution + minX,
      y: sumR / cellCount * resolution + minY,
    };

    // Find adjacent wall IDs by checking cells near this component
    const adjacentWallIds: string[] = [];
    const centCell = { r: Math.round(sumR / cellCount), c: Math.round(sumC / cellCount) };
    for (const w of walls) {
      const wx0 = Math.round((w.start.x - minX) / resolution);
      const wy0 = Math.round((w.start.y - minY) / resolution);
      const wx1 = Math.round((w.end.x   - minX) / resolution);
      const wy1 = Math.round((w.end.y   - minY) / resolution);
      // Simple proximity check: wall midpoint near centroid
      const midC = (wx0 + wx1) / 2;
      const midR = (wy0 + wy1) / 2;
      const dist = Math.sqrt((midC - centCell.c) ** 2 + (midR - centCell.r) ** 2);
      if (dist < (gridW + gridH) / 4) {
        adjacentWallIds.push(w.id);
      }
    }

    rooms.push({ wallIds: adjacentWallIds, area, centroid });
  }

  return rooms;
}
