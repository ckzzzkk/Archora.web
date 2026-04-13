import React, { useMemo } from 'react';
import { buildWallGeometry } from '../../utils/procedural/geometry';
import type { Wall, Opening } from '../../types';

interface Segment {
  x: number;   // local X center (in wall group space)
  y: number;   // local Y center
  z: number;   // local Z offset (always 0)
  w: number;   // width along wall
  h: number;   // height
  d: number;   // depth (thickness)
  kind: 'wall' | 'door' | 'window' | 'lintel';
}

function buildSegments(length: number, height: number, thickness: number, openings: Opening[]): Segment[] {
  if (openings.length === 0) {
    return [{ x: 0, y: 0, z: 0, w: length, h: height, d: thickness, kind: 'wall' }];
  }

  const sorted = [...openings].sort((a, b) => a.position - b.position);
  const segs: Segment[] = [];
  // Wall runs from -length/2 to +length/2 in local X. Y=0 is the vertical center.
  let curX = -length / 2;

  for (const op of sorted) {
    const opCenterX = (op.position - 0.5) * length;
    const opLeft = opCenterX - op.width / 2;
    const opRight = opCenterX + op.width / 2;

    // Left wall segment (full height, before this opening)
    if (opLeft > curX + 0.02) {
      const w = opLeft - curX;
      segs.push({ x: (curX + opLeft) / 2, y: 0, z: 0, w, h: height, d: thickness, kind: 'wall' });
    }

    const opBottom = op.sillHeight;
    const opTop = op.sillHeight + op.height;

    // Lintel above opening
    const lintelH = height - opTop;
    if (lintelH > 0.02) {
      const localY = (opTop + height) / 2 - height / 2;
      segs.push({ x: opCenterX, y: localY, z: 0, w: op.width, h: lintelH, d: thickness, kind: 'lintel' });
    }

    // Sill below opening (windows only, sillHeight > 0)
    if (opBottom > 0.02) {
      const localY = opBottom / 2 - height / 2;
      segs.push({ x: opCenterX, y: localY, z: 0, w: op.width, h: opBottom, d: thickness, kind: 'wall' });
    }

    // Opening visual — thin panel representing door or glass
    const isDoor = op.type === 'door' || op.type === 'sliding_door' || op.type === 'french_door';
    const openingLocalY = (opBottom + opTop) / 2 - height / 2;
    segs.push({
      x: opCenterX,
      y: openingLocalY,
      z: 0,
      w: op.width,
      h: op.height,
      d: thickness * 0.25,
      kind: isDoor ? 'door' : 'window',
    });

    curX = opRight;
  }

  // Right wall segment (after last opening)
  const rightEdge = length / 2;
  if (rightEdge > curX + 0.02) {
    const w = rightEdge - curX;
    segs.push({ x: (curX + rightEdge) / 2, y: 0, z: 0, w, h: height, d: thickness, kind: 'wall' });
  }

  return segs;
}

interface ProceduralWallProps {
  wall: Wall;
  openings?: Opening[];
  selected?: boolean;
  color?: string;
  opacity?: number;
  onClick?: () => void;
}

export function ProceduralWall({
  wall,
  openings = [],
  selected = false,
  color = '#C8C8C8',
  opacity = 1,
  onClick,
}: ProceduralWallProps) {
  const { position, rotation, length } = useMemo(() => buildWallGeometry(wall), [wall]);

  const segments = useMemo(
    () => buildSegments(length, wall.height, wall.thickness, openings),
    [length, wall.height, wall.thickness, openings],
  );

  const wallColor = selected ? '#4A90D9' : color;
  const isTransparent = opacity < 1;

  // r3f group accepts onClick at runtime; cast to silence TS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Group = 'group' as any;

  return (
    <Group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
      onClick={onClick}
    >
      {segments.map((seg, i) => {
        const isDoor = seg.kind === 'door';
        const isWindow = seg.kind === 'window';
        const segColor = isDoor ? '#1A1A1A' : isWindow ? '#88B8D0' : wallColor;
        const segOpacity = isWindow ? 0.55 : (isTransparent ? opacity : 1);
        const segRoughness = isWindow ? 0.05 : 0.8;
        const segMetalness = isWindow ? 0.6 : 0.05;

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
        );
      })}
    </Group>
  );
}
