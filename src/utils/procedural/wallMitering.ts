// ============================================================================
// WALL MITERING SYSTEM
// Proper miter joint geometry at wall corners
// Adapted from pascalorg wall-mitering.ts
// ============================================================================

import * as THREE from 'three'
import type { Wall, Vector2D } from '../../types/blueprint'

// ============================================================================
// TYPES
// ============================================================================

export interface Point2D {
  x: number
  y: number
}

export interface WallMiterBoundaryPoints {
  startLeft: Point2D
  startRight: Point2D
  endLeft: Point2D
  endRight: Point2D
}

export interface Junction {
  meetingPoint: Point2D
  connectedWalls: Array<{
    wallId: string
    endType: 'start' | 'end' | 'passthrough'
  }>
}

export interface WallMiterResult {
  wallId: string
  polygon: Point2D[] // the mitered 2D footprint
  junctions: Junction[]
}

interface WallMiterCache {
  boundaryPoints: WallMiterBoundaryPoints | null
  polygon: Point2D[]
}

// Map of wallId -> cached miter data
const miterCache = new Map<string, WallMiterCache>()

interface LineEquation {
  a: number
  b: number
  c: number // ax + by + c = 0
}

// Map of wallId -> { left?: Point2D, right?: Point2D } for each junction
type WallIntersections = Map<string, { left?: Point2D; right?: Point2D }>

// Map of junctionKey -> WallIntersections
type JunctionData = Map<string, WallIntersections>

export interface WallMiterData {
  junctionData: JunctionData
  junctions: Map<string, Junction>
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const TOLERANCE = 0.05 // 5cm tolerance for endpoint matching

function pointToKey(p: Point2D, tolerance = TOLERANCE): string {
  const snap = 1 / tolerance
  return `${Math.round(p.x * snap)},${Math.round(p.y * snap)}`
}

function createLineFromPointAndVector(p: Point2D, v: Point2D): LineEquation {
  const a = -v.y
  const b = v.x
  const c = -(a * p.x + b * p.y)
  return { a, b, c }
}

function pointOnWallSegment(point: Point2D, wall: Wall): boolean {
  const start: Point2D = { x: wall.start.x, y: wall.start.y }
  const end: Point2D = { x: wall.end.x, y: wall.end.y }

  // Check if point is at endpoints (those are handled separately)
  if (pointToKey(point, TOLERANCE) === pointToKey(start, TOLERANCE)) return false
  if (pointToKey(point, TOLERANCE) === pointToKey(end, TOLERANCE)) return false

  // Vector from start to end
  const v = { x: end.x - start.x, y: end.y - start.y }
  const L = Math.sqrt(v.x * v.x + v.y * v.y)
  if (L < 1e-9) return false

  // Vector from start to point
  const w = { x: point.x - start.x, y: point.y - start.y }

  // Project point onto wall line (t is parametric position along segment)
  const t = (v.x * w.x + v.y * w.y) / (L * L)

  // Check if projection is within segment (not at endpoints)
  if (t < TOLERANCE / L || t > 1 - TOLERANCE / L) return false

  // Check distance from point to line
  const projX = start.x + t * v.x
  const projY = start.y + t * v.y
  const dist = Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2)

  return dist < TOLERANCE
}

// ============================================================================
// JUNCTION DETECTION
// ============================================================================

function findJunctions(walls: Wall[]): Map<string, Junction> {
  const junctions = new Map<string, Junction>()

  // First pass: group walls by their endpoints
  for (const wall of walls) {
    const startPt: Point2D = { x: wall.start.x, y: wall.start.y }
    const endPt: Point2D = { x: wall.end.x, y: wall.end.y }

    const keyStart = pointToKey(startPt)
    const keyEnd = pointToKey(endPt)

    if (!junctions.has(keyStart)) {
      junctions.set(keyStart, { meetingPoint: startPt, connectedWalls: [] })
    }
    junctions.get(keyStart)?.connectedWalls.push({ wallId: wall.id, endType: 'start' })

    if (!junctions.has(keyEnd)) {
      junctions.set(keyEnd, { meetingPoint: endPt, connectedWalls: [] })
    }
    junctions.get(keyEnd)?.connectedWalls.push({ wallId: wall.id, endType: 'end' })
  }

  // Second pass: detect T-junctions (walls passing through junction points)
  for (const [, junction] of junctions.entries()) {
    for (const wall of walls) {
      // Skip if wall already in this junction
      if (junction.connectedWalls.some((cw) => cw.wallId === wall.id)) continue

      // Check if junction point lies on this wall's segment (not at endpoints)
      if (pointOnWallSegment(junction.meetingPoint, wall)) {
        junction.connectedWalls.push({ wallId: wall.id, endType: 'passthrough' })
      }
    }
  }

  // Filter to only junctions with 2+ walls
  const actualJunctions = new Map<string, Junction>()
  for (const [key, junction] of junctions.entries()) {
    if (junction.connectedWalls.length >= 2) {
      actualJunctions.set(key, junction)
    }
  }

  return actualJunctions
}

