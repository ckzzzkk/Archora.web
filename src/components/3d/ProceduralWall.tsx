import React, { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import type { Wall, Opening } from '../../types/blueprint'
import { MaterialCompiler } from '../../materials/MaterialCompiler'
import {
  calculateLevelMiters,
  getWallMiterBoundaryPoints,
  getWallMiterFootprint,
  buildWallShape,
  worldToWallLocal,
  type Point2D,
  type WallMiterData,
} from '../../utils/procedural/wallMitering'
import {
  isCurvedWall,
  getWallCurveFrameAt,
  buildCurvedWallGeometry,
  getWallSurfacePolygon,
} from '../../utils/procedural/wallCurve'

interface Segment {
  x: number   // local X center (in wall group space)
  y: number   // local Y center
  z: number   // local Z offset (always 0)
  w: number   // width along wall
  h: number   // height
  d: number   // depth (thickness)
  kind: 'wall' | 'door' | 'window' | 'lintel'
}

/** Renders a proper 3D door or window inside the wall group. */
function OpeningMesh({
  opening,
  wallHeight,
  wallThickness,
  hingeSide = 'left',
}: {
  opening: Opening;
  wallHeight: number;
  wallThickness: number;
  /** 'left' = hinge on opening start (standard swing), 'right' = hinge on opening end */
  hingeSide?: 'left' | 'right';
}) {
  const isDoor = opening.type === 'door' || opening.type === 'sliding_door' || opening.type === 'french_door';
  const FRAME = 0.06;
  const depth = wallThickness * 0.25;

  const frameX = 0;
  const frameY = (opening.sillHeight + opening.height / 2) - wallHeight / 2;
  const frameW = opening.width;
  const frameH = opening.height;

  // Door leaf dimensions after frame gap
  const leafH = frameH - FRAME * 2;
  const leafW = frameW - FRAME * 2;

  if (isDoor) {
    // Leaf Z: forward of wall centre (positive Z = into room)
    const leafZ = depth / 2 + 0.02;

    // Latch side = opposite of hinge side
    const latchSide = hingeSide === 'left' ? 1 : -1;
    const handleOffsetX = latchSide * (leafW / 2 - 0.08);

    // Hinge pin position (at hinge side)
    const hingeX = hingeSide === 'left' ? (-frameW / 2 + FRAME / 2) : (frameW / 2 - FRAME / 2);

    // Arc radius = door width (standard architectural convention)
    const arcRadius = frameW;

    // Arc centre is at the hinge (leaf pivots around hinge side)
    const arcOriginX = hingeSide === 'left' ? (-frameW / 2 + FRAME) : (frameW / 2 - FRAME);
    const arcOriginY = 0; // same Y level as leaf centre

    return (
      <group position={[frameX, frameY, 0]}>
        {/* Frame top */}
        <mesh position={[0, frameH / 2 - FRAME / 2, 0]} castShadow>
          <boxGeometry args={[frameW, FRAME, depth]} />
          <meshStandardMaterial color="#5C4033" roughness={0.7} metalness={0.1} />
        </mesh>
        {/* Frame left */}
        <mesh position={[-frameW / 2 + FRAME / 2, 0, 0]} castShadow>
          <boxGeometry args={[FRAME, frameH, depth]} />
          <meshStandardMaterial color="#5C4033" roughness={0.7} metalness={0.1} />
        </mesh>
        {/* Frame right */}
        <mesh position={[frameW / 2 - FRAME / 2, 0, 0]} castShadow>
          <boxGeometry args={[FRAME, frameH, depth]} />
          <meshStandardMaterial color="#5C4033" roughness={0.7} metalness={0.1} />
        </mesh>
        {/* Frame bottom */}
        <mesh position={[0, -frameH / 2 + FRAME / 2, 0]} castShadow>
          <boxGeometry args={[frameW, FRAME, depth]} />
          <meshStandardMaterial color="#5C4033" roughness={0.7} metalness={0.1} />
        </mesh>

        {/* Door leaf — positioned so hinge side aligns with frame hinge */}
        <mesh position={[hingeSide === 'left' ? -frameW / 2 + FRAME + leafW / 2 : frameW / 2 - FRAME - leafW / 2, 0, leafZ]} castShadow>
          <boxGeometry args={[leafW, leafH, 0.04]} />
          <meshStandardMaterial color="#8B6352" roughness={0.6} metalness={0.05} />
        </mesh>

        {/* Door handle on latch side */}
        <mesh position={[handleOffsetX, 0, leafZ + 0.04]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#C0C0C0" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Hinge pin — small silver cylinder at hinge side */}
        <mesh position={[hingeX, -leafH / 2 + 0.08, leafZ - 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, depth + 0.04, 8]} />
          <meshStandardMaterial color="#A0A0A0" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Door swing arc — 90° arc in the plane of the swing (perpendicular to wall) */}
        {/* Rendered as a line of points in YZ plane from hinge, sweeping 90° */}
        {useMemo(() => {
          const points: THREE.Vector3[] = []
          for (let i = 0; i <= 12; i++) {
            const t = i / 12
            const yOff = -leafH / 2 + t * leafH
            const zOff = leafZ + Math.sin(t * Math.PI / 2) * arcRadius
            points.push(new THREE.Vector3(hingeX, yOff, zOff))
          }
          const geo = new THREE.BufferGeometry().setFromPoints(points)
          const mat = new THREE.LineBasicMaterial({ color: '#D4A84B', transparent: true, opacity: 0.6 })
          const arcLine = new THREE.Line(geo, mat)
          return <primitive object={arcLine} />
        }, [hingeX, leafH, leafZ, arcRadius])}
      </group>
    );
  }

  // Window: frame + glass
  const glassH = frameH - FRAME * 2;
  const glassW = frameW - FRAME * 2;
  const glassZ = depth / 2;

  return (
    <group position={[frameX, frameY, 0]}>
      {/* Frame top */}
      <mesh position={[0, frameH / 2 - FRAME / 2, 0]} castShadow>
        <boxGeometry args={[frameW, FRAME, depth]} />
        <meshStandardMaterial color="#E0E0E0" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Frame bottom */}
      <mesh position={[0, -frameH / 2 + FRAME / 2, 0]} castShadow>
        <boxGeometry args={[frameW, FRAME, depth]} />
        <meshStandardMaterial color="#E0E0E0" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Frame left */}
      <mesh position={[-frameW / 2 + FRAME / 2, 0, 0]} castShadow>
        <boxGeometry args={[FRAME, frameH, depth]} />
        <meshStandardMaterial color="#E0E0E0" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Frame right */}
      <mesh position={[frameW / 2 - FRAME / 2, 0, 0]} castShadow>
        <boxGeometry args={[FRAME, frameH, depth]} />
        <meshStandardMaterial color="#E0E0E0" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Glass pane */}
      <mesh position={[0, 0, glassZ]}>
        <boxGeometry args={[glassW, glassH, 0.01]} />
        <meshStandardMaterial
          color="#88B8D0"
          roughness={0.05}
          metalness={0.1}
          transparent
          opacity={0.45}
        />
      </mesh>
    </group>
  );
}

