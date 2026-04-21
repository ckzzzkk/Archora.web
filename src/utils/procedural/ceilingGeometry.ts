import * as THREE from 'three';
import type { Ceiling, CeilingType } from '../../types/blueprint';

// ---------------------------------------------------------------------------
// Shape helpers
// ---------------------------------------------------------------------------

function buildShapeFromPolygon(polygon: [number, number][]): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(polygon[0]![0], -polygon[0]![1]);
  for (let i = 1; i < polygon.length; i++) {
    shape.lineTo(polygon[i]![0], -polygon[i]![1]);
  }
  shape.closePath();
  return shape;
}

function addHolesToShape(shape: THREE.Shape, holes: [number, number][][]): void {
  for (const holePolygon of holes) {
    if (holePolygon.length < 3) continue;
    const holePath = new THREE.Path();
    holePath.moveTo(holePolygon[0]![0], -holePolygon[0]![1]);
    for (let i = 1; i < holePolygon.length; i++) {
      holePath.lineTo(holePolygon[i]![0], -holePolygon[i]![1]);
    }
    holePath.closePath();
    shape.holes.push(holePath);
  }
}

/**
 * Ensure uv2 attribute exists for lightmaps.
 */
function ensureUv2(geometry: THREE.BufferGeometry): void {
  const uv = geometry.getAttribute('uv');
  if (!uv) return;
  geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(Array.from(uv.array), 2));
}

// ---------------------------------------------------------------------------
// Geometry builders per ceiling type
// ---------------------------------------------------------------------------

/**
 * flat_white / flat_dark / concrete / wood_planks
 * Simple flat plane at (height - 0.01).
 */
export function buildFlatCeilingGeometry(
  polygon: [number, number][],
  height: number,
): THREE.BufferGeometry {
  if (polygon.length < 3) return new THREE.BufferGeometry();

  const shape = buildShapeFromPolygon(polygon);
  addHolesToShape(shape, []);

  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  ensureUv2(geometry);
  // Position at ceiling height - 0.01 (slight offset to avoid z-fighting)
  geometry.translate(0, height - 0.01, 0);
  return geometry;
}

/**
 * coffered — recessed panel grid (2x2 or 3x3 based on room size).
 * Each panel: offset inward by ~0.15m, depth ~0.05m.
 * We build this by combining an outer shape and inner raised shapes.
 */
export function buildCofferedCeilingGeometry(
  polygon: [number, number][],
  height: number,
): THREE.BufferGeometry {
  if (polygon.length < 3) return new THREE.BufferGeometry();

  // Determine room size to decide grid
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of polygon) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const width = maxX - minX;
  const depth = maxZ - minZ;
  const isLarge = width > 6 || depth > 6;

  const OFFSET = 0.15;
  const PANEL_DEPTH = 0.05;

  // Build inner polygon (offset inward)
  const inner: [number, number][] = polygon.map(([x, z]) => [
    minX + OFFSET + ((x - minX) / (maxX - minX)) * (width - OFFSET * 2),
    minZ + OFFSET + ((z - minZ) / (maxZ - minZ)) * (depth - OFFSET * 2),
  ]);

  // Outer shape
  const outerShape = buildShapeFromPolygon(polygon);
  addHolesToShape(outerShape, [inner]);

  const geometry = new THREE.ShapeGeometry(outerShape);
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  ensureUv2(geometry);
  geometry.translate(0, height - 0.01, 0);

  // Add panel borders as thin box extrusions along the inner edge
  // For simplicity, we add raised border geometry around inner polygon
  const borderGeometries: THREE.BufferGeometry[] = [];

  // Create thin raised borders (4 sides of inner rectangle)
  const sides: [number, number][][] = [
    [[inner[0]![0], inner[0]![1]], [inner[1]![0], inner[1]![1]]],
    [[inner[1]![0], inner[1]![1]], [inner[2]![0], inner[2]![1]]],
    [[inner[2]![0], inner[2]![1]], [inner[3]![0], inner[3]![1]]],
    [[inner[3]![0], inner[3]![1]], [inner[0]![0], inner[0]![1]]],
  ];

  for (const side of sides) {
    const dx = side[1]![0] - side[0]![0];
    const dz = side[1]![1] - side[0]![1];
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(-dz, dx);

    const boxGeo = new THREE.BoxGeometry(length, PANEL_DEPTH, 0.02);
    boxGeo.translate(side[0]![0] + dx / 2, height - 0.01 + PANEL_DEPTH / 2, side[0]![1] + dz / 2);
    boxGeo.rotateX(-Math.PI / 2);
    boxGeo.rotateZ(-angle);
    borderGeometries.push(boxGeo);
  }

  // Merge all geometries
  return mergeGeometries([geometry, ...borderGeometries]);
}

