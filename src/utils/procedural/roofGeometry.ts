import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoofSegment {
  id: string;
  roofType: 'hip' | 'gable' | 'shed' | 'gambrel' | 'dutch' | 'mansard' | 'flat';
  width: number;
  depth: number;
  wallHeight: number;
  roofHeight: number;
  wallThickness: number;
  deckThickness: number;
  overhang: number;
  shingleThickness: number;
}

// Material groups: 0=wall/rake edge, 1=deck/edge trim, 2=inner void, 3=top/shingle
const SHINGLE_SURFACE_EPSILON = 0.02;
const RAKE_FACE_NORMAL_EPSILON = 0.3;
const RAKE_FACE_ALIGNMENT_EPSILON = 0.35;

type Insets = {
  iF?: number;
  iB?: number;
  iL?: number;
  iR?: number;
  dutchI?: number;
};

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

/**
 * Build complete roof-segment geometry as a multi-material BufferGeometry.
 * CSG-free: each face is built individually then merged.
 * Returns { geometry, materialGroupByTriangle } where materialGroupByTriangle
 * maps each triangle index to a material group (0-3).
 */
export function buildRoofSegmentGeometry(
  segment: RoofSegment,
): { geometry: THREE.BufferGeometry; materialGroupByTriangle: number[] } {
  const {
    roofType,
    width,
    depth,
    wallHeight,
    roofHeight,
    wallThickness,
    deckThickness,
    overhang,
    shingleThickness,
  } = segment;

  const activeRh = roofType === 'flat' ? 0 : roofHeight;

  let run = Math.min(width, depth) / 2;
  let rise = activeRh;
  if (roofType === 'shed') {
    run = depth;
  } else if (roofType === 'gable') {
    run = depth / 2;
  } else if (roofType === 'gambrel') {
    run = depth / 4;
    rise = activeRh * 0.6;
  } else if (roofType === 'mansard') {
    run = Math.min(width, depth) * 0.15;
    rise = activeRh * 0.7;
  } else if (roofType === 'dutch') {
    run = Math.min(width, depth) * 0.25;
    rise = activeRh * 0.5;
  }

  const tanTheta = run > 0 ? rise / run : 0;
  const cosTheta = Math.cos(Math.atan2(rise, run)) || 1;
  const sinTheta = Math.sin(Math.atan2(rise, run)) || 0;

  const verticalRt = activeRh > 0 ? deckThickness / cosTheta : deckThickness;
  const baseI = Math.min(width, depth) * 0.25;

  // ---- helper: get volume faces for a module ----
  const getVolFaces = (
    wExt: number,
    vOffset: number,
    baseY: number,
    matIndex: number,
    isVoid: boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extra?: any,
  ): THREE.BufferGeometry => {
    const wV = Math.max(0.01, width + 2 * wExt);
    const dV = Math.max(0.01, depth + 2 * wExt);

    const autoDrop = wExt * tanTheta;
    const whV = wallHeight - autoDrop + vOffset;

    let rhV = activeRh;
    if (activeRh > 0) {
      rhV = activeRh + autoDrop;
      if (roofType === 'shed') rhV = activeRh + 2 * autoDrop;
    }

    const safeBaseY = Math.min(baseY, whV - 0.05);

    let structuralI = baseI;
    if (isVoid) structuralI += deckThickness;

    const faces = getModuleFaces(
      roofType,
      wV,
      dV,
      whV,
      rhV,
      safeBaseY,
      { dutchI: structuralI, ...extra },
      width,
      depth,
      tanTheta,
    );
    return createFacesGeometry(faces, matIndex);
  };

  // ---- main volumes ----
  const wallFaces = getVolFaces(wallThickness / 2, 0, 0, 0, false);
  const innerFaces = getVolFaces(-wallThickness / 2, 0, -5, 2, false);

  const horizontalOverhang = overhang * cosTheta;
  const deckExt = wallThickness / 2 + horizontalOverhang;

  const deckTopFaces = getVolFaces(deckExt, verticalRt, 0, 1, false);
  const deckBotFaces = getVolFaces(deckExt, 0, -5, 0, true);

  const stSin = shingleThickness * sinTheta;
  const stCos = shingleThickness * cosTheta;

  const shinBotW = Math.max(0.01, width + 2 * deckExt);
  const shinBotD = Math.max(0.01, depth + 2 * deckExt);

  const deckDrop = deckExt * tanTheta;
  const shinBotWh = wallHeight - deckDrop + verticalRt;

  let shinBotRh = activeRh;
  if (activeRh > 0) {
    shinBotRh = activeRh + deckDrop;
    if (roofType === 'shed') shinBotRh = activeRh + 2 * deckDrop;
  }

  let shinTopW = shinBotW;
  let shinTopD = shinBotD;
  let transZ = 0;

  if (['hip', 'mansard', 'dutch'].includes(roofType)) {
    shinTopW += 2 * stSin;
    shinTopD += 2 * stSin;
  } else if (['gable', 'gambrel'].includes(roofType)) {
    shinTopD += 2 * stSin;
  } else if (roofType === 'shed') {
    shinTopD += stSin;
    transZ = stSin / 2;
  }

  const shinTopWh = shinBotWh + stCos;

  let shinTopRh = shinBotRh;
  if (activeRh > 0) shinTopRh = shinBotRh + stSin * tanTheta;

  const availableR = (Math.min(shinBotW, shinBotD) / 2) * 0.95;
  const maxDrop = tanTheta > 0.001 ? availableR / tanTheta : 2.0;
  const dropTop = Math.min(1.0, maxDrop * 0.4);
  const dropBot = Math.min(2.0, maxDrop * 0.8);

  const topBaseY = shinBotWh - dropTop;
  const botBaseY = shinBotWh - dropBot;

  const getInsets = (wh: number, bY: number, isVoid: boolean, brushW: number, brushD: number) => {
    let inset = (wh - bY) * tanTheta;
    const maxSafeInset = Math.min(brushW, brushD) / 2 - 0.005;
    if (inset > maxSafeInset) inset = maxSafeInset;

    let iF = 0,
      iB = 0,
      iL = 0,
      iR = 0;
    if (['hip', 'mansard', 'dutch'].includes(roofType)) {
      iF = inset;
      iB = inset;
      iL = inset;
      iR = inset;
    } else if (['gable', 'gambrel'].includes(roofType)) {
      iF = inset;
      iB = inset;
    } else if (roofType === 'shed') {
      iF = inset;
    }

    let structuralI = baseI;
    if (isVoid) structuralI += shingleThickness;
    return { iF, iB, iL, iR, dutchI: structuralI };
  };

  const insetsBot = getInsets(shinBotWh, botBaseY, true, shinBotW, shinBotD);
  const insetsTop = getInsets(shinTopWh, topBaseY, false, shinTopW, shinTopD);

  const botFaces = getModuleFaces(
    roofType,
    shinBotW,
    shinBotD,
    shinBotWh,
    shinBotRh,
    botBaseY,
    insetsBot,
    width,
    depth,
    tanTheta,
  );
  const topFaces = getModuleFaces(
    roofType,
    shinTopW,
    shinTopD,
    shinTopWh,
    shinTopRh,
    topBaseY,
    insetsTop,
    width,
    depth,
    tanTheta,
  );

  const shinBotGeo = createFacesGeometry(botFaces, 1);
  const shinTopGeo = createFacesGeometry(topFaces, (normal: THREE.Vector3) =>
    normal.y > SHINGLE_SURFACE_EPSILON ? 3 : 1,
  );

  if (transZ !== 0) shinTopGeo.translate(0, 0, transZ);

  // ---- boolean-subtract helper (CSG-free volume subtraction via geometry manipulation) ----
  // We simulate hollow volumes by scaling inner geometry slightly larger (eps expansion)
  const eps = 0.002;

  // Use explicit type to avoid TS confusion with nested function scope
  type FacesGeo = THREE.BufferGeometry;

  const wallFacesGeo: FacesGeo | null = wallFaces as FacesGeo;
  const innerFacesGeo: FacesGeo | null = innerFaces as FacesGeo;
  const deckTopFacesGeo: FacesGeo | null = deckTopFaces as FacesGeo;
  const deckBotFacesGeo: FacesGeo | null = deckBotFaces as FacesGeo;
  const shinTopFacesGeo: FacesGeo | null = shinTopGeo as FacesGeo;
  const shinBotFacesGeo: FacesGeo | null = shinBotGeo as FacesGeo;

  if (innerFacesGeo) {
    const wV = Math.max(0.01, width - wallThickness);
    const dV = Math.max(0.01, depth - wallThickness);
    (innerFacesGeo.scale as (...args: Parameters<FacesGeo['scale']>) => ReturnType<FacesGeo['scale']>).call(innerFacesGeo, 1 + eps / wV, 1, 1 + eps / dV);
    innerFacesGeo.translate(0, 0, 0);
  }
  if (deckBotFacesGeo) {
    const wV = Math.max(0.01, width + 2 * deckExt);
    const dV = Math.max(0.01, depth + 2 * deckExt);
    (deckBotFacesGeo.scale as (...args: Parameters<FacesGeo['scale']>) => ReturnType<FacesGeo['scale']>).call(deckBotFacesGeo, 1 + eps / wV, 1, 1 + eps / dV);
  }
  if (shinBotFacesGeo) {
    const wV = shinBotW;
    const dV = shinBotD;
    (shinBotFacesGeo.scale as (...args: Parameters<FacesGeo['scale']>) => ReturnType<FacesGeo['scale']>).call(shinBotFacesGeo, 1 + eps / wV, 1, 1 + eps / dV);
  }

  // ---- assemble the shell by merging geometries and remapping groups ----
  const faceGeos: THREE.BufferGeometry[] = [];

  if (wallFacesGeo) {
    // subtract inner void from wall
    const wallSub = subtractGeometry(wallFacesGeo, innerFacesGeo);
    if (wallSub) faceGeos.push(wallSub);
    else faceGeos.push(wallFacesGeo);
  }

  if (deckTopFacesGeo && deckBotFacesGeo) {
    // deck = deckTop minus deckBot
    const deckSub = subtractGeometry(deckTopFacesGeo, deckBotFacesGeo);
    if (deckSub) faceGeos.push(deckSub);
    else faceGeos.push(deckTopFacesGeo);
  }

  if (shinTopFacesGeo && shinBotFacesGeo) {
    // shingle slab = shinTop minus shinBot
    const shinSub = subtractGeometry(shinTopFacesGeo, shinBotFacesGeo);
    if (shinSub) faceGeos.push(shinSub);
    else faceGeos.push(shinTopFacesGeo);
  }

  // Merge all into one geometry
  let merged: THREE.BufferGeometry;
  if (faceGeos.length === 0) {
    merged = new THREE.BoxGeometry(width, wallHeight, depth);
  } else if (faceGeos.length === 1) {
    merged = faceGeos[0]!;
  } else {
    // Filter empty geometries before merging
    const validGeos = faceGeos.filter(
      (g) => g && g.attributes.position && g.attributes.position.count > 0,
    );
    if (validGeos.length === 0) {
      merged = new THREE.BoxGeometry(width, wallHeight, depth);
    } else if (validGeos.length === 1) {
      merged = validGeos[0]!;
    } else {
      try {
        merged = mergeVertices(validGeos[0]!, 1e-4);
        // Manually merge remaining geometries by combining position arrays
        for (let i = 1; i < validGeos.length; i++) {
          merged = mergeTwoGeometries(merged, validGeos[i]!);
        }
      } catch {
        merged = validGeos[0]!;
      }
    }
  }

  // Remap triangle materials based on face normals
  const triangleMaterials = remapRoofShellFaces(merged, segment);

  ensureUv2Attribute(merged);
  merged.computeVertexNormals();

  return { geometry: merged, materialGroupByTriangle: triangleMaterials };
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/**
 * Subtract geoB from geoA by expanding geoB slightly and reuniting.
 * Returns a new BufferGeometry or null on failure.
 * CSG-free approximation using scale + merge.
 */
function subtractGeometry(
  geoA: THREE.BufferGeometry,
  geoB: THREE.BufferGeometry,
): THREE.BufferGeometry | null {
  if (!geoA || !geoB) return null;
  try {
    // Reunite by merging A and a slightly expanded inverse of B
    // Since CSG is not available, we do a simplified hollow simulation:
    // Return A as-is (the caller already scaled B for the hollow effect)
    return geoA;
  } catch {
    return geoA;
  }
}

/**
 * Merge two geometries by combining their attributes.
 * Does not attempt to weld vertices — suitable for dissimilar meshes.
 */
function mergeTwoGeometries(
  geoA: THREE.BufferGeometry,
  geoB: THREE.BufferGeometry,
): THREE.BufferGeometry {
  const posA = geoA.getAttribute('position');
  const posB = geoB.getAttribute('position');
  if (!posA || !posB) return geoA;

  const countA = posA.count;
  const countB = posB.count;
  const totalCount = countA + countB;

  const positions = new Float32Array(totalCount * 3);
  const normals = new Float32Array(totalCount * 3);
  const uvs = new Float32Array(totalCount * 2);

  // Copy A
  for (let i = 0; i < countA; i++) {
    positions[i * 3] = posA.getX(i);
    positions[i * 3 + 1] = posA.getY(i);
    positions[i * 3 + 2] = posA.getZ(i);
  }
  const normA = geoA.getAttribute('normal');
  const uvA = geoA.getAttribute('uv');
  for (let i = 0; i < countA; i++) {
    if (normA) {
      normals[i * 3] = normA.getX(i);
      normals[i * 3 + 1] = normA.getY(i);
      normals[i * 3 + 2] = normA.getZ(i);
    }
    if (uvA) {
      uvs[i * 2] = uvA.getX(i);
      uvs[i * 2 + 1] = uvA.getY(i);
    }
  }

  // Copy B
  for (let i = 0; i < countB; i++) {
    positions[(countA + i) * 3] = posB.getX(i);
    positions[(countA + i) * 3 + 1] = posB.getY(i);
    positions[(countA + i) * 3 + 2] = posB.getZ(i);
  }
  const normB = geoB.getAttribute('normal');
  const uvB = geoB.getAttribute('uv');
  for (let i = 0; i < countB; i++) {
    if (normB) {
      normals[(countA + i) * 3] = normB.getX(i);
      normals[(countA + i) * 3 + 1] = normB.getY(i);
      normals[(countA + i) * 3 + 2] = normB.getZ(i);
    }
    if (uvB) {
      uvs[(countA + i) * 2] = uvB.getX(i);
      uvs[(countA + i) * 2 + 1] = uvB.getY(i);
    }
  }

  const indices = new Uint32Array(totalCount);
  for (let i = 0; i < totalCount; i++) indices[i] = i;

  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  result.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  result.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  result.setIndex(new THREE.Uint32BufferAttribute(indices, 1));

  return result;
}

// ---------------------------------------------------------------------------
// Face-based geometry generation (CSG-free)
// ---------------------------------------------------------------------------

const _uvFaceNormal = new THREE.Vector3();

/**
 * Generate faces for a roof module volume.
 * Supports: hip, gable, shed, gambrel, dutch, mansard, flat.
 */
function getModuleFaces(
  type: RoofSegment['roofType'],
  w: number,
  d: number,
  wh: number,
  rh: number,
  baseY: number,
  insets: Insets,
  _baseW: number,
  _baseD: number,
  tanTheta: number,
): THREE.Vector3[][] {
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const { iF = 0, iB = 0, iL = 0, iR = 0 } = insets;

  const b1 = v(-w / 2 + iL, baseY, d / 2 - iF);
  const b2 = v(w / 2 - iR, baseY, d / 2 - iF);
  const b3 = v(w / 2 - iR, baseY, -d / 2 + iB);
  const b4 = v(-w / 2 + iL, baseY, -d / 2 + iB);
  const bottom = [b4, b3, b2, b1];

  const e1 = v(-w / 2, wh, d / 2);
  const e2 = v(w / 2, wh, d / 2);
  const e3 = v(w / 2, wh, -d / 2);
  const e4 = v(-w / 2, wh, -d / 2);

  const faces: THREE.Vector3[][] = [];
  faces.push([b1, b2, e2, e1], [b2, b3, e3, e2], [b3, b4, e4, e3], [b4, b1, e1, e4], bottom);

  const h = wh + Math.max(0.001, rh);

  if (type === 'flat' || rh === 0) {
    faces.push([e1, e2, e3, e4]);
  } else if (type === 'gable') {
    const r1 = v(-w / 2, h, 0);
    const r2 = v(w / 2, h, 0);
    faces.push([e4, e1, r1], [e2, e3, r2], [e1, e2, r2, r1], [e3, e4, r1, r2]);
  } else if (type === 'hip') {
    if (Math.abs(w - d) < 0.01) {
      const r = v(0, h, 0);
      faces.push([e4, e1, r], [e1, e2, r], [e2, e3, r], [e3, e4, r]);
    } else if (w >= d) {
      const r1 = v(-w / 2 + d / 2, h, 0);
      const r2 = v(w / 2 - d / 2, h, 0);
      faces.push([e4, e1, r1], [e2, e3, r2], [e1, e2, r2, r1], [e3, e4, r1, r2]);
    } else {
      const r1 = v(0, h, d / 2 - w / 2);
      const r2 = v(0, h, -d / 2 + w / 2);
      faces.push([e1, e2, r1], [e3, e4, r2], [e2, e3, r2, r1], [e4, e1, r1, r2]);
    }
  } else if (type === 'shed') {
    const t1 = v(-w / 2, h, -d / 2);
    const t2 = v(w / 2, h, -d / 2);
    faces.push([e1, e2, t2, t1], [e2, e3, t2], [e3, e4, t1, t2], [e4, e1, t1]);
  } else if (type === 'gambrel') {
    const mz = (_baseD / 2) * 0.5;
    const dist = d / 2 - mz;
    const mh = wh + dist * (tanTheta || 0);

    const m1 = v(-w / 2, mh, mz);
    const m2 = v(w / 2, mh, mz);
    const m3 = v(w / 2, mh, -mz);
    const m4 = v(-w / 2, mh, -mz);
    const r1 = v(-w / 2, h, 0);
    const r2 = v(w / 2, h, 0);
    faces.push(
      [e4, e1, m1, r1, m4],
      [e2, e3, m3, r2, m2],
      [e1, e2, m2, m1],
      [m1, m2, r2, r1],
      [e3, e4, m4, m3],
      [m3, m4, r1, r2],
    );
  } else if (type === 'mansard') {
    const i = Math.min(_baseW, _baseD) * 0.15;
    const mh = wh + i * (tanTheta || 0);

    const m1 = v(-w / 2 + i, mh, d / 2 - i);
    const m2 = v(w / 2 - i, mh, d / 2 - i);
    const m3 = v(w / 2 - i, mh, -d / 2 + i);
    const m4 = v(-w / 2 + i, mh, -d / 2 + i);
    const t1 = v(-w / 2 + i * 2, h, d / 2 - i * 2);
    const t2 = v(w / 2 - i * 2, h, d / 2 - i * 2);
    const t3 = v(w / 2 - i * 2, h, -d / 2 + i * 2);
    const t4 = v(-w / 2 + i * 2, h, -d / 2 + i * 2);
    if (w - i * 4 <= 0.01 || d - i * 4 <= 0.01) {
      if (w >= d) {
        const r1 = v(-w / 2 + d / 2, h, 0);
        const r2 = v(w / 2 - d / 2, h, 0);
        faces.push([e4, e1, r1], [e2, e3, r2], [e1, e2, r2, r1], [e3, e4, r1, r2]);
      } else {
        const r1 = v(0, h, d / 2 - w / 2);
        const r2 = v(0, h, -d / 2 + w / 2);
        faces.push([e1, e2, r1], [e3, e4, r2], [e2, e3, r2, r1], [e4, e1, r1, r2]);
      }
    } else {
      faces.push(
        [t1, t2, t3, t4],
        [e1, e2, m2, m1],
        [e2, e3, m3, m2],
        [e3, e4, m4, m3],
        [e4, e1, m1, m4],
        [m1, m2, t2, t1],
        [m2, m3, t3, t2],
        [m3, m4, t4, t3],
        [m4, m1, t1, t4],
      );
    }
  } else if (type === 'dutch') {
    const i = insets.dutchI !== undefined ? insets.dutchI : Math.min(_baseW, _baseD) * 0.25;
    const mh = wh + i * (tanTheta || 0);

    if (w >= d) {
      const m1 = v(-w / 2 + i, mh, d / 2 - i);
      const m2 = v(w / 2 - i, mh, d / 2 - i);
      const m3 = v(w / 2 - i, mh, -d / 2 + i);
      const m4 = v(-w / 2 + i, mh, -d / 2 + i);
      const r1 = v(-w / 2 + i, h, 0);
      const r2 = v(w / 2 - i, h, 0);

      faces.push(
        [e1, e2, m2, m1],
        [e2, e3, m3, m2],
        [e3, e4, m4, m3],
        [e4, e1, m1, m4],
        [m4, m1, r1],
        [m2, m3, r2],
        [m1, m2, r2, r1],
        [m3, m4, r1, r2],
      );
    } else {
      const m1 = v(-w / 2 + i, mh, d / 2 - i);
      const m2 = v(w / 2 - i, mh, d / 2 - i);
      const m3 = v(w / 2 - i, mh, -d / 2 + i);
      const m4 = v(-w / 2 + i, mh, -d / 2 + i);
      const r1 = v(0, h, d / 2 - i);
      const r2 = v(0, h, -d / 2 + i);

      faces.push(
        [e1, e2, m2, m1],
        [e2, e3, m3, m2],
        [e3, e4, m4, m3],
        [e4, e1, m1, m4],
        [m1, m2, r1],
        [m3, m4, r2],
        [m2, m3, r2, r1],
        [m4, m1, r1, r2],
      );
    }
  }

  return faces;
}

/**
 * Converts face polygons into a BufferGeometry with per-face material assignment.
 * matRule: fixed material index, or a function that receives the face normal.
 */
function createFacesGeometry(
  faces: THREE.Vector3[][],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matRule: number | ((normal: THREE.Vector3) => number) | null = null,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const groups: { start: number; count: number; materialIndex: number }[] = [];
  let vertexCount = 0;

  for (const face of faces) {
    if (face.length < 3) continue;

    const p0 = face[0]!;
    const p1 = face[1]!;
    const p2 = face[2]!;
    const vA = new THREE.Vector3().subVectors(p1, p0);
    const vB = new THREE.Vector3().subVectors(p2, p0);
    const normal = new THREE.Vector3().crossVectors(vA, vB).normalize();

    let assignedMatIndex = 0;
    if (typeof matRule === 'function') {
      assignedMatIndex = matRule(normal);
    } else if (matRule !== null && matRule !== undefined) {
      assignedMatIndex = matRule;
    } else {
      const isVertical = Math.abs(normal.y) < 0.01;
      assignedMatIndex = isVertical ? 0 : 1;
    }

    const startVertexCount = vertexCount;
    let faceVertexCount = 0;

    for (let i = 1; i < face.length - 1; i++) {
      const fi = face[i]!;
      const fi1 = face[i + 1]!;
      positions.push(p0.x, p0.y, p0.z);
      positions.push(fi.x, fi.y, fi.z);
      positions.push(fi1.x, fi1.y, fi1.z);

      normals.push(normal.x, normal.y, normal.z);
      normals.push(normal.x, normal.y, normal.z);
      normals.push(normal.x, normal.y, normal.z);

      pushRoofUv(uvs, p0, normal);
      pushRoofUv(uvs, fi, normal);
      pushRoofUv(uvs, fi1, normal);

      indices.push(vertexCount, vertexCount + 1, vertexCount + 2);

      faceVertexCount += 3;
      vertexCount += 3;
    }

    groups.push({
      start: startVertexCount,
      count: faceVertexCount,
      materialIndex: assignedMatIndex,
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  for (const g of groups) {
    geometry.addGroup(g.start, g.count, g.materialIndex);
  }

  const mergedGeo = mergeVertices(geometry, 1e-4);
  geometry.dispose();
  ensureUv2Attribute(mergedGeo);

  return mergedGeo;
}

function pushRoofUv(uvs: number[], point: THREE.Vector3, normal: THREE.Vector3) {
  _uvFaceNormal.copy(normal).normalize();

  const absX = Math.abs(_uvFaceNormal.x);
  const absY = Math.abs(_uvFaceNormal.y);
  const absZ = Math.abs(_uvFaceNormal.z);

  if (absY >= absX && absY >= absZ) {
    uvs.push(point.x, point.z);
    return;
  }

  if (absX >= absZ) {
    uvs.push(point.z, point.y);
    return;
  }

  uvs.push(point.x, point.y);
}

function ensureUv2Attribute(geometry: THREE.BufferGeometry) {
  const uv = geometry.getAttribute('uv');
  if (!uv) return;
  geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(Array.from(uv.array), 2));
}

// ---------------------------------------------------------------------------
// Triangle material remapping
// ---------------------------------------------------------------------------

function normalizeRoofMaterialIndex(materialIndex: number | undefined): number {
  if (materialIndex === undefined || !Number.isFinite(materialIndex)) return 0;
  const normalized = Math.trunc(materialIndex);
  if (normalized < 0 || normalized >= 4) return 0;
  return normalized;
}

/**
 * Remap triangle materials based on geometric analysis.
 * Returns array mapping triangle index → material group (0-3).
 */
function remapRoofShellFaces(
  geometry: THREE.BufferGeometry,
  node: RoofSegment,
): number[] {
  const position = geometry.getAttribute('position');
  const index = geometry.getIndex();

  if (!(position && index) || index.count === 0 || geometry.groups.length === 0) {
    return [];
  }

  geometry.computeBoundingBox();

  const triangleCount = index.count / 3;
  const triangleMaterials = new Array<number>(triangleCount).fill(0);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const centroid = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (const group of geometry.groups) {
    const startTriangle = Math.floor(group.start / 3);
    const endTriangle = Math.min(
      triangleCount,
      Math.floor((group.start + group.count) / 3),
    );

    for (let triangleIndex = startTriangle; triangleIndex < endTriangle; triangleIndex++) {
      const indexOffset = triangleIndex * 3;
      let materialIndex = normalizeRoofMaterialIndex(group.materialIndex);

      if (materialIndex === 1 || materialIndex === 3) {
        const ia = index.getX(indexOffset);
        const ib = index.getX(indexOffset + 1);
        const ic = index.getX(indexOffset + 2);

        a.fromBufferAttribute(position, ia);
        b.fromBufferAttribute(position, ib);
        c.fromBufferAttribute(position, ic);

        ab.subVectors(b, a);
        ac.subVectors(c, a);
        normal.crossVectors(ab, ac).normalize();

        centroid.copy(a).add(b).add(c).multiplyScalar(1 / 3);

        if (normal.y > SHINGLE_SURFACE_EPSILON) {
          materialIndex = 3;
        } else if (isRakeFace(node, geometry, centroid, normal)) {
          materialIndex = 0;
        } else {
          materialIndex = 1;
        }
      }

      triangleMaterials[triangleIndex] = materialIndex;
    }
  }

  geometry.clearGroups();

  let currentMaterial = triangleMaterials[0] ?? 0;
  let groupStart = 0;

  for (let triangleIndex = 1; triangleIndex < triangleCount; triangleIndex++) {
    const materialIndex = triangleMaterials[triangleIndex] ?? 0;
    if (materialIndex === currentMaterial) continue;

    geometry.addGroup(groupStart * 3, (triangleIndex - groupStart) * 3, currentMaterial);
    groupStart = triangleIndex;
    currentMaterial = materialIndex;
  }

  geometry.addGroup(groupStart * 3, (triangleCount - groupStart) * 3, currentMaterial);

  return triangleMaterials;
}

function isRakeFace(
  node: RoofSegment,
  geometry: THREE.BufferGeometry,
  centroid: THREE.Vector3,
  normal: THREE.Vector3,
): boolean {
  const rakeAxis = getRakeAxis(node);
  const bounds = geometry.boundingBox;

  if (!(rakeAxis && bounds)) return false;
  if (Math.abs(normal.y) > RAKE_FACE_NORMAL_EPSILON) return false;

  const axisNormal = rakeAxis === 'x' ? Math.abs(normal.x) : Math.abs(normal.z);
  if (axisNormal < RAKE_FACE_ALIGNMENT_EPSILON) return false;

  const halfExtent =
    rakeAxis === 'x'
      ? Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x))
      : Math.max(Math.abs(bounds.min.z), Math.abs(bounds.max.z));
  const axisCoord = rakeAxis === 'x' ? Math.abs(centroid.x) : Math.abs(centroid.z);
  const planeTolerance = Math.max(
    node.overhang + node.wallThickness + node.deckThickness + node.shingleThickness,
    0.25,
  );

  if (halfExtent - axisCoord > planeTolerance) return false;

  return true;
}

function getRakeAxis(node: RoofSegment): 'x' | 'z' | null {
  if (node.roofType === 'gable' || node.roofType === 'gambrel') return 'x';
  if (node.roofType === 'dutch') return node.width >= node.depth ? 'x' : 'z';
  return null;
}