function buildSegments(length: number, height: number, thickness: number, openings: Opening[]): Segment[] {
  if (openings.length === 0) {
    return [{ x: 0, y: 0, z: 0, w: length, h: height, d: thickness, kind: 'wall' }]
  }

  const sorted = [...openings].sort((a, b) => a.position - b.position)
  const segs: Segment[] = []
  // Wall runs from -length/2 to +length/2 in local X. Y=0 is the vertical center.
  let curX = -length / 2

  for (const op of sorted) {
    const opCenterX = (op.position - 0.5) * length
    const opLeft = opCenterX - op.width / 2
    const opRight = opCenterX + op.width / 2

    // Left wall segment (full height, before this opening)
    if (opLeft > curX + 0.02) {
      const w = opLeft - curX
      segs.push({ x: (curX + opLeft) / 2, y: 0, z: 0, w, h: height, d: thickness, kind: 'wall' })
    }

    const opBottom = op.sillHeight
    const opTop = op.sillHeight + op.height

    // Lintel above opening
    const lintelH = height - opTop
    if (lintelH > 0.02) {
      const localY = (opTop + height) / 2 - height / 2
      segs.push({ x: opCenterX, y: localY, z: 0, w: op.width, h: lintelH, d: thickness, kind: 'lintel' })
    }

    // Sill below opening (windows only, sillHeight > 0)
    if (opBottom > 0.02) {
      const localY = opBottom / 2 - height / 2
      segs.push({ x: opCenterX, y: localY, z: 0, w: op.width, h: opBottom, d: thickness, kind: 'wall' })
    }

    // Opening visual — thin panel representing door or glass
    const isDoor = op.type === 'door' || op.type === 'sliding_door' || op.type === 'french_door'
    const openingLocalY = (opBottom + opTop) / 2 - height / 2
    segs.push({
      x: opCenterX,
      y: openingLocalY,
      z: 0,
      w: op.width,
      h: op.height,
      d: thickness * 0.25,
      kind: isDoor ? 'door' : 'window',
    })

    curX = opRight
  }

  // Right wall segment (after last opening)
  const rightEdge = length / 2
  if (rightEdge > curX + 0.02) {
    const w = rightEdge - curX
    segs.push({ x: (curX + rightEdge) / 2, y: 0, z: 0, w, h: height, d: thickness, kind: 'wall' })
  }

  return segs
}