/**
 * tray — single recessed center area.
 * Inset the inner portion by ~0.2m, lower by ~0.08m.
 */
export function buildTrayCeilingGeometry(
  polygon: [number, number][],
  height: number,
): THREE.BufferGeometry {
  if (polygon.length < 3) return new THREE.BufferGeometry();

  const OFFSET = 0.2;
  const TRAY_DEPTH = 0.08;

  // Compute bounds
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of polygon) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const width = maxX - minX;
  const depth = maxZ - minZ;

  const inner: [number, number][] = polygon.map(([x, z]) => [
    minX + OFFSET + ((x - minX) / width) * (width - OFFSET * 2),
    minZ + OFFSET + ((z - minZ) / depth) * (depth - OFFSET * 2),
  ]);

  // Outer frame (with hole for inner)
  const outerShape = buildShapeFromPolygon(polygon);
  addHolesToShape(outerShape, [inner]);

  const geometry = new THREE.ShapeGeometry(outerShape);
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  ensureUv2(geometry);
  geometry.translate(0, height - 0.01, 0);

  // Add recessed inner panel (lowered)
  const innerShape = buildShapeFromPolygon(inner);
  const innerGeo = new THREE.ShapeGeometry(innerShape);
  innerGeo.rotateX(-Math.PI / 2);
  innerGeo.translate(0, height - 0.01 - TRAY_DEPTH, 0);

  return mergeGeometries([geometry, innerGeo]);
}

/**
 * vaulted — angled ceiling, like a sloped roof underside.
 * Two opposite edges form the "ridge" at height + additional rise.
 */
export function buildVaultedCeilingGeometry(
  polygon: [number, number][],
  height: number,
): THREE.BufferGeometry {
  if (polygon.length < 3) return new THREE.BufferGeometry();

  // Determine longer axis to serve as ridge direction
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of polygon) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const width = maxX - minX;
  const depth = maxZ - minZ;

  const RISE = 0.5; // additional height at ridge

  // Build shape in YZ plane and rotate to XZ
  // Use two triangles to form vault shape across the shorter dimension
  const shape = new THREE.Shape();
  if (width >= depth) {
    // Ridge along X axis, vault across Z
    shape.moveTo(minX, -minZ);
    shape.lineTo(minX, -maxZ);
    shape.lineTo(maxX, -minZ);
    shape.lineTo(maxX, -maxZ);
    shape.closePath();
  } else {
    // Ridge along Z axis, vault across X
    shape.moveTo(minX, -minZ);
    shape.lineTo(minX, -maxZ);
    shape.lineTo(maxX, -minZ);
    shape.lineTo(maxX, -maxZ);
    shape.closePath();
  }

  // Extrude to create vaulted surface
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.01,
    bevelEnabled: false,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  ensureUv2(geometry);
  geometry.translate(0, height - 0.01, 0);

  return geometry;
}

/**
 * exposed_beams — parallel box beams across ceiling.
 * Beams (0.1m wide × 0.15m tall) at 0.6m intervals across shorter room dimension.
 * Flat ceiling plane at (height - 0.04), beams protruding below.
 */
export function buildExposedBeamsCeilingGeometry(
  polygon: [number, number][],
  height: number,
): THREE.BufferGeometry {
  if (polygon.length < 3) return new THREE.BufferGeometry();

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of polygon) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const width = maxX - minX;
  const depth = maxZ - minZ;

  const BEAM_WIDTH = 0.1;
  const BEAM_HEIGHT = 0.15;
  const BEAM_SPACING = 0.6;
  const PLANE_OFFSET = 0.04;

  // Base flat ceiling at height - PLANE_OFFSET
  const baseGeometry = buildFlatCeilingGeometry(polygon, height - PLANE_OFFSET);

  // Determine beam direction (across shorter dimension)
  const geos: THREE.BufferGeometry[] = [baseGeometry];

  const numBeams = Math.floor((Math.min(width, depth) - BEAM_WIDTH) / BEAM_SPACING);
  const isXDirection = width < depth;

  for (let i = 0; i <= numBeams; i++) {
    const offset = i * BEAM_SPACING;
    let bx: number, bz: number;

    if (isXDirection) {
      bx = minX + offset;
      bz = (minZ + maxZ) / 2;
      const beamGeo = new THREE.BoxGeometry(BEAM_SPACING, BEAM_HEIGHT, depth + 0.1);
      beamGeo.translate(bx + BEAM_SPACING / 2, height - PLANE_OFFSET - BEAM_HEIGHT / 2, bz);
      geos.push(beamGeo);
    } else {
      bx = (minX + maxX) / 2;
      bz = minZ + offset;
      const beamGeo = new THREE.BoxGeometry(width + 0.1, BEAM_HEIGHT, BEAM_SPACING);
      beamGeo.translate(bx, height - PLANE_OFFSET - BEAM_HEIGHT / 2, bz + BEAM_SPACING / 2);
      geos.push(beamGeo);
    }
  }

  return mergeGeometries(geos);
}

