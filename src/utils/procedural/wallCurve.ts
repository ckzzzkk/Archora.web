// ============================================================================
// CURVED WALL GEOMETRY
// Sagitta-based arc geometry for curved walls
// Adapted from pascal-editor wall-curve.ts
// ============================================================================

import * as THREE from 'three'
import type { Wall } from '../../types/blueprint'
import type { Point2D } from './wallMitering'

// ============================================================================
// TYPES
// ============================================================================

export interface ArcData {
  center: Point2D       // arc center point
  radius: number         // arc radius
  startAngle: number     // start angle in radians
  endAngle: number       // end angle in radians
  delta: number          // angular sweep (can be negative for reverse direction)
  direction: 1 | -1      // arc sweep direction
}

export interface CurveFrame {
  point: Point2D      // position on arc at t
  tangent: Point2D    // tangent direction (unit vector)
  normal: Point2D     // perpendicular to tangent (outward normal)
}

export interface WallChordFrame {
  start: Point2D
  end: Point2D
  midpoint: Point2D
  tangent: Point2D
  normal: Point2D
  length: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CURVE_EPSILON = 1e-6
const DEFAULT_SAMPLE_SEGMENTS = 24

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

// ============================================================================
// CHORD FRAME
// ============================================================================

/**
 * Gets the chord frame (straight line reference) for a wall
 */
export function getWallChordFrame(wall: Wall): WallChordFrame {
  const start: Point2D = { x: wall.start.x, y: wall.start.y }
  const end: Point2D = { x: wall.end.x, y: wall.end.y }
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.hypot(dx, dy)

  if (length < CURVE_EPSILON) {
    return {
      start,
      end,
      midpoint: start,
      tangent: { x: 1, y: 0 },
      normal: { x: 0, y: 1 },
      length: 0,
    }
  }

  return {
    start,
    end,
    midpoint: {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    },
    tangent: { x: dx / length, y: dy / length },
    normal: { x: -dy / length, y: dx / length },
    length,
  }
}

// ============================================================================
// CURVE OFFSET UTILITIES
// ============================================================================

function getWallChordLength(wall: Wall): number {
  return distance({ x: wall.start.x, y: wall.start.y }, { x: wall.end.x, y: wall.end.y })
}

function getMaxWallCurveOffset(wall: Wall): number {
  return getWallChordLength(wall) / 2
}

function getWallStraightSnapOffset(wall: Wall): number {
  return Math.min(0.03, Math.max(0.005, getWallChordLength(wall) * 0.005))
}

function clampCurveOffset(wall: Wall, offset: number): number {
  const maxOffset = getMaxWallCurveOffset(wall)
  if (!Number.isFinite(maxOffset) || maxOffset < CURVE_EPSILON) {
    return 0
  }
  return Math.max(-maxOffset, Math.min(maxOffset, offset))
}

function normalizeWallCurveOffset(wall: Wall, offset: number): number {
  const clamped = clampCurveOffset(wall, offset)
  return Math.abs(clamped) <= getWallStraightSnapOffset(wall) ? 0 : clamped
}

function getClampedWallCurveOffset(wall: Wall): number {
  const value = wall.curveOffset ?? 0
  const normalized = normalizeWallCurveOffset(wall, value)
  return Math.abs(normalized) > CURVE_EPSILON ? normalized : 0
}

/**
 * Returns true if the wall has a significant curve
 */
export function isCurvedWall(wall: Wall): boolean {
  return Math.abs(getClampedWallCurveOffset(wall)) > CURVE_EPSILON
}

// ============================================================================
// ARC DATA COMPUTATION
// ============================================================================

/**
 * Computes arc geometry parameters from wall chord and sagitta
 *
 * Given chord (start→end) and sagitta (curveOffset):
 * - midChord = midpoint of start/end
 * - normal = perpendicular to chord direction
 * - center = midChord + normal * (radius - abs(sagitta))
 * - radius = chord.length² / (8 * abs(sagitta)) + abs(sagitta) / 2
 */
export function getWallArcData(wall: Wall): ArcData | null {
  const chord = getWallChordFrame(wall)
  const sagitta = getClampedWallCurveOffset(wall)

  if (Math.abs(sagitta) <= CURVE_EPSILON || chord.length < CURVE_EPSILON) {
    return null
  }

  const absSagitta = Math.abs(sagitta)
  const radius = (chord.length * chord.length) / (8 * absSagitta) + absSagitta / 2
  const centerOffset = radius - absSagitta
  const direction = Math.sign(sagitta) || 1
  const arcDirection: 1 | -1 = direction as 1 | -1

  const center: Point2D = {
    x: chord.midpoint.x + chord.normal.x * centerOffset * direction,
    y: chord.midpoint.y + chord.normal.y * centerOffset * direction,
  }

  const startAngle = Math.atan2(chord.start.y - center.y, chord.start.x - center.x)
  const endAngle = Math.atan2(chord.end.y - center.y, chord.end.x - center.x)

  let delta = endAngle - startAngle
  if (direction > 0) {
    while (delta <= 0) delta += Math.PI * 2
  } else {
    while (delta >= 0) delta -= Math.PI * 2
  }

  return { center, radius, startAngle, endAngle, delta, direction: arcDirection }
}

// ============================================================================
// CURVE FRAME AT PARAMETER T
// ============================================================================

/**
 * Returns the local coordinate frame at parameter t ∈ [0, 1] on the wall
 *
 * For curved portion: uses arc equations
 * For straight walls (curveOffset ≈ 0): linear interpolation between start and end
 */
export function getWallCurveFrameAt(wall: Wall, t: number): CurveFrame {
  const chord = getWallChordFrame(wall)

  if (!isCurvedWall(wall) || chord.length < CURVE_EPSILON) {
    return {
      point: {
        x: lerp(chord.start.x, chord.end.x, clamp01(t)),
        y: lerp(chord.start.y, chord.end.y, clamp01(t)),
      },
      tangent: chord.tangent,
      normal: chord.normal,
    }
  }

  const arc = getWallArcData(wall)
  if (!arc) {
    return {
      point: chord.midpoint,
      tangent: chord.tangent,
      normal: chord.normal,
    }
  }

  const angle = arc.startAngle + arc.delta * clamp01(t)
  const point: Point2D = {
    x: arc.center.x + Math.cos(angle) * arc.radius,
    y: arc.center.y + Math.sin(angle) * arc.radius,
  }

  const tangent: Point2D =
    arc.direction > 0
      ? { x: -Math.sin(angle), y: Math.cos(angle) }
      : { x: Math.sin(angle), y: -Math.cos(angle) }

  return {
    point,
    tangent,
    normal: {
      x: -tangent.y,
      y: tangent.x,
    },
  }
}

// ============================================================================
// SAMPLING
// ============================================================================

/**
 * Samples the wall centerline at numSegments points
 */
export function sampleWallCenterline(wall: Wall, segments = DEFAULT_SAMPLE_SEGMENTS): Point2D[] {
  const count = Math.max(1, segments)
  return Array.from({ length: count + 1 }, (_, index) => getWallCurveFrameAt(wall, index / count).point)
}

/**
 * Gets the midpoint handle point of the wall (useful for visualization)
 */
export function getWallMidpointHandlePoint(wall: Wall): Point2D {
  return getWallCurveFrameAt(wall, 0.5).point
}

/**
 * Computes the approximate arc length of the curved wall
 */
export function getWallCurveLength(wall: Wall, segments = DEFAULT_SAMPLE_SEGMENTS): number {
  const points = sampleWallCenterline(wall, segments)
  let totalLength = 0

  for (let index = 1; index < points.length; index += 1) {
    totalLength += distance(points[index - 1]!, points[index]!)
  }

  return totalLength
}

// ============================================================================
// SURFACE POLYGON
// ============================================================================

export interface WallSurfaceMiterOverrides {
  startLeft?: Point2D
  startRight?: Point2D
  endLeft?: Point2D
  endRight?: Point2D
}

/**
 * Builds a 2D polygon approximating the curved wall's boundary
 *
 * Sample arc at numSegments points (including start/end)
 * For each sample point: offset left and right by thickness/2 along the normal
 * Returns Point2D[] polygon in world coordinate space
 */
export function getWallSurfacePolygon(
  wall: Wall,
  segments = DEFAULT_SAMPLE_SEGMENTS,
  miterOverrides?: WallSurfaceMiterOverrides,
): Point2D[] {
  const halfThickness = wall.thickness / 2
  const count = Math.max(1, segments)
  const left: Point2D[] = []
  const right: Point2D[] = []

  for (let index = 0; index <= count; index += 1) {
    const frame = getWallCurveFrameAt(wall, index / count)
    left.push({
      x: frame.point.x + frame.normal.x * halfThickness,
      y: frame.point.y + frame.normal.y * halfThickness,
    })
    right.push({
      x: frame.point.x - frame.normal.x * halfThickness,
      y: frame.point.y - frame.normal.y * halfThickness,
    })
  }

  // Apply miter overrides if provided
  if (left.length > 0 && right.length > 0) {
    left[0] = miterOverrides?.startLeft ?? left[0]!
    right[0] = miterOverrides?.startRight ?? right[0]!
    left[left.length - 1] = miterOverrides?.endLeft ?? left[left.length - 1]!
    right[right.length - 1] = miterOverrides?.endRight ?? right[right.length - 1]!
  }

  // Combine: right side (start to end) + left side reversed (end to start)
  return [...right, ...left.reverse()]
}

// ============================================================================
// THREE.JS GEOMETRY BUILDING
// ============================================================================

/**
 * Builds the Three.js geometry for a curved wall
 *
 * Uses getWallSurfacePolygon to get outer boundary
 * Builds THREE.Shape from polygon
 * Extrudes to wall.height (ExtrudeGeometry)
 * The result is a curved wall mesh with proper thickness
 */
export function buildCurvedWallGeometry(wall: Wall, numSegments = DEFAULT_SAMPLE_SEGMENTS): THREE.BufferGeometry {
  const polygon = getWallSurfacePolygon(wall, numSegments)

  if (polygon.length < 3) {
    return new THREE.BufferGeometry()
  }

  // Build THREE.Shape from polygon points
  const shape = new THREE.Shape()
  shape.moveTo(polygon[0]!.x, polygon[0]!.y)

  for (let i = 1; i < polygon.length; i++) {
    shape.lineTo(polygon[i]!.x, polygon[i]!.y)
  }
  shape.closePath()

  // Extrude along Z (will rotate to become Y height)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: wall.height,
    bevelEnabled: false,
  })

  // Rotate so extrusion direction (Z) becomes height direction (Y)
  geometry.rotateX(-Math.PI / 2)
  geometry.computeVertexNormals()

  return geometry
}

/**
 * Builds curved wall geometry with mitered endpoints
 * Uses miter overrides to properly connect with adjacent walls
 */
export function buildCurvedWallGeometryWithMiters(
  wall: Wall,
  miterData: { startLeft?: Point2D; startRight?: Point2D; endLeft?: Point2D; endRight?: Point2D },
  numSegments = DEFAULT_SAMPLE_SEGMENTS,
): THREE.BufferGeometry {
  const miterOverrides: WallSurfaceMiterOverrides = {
    startLeft: miterData.startLeft,
    startRight: miterData.startRight,
    endLeft: miterData.endLeft,
    endRight: miterData.endRight,
  }

  const polygon = getWallSurfacePolygon(wall, numSegments, miterOverrides)

  if (polygon.length < 3) {
    return new THREE.BufferGeometry()
  }

  const shape = new THREE.Shape()
  shape.moveTo(polygon[0]!.x, polygon[0]!.y)

  for (let i = 1; i < polygon.length; i++) {
    shape.lineTo(polygon[i]!.x, polygon[i]!.y)
  }
  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: wall.height,
    bevelEnabled: false,
  })

  geometry.rotateX(-Math.PI / 2)
  geometry.computeVertexNormals()

  return geometry
}