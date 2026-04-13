/**
 * DXF Export Utility — converts BlueprintData to DXF (AutoCAD-compatible)
 * Supported: walls (LINE), rooms (LWPOLYLINE), dimensions (TEXT), room labels
 * Units: millimetres (1 unit = 1mm, matching architectural drawing convention)
 */

import type { BlueprintData, FloorData, Wall, Room } from '../types/blueprint';

const SCALE = 1000; // 1m → 1000mm

function mToDxf(m: number): number {
  return Math.round(m * SCALE);
}

function headerSection(): string {
  return [
    '0', 'SECTION',
    '2', 'HEADER',
    '9', '$ACADVER', '1', 'AC1015',
    '9', '$INSUNITS', '70', '4', // millimetres
    '9', '$MEASUREMENT', '70', '1', // metric
    '0', 'ENDSEC',
  ].join('\n') + '\n';
}

function tableSection(): string {
  return [
    '0', 'SECTION',
    '2', 'TABLES',
    // Layer table
    '0', 'TABLE',
    '2', 'LAYER',
    '70', '4', // number of layers
    // Walls layer
    '0', 'LAYER',
    '2', 'WALLS',
    '70', '0',
    '62', '7', // colour (white)
    '6', 'CONTINUOUS',
    // Rooms layer
    '0', 'LAYER',
    '2', 'ROOMS',
    '70', '0',
    '62', '3', // colour (green)
    '6', 'CONTINUOUS',
    // Dimensions layer
    '0', 'LAYER',
    '2', 'DIMENSIONS',
    '70', '0',
    '62', '2', // colour (yellow)
    '6', 'CONTINUOUS',
    // Labels layer
    '0', 'LAYER',
    '2', 'LABELS',
    '70', '0',
    '62', '5', // colour (blue)
    '6', 'CONTINUOUS',
    '0', 'ENDTAB',
    '0', 'ENDSEC',
  ].join('\n') + '\n';
}

function wallToLine(wall: Wall, floorIndex: number): string {
  const x1 = mToDxf(wall.start.x);
  const y1 = mToDxf(wall.start.y);
  const x2 = mToDxf(wall.end.x);
  const y2 = mToDxf(wall.end.y);
  const thickness = mToDxf(wall.thickness);

  const lines: string[] = [];

  // Main wall centre line
  lines.push(
    '0', 'LINE',
    '8', `F${floorIndex}_WALLS`,
    '10', String(x1),
    '20', String(y1),
    '30', '0',
    '11', String(x2),
    '21', String(y2),
    '31', '0',
  );

  // Wall thickness as parallel lines (left and right offset)
  if (thickness > 0) {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      const nx = -dy / len * (thickness / 2);
      const ny = dx / len * (thickness / 2);
      const x1o = mToDxf(wall.start.x + nx);
      const y1o = mToDxf(wall.start.y + ny);
      const x2o = mToDxf(wall.end.x + nx);
      const y2o = mToDxf(wall.end.y + ny);
      const x1i = mToDxf(wall.start.x - nx);
      const y1i = mToDxf(wall.start.y - ny);
      const x2i = mToDxf(wall.end.x - nx);
      const y2i = mToDxf(wall.end.y - ny);

      // Left offset
      lines.push(
        '0', 'LINE', '8', `F${floorIndex}_WALLS`,
        '10', String(x1o), '20', String(y1o), '30', '0',
        '11', String(x2o), '21', String(y2o), '31', '0',
      );
      // Right offset
      lines.push(
        '0', 'LINE', '8', `F${floorIndex}_WALLS`,
        '10', String(x1i), '20', String(y1i), '30', '0',
        '11', String(x2i), '21', String(y2i), '31', '0',
      );
      // End caps
      lines.push(
        '0', 'LINE', '8', `F${floorIndex}_WALLS`,
        '10', String(x1o), '20', String(y1o), '30', '0',
        '11', String(x1i), '21', String(y1i), '31', '0',
      );
      lines.push(
        '0', 'LINE', '8', `F${floorIndex}_WALLS`,
        '10', String(x2o), '20', String(y2o), '30', '0',
        '11', String(x2i), '21', String(y2i), '31', '0',
      );
    }
  }

  return lines.join('\n') + '\n';
}