// ============================================================================
// WALL BOUNDARY FRAME
// ============================================================================

function getWallDirection(wall: Wall, endType: 'start' | 'end'): Vector2D {
  const dx = wall.end.x - wall.start.x
  const dy = wall.end.y - wall.start.y

  if (endType === 'start') {
    return { x: dx, y: dy }
  }
  return { x: -dx, y: -dy }
}

function getWallBoundaryFrame(
  wall: Wall,
  endType: 'start' | 'end',
): {
  point: Point2D
  tangent: Vector2D
  normal: Vector2D
} {
  const point: Point2D =
    endType === 'start'
      ? { x: wall.start.x, y: wall.start.y }
      : { x: wall.end.x, y: wall.end.y }

  const vector = getWallDirection(wall, endType)
  const length = Math.hypot(vector.x, vector.y)

  if (length < 1e-9) {
    return {
      point,
      tangent: { x: 1, y: 0 },
      normal: { x: 0, y: 1 },
    }
  }

  const tangent = { x: vector.x / length, y: vector.y / length }
  // Normal is perpendicular to tangent (90° rotation)
  const normal = { x: -tangent.y, y: tangent.x }

  return { point, tangent, normal }
}

// ============================================================================
// MITER CALCULATION
// ============================================================================

interface ProcessedWall {
  wallId: string
  angle: number
  edgeA: LineEquation // Left edge
  edgeB: LineEquation // Right edge
  isPassthrough: boolean
}

function calculateJunctionIntersections(
  junction: Junction,
  walls: Wall[],
): WallIntersections {
  const { meetingPoint, connectedWalls } = junction
  const processedWalls: ProcessedWall[] = []

  for (const { wallId, endType } of connectedWalls) {
    const wall = walls.find((w) => w.id === wallId)
    if (!wall) continue

    const halfT = wall.thickness / 2

    if (endType === 'passthrough') {
      // For passthrough walls (T-junctions), add both directions
      const v1 = { x: wall.end.x - wall.start.x, y: wall.end.y - wall.start.y }
      const v2 = { x: -v1.x, y: -v1.y }

      for (const v of [v1, v2]) {
        const L = Math.sqrt(v.x * v.x + v.y * v.y)
        if (L < 1e-9) continue

        const nUnit = { x: -v.y / L, y: v.x / L }
        const pA = { x: meetingPoint.x + nUnit.x * halfT, y: meetingPoint.y + nUnit.y * halfT }
        const pB = { x: meetingPoint.x - nUnit.x * halfT, y: meetingPoint.y - nUnit.y * halfT }

        const edgeA = createLineFromPointAndVector(pA, v)
        const edgeB = createLineFromPointAndVector(pB, v)
        const angle = Math.atan2(v.y, v.x)

        processedWalls.push({ wallId: wall.id, angle, edgeA, edgeB, isPassthrough: true })
      }
    } else {
      // Normal wall endpoint (start or end)
      const v = getWallDirection(wall, endType)

      const L = Math.sqrt(v.x * v.x + v.y * v.y)
      if (L < 1e-9) continue

      const nUnit = { x: -v.y / L, y: v.x / L }
      const pA = { x: meetingPoint.x + nUnit.x * halfT, y: meetingPoint.y + nUnit.y * halfT }
      const pB = { x: meetingPoint.x - nUnit.x * halfT, y: meetingPoint.y - nUnit.y * halfT }

      const edgeA = createLineFromPointAndVector(pA, v)
      const edgeB = createLineFromPointAndVector(pB, v)
      const angle = Math.atan2(v.y, v.x)

      processedWalls.push({ wallId: wall.id, angle, edgeA, edgeB, isPassthrough: false })
    }
  }

  // Sort by outgoing angle
  processedWalls.sort((a, b) => a.angle - b.angle)

  const wallIntersections = new Map<string, { left?: Point2D; right?: Point2D }>()
  const n = processedWalls.length

  if (n < 2) return wallIntersections

  // Calculate intersections between adjacent walls
  for (let i = 0; i < n; i++) {
    const wall1 = processedWalls[i]!
    const wall2 = processedWalls[(i + 1) % n]!

    // Intersect left edge of wall1 with right edge of wall2
    const det = wall1.edgeA.a * wall2.edgeB.b - wall2.edgeB.a * wall1.edgeA.b

    // If lines are parallel (det ≈ 0), skip this intersection
    if (Math.abs(det) < 1e-9) {
      continue
    }

    const p = {
      x: (wall1.edgeA.b * wall2.edgeB.c - wall2.edgeB.b * wall1.edgeA.c) / det,
      y: (wall2.edgeB.a * wall1.edgeA.c - wall1.edgeA.a * wall2.edgeB.c) / det,
    }

    // Only assign intersection to non-passthrough walls
    if (!wall1.isPassthrough) {
      if (!wallIntersections.has(wall1.wallId)) {
        wallIntersections.set(wall1.wallId, {})
      }
      wallIntersections.get(wall1.wallId)!.left = p
    }

    if (!wall2.isPassthrough) {
      if (!wallIntersections.has(wall2.wallId)) {
        wallIntersections.set(wall2.wallId, {})
      }
      wallIntersections.get(wall2.wallId)!.right = p
    }
  }

  return wallIntersections
}