// Cached miter data per floor (walls array reference is used as cache key)
const miterCache = new Map<string, WallMiterData>()

function getMiterData(walls: Wall[]): WallMiterData {
  // Use walls length as simple cache key (invalidate when walls change)
  const cacheKey = walls.length.toString()
  const existing = miterCache.get(cacheKey)
  if (existing) return existing

  const miterData = calculateLevelMiters(walls)
  miterCache.set(cacheKey, miterData)
  return miterData
}

/**
 * Builds geometry for curved walls (curveOffset !== 0)
 * The arc body uses buildCurvedWallGeometry, with miter overrides at endpoints
 */
function buildCurvedWallGeometryWithMiters(
  wall: Wall,
  miterData: WallMiterData,
  numSegments = 24,
): THREE.BufferGeometry {
  const boundaryPoints = getWallMiterBoundaryPoints(wall, miterData)

  const polygon = getWallSurfacePolygon(
    wall,
    numSegments,
    {
      startLeft: boundaryPoints.startLeft,
      startRight: boundaryPoints.startRight,
      endLeft: boundaryPoints.endLeft,
      endRight: boundaryPoints.endRight,
    },
  )

  if (polygon.length < 3) {
    return new THREE.BufferGeometry()
  }

  // Build THREE.Shape in world coordinates
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

  // Rotate so extrusion direction (Z) becomes height direction (Y)
  geometry.rotateX(-Math.PI / 2)
  geometry.computeVertexNormals()

  return geometry
}

function buildMiteredWallGeometry(wall: Wall, miterData: WallMiterData): THREE.BufferGeometry {
  const start: Point2D = { x: wall.start.x, y: wall.start.y }
  const end: Point2D = { x: wall.end.x, y: wall.end.y }

  // Calculate wall length and angle
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.sqrt(dx * dx + dy * dy)
  if (length < 1e-9) {
    return new THREE.BufferGeometry()
  }

  const wallAngle = Math.atan2(dy, dx)

  // For curved walls, use sagitta-based arc geometry with mitered endpoints
  if (isCurvedWall(wall)) {
    return buildCurvedWallGeometryWithMiters(wall, miterData)
  }

  // Get mitered polygon footprint
  const polygon = getWallMiterFootprint(wall, miterData)
  if (polygon.length < 3) {
    return new THREE.BufferGeometry()
  }

  // Transform world coordinates to wall-local
  // Wall-local: x along wall, z perpendicular (thickness direction)
  const localPoints = polygon.map((pt) => worldToWallLocal(pt, start, wallAngle))

  // Build THREE.Shape
  // Shape uses (x, y) where we map: shape.x = local.x, shape.y = -local.z
  const footprint = new THREE.Shape()
  footprint.moveTo(localPoints[0]!.x, -localPoints[0]!.z)
  for (let i = 1; i < localPoints.length; i++) {
    footprint.lineTo(localPoints[i]!.x, -localPoints[i]!.z)
  }
  footprint.closePath()

  // Extrude along Z by height
  const geometry = new THREE.ExtrudeGeometry(footprint, {
    depth: wall.height,
    bevelEnabled: false,
  })

  // Rotate so extrusion direction (Z) becomes height direction (Y)
  geometry.rotateX(-Math.PI / 2)
  geometry.computeVertexNormals()

  return geometry
}