/**
 * acoustic_panels — grid of small flat panels with slight gaps.
 */
export function buildAcousticPanelsGeometry(
  polygon: [number, number][],
  height: number,
): THREE.BufferGeometry {
  if (polygon.length < 3) return new THREE.BufferGeometry();

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of polygon) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const width = maxX - minX;
  const depth = maxZ - minZ;

  const PANEL_SIZE = 0.6;
  const GAP = 0.05;
  const totalSize = PANEL_SIZE + GAP;

  const geos: THREE.BufferGeometry[] = [];

  const cols = Math.floor(width / totalSize);
  const rows = Math.floor(depth / totalSize);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = minX + c * totalSize + PANEL_SIZE / 2;
      const pz = minZ + r * totalSize + PANEL_SIZE / 2;
      const panelGeo = new THREE.BoxGeometry(PANEL_SIZE, 0.02, PANEL_SIZE);
      panelGeo.translate(px, height - 0.01 - 0.01, pz);
      geos.push(panelGeo);
    }
  }

  return mergeGeometries(geos);
}

/**
 * barrel_vault — curved ceiling via tube geometry along an arc path.
 * Semicircular arc spanning the room's longer dimension.
 */
export function buildBarrelVaultCeilingGeometry(
  polygon: [number, number][],
  height: number,
): THREE.BufferGeometry {
  if (polygon.length < 3) return new THREE.BufferGeometry();

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of polygon) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const width = maxX - minX;
  const depth = maxZ - minZ;

  const RISE = Math.min(width, depth) * 0.4;

  // Create semicircular arc along longer dimension
  const isXDirection = width >= depth;
  const spanLength = isXDirection ? width : depth;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(isXDirection ? minX : centerX, height + RISE, isXDirection ? centerZ : minZ),
    new THREE.Vector3(isXDirection ? centerX : centerX, height + RISE * 2, isXDirection ? centerZ : centerZ),
    new THREE.Vector3(isXDirection ? maxX : centerX, height + RISE, isXDirection ? centerZ : maxZ),
  );

  const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.01, 8, false);
  tubeGeo.computeVertexNormals();
  ensureUv2(tubeGeo);

  // Fill the sides with flat surfaces
  const geos: THREE.BufferGeometry[] = [tubeGeo];

  // Add flat closing surfaces on the ends
  if (isXDirection) {
    const leftCap = new THREE.CircleGeometry(RISE, 16);
    leftCap.rotateY(Math.PI / 2);
    leftCap.translate(minX, height + RISE, centerZ);
    geos.push(leftCap);

    const rightCap = new THREE.CircleGeometry(RISE, 16);
    rightCap.rotateY(-Math.PI / 2);
    rightCap.translate(maxX, height + RISE, centerZ);
    geos.push(rightCap);
  } else {
    const frontCap = new THREE.CircleGeometry(RISE, 16);
    frontCap.rotateY(0);
    frontCap.translate(centerX, height + RISE, minZ);
    geos.push(frontCap);

    const backCap = new THREE.CircleGeometry(RISE, 16);
    backCap.rotateY(Math.PI);
    backCap.translate(centerX, height + RISE, maxZ);
    geos.push(backCap);
  }

  return mergeGeometries(geos);
}

/**
 * dropped — dropped ceiling with a border frame.
 * Slightly lower perimeter, raised center.
 */