// ============================================================================
// MAIN EXPORTS
// ============================================================================

/**
 * Calculates miter data for all walls on a level
 */
export function calculateLevelMiters(walls: Wall[]): WallMiterData {
  const junctions = findJunctions(walls)
  const junctionData: JunctionData = new Map()

  for (const [key, junction] of junctions.entries()) {
    const wallIntersections = calculateJunctionIntersections(junction, walls)
    junctionData.set(key, wallIntersections)
  }

  return { junctionData, junctions }
}

/**
 * Gets the miter boundary points for a specific wall
 */
export function getWallMiterBoundaryPoints(
  wall: Wall,
  miterData: WallMiterData,
): WallMiterBoundaryPoints {
  const halfThickness = wall.thickness / 2
  const startFrame = getWallBoundaryFrame(wall, 'start')
  const endFrame = getWallBoundaryFrame(wall, 'end')

  const startKey = pointToKey(startFrame.point)
  const endKey = pointToKey(endFrame.point)

  const startJunction = miterData.junctionData.get(startKey)?.get(wall.id)
  const endJunction = miterData.junctionData.get(endKey)?.get(wall.id)

  return {
    startLeft: startJunction?.left ?? {
      x: startFrame.point.x + startFrame.normal.x * halfThickness,
      y: startFrame.point.y + startFrame.normal.y * halfThickness,
    },
    startRight: startJunction?.right ?? {
      x: startFrame.point.x - startFrame.normal.x * halfThickness,
      y: startFrame.point.y - startFrame.normal.y * halfThickness,
    },
    endLeft: endJunction?.right ?? {
      x: endFrame.point.x + endFrame.normal.x * halfThickness,
      y: endFrame.point.y + endFrame.normal.y * halfThickness,
    },
    endRight: endJunction?.left ?? {
      x: endFrame.point.x - endFrame.normal.x * halfThickness,
      y: endFrame.point.y - endFrame.normal.y * halfThickness,
    },
  }
}

/**
 * Gets the mitered 2D polygon footprint for a wall
 */
export function getWallMiterFootprint(wall: Wall, miterData: WallMiterData): Point2D[] {
  const boundaryPoints = getWallMiterBoundaryPoints(wall, miterData)

  // Check if wall has any T-junctions (passthrough endpoints)
  const startKey = pointToKey({ x: wall.start.x, y: wall.start.y })
  const endKey = pointToKey({ x: wall.end.x, y: wall.end.y })

  const startJunction = miterData.junctions.get(startKey)
  const endJunction = miterData.junctions.get(endKey)

  const hasStartPassthrough = startJunction?.connectedWalls.some(
    (cw) => cw.wallId === wall.id && cw.endType === 'passthrough',
  )
  const hasEndPassthrough = endJunction?.connectedWalls.some(
    (cw) => cw.wallId === wall.id && cw.endType === 'passthrough',
  )

  // Simple 4-point polygon for straight walls
  // Note: for curved walls with curveOffset, additional points would be generated
  if (!hasStartPassthrough && !hasEndPassthrough) {
    return [
      boundaryPoints.startRight,
      boundaryPoints.endRight,
      boundaryPoints.endLeft,
      boundaryPoints.startLeft,
    ]
  }

  // For T-junctions, include the meeting point to create proper geometry
  const polygon: Point2D[] = []

  if (hasStartPassthrough) {
    // Include start meeting point
    polygon.push(boundaryPoints.startRight)
    polygon.push({ x: wall.start.x, y: wall.start.y })
  } else {
    polygon.push(boundaryPoints.startRight)
  }

  polygon.push(boundaryPoints.endRight)
  polygon.push(boundaryPoints.endLeft)

  if (hasEndPassthrough) {
    // Include end meeting point
    polygon.push({ x: wall.end.x, y: wall.end.y })
    polygon.push(boundaryPoints.startLeft)
  } else {
    polygon.push(boundaryPoints.startLeft)
  }

  return polygon
}

