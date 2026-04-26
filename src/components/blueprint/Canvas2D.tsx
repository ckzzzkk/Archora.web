import { DS } from '../../theme/designSystem';
import React, { useCallback, useRef, useState, useEffect, forwardRef, useImperativeHandle, useReducer } from 'react';
import { View, Dimensions } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  Line,
  Circle,
  Group,
  Text as SkiaText,
  DashPathEffect,
} from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  runOnJS,
  withSpring,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useUIStore } from '../../stores/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { useWallDrawing } from '../../hooks/useWallDrawing';
import { useFurniturePlacement } from '../../hooks/useFurniturePlacement';
import { useRoomDetection } from '../../hooks/useRoomDetection';
import { useDimensions } from '../../hooks/useDimensions';
import { clipboard } from '../../utils/clipboard';
import { FurnitureContextMenu } from './FurnitureContextMenu';
import { ErrorBoundary } from '../common/ErrorBoundary';
import {
  PIXELS_PER_METRE,
  metreToPixel,
  pixelToMetre,
} from '../../utils/canvasHelpers';
import { ScaleBar } from '../../utils/geometry/ScaleBar';
import { boundingBox } from '../../utils/geometry/polygonUtils';
import { wallLength as calcWallLength } from '../../utils/geometry/wallGraph';
import { MaterialCompiler } from '../../materials/MaterialCompiler';
import { useSkiaFonts } from '../common/SkiaFontLoader';
import type { Wall, Room, Opening, FurniturePiece, Vector2D } from '../../types';
import type { FurnitureDef } from '../../hooks/useFurniturePlacement';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CANVAS_H = SCREEN_H * 0.72;

// UK minimum room area thresholds (m²)
const MIN_BEDROOM_AREA = 7.5;
const MIN_BATHROOM_AREA = 2.5;
const SMALL_ROOM_AREA = 4;

interface ContextMenuState {
  visible: boolean;
  position: { x: number; y: number };
  item: FurniturePiece | null;
}

export interface Canvas2DHandle {
  makeImageSnapshot: () => { encodeToBase64: () => string } | undefined;
}

interface Props {
  onSelectObject?: (id: string | null) => void;
  showStructuralGrid?: boolean;
  activeTool: string;
  pendingFurniturePlacement?: FurnitureDef | null;
  onFurniturePlaced?: () => void;
}