interface ProceduralWallProps {
  wall: Wall
  openings?: Opening[]
  selected?: boolean
  color?: string
  wallTexture?: string
  opacity?: number
  onClick?: () => void
}

export function ProceduralWall({
  wall,
  openings = [],
  selected = false,
  color = '#C8C8C8',
  wallTexture,
  opacity = 1,
  onClick,
}: ProceduralWallProps) {
  const mat = MaterialCompiler.compile(wallTexture ?? 'wall_drywall', 'threejs');
  const baseRoughness = mat.roughness ?? 0.8;
  const baseMetalness = mat.metalness ?? 0.05;
  const compiledColor = mat.color;
  const { position, rotation, length } = useMemo(() => {
    // Compute position and rotation from wall start/end
    const start = { x: wall.start.x, y: wall.start.y }
    const end = { x: wall.end.x, y: wall.end.y }
    const dx = end.x - start.x
    const dy = end.y - start.y
    const wallLength = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)

    return {
      position: { x: start.x, y: 0, z: start.y },
      rotation: { x: 0, y: -angle, z: 0 },
      length: wallLength,
    }
  }, [wall.start.x, wall.start.y, wall.end.x, wall.end.y])

  // Get miter data for all walls (using a hook-like pattern via useMemo with wall id as dependency)
  // Note: In production, you'd want to pass walls as a prop or via context
  const miterData = useMemo(() => {
    // This is a simplified version - in full integration, miterData would come from blueprintStore
    return calculateLevelMiters([wall])
  }, [wall.id])

  // Build mitered geometry
  const miteredGeometry = useMemo(
    () => buildMiteredWallGeometry(wall, miterData),
    [wall, miterData],
  )

  // Fallback to simple box geometry if mitering fails
  const geometry = useMemo(() => {
    if (miteredGeometry.attributes.position?.count > 0) {
      return miteredGeometry
    }
    // Simple fallback
    return new THREE.BoxGeometry(length, wall.height, wall.thickness)
  }, [miteredGeometry, length, wall.height, wall.thickness])

  // Dispose geometries on unmount / wall change to prevent memory leaks
  useEffect(() => {
    return () => {
      miteredGeometry.dispose();
      geometry.dispose();
    };
  }, [miteredGeometry, geometry]);

  const segments = useMemo(
    () => buildSegments(length, wall.height, wall.thickness, openings),
    [length, wall.height, wall.thickness, openings],
  )

  const wallColor = selected ? '#4A90D9' : (color ?? compiledColor)
  const isTransparent = opacity < 1

  // r3f group accepts onClick at runtime; cast to silence TS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Group = 'group' as any

  return (
    <Group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
      onClick={onClick}
    >
      {segments.map((seg, i) => {
        const isDoor = seg.kind === 'door'
        const isWindow = seg.kind === 'window'
        const segColor = isDoor ? '#1A1A1A' : isWindow ? '#88B8D0' : wallColor
        const segOpacity = isWindow ? 0.55 : (isTransparent ? opacity : 1)
        const segRoughness = isWindow ? 0.05 : (isDoor ? 0.5 : baseRoughness)
        const segMetalness = isWindow ? 0.6 : (isDoor ? 0.05 : baseMetalness)

        return (
          <mesh
            key={i}
            position={[seg.x, seg.y, seg.z]}
            castShadow={!isTransparent && !isWindow}
            receiveShadow
          >
            <boxGeometry args={[seg.w, seg.h, seg.d]} />
            <meshStandardMaterial
              color={segColor}
              roughness={segRoughness}
              metalness={segMetalness}
              transparent={isTransparent || isWindow}
              opacity={segOpacity}
            />
          </mesh>
        )
      })}
      {/* 3D opening meshes (doors + windows) */}
      {openings.map((opening) => (
        <OpeningMesh
          key={`opening_${opening.id}`}
          opening={opening}
          wallHeight={wall.height}
          wallThickness={wall.thickness}
          hingeSide={opening.hingeSide ?? 'left'}
        />
      ))}
    </Group>
  )
}