/**
 * Gets wall IDs that share junctions with the given walls
 */
export function getAdjacentWallIds(allWalls: Wall[], dirtyWallIds: Set<string>): Set<string> {
  const adjacent = new Set<string>()

  for (const dirtyId of dirtyWallIds) {
    const dirtyWall = allWalls.find((w) => w.id === dirtyId)
    if (!dirtyWall) continue

    const dirtyStart: Point2D = { x: dirtyWall.start.x, y: dirtyWall.start.y }
    const dirtyEnd: Point2D = { x: dirtyWall.end.x, y: dirtyWall.end.y }

    for (const wall of allWalls) {
      if (wall.id === dirtyId) continue

      const wallStart: Point2D = { x: wall.start.x, y: wall.start.y }
      const wallEnd: Point2D = { x: wall.end.x, y: wall.end.y }

      // Check corner connections (endpoints meeting)
      const startKey = pointToKey(wallStart)
      const endKey = pointToKey(wallEnd)
      const dirtyStartKey = pointToKey(dirtyStart)
      const dirtyEndKey = pointToKey(dirtyEnd)

      if (
        startKey === dirtyStartKey ||
        startKey === dirtyEndKey ||
        endKey === dirtyStartKey ||
        endKey === dirtyEndKey
      ) {
        adjacent.add(wall.id)
        continue
      }

      // Check T-junction connections
      if (pointOnWallSegment(dirtyStart, wall) || pointOnWallSegment(dirtyEnd, wall)) {
        adjacent.add(wall.id)
        continue
      }

      // Check reverse T-junction
      if (pointOnWallSegment(wallStart, dirtyWall) || pointOnWallSegment(wallEnd, dirtyWall)) {
        adjacent.add(wall.id)
      }
    }
  }

  return adjacent
}

/**
 * Invalidates miter cache for affected walls
 */
export function invalidateMiterCache(affectedWallIds: Set<string>): void {
  for (const id of affectedWallIds) {
    miterCache.delete(id)
  }
}

/**
 * Gets cached miter boundary points for a wall
 */
export function getCachedMiterBoundaryPoints(
  wall: Wall,
  miterData: WallMiterData,
): WallMiterBoundaryPoints {
  const cached = miterCache.get(wall.id)
  if (cached?.boundaryPoints) {
    return cached.boundaryPoints
  }

  const boundaryPoints = getWallMiterBoundaryPoints(wall, miterData)

  // Update cache
  if (cached) {
    cached.boundaryPoints = boundaryPoints
  } else {
    miterCache.set(wall.id, { boundaryPoints, polygon: [] })
  }

  return boundaryPoints
}

/**
 * Builds a THREE.Shape from miter polygon points
 */
export function buildWallShape(polygon: Point2D[]): THREE.Shape {
  if (polygon.length < 3) {
    // Return empty shape for degenerate polygons
    const shape = new THREE.Shape()
    return shape
  }

  const shape = new THREE.Shape()
  shape.moveTo(polygon[0]!.x, polygon[0]!.y)

  for (let i = 1; i < polygon.length; i++) {
    shape.lineTo(polygon[i]!.x, polygon[i]!.y)
  }

  shape.closePath()
  return shape
}

/**
 * Creates ExtrudeGeometry from wall polygon and height
 */
export function buildWallExtrudeGeometry(
  polygon: Point2D[],
  height: number,
): THREE.ExtrudeGeometry {
  const shape = buildWallShape(polygon)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
  })

  // Rotate so extrusion direction (Z) becomes height direction (Y)
  geometry.rotateX(-Math.PI / 2)
  geometry.computeVertexNormals()

  return geometry
}

/**
 * Transforms world coordinates to wall-local coordinates
 */
export function worldToWallLocal(
  worldPoint: Point2D,
  wallStart: Point2D,
  wallAngle: number,
): { x: number; z: number } {
  const dx = worldPoint.x - wallStart.x
  const dy = worldPoint.y - wallStart.y
  const cosA = Math.cos(-wallAngle)
  const sinA = Math.sin(-wallAngle)

  return {
    x: dx * cosA - dy * sinA,
    z: dx * sinA + dy * cosA,
  }
}

// Re-export for backwards compatibility
export { pointToKey }