export const Canvas2D = forwardRef<Canvas2DHandle, Props>(function Canvas2DInner({
  onSelectObject,
  showStructuralGrid = false,
  activeTool,
  pendingFurniturePlacement,
  onFurniturePlaced,
}, ref) {
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const selectedId = useBlueprintStore((s) => s.selectedId);
  const setSelectedId = useBlueprintStore((s) => s.actions.setSelectedId);
  const deleteFurniture = useBlueprintStore((s) => s.actions.deleteFurniture);
  const addOpening = useBlueprintStore((s) => s.actions.addOpening);
  const { colors } = useTheme();
  const { light } = useHaptics();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skiaCanvasRef = useRef<any>(null);
  useImperativeHandle(ref, () => ({
    makeImageSnapshot: () => skiaCanvasRef.current?.makeImageSnapshot?.() as { encodeToBase64: () => string } | undefined,
  }));
  const { dimFont, roomFont } = useSkiaFonts();

  const wallDrawing = useWallDrawing();
  const placement = useFurniturePlacement(onFurniturePlaced);
  useRoomDetection();
  const dimensionLines = useDimensions();
  const showToast = useUIStore((s) => s.actions.showToast);

  // Measurement intelligence: warn when a room falls below minimum area
  const prevRoomCountRef = useRef(0);
  useEffect(() => {
    const rooms = blueprint?.rooms ?? [];
    if (rooms.length > prevRoomCountRef.current) {
      // A new room was detected — check it
      const newRoom = rooms[rooms.length - 1];
      if (newRoom) {
        const typeKey = newRoom.type ?? '';
        let minArea: number | null = null;
        if (typeKey === 'bedroom' && newRoom.area < MIN_BEDROOM_AREA) minArea = MIN_BEDROOM_AREA;
        else if (typeKey === 'bathroom' && newRoom.area < MIN_BATHROOM_AREA) minArea = MIN_BATHROOM_AREA;
        else if (newRoom.area < SMALL_ROOM_AREA) minArea = SMALL_ROOM_AREA;
        if (minArea !== null) {
          showToast(`${newRoom.name || 'Room'} is ${newRoom.area.toFixed(1)}m² — minimum recommended is ${minArea}m²`, 'warning');
        }
      }
    }
    prevRoomCountRef.current = rooms.length;
  }, [blueprint?.rooms, showToast]);

  // Sync pending placement with the placement hook
  const prevPendingRef = useRef<FurnitureDef | null | undefined>(undefined);
  if (pendingFurniturePlacement !== prevPendingRef.current) {
    prevPendingRef.current = pendingFurniturePlacement;
    placement.setPendingPlacement(pendingFurniturePlacement ?? null);
  }

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    position: { x: 0, y: 0 },
    item: null,
  });
  const [showDimensions, setShowDimensions] = useState(true);
  // Measure tool: stores tapped points
  const [measurePoints, setMeasurePoints] = useState<{ x: number; y: number }[]>([]);

  const scale = useSharedValue(1);
  const offsetX = useSharedValue(SCREEN_W / 2);
  const offsetY = useSharedValue(CANVAS_H / 2);
  const savedScale = useSharedValue(1);
  const savedOffsetX = useSharedValue(SCREEN_W / 2);
  const savedOffsetY = useSharedValue(CANVAS_H / 2);

  const scaleRef = useRef(1);
  const offsetXRef = useRef(SCREEN_W / 2);
  const offsetYRef = useRef(CANVAS_H / 2);
  // Sync Reanimated shared values to plain refs so gesture handlers can read them.
  // Pattern mirrors SketchScreen — runOnJS forces React re-render so Skia picks up latest values.
  const [, forceCanvasRender] = useReducer((n: number) => n + 1, 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useAnimatedReaction(
    () => ({ s: (scale as any).value, ox: (offsetX as any).value, oy: (offsetY as any).value }),
    (curr) => {
      scaleRef.current = curr.s;
      offsetXRef.current = curr.ox;
      offsetYRef.current = curr.oy;
      runOnJS(forceCanvasRender)();
    },
  );

  const showContextMenu = useCallback(
    (item: FurniturePiece, screenX: number, screenY: number) => {
      setContextMenu({ visible: true, position: { x: screenX, y: screenY }, item });
    },
    [],
  );
  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleOpeningTap = useCallback((worldX: number, worldY: number, openingType: 'door' | 'window') => {
    if (!blueprint) return;
    const walls = blueprint.walls;
    let nearest: { wall: typeof walls[0]; t: number; dist: number } | null = null;

    for (const wall of walls) {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;
      const t = ((worldX - wall.start.x) * dx + (worldY - wall.start.y) * dy) / (len * len);
      const ct = Math.max(0, Math.min(1, t));
      const closestX = wall.start.x + ct * dx;
      const closestY = wall.start.y + ct * dy;
      const dist = Math.sqrt((worldX - closestX) ** 2 + (worldY - closestY) ** 2);
      if (dist < 0.5 && (!nearest || dist < nearest.dist)) {
        nearest = { wall, t: ct, dist };
      }
    }

    if (!nearest) return;

    const wallLen = Math.sqrt(
      (nearest.wall.end.x - nearest.wall.start.x) ** 2 +
      (nearest.wall.end.y - nearest.wall.start.y) ** 2,
    );

    const isDoor = openingType === 'door';
    const openingWidth = isDoor ? 0.9 : 1.2;

    // Centre the opening on the tap point, clamped to wall bounds
    const positionCentre = nearest.t * wallLen;
    const position = Math.max(0, Math.min(wallLen - openingWidth, positionCentre - openingWidth / 2));

    addOpening({
      id: `opening_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      wallId: nearest.wall.id,
      type: openingType,
      position,
      width: openingWidth,
      height: isDoor ? 2.1 : 1.2,
      sillHeight: isDoor ? 0 : 0.8,
    });

    light();
  }, [blueprint, addOpening, light]);

  const handleMeasureTap = useCallback((mx: number, my: number) => {
    setMeasurePoints((pts) => {
      if (pts.length >= 2) return [{ x: mx, y: my }]; // reset on 3rd tap
      return [...pts, { x: mx, y: my }];
    });
    light();
  }, [light]);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => { savedScale.value = scale.value; })
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 0.3), 4);
    });

  const tapGesture = Gesture.Tap().onEnd((e) => {
    const mx = pixelToMetre(e.x, scaleRef.current, offsetXRef.current);
    const my = pixelToMetre(e.y, scaleRef.current, offsetYRef.current);

    if (!blueprint) {
      runOnJS(setSelectedId)(null);
      return;
    }

    if (activeTool === 'wall') {
      runOnJS(wallDrawing.handleCanvasTap)(mx, my);
      return;
    }

    if (activeTool === 'furniture' && placement.ghostPosition) {
      runOnJS(placement.handlePlaceTap)(mx, my);
      return;
    }

    if (activeTool === 'measure') {
      runOnJS(handleMeasureTap)(mx, my);
      return;
    }

    if (activeTool === 'door') {
      runOnJS(handleOpeningTap)(mx, my, 'door');
      return;
    }

    if (activeTool === 'window') {
      runOnJS(handleOpeningTap)(mx, my, 'window');
      return;
    }

    // Default: hit-test furniture then walls
    for (const piece of blueprint.furniture) {
      const halfW = piece.dimensions.x / 2;
      const halfD = piece.dimensions.z / 2;
      if (
        mx >= piece.position.x - halfW &&
        mx <= piece.position.x + halfW &&
        my >= piece.position.z - halfD &&
        my <= piece.position.z + halfD
      ) {
        runOnJS(light)();
        runOnJS(setSelectedId)(piece.id);
        return;
      }
    }

    for (const wall of blueprint.walls) {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;
      const t = ((mx - wall.start.x) * dx + (my - wall.start.y) * dy) / (len * len);
      const ct = Math.max(0, Math.min(1, t));
      const closestX = wall.start.x + ct * dx;
      const closestY = wall.start.y + ct * dy;
      const dist = Math.sqrt((mx - closestX) ** 2 + (my - closestY) ** 2);
      if (dist < 0.3) {
        runOnJS(light)();
        runOnJS(setSelectedId)(wall.id);
        return;
      }
    }

    // Default: hit-test rooms by centroid proximity
    for (const room of blueprint.rooms) {
      const dx = mx - room.centroid.x;
      const dy = my - room.centroid.y;
      if (Math.sqrt(dx * dx + dy * dy) < 0.5) {
        runOnJS(light)();
        runOnJS(setSelectedId)(room.id);
        return;
      }
    }

    runOnJS(setSelectedId)(null);
  });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (activeTool === 'wall' || (activeTool === 'furniture' && placement.ghostPosition)) return;
      savedOffsetX.value = offsetX.value;
      savedOffsetY.value = offsetY.value;
    })
    .onUpdate((e) => {
      const mx = pixelToMetre(e.x, scaleRef.current, offsetXRef.current);
      const my = pixelToMetre(e.y, scaleRef.current, offsetYRef.current);

      if (activeTool === 'wall') {
        runOnJS(wallDrawing.handleCanvasDrag)(mx, my);
        return;
      }
      if (activeTool === 'furniture' && placement.ghostPosition) {
        runOnJS(placement.handleGhostDrag)(mx, my);
        return;
      }
      if (activeTool === 'select' && placement.draggingFurnitureId) {
        runOnJS(placement.handleFurnitureDragMove)(mx, my);
        return;
      }
      offsetX.value = savedOffsetX.value + e.translationX;
      offsetY.value = savedOffsetY.value + e.translationY;
    })
    .onEnd(() => {
      if (placement.draggingFurnitureId) {
        runOnJS(placement.handleFurnitureDragEnd)();
      }
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart((e) => {
      if (activeTool === 'wall') {
        runOnJS(wallDrawing.cancelDrawing)();
        return;
      }

      if (!blueprint) return;
      const mx = pixelToMetre(e.x, scaleRef.current, offsetXRef.current);
      const mz = pixelToMetre(e.y, scaleRef.current, offsetYRef.current);

      // Hit-test furniture for context menu
      for (const piece of blueprint.furniture) {
        const halfW = piece.dimensions.x / 2;
        const halfD = piece.dimensions.z / 2;
        if (
          mx >= piece.position.x - halfW &&
          mx <= piece.position.x + halfW &&
          mz >= piece.position.z - halfD &&
          mz <= piece.position.z + halfD
        ) {
          runOnJS(light)();
          runOnJS(setSelectedId)(piece.id);
          runOnJS(showContextMenu)(piece, e.x, e.y);
          return;
        }
      }

      // No hit: toggle dimension lines
      runOnJS(setShowDimensions)((v: boolean) => !v);
    });

  const combined = Gesture.Simultaneous(
    Gesture.Race(tapGesture, longPressGesture, panGesture),
    pinchGesture,
  );

  if (!blueprint) {
    return (
      <View style={{
        width: SCREEN_W, height: CANVAS_H,
        backgroundColor: DS.colors.surface,
        alignItems: 'center', justifyContent: 'center',
      }} />
    );
  }

  const handleCopy = () => {
    if (!contextMenu.item) return;
    clipboard.push({
      type: 'furniture',
      data: contextMenu.item,
      sourceBlueprintId: blueprint.id,
      sourceWallNeighbors: blueprint.walls.slice(0, 2).map((w) => w.id),
    });
  };
  const handleCut = () => { handleCopy(); if (contextMenu.item) deleteFurniture(contextMenu.item.id); };
  const handleDelete = () => { if (contextMenu.item) deleteFurniture(contextMenu.item.id); };

  const ox = offsetXRef.current;
  const oy = offsetYRef.current;
  const sc = scaleRef.current; // current zoom scale — now functional via pinch gesture

  const toPixelX = (m: number) => metreToPixel(m, sc, ox);
  const toPixelY = (m: number) => metreToPixel(m, sc, oy);

  // Room warning helper
  const roomWarning = (room: Room): string | null => {
    if (room.area < SMALL_ROOM_AREA) return '⚠';
    if (room.type === 'bedroom' && room.area < MIN_BEDROOM_AREA) return '⚠';
    if (room.type === 'bathroom' && room.area < MIN_BATHROOM_AREA) return '⚠';
    return null;
  };

  return (
    <ErrorBoundary>
    <View style={{ width: SCREEN_W, height: CANVAS_H }}>
      <GestureDetector gesture={combined}>
        <View style={{ width: SCREEN_W, height: CANVAS_H }}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Canvas {...({ ref: skiaCanvasRef } as any)} style={{ width: SCREEN_W, height: CANVAS_H }}>
            <Group>

              {/* ── Layer 1: Blueprint grid ────────────────────────────── */}
              {Array.from({ length: 30 }).map((_, i) => (
                <Line
                  key={`v${i}`}
                  p1={{ x: i * PIXELS_PER_METRE * 0.5, y: 0 }}
                  p2={{ x: i * PIXELS_PER_METRE * 0.5, y: CANVAS_H }}
                  color={colors.primary}
                  strokeWidth={0.5}
                  opacity={0.06}
                />
              ))}
              {Array.from({ length: 20 }).map((_, i) => (
                <Line
                  key={`h${i}`}
                  p1={{ x: 0, y: i * PIXELS_PER_METRE * 0.5 }}
                  p2={{ x: SCREEN_W, y: i * PIXELS_PER_METRE * 0.5 }}
                  color={colors.primary}
                  strokeWidth={0.5}
                  opacity={0.06}
                />
              ))}

              {/* ── Layer 2: Structural grid ───────────────────────────── */}
              {showStructuralGrid && (() => {
                const STRUCT_INTERVAL = 3;
                const gridCount = 20;
                const lines = [];
                for (let i = 0; i <= gridCount; i++) {
                  const xPx = metreToPixel(i * STRUCT_INTERVAL, 1, ox);
                  const yPx = metreToPixel(i * STRUCT_INTERVAL, 1, oy);
                  lines.push(
                    <Line key={`sg_v${i}`} p1={{ x: xPx, y: 0 }} p2={{ x: xPx, y: CANVAS_H }} color={colors.primary} strokeWidth={1} opacity={0.18} />,
                    <Line key={`sg_h${i}`} p1={{ x: 0, y: yPx }} p2={{ x: SCREEN_W, y: yPx }} color={colors.primary} strokeWidth={1} opacity={0.18} />,
                  );
                }
                return lines;
              })()}

              {/* ── Layer 3: Room fills ────────────────────────────────── */}
              {(blueprint?.rooms ?? []).map((room) => {
                const wallMap = new Map((blueprint?.walls ?? []).map((w: Wall) => [w.id, w]));
                const roomWalls = room.wallIds
                  .map((id: string) => wallMap.get(id))
                  .filter((w: Wall | undefined): w is Wall => !!w);

                if (roomWalls.length < 3) return null;

                // Sort walls into a proper closed loop using endpoint continuity
                const sortedWalls: Wall[] = [];
                const usedIds = new Set<string>();
                let currentWall = roomWalls[0];
                sortedWalls.push(currentWall);
                usedIds.add(currentWall.id);

                while (sortedWalls.length < roomWalls.length) {
                  const lastEnd: Vector2D = sortedWalls[sortedWalls.length - 1].end;
                  let found: Wall | null = null;
                  for (const w of roomWalls) {
                    if (usedIds.has(w.id)) continue;
                    if (Math.hypot(w.start.x - lastEnd.x, w.start.y - lastEnd.y) < 0.15) {
                      found = w;
                      break;
                    }
                    if (Math.hypot(w.end.x - lastEnd.x, w.end.y - lastEnd.y) < 0.15) {
                      // reverse wall direction
                      found = { ...w, start: w.end, end: w.start };
                      break;
                    }
                  }
                  if (!found) break;
                  sortedWalls.push(found);
                  usedIds.add(found.id);
                }

                if (sortedWalls.length < 3) return null;

                // Build pixel-space polygon path
                const roomPath = Skia.Path.Make();
                const first = sortedWalls[0];
                roomPath.moveTo(toPixelX(first.start.x), toPixelY(first.start.y));
                for (const w of sortedWalls) {
                  roomPath.lineTo(toPixelX(w.end.x), toPixelY(w.end.y));
                }
                roomPath.close();

                const mat = MaterialCompiler.compile(
                  room.floorMaterialId ?? room.floorMaterial,
                  'skia',
                );
                const isSmall = room.area < SMALL_ROOM_AREA;
                return (
                  <Path
                    key={`rf_${room.id}`}
                    path={roomPath}
                    color={isSmall ? DS.colors.error : mat.color}
                    opacity={0.15}
                    style="fill"
                  />
                );
              })}

              {/* ── Layer 4: Room labels ───────────────────────────────── */}
              {roomFont && (blueprint?.rooms ?? []).map((room) => {
                const cx = toPixelX(room.centroid.x);
                const cy = toPixelY(room.centroid.y);
                const warning = roomWarning(room);
                const label = `${room.name}${warning ? ` ${warning}` : ''} — ${room.area.toFixed(1)}m²`;
                return (
                  <SkiaText
                    key={`rl_${room.id}`}
                    x={cx - 40}
                    y={cy}
                    text={label}
                    color={warning ? DS.colors.error : colors.primaryDim}
                    font={roomFont}
                  />
                );
              })}

              {/* ── Layer 5: Walls ─────────────────────────────────────── */}
              {(blueprint?.walls ?? []).map((wall) => {
                const isSelected = selectedId === wall.id;
                const x1 = toPixelX(wall.start.x);
                const y1 = toPixelY(wall.start.y);
                const x2 = toPixelX(wall.end.x);
                const y2 = toPixelY(wall.end.y);
                return (
                  <Line
                    key={wall.id}
                    p1={{ x: x1, y: y1 }}
                    p2={{ x: x2, y: y2 }}
                    color={isSelected ? colors.primary : DS.colors.primary}
                    strokeWidth={isSelected ? 4 : 3}
                    opacity={isSelected ? 1 : 0.9}
                  />
                );
              })}

              {/* ── Layer 5b: Openings ────────────────────────────────── */}
              {(blueprint?.openings ?? []).map((opening) => {
                const wall = (blueprint?.walls ?? []).find((w) => w.id === opening.wallId);
                if (!wall) return null;
                const dx = wall.end.x - wall.start.x;
                const dy = wall.end.y - wall.start.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len === 0) return null;
                const ux = dx / len;
                const uy = dy / len;
                const sx = toPixelX(wall.start.x + ux * opening.position);
                const sy = toPixelY(wall.start.y + uy * opening.position);
                const ex = toPixelX(wall.start.x + ux * (opening.position + opening.width));
                const ey = toPixelY(wall.start.y + uy * (opening.position + opening.width));
                const isDoor = opening.type === 'door';
                return (
                  <Line
                    key={opening.id}
                    p1={{ x: sx, y: sy }}
                    p2={{ x: ex, y: ey }}
                    color={isDoor ? DS.colors.warning : DS.colors.success}
                    strokeWidth={5}
                    opacity={0.9}
                  />
                );
              })}

              {/* ── Layer 6: Dimension lines ───────────────────────────── */}
              {showDimensions && dimensionLines.map((dim) => {
                const sx = toPixelX(dim.offsetStart.x);
                const sy = toPixelY(dim.offsetStart.y);
                const ex = toPixelX(dim.offsetEnd.x);
                const ey = toPixelY(dim.offsetEnd.y);
                const mx = (sx + ex) / 2;
                const my = (sy + ey) / 2;

                // Arrowhead triangle size
                const ARROW = 5;
                const dx = ex - sx;
                const dy = ey - sy;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len < 2) return null;
                const ux = dx / len;
                const uy = dy / len;
                const px = -uy;
                const py = ux;

                const arrowPath1 = Skia.Path.Make();
                arrowPath1.moveTo(sx, sy);
                arrowPath1.lineTo(sx + ux * ARROW + px * ARROW * 0.5, sy + uy * ARROW + py * ARROW * 0.5);
                arrowPath1.lineTo(sx + ux * ARROW - px * ARROW * 0.5, sy + uy * ARROW - py * ARROW * 0.5);
                arrowPath1.close();

                const arrowPath2 = Skia.Path.Make();
                arrowPath2.moveTo(ex, ey);
                arrowPath2.lineTo(ex - ux * ARROW + px * ARROW * 0.5, ey - uy * ARROW + py * ARROW * 0.5);
                arrowPath2.lineTo(ex - ux * ARROW - px * ARROW * 0.5, ey - uy * ARROW - py * ARROW * 0.5);
                arrowPath2.close();

                return (
                  <Group key={dim.id}>
                    <Line p1={{ x: sx, y: sy }} p2={{ x: ex, y: ey }} color={DS.colors.primaryDim} strokeWidth={0.5} />
                    <Path path={arrowPath1} color={DS.colors.primaryDim} style="fill" />
                    <Path path={arrowPath2} color={DS.colors.primaryDim} style="fill" />
                    {dimFont && <SkiaText x={mx - 16} y={my - 4} text={dim.displayText} color={DS.colors.primaryDim} font={dimFont} />}
                  </Group>
                );
              })}

              {/* ── Layer 7: Wall drawing preview ──────────────────────── */}
              {wallDrawing.preview && (() => {
                const { preview } = wallDrawing;
                const x1 = toPixelX(preview.start.x);
                const y1 = toPixelY(preview.start.y);
                const x2 = toPixelX(preview.end.x);
                const y2 = toPixelY(preview.end.y);
                const mx = (x1 + x2) / 2;
                const my = (y1 + y2) / 2;
                const previewColor = preview.isValid ? colors.primary : DS.colors.error;

                const previewPath = Skia.Path.Make();
                previewPath.moveTo(x1, y1);
                previewPath.lineTo(x2, y2);

                return (
                  <Group>
                    {/* Dashed preview line */}
                    <Path path={previewPath} color={previewColor} strokeWidth={2} style="stroke">
                      <DashPathEffect intervals={[8, 4]} />
                    </Path>
                    {/* Start point dot */}
                    <Circle cx={x1} cy={y1} r={5} color={previewColor} opacity={0.9} />
                    {/* Live dimension label */}
                    {dimFont && preview.length > 0 && (
                      <SkiaText
                        x={mx - 20}
                        y={my - 10}
                        text={preview.length < 1
                          ? `${Math.round(preview.length * 1000)}mm`
                          : `${preview.length.toFixed(3)}m`}
                        color={previewColor}
                        font={dimFont}
                      />
                    )}
                  </Group>
                );
              })()}

              {/* ── Layer 8: Furniture rectangles ──────────────────────── */}
              {(blueprint?.furniture ?? []).map((piece) => {
                const isSelected = selectedId === piece.id;
                const px = toPixelX(piece.position.x);
                const py = toPixelY(piece.position.z);
                const hw = (piece.dimensions.x / 2) * PIXELS_PER_METRE;
                const hd = (piece.dimensions.z / 2) * PIXELS_PER_METRE;

                const furPath = Skia.Path.Make();
                furPath.addRect({ x: px - hw, y: py - hd, width: hw * 2, height: hd * 2 });

                if (isSelected) {
                  // Clearance border (0.6m around selected piece)
                  const clearM = 0.6 * PIXELS_PER_METRE;
                  const clearPath = Skia.Path.Make();
                  clearPath.addRect({
                    x: px - hw - clearM,
                    y: py - hd - clearM,
                    width: (hw + clearM) * 2,
                    height: (hd + clearM) * 2,
                  });
                  return (
                    <Group key={piece.id}>
                      <Path path={furPath} color={colors.primary} opacity={0.85} style="fill" />
                      <Path path={furPath} color={colors.primary} strokeWidth={1.5} style="stroke" />
                      <Path path={clearPath} color={colors.primary} strokeWidth={0.8} opacity={0.35} style="stroke">
                        <DashPathEffect intervals={[4, 3]} />
                      </Path>
                    </Group>
                  );
                }

                return (
                  <Group key={piece.id}>
                    <Path path={furPath} color={colors.primaryDim} opacity={0.6} style="fill" />
                    <Path path={furPath} color={colors.primaryDim} strokeWidth={1} style="stroke" />
                  </Group>
                );
              })}

              {/* ── Layer 9: Ghost furniture ───────────────────────────── */}
              {placement.ghostPosition && (() => {
                const { x, y, def } = placement.ghostPosition;
                const gx = toPixelX(x);
                const gy = toPixelY(y);
                const hw = (def.dimensions.width / 2) * PIXELS_PER_METRE;
                const hd = (def.dimensions.depth / 2) * PIXELS_PER_METRE;

                const ghostPath = Skia.Path.Make();
                ghostPath.addRect({ x: gx - hw, y: gy - hd, width: hw * 2, height: hd * 2 });

                return (
                  <Group>
                    <Path path={ghostPath} color={colors.primary} opacity={0.25} style="fill" />
                    <Path path={ghostPath} color={colors.primary} strokeWidth={1.5} opacity={0.7} style="stroke">
                      <DashPathEffect intervals={[5, 3]} />
                    </Path>
                  </Group>
                );
              })()}

              {/* ── Measure tool overlay ────────────────────────────────── */}
              {activeTool === 'measure' && measurePoints.length === 2 && (() => {
                const [a, b] = measurePoints;
                const ax = toPixelX(a.x);
                const ay = toPixelY(a.y);
                const bx = toPixelX(b.x);
                const by = toPixelY(b.y);
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const label = dist < 1 ? `${Math.round(dist * 1000)}mm` : `${dist.toFixed(3)}m`;
                const measPath = Skia.Path.Make();
                measPath.moveTo(ax, ay);
                measPath.lineTo(bx, by);
                return (
                  <Group>
                    <Path path={measPath} color={DS.colors.warning} strokeWidth={1.5} style="stroke">
                      <DashPathEffect intervals={[6, 3]} />
                    </Path>
                    <Circle cx={ax} cy={ay} r={4} color={DS.colors.warning} />
                    <Circle cx={bx} cy={by} r={4} color={DS.colors.warning} />
                    {dimFont && <SkiaText x={(ax + bx) / 2 - 16} y={(ay + by) / 2 - 8} text={label} color={DS.colors.warning} font={dimFont} />}
                  </Group>
                );
              })()}

              {/* ── Scale bar ────────────────────────────────────── */}
              <ScaleBar
                scale={scaleRef.current}
                x={16}
                y={CANVAS_H - 28}
                color="#C9FFFD"
                bgColor="#061A1A"
              />

              {/* ── Room dimension labels (width × depth + area) ─ */}
              {showDimensions && (blueprint?.rooms ?? []).map((room) => {
                const roomWalls = room.wallIds
                  .map((id: string) => (blueprint?.walls ?? []).find((w: Wall) => w.id === id))
                  .filter((w: Wall | undefined): w is Wall => !!w);
                if (roomWalls.length < 3) return null;

                const allPts = roomWalls.flatMap((w: Wall) => [w.start, w.end]);
                const bb = boundingBox(allPts);
                const w = bb.width;
                const h = bb.height;
                const cx = toPixelX(room.centroid.x);
                const cy = toPixelY(room.centroid.y);

                const dimText = `${w.toFixed(1)}m × ${h.toFixed(1)}m`;
                const areaText = `${room.area.toFixed(1)} m²`;

                return (
                  <Group key={`dim_${room.id}`}>
                    {dimFont && (
                      <SkiaText
                        x={cx - dimText.length * 2.8}
                        y={cy + 14}
                        text={dimText}
                        font={dimFont}
                        color="#9A9590"
                      />
                    )}
                    {dimFont && (
                      <SkiaText
                        x={cx - areaText.length * 2.8}
                        y={cy + 26}
                        text={areaText}
                        font={dimFont}
                        color="#5A5550"
                      />
                    )}
                  </Group>
                );
              })}

              {/* ── Wall length labels ───────────────────────────── */}
              {showDimensions && (blueprint?.walls ?? []).map((wall: Wall) => {
                const len = calcWallLength(wall);
                if (len < 0.5) return null; // Skip tiny walls
                const midX = toPixelX((wall.start.x + wall.end.x) / 2);
                const midY = toPixelY((wall.start.y + wall.end.y) / 2);
                const label = `${len.toFixed(1)}m`;
                // Offset label perpendicular to wall
                const dx = wall.end.x - wall.start.x;
                const dy = wall.end.y - wall.start.y;
                const norm = Math.sqrt(dx * dx + dy * dy);
                const offsetPx = 10;
                const nx = norm > 0 ? (-dy / norm) * offsetPx : 0;
                const ny = norm > 0 ? (dx / norm) * offsetPx : offsetPx;

                return dimFont ? (
                  <SkiaText
                    key={`wlen_${wall.id}`}
                    x={midX + nx - label.length * 2.5}
                    y={midY + ny}
                    text={label}
                    font={dimFont}
                    color="#5A5550"
                  />
                ) : null;
              })}

            </Group>
          </Canvas>
        </View>
      </GestureDetector>

      <FurnitureContextMenu
        visible={contextMenu.visible}
        position={contextMenu.position}
        item={contextMenu.item}
        onCopy={handleCopy}
        onCut={handleCut}
        onDelete={handleDelete}
        onProperties={() => { if (contextMenu.item) setSelectedId(contextMenu.item.id); }}
        onClose={closeContextMenu}
      />
    </View>
    </ErrorBoundary>
  );
});