export function buildDroppedCeilingGeometry(
  polygon: [number, number][],
  height: number,
): THREE.BufferGeometry {
  if (polygon.length < 3) return new THREE.BufferGeometry();

  const BORDER_INSET = 0.3;
  const BORDER_DROP = 0.1;

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of polygon) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const width = maxX - minX;
  const depth = maxZ - minZ;

  const inner: [number, number][] = polygon.map(([x, z]) => [
    minX + BORDER_INSET + ((x - minX) / width) * (width - BORDER_INSET * 2),
    minZ + BORDER_INSET + ((z - minZ) / depth) * (depth - BORDER_INSET * 2),
  ]);

  // Outer frame (dropped)
  const outerShape = buildShapeFromPolygon(polygon);
  addHolesToShape(outerShape, [inner]);

  const geometry = new THREE.ShapeGeometry(outerShape);
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  ensureUv2(geometry);
  geometry.translate(0, height - 0.01 - BORDER_DROP, 0);

  // Center raised panel
  const innerShape = buildShapeFromPolygon(inner);
  const innerGeo = new THREE.ShapeGeometry(innerShape);
  innerGeo.rotateX(-Math.PI / 2);
  innerGeo.translate(0, height - 0.01, 0);

  return mergeGeometries([geometry, innerGeo]);
}

// ---------------------------------------------------------------------------
// Utility: merge geometries
// ---------------------------------------------------------------------------

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  // Use BufferGeometryUtils merge if available, otherwise manually merge
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BufferGeometryUtils = (THREE as any).BufferGeometryUtils;
  if (BufferGeometryUtils && typeof BufferGeometryUtils.mergeBufferGeometries === 'function') {
    return BufferGeometryUtils.mergeBufferGeometries(geometries, false);
  }

  // Manual merge fallback
  let totalVertices = 0;
  let totalIndices = 0;
  for (const geo of geometries) {
    totalVertices += geo.attributes.position.count;
    if (geo.index) totalIndices += geo.index.count;
  }

  const positions = new Float32Array(totalVertices * 3);
  const normals = new Float32Array(totalVertices * 3);
  const uvs = new Float32Array(totalVertices * 2);
  const indices: number[] = [];

  let vertexOffset = 0;
  let indexOffset = 0;

  for (const geo of geometries) {
    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;
    const uv = geo.attributes.uv;

    for (let i = 0; i < pos.count; i++) {
      positions[(vertexOffset + i) * 3] = pos.getX(i);
      positions[(vertexOffset + i) * 3 + 1] = pos.getY(i);
      positions[(vertexOffset + i) * 3 + 2] = pos.getZ(i);
      if (nor) {
        normals[(vertexOffset + i) * 3] = nor.getX(i);
        normals[(vertexOffset + i) * 3 + 1] = nor.getY(i);
        normals[(vertexOffset + i) * 3 + 2] = nor.getZ(i);
      }
      if (uv) {
        uvs[(vertexOffset + i) * 2] = uv.getX(i);
        uvs[(vertexOffset + i) * 2 + 1] = uv.getY(i);
      }
    }

    if (geo.index) {
      for (let i = 0; i < geo.index.count; i++) {
        indices.push(geo.index.getX(i) + vertexOffset);
      }
    }

    vertexOffset += pos.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  if (indices.length > 0) {
    merged.setIndex(indices);
  }
  merged.computeVertexNormals();
  return merged;
}

// ---------------------------------------------------------------------------
// Main dispatch
// ---------------------------------------------------------------------------

export function buildCeilingGeometry(ceiling: Ceiling): THREE.BufferGeometry {
  switch (ceiling.ceilingType) {
    case 'flat_white':
    case 'flat_dark':
      return buildFlatCeilingGeometry(ceiling.polygon, ceiling.height);
    case 'coffered':
      return buildCofferedCeilingGeometry(ceiling.polygon, ceiling.height);
    case 'tray':
      return buildTrayCeilingGeometry(ceiling.polygon, ceiling.height);
    case 'vaulted':
      return buildVaultedCeilingGeometry(ceiling.polygon, ceiling.height);
    case 'exposed_beams':
      return buildExposedBeamsCeilingGeometry(ceiling.polygon, ceiling.height);
    case 'concrete':
    case 'wood_planks':
      return buildFlatCeilingGeometry(ceiling.polygon, ceiling.height);
    case 'acoustic_panels':
      return buildAcousticPanelsGeometry(ceiling.polygon, ceiling.height);
    case 'barrel_vault':
      return buildBarrelVaultCeilingGeometry(ceiling.polygon, ceiling.height);
    case 'dropped':
      return buildDroppedCeilingGeometry(ceiling.polygon, ceiling.height);
    default:
      return buildFlatCeilingGeometry(ceiling.polygon, ceiling.height);
  }
}