import * as THREE from 'three';

/**
 * Stair segment — used by buildStairSegmentGeometry and multi-segment builders.
 */
export interface StairSegment {
  id: string;
  segmentType: 'stair' | 'landing';
  width: number;
  length: number;
  height: number;
  stepCount: number;
  attachmentSide?: 'front' | 'left' | 'right';
  thickness: number;
  fillToFloor: boolean;
}

// ---------------------------------------------------------------------------
// Individual segment
// ---------------------------------------------------------------------------

/**
 * Build a BufferGeometry for a single stair segment (stair run or landing platform).
 *
 * - Riser/tread profile as a THREE.Shape in XY (x = depth along run, y = height)
 * - Extruded along Z (width axis), then rotated -PI/2 around X so it lies in XZ plane
 * - Material group 1 (TREAD/top) when Y > 0.75 (top surface of tread)
 * - Material group 0 (SIDE) for all other faces
 *
 * Returns { geometry, materialGroups } where materialGroups is used for mesh assignment.
 */
export function buildStairSegmentGeometry(
  segment: StairSegment,
): { geometry: THREE.BufferGeometry; materialGroups: Array<{ position: number[]; materialIndex: number }> } {
  const { width, length, height, stepCount, thickness, fillToFloor } = segment;

  if (stepCount < 1 || width <= 0 || length <= 0 || height <= 0) {
    return { geometry: new THREE.BufferGeometry(), materialGroups: [] };
  }

  const shape = new THREE.Shape();
  const stepH = height / stepCount;
  const stepD = length / stepCount;

  // Bottom-left of profile (start of first riser)
  shape.moveTo(0, 0);

  // Build riser/tread profile:
  // For each step: vertical riser, horizontal tread
  for (let i = 0; i < stepCount; i++) {
    // Vertical riser
    shape.lineTo(stepD * i, stepH * (i + 1));
    // Horizontal tread (top of step i)
    shape.lineTo(stepD * (i + 1), stepH * (i + 1));
  }

  if (fillToFloor) {
    // Close bottom with a flat line back to origin
    shape.lineTo(length, 0);
    shape.closePath();
  } else {
    // Sloped bottom: back from last tread edge down to first riser base
    const lastX = stepD * stepCount;
    shape.lineTo(lastX, 0);
    shape.closePath();
  }

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: width,
    bevelEnabled: false,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // Rotate -PI/2 around X: Y-up → Z-up, so extruded depth aligns with Z axis
  geometry.rotateX(-Math.PI / 2);

  // Build material group assignments: each triangle's materialIndex based on centroid Y
  const posAttr = geometry.getAttribute('position');
  const triCount = posAttr.count / 3;
  const materialGroups: Array<{ position: number[]; materialIndex: number }> = [];

  for (let i = 0; i < triCount; i++) {
    // Use the first vertex's Y (before rotation) as proxy: Y > 0.75 of height → TREAD group
    // After rotation, Y-axis becomes Z-axis, so the original Y maps to world Z height
    // We check world Z after rotation: if > (height * 0.75), it's a top tread surface
    // But the original Y = stepH * stepCount = height gives us the tread level
    // Simpler: check original Y before rotation against stepH * (stepCount - 0.5)
    // Since shape.y goes from 0 to height, vertices with original Y near height are tread tops
    const vy = posAttr.getY(i * 3);
    const isTop = vy > height * 0.75;
    const matIdx = isTop ? 1 : 0;

    // Compute triangle centroid
    const cx = (posAttr.getX(i * 3) + posAttr.getX(i * 3 + 1) + posAttr.getX(i * 3 + 2)) / 3;
    const cy = (posAttr.getY(i * 3) + posAttr.getY(i * 3 + 1) + posAttr.getY(i * 3 + 2)) / 3;
    const cz = (posAttr.getZ(i * 3) + posAttr.getZ(i * 3 + 1) + posAttr.getZ(i * 3 + 2)) / 3;

    // Rotate centroid: after rotateX(-PI/2): Y becomes original Z, Z becomes -original Y
    const rotX = cx;
    const rotY = cz;         // original Z → new Y
    const rotZ = -cy;        // original Y → new Z

    materialGroups.push({ position: [rotX, rotY, rotZ], materialIndex: matIdx });
  }

  return { geometry, materialGroups };
}