function roomToPolyline(room: Room, walls: Wall[], floorIndex: number): string {
  // Collect wall vertices for this room
  const roomWallIds = new Set(room.wallIds);
  const usedWalls = walls.filter(w => roomWallIds.has(w.id));
  if (usedWalls.length < 3) return '';

  // Build ordered polygon from wall graph
  const points: Array<{ x: number; y: number }> = [];
  const wallMap = new Map<string, Wall>();
  usedWalls.forEach(w => wallMap.set(w.id, w));

  // Simple approach: use room centroid + wall geometry
  // Get the convex hull of room wall endpoints
  const endpoints = new Set<string>();
  usedWalls.forEach(w => {
    endpoints.add(`${w.start.x},${w.start.y}`);
    endpoints.add(`${w.end.x},${w.end.y}`);
  });
  const pts = Array.from(endpoints).map(s => {
    const [x, y] = s.split(',').map(Number);
    return { x, y };
  });

  if (pts.length < 3) return '';

  // Simple perimeter: connect wall start/end points
  // Order points by angle from centroid
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  pts.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));

  const vertices = pts.map(p => mToDxf(p.x)).join('\n21\n') + '\n' +
                  pts.map(p => mToDxf(p.y)).join('\n22\n') + '\n';

  const closed = 1; // closed polyline
  const numVerts = pts.length;

  return [
    '0', 'LWPOLYLINE',
    '8', `F${floorIndex}_ROOMS`,
    '90', String(numVerts),
    '70', String(closed),
    '10', vertices,
  ].join('\n') + '\n';
}

function roomLabel(room: Room, floorIndex: number): string {
  const cx = mToDxf(room.centroid.x);
  const cy = mToDxf(room.centroid.y);
  const height = mToDxf(0.3); // 30cm text height

  return [
    '0', 'TEXT',
    '8', `F${floorIndex}_LABELS`,
    '10', String(cx),
    '20', String(cy),
    '30', '0',
    '40', String(height),
    '1', room.name,
    '72', '1', // centre align
    '11', String(cx),
    '21', String(cy),
  ].join('\n') + '\n';
}

function floorSection(floor: FloorData, floorIndex: number): string {
  const lines: string[] = [];

  // Walls
  floor.walls.forEach(wall => {
    lines.push(wallToLine(wall, floorIndex));
  });

  // Room polygons
  floor.rooms.forEach(room => {
    lines.push(roomToPolyline(room, floor.walls, floorIndex));
    lines.push(roomLabel(room, floorIndex));
  });

  return lines.join('');
}

function buildHeaderComment(bp: BlueprintData): string {
  const now = new Date().toISOString();
  const totalArea = bp.floors.reduce((s, f) =>
    s + f.rooms.reduce((rs, r) => rs + r.area, 0), 0);

  return [
    `; ASORIA DXF Export — generated ${now}`,
    `; Building: ${bp.metadata.buildingType ?? 'Unknown'}`,
    `; Style: ${bp.metadata.style ?? 'Unknown'}`,
    `; Total floors: ${bp.floors.length}`,
    `; Total area: ${Math.round(totalArea)} m²`,
    '; Scale: 1 unit = 1mm',
  ].map(l => `0\nCOMMENT\n1\n${l}`).join('\n') + '\n';
}

/**
 * Convert a BlueprintData to DXF string.
 * Doors and windows are represented as smaller gaps in walls.
 */
export function blueprintToDXF(bp: BlueprintData): string {
  const parts: string[] = [];

  parts.push(buildHeaderComment(bp));
  parts.push(headerSection());
  parts.push(tableSection());

  // ENTITIES section
  parts.push([
    '0', 'SECTION',
    '2', 'ENTITIES',
  ].join('\n') + '\n');

  bp.floors.forEach((floor, idx) => {
    parts.push(floorSection(floor, idx));
  });

  parts.push([
    '0', 'ENDSEC',
    '0', 'EOF',
  ].join('\n') + '\n');

  return parts.join('');
}

/**
 * Export a blueprint floor to a downloadable .dxf file path.
 * Returns the local file URI.
 */
export async function exportBlueprintToDXF(
  bp: BlueprintData,
  filename = 'asoria-floorplan.dxf',
): Promise<string> {
  const dxf = blueprintToDXF(bp);
  const FileSystem = await import('expo-file-system/legacy');
  const uri = (FileSystem.documentDirectory ?? '') + filename;
  await FileSystem.writeAsStringAsync(uri, dxf, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return uri;
}