// ---------------------------------------------------------------------------
// Straight staircase
// ---------------------------------------------------------------------------

export function buildStraightStaircase(
  width = 0.9,
  totalRise = 3.0,
  stepCount = 12,
  thickness = 0.025,
  fillToFloor = true,
): THREE.BufferGeometry {
  const segment: StairSegment = {
    id: 'straight',
    segmentType: 'stair',
    width,
    length: stepCount * 0.25,  // 0.25m per step tread depth
    height: totalRise,
    stepCount,
    thickness,
    fillToFloor,
  };

  return buildStairSegmentGeometry(segment).geometry;
}

// ---------------------------------------------------------------------------
// L-shaped staircase (two flights + landing)
// ---------------------------------------------------------------------------

export function buildLStaircase(
  width = 0.9,
  totalRise = 3.0,
  stepCount = 12,
  thickness = 0.025,
  fillToFloor = true,
): THREE.BufferGeometry {
  const stepsPerFlight = Math.max(1, Math.floor(stepCount / 2));
  const treadDepth = 0.25;
  const flight1Length = stepsPerFlight * treadDepth;
  const flight2Length = stepsPerFlight * treadDepth;
  const stepH = totalRise / stepCount;

  // Total dimensions
  const totalLen = flight1Length + flight2Length;
  const totalH = stepH * stepsPerFlight;

  const geometries: THREE.BufferGeometry[] = [];

  // Flight 1 — runs along +Z direction, rises to mid height
  const seg1: StairSegment = {
    id: 'flight1',
    segmentType: 'stair',
    width,
    length: flight1Length,
    height: totalH,
    stepCount: stepsPerFlight,
    thickness,
    fillToFloor,
  };
  geometries.push(buildStairSegmentGeometry(seg1).geometry);

  // Landing platform between flights
  const landing: StairSegment = {
    id: 'landing',
    segmentType: 'landing',
    width,
    length: treadDepth * 1.2,
    height: totalH,
    stepCount: 1,
    thickness,
    fillToFloor,
  };
  geometries.push(buildStairSegmentGeometry(landing).geometry);

  // Flight 2 — runs along +X direction, 90° turn, rises from mid height to top
  const seg2: StairSegment = {
    id: 'flight2',
    segmentType: 'stair',
    width,
    length: flight2Length,
    height: totalH,
    stepCount: stepsPerFlight,
    thickness,
    fillToFloor,
  };
  const geo2 = buildStairSegmentGeometry(seg2).geometry;

  // Translate flight 2 so it starts at end of flight 1
  geo2.translate(flight1Length, 0, 0);
  geometries.push(geo2);

  return mergeStairGeometries(geometries, []);
}

// ---------------------------------------------------------------------------
// Spiral staircase
// ---------------------------------------------------------------------------

export function buildSpiralStaircase(
  width = 0.9,
  totalRise = 3.0,
  stepCount = 12,
  innerRadius = 0.3,
  sweepAngle = Math.PI / 2,
  thickness = 0.025,
  fillToFloor = false,
): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];
  const stepH = totalRise / stepCount;
  const stepAngle = sweepAngle / stepCount;
  const outerR = innerRadius + width;

  // Central pole
  const poleGeo = new THREE.CylinderGeometry(innerRadius * 0.4, innerRadius * 0.4, totalRise, 12);
  const poleMat = new THREE.MeshStandardMaterial({ color: '#808080', roughness: 0.3, metalness: 0.6 });
  const poleMesh = new THREE.Mesh(poleGeo, poleMat);
  poleMesh.position.set(0, totalRise / 2, 0);
  poleMesh.castShadow = true;

  // Build steps in a helix
  for (let i = 0; i < stepCount; i++) {
    const angle = i * stepAngle;
    const midAngle = angle + stepAngle / 2;
    const stepY = stepH * i + stepH / 2;

    // Step geometry
    const stepGeo = new THREE.BoxGeometry(width * 0.42, stepH * 0.85, width * 0.4);

    // Position step at midpoint along the arc
    const cx = Math.cos(midAngle) * (innerRadius + width / 2);
    const cz = Math.sin(midAngle) * (innerRadius + width / 2);

    const stepMesh = new THREE.Mesh(stepGeo);
    stepMesh.position.set(cx, stepY, cz);
    stepMesh.rotation.y = -midAngle;
    stepMesh.castShadow = true;
    stepMesh.receiveShadow = true;

    // Convert to geometry and dispose mesh
    const stepBufferGeo = stepGeo.clone();
    stepBufferGeo.applyMatrix4(stepMesh.matrixWorld);
    geometries.push(stepBufferGeo);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (stepMesh as any).dispose();
  }

  // Top platform
  const topPlatGeo = new THREE.CylinderGeometry(outerR * 0.38, outerR * 0.38, stepH, 16);
  const topPlatMesh = new THREE.Mesh(topPlatGeo);
  topPlatMesh.position.set(0, totalRise - stepH * 0.5, 0);
  topPlatMesh.castShadow = true;
  topPlatMesh.receiveShadow = true;
  geometries.push(topPlatGeo.clone().applyMatrix4(topPlatMesh.matrixWorld));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (topPlatMesh as any).dispose();

  return mergeStairGeometries(geometries, []);
}

// ---------------------------------------------------------------------------
// Merge helper
// ---------------------------------------------------------------------------

export function mergeStairGeometries(
  geometries: THREE.BufferGeometry[],
  _transforms: Array<{ position: [number, number, number]; rotation?: [number, number, number] }>,
): THREE.BufferGeometry {
  if (geometries.length === 0) return new THREE.BufferGeometry();
  if (geometries.length === 1) return geometries[0]!;

  // Apply manual transforms if needed
  const positioned = geometries.map((geo, i) => {
    if (i < _transforms.length) {
      const t = _transforms[i]!;
      geo.translate(t.position[0], t.position[1], t.position[2]);
      if (t.rotation) geo.rotateX(t.rotation[0] ?? 0);
      if (t.rotation) geo.rotateY(t.rotation[1] ?? 0);
      if (t.rotation) geo.rotateZ(t.rotation[2] ?? 0);
    }
    return geo;
  });

  // Use BufferGeometryUtils.mergeBufferGeometries if available, otherwise manual merge
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const merge = (THREE as any).BufferGeometryUtils?.mergeGeometries;
  if (typeof merge === 'function') {
    return merge(positioned, false) as THREE.BufferGeometry;
  }

  // Fallback: manually merge vertex data
  let totalVerts = 0;
  let totalIndices = 0;
  for (const g of positioned) {
    totalVerts += g.getAttribute('position').count;
    totalIndices += g.getIndex()?.count ?? 0;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  let vertOffset = 0;

  const mergedIndices: number[] = [];

  for (const g of positioned) {
    const pos = g.getAttribute('position');
    const norm = g.getAttribute('normal');
    const idx = g.getIndex();

    for (let i = 0; i < pos.count; i++) {
      positions[vertOffset + i * 3] = pos.getX(i);
      positions[vertOffset + i * 3 + 1] = pos.getY(i);
      positions[vertOffset + i * 3 + 2] = pos.getZ(i);
      if (norm) {
        normals[vertOffset + i * 3] = norm.getX(i);
        normals[vertOffset + i * 3 + 1] = norm.getY(i);
        normals[vertOffset + i * 3 + 2] = norm.getZ(i);
      }
    }

    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        mergedIndices.push(vertOffset / 3 + idx.getX(i));
      }
    }
    vertOffset += pos.count * 3;
  }

  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  result.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  if (mergedIndices.length > 0) result.setIndex(mergedIndices);

  return result;
}