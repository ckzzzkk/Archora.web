import { DS } from '../../theme/designSystem';
import React, { useCallback, useRef, useState, useEffect, useMemo, forwardRef, useImperativeHandle, useReducer } from 'react';
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
import type { StaircaseData } from '../../types/blueprint';
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
import { NorthArrow } from './symbols/NorthArrow';
import { ErrorBoundary } from '../common/ErrorBoundary';
import {
  PIXELS_PER_METRE,
  metreToPixel,
  pixelToMetre,
} from '../../utils/canvasHelpers';
import { ScaleBar } from '../../utils/geometry/ScaleBar';
import { ARCH_COLORS, LINE_WEIGHT, GRID, SYMBOLS, ARCH_FONTS, ROOM_THRESHOLDS } from '../../utils/architecture/drawingConventions';
import { boundingBox } from '../../utils/geometry/polygonUtils';
import { wallLength as calcWallLength } from '../../utils/geometry/wallGraph';
import { MaterialCompiler } from '../../materials/MaterialCompiler';
import { useSkiaFonts } from '../common/SkiaFontLoader';
import type { Wall, Room, Opening, FurniturePiece, Vector2D, DimensionAccuracy } from '../../types';
import type { FurnitureDef } from '../../hooks/useFurniturePlacement';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CANVAS_H = SCREEN_H * 0.72;

// UK minimum room area thresholds (m²)
const MIN_BEDROOM_AREA = ROOM_THRESHOLDS.minBedroom;
const MIN_BATHROOM_AREA = ROOM_THRESHOLDS.minBathroom;
const SMALL_ROOM_AREA = ROOM_THRESHOLDS.small;

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

  // ── Memoized grid paths (replaces ~150 individual Line components) ──
  // Minor grid (0.5m): ~80 vertical + ~60 horizontal lines
  // Major grid (2m): ~20 vertical + ~15 horizontal lines
  const { minorGridPath, majorGridPath, minorLineWeight, majorLineWeight } = useMemo(() => {
    const minorPath = Skia.Path.Make();
    const majorPath = Skia.Path.Make();
    const pxMinor = PIXELS_PER_METRE * GRID.minorInterval; // 20px
    const pxMajor = PIXELS_PER_METRE * GRID.majorInterval; // 80px
    const minorWt = LINE_WEIGHT.gridMinor;
    const majorWt = LINE_WEIGHT.gridMajor;

    // Minor: 80 vertical + 60 horizontal
    for (let i = 0; i <= 80; i++) {
      const x = i * pxMinor;
      minorPath.moveTo(x, 0);
      minorPath.lineTo(x, CANVAS_H);
    }
    for (let i = 0; i <= 60; i++) {
      const y = i * pxMinor;
      minorPath.moveTo(0, y);
      minorPath.lineTo(SCREEN_W, y);
    }

    // Major: 20 vertical + 15 horizontal
    for (let i = 0; i <= 20; i++) {
      const x = i * pxMajor;
      majorPath.moveTo(x, 0);
      majorPath.lineTo(x, CANVAS_H);
    }
    for (let i = 0; i <= 15; i++) {
      const y = i * pxMajor;
      majorPath.moveTo(0, y);
      majorPath.lineTo(SCREEN_W, y);
    }

    return {
      minorGridPath: minorPath,
      majorGridPath: majorPath,
      minorLineWeight: minorWt,
      majorLineWeight: majorWt,
    };
  }, [SCREEN_W, CANVAS_H]);
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

  // Classify wall as outer (perimeter) or inner (partition)
  // Perimeter walls have < 2 connections at one or both endpoints
  const classifyWall = (wall: Wall): 'outer' | 'inner' => {
    const allWalls = blueprint?.walls ?? [];
    const connectAt = (pt: Vector2D) =>
      allWalls.filter((w) => w.id !== wall.id && (
        Math.hypot(w.start.x - pt.x, w.start.y - pt.y) < 0.15 ||
        Math.hypot(w.end.x - pt.x, w.end.y - pt.y) < 0.15
      )).length;
    const startConns = connectAt(wall.start);
    const endConns = connectAt(wall.end);
    return startConns < 2 || endConns < 2 ? 'outer' : 'inner';
  };

  return (
    <ErrorBoundary>
    <View style={{ width: SCREEN_W, height: CANVAS_H }}>
      <GestureDetector gesture={combined}>
        <View style={{ width: SCREEN_W, height: CANVAS_H }}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Canvas {...({ ref: skiaCanvasRef } as any)} style={{ width: SCREEN_W, height: CANVAS_H }}>
            <Group>

              {/* ── Layer 1: Minor grid (0.5m) ──────────────────────────── */}
              <Path path={minorGridPath} color={ARCH_COLORS.gridMinor} style="stroke" strokeWidth={minorLineWeight} />

              {/* ── Layer 1b: Major grid (2m) ────────────────────────── */}
              <Path path={majorGridPath} color={ARCH_COLORS.gridMajor} style="stroke" strokeWidth={majorLineWeight} />

              {/* ── Layer 2: Structural grid (3m) ────────────────────── */}
              {showStructuralGrid && (() => {
                const STRUCT_INTERVAL = 3;
                const gridCount = 20;
                const lines = [];
                for (let i = 0; i <= gridCount; i++) {
                  const xPx = metreToPixel(i * STRUCT_INTERVAL, 1, ox);
                  const yPx = metreToPixel(i * STRUCT_INTERVAL, 1, oy);
                  lines.push(
                    <Line key={`sg_v${i}`} p1={{ x: xPx, y: 0 }} p2={{ x: xPx, y: CANVAS_H }} color={ARCH_COLORS.gridMajor} strokeWidth={LINE_WEIGHT.gridMajor} />,
                    <Line key={`sg_h${i}`} p1={{ x: 0, y: yPx }} p2={{ x: SCREEN_W, y: yPx }} color={ARCH_COLORS.gridMajor} strokeWidth={LINE_WEIGHT.gridMajor} />,
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
                    opacity={0.12}
                    style="fill"
                  />
                );
              })}

              {/* ── Layer 4: Room labels — lower-right of bounding box ── */}
              {roomFont && (blueprint?.rooms ?? []).map((room) => {
                const wallMap = new Map((blueprint?.walls ?? []).map((w: Wall) => [w.id, w]));
                const roomWalls = room.wallIds
                  .map((id: string) => wallMap.get(id))
                  .filter((w: Wall | undefined): w is Wall => !!w);
                if (roomWalls.length < 3) return null;

                const allPts = roomWalls.flatMap((w: Wall) => [w.start, w.end]);
                const bb = boundingBox(allPts);
                const labelX = toPixelX(bb.maxX + SYMBOLS.roomLabelOffsetX);
                const labelY = toPixelY(bb.maxY + SYMBOLS.roomLabelOffsetY);
                const warning = roomWarning(room);

                // Room name + area on one line: "Living Room (18.2m²)"
                const areaText = `${room.area.toFixed(1)}m²`;
                const label = `${room.name}${warning ? ` ${warning}` : ''} (${areaText})`;
                const labelColor = warning ? DS.colors.error : ARCH_COLORS.ink;

                return (
                  <Group key={`rl_${room.id}`}>
                    <SkiaText
                      x={labelX - label.length * 3}
                      y={labelY}
                      text={label}
                      color={labelColor}
                      font={roomFont}
                    />
                  </Group>
                );
              })}

              {/* ── Layer 5: Walls ─────────────────────────────────────── */}
              {(blueprint?.walls ?? []).map((wall) => {
                const isSelected = selectedId === wall.id;
                const x1 = toPixelX(wall.start.x);
                const y1 = toPixelY(wall.start.y);
                const x2 = toPixelX(wall.end.x);
                const y2 = toPixelY(wall.end.y);
                const weight = isSelected
                  ? LINE_WEIGHT.selectedWall
                  : classifyWall(wall) === 'outer'
                    ? LINE_WEIGHT.outerWall
                    : LINE_WEIGHT.innerWall;
                return (
                  <Line
                    key={wall.id}
                    p1={{ x: x1, y: y1 }}
                    p2={{ x: x2, y: y2 }}
                    color={isSelected ? DS.colors.accent : ARCH_COLORS.ink}
                    strokeWidth={weight}
                  />
                );
              })}

              {/* ── Layer 5b: Openings — architectural symbols ───────────── */}
              {(blueprint?.openings ?? []).map((opening) => {
                const wall = (blueprint?.walls ?? []).find((w) => w.id === opening.wallId);
                if (!wall) return null;
                const dx = wall.end.x - wall.start.x;
                const dy = wall.end.y - wall.start.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len === 0) return null;
                const ux = dx / len;
                const uy = dy / len;
                const isDoor = opening.type === 'door';

                // Start and end of opening in world coords
                const ox0 = wall.start.x + ux * opening.position;
                const oy0 = wall.start.y + uy * opening.position;
                const ox1 = wall.start.x + ux * (opening.position + opening.width);
                const oy1 = wall.start.y + uy * (opening.position + opening.width);

                if (isDoor) {
                  // ── Door: 90° arc + swing leaf line ─────────────────
                  // Hinge at opening start; arc sweeps to wall-perpendicular direction
                  const doorW = opening.width;
                  const hx = toPixelX(ox0);
                  const hy = toPixelY(oy0);
                  // Arc endpoint: hinge + perpendicular * doorWidth (in pixels)
                  const arcX = hx + (-uy) * doorW * PIXELS_PER_METRE;
                  const arcY = hy + ux * doorW * PIXELS_PER_METRE;

                  // Build 90° arc as line segments approximating a quarter-circle
                  const arcSegments = 8;
                  const arcPath = Skia.Path.Make();
                  arcPath.moveTo(hx, hy);
                  for (let i = 1; i <= arcSegments; i++) {
                    const t = i / arcSegments;
                    const px = hx + (-uy) * doorW * PIXELS_PER_METRE * Math.sin(t * Math.PI / 2);
                    const py = hy + ux * doorW * PIXELS_PER_METRE * Math.sin(t * Math.PI / 2);
                    arcPath.lineTo(px, py);
                  }

                  return (
                    <Group key={opening.id}>
                      {/* Door leaf line: hinge → arc endpoint */}
                      <Line
                        p1={{ x: hx, y: hy }}
                        p2={{ x: arcX, y: arcY }}
                        color={ARCH_COLORS.doorAccent}
                        strokeWidth={LINE_WEIGHT.doorSwing}
                      />
                      {/* 90° arc */}
                      <Path path={arcPath} color={ARCH_COLORS.doorAccent} strokeWidth={LINE_WEIGHT.doorArc} style="stroke" />
                    </Group>
                  );
                } else {
                  // ── Window: 3 parallel lines ──────────────────────────
                  const lineOffset = SYMBOLS.windowLineOffset * PIXELS_PER_METRE;
                  const lineGap = SYMBOLS.windowLineGap * PIXELS_PER_METRE;
                  // Perpendicular to wall
                  const px = -uy;
                  const py = ux;
                  const cx = toPixelX((ox0 + ox1) / 2);
                  const cy = toPixelY((oy0 + oy1) / 2);

                  return (
                    <Group key={opening.id}>
                      {[(-lineOffset - lineGap), (-lineOffset), (lineOffset), (lineOffset + lineGap)].map((offset, idx) => (
                        <Line
                          key={idx}
                          p1={{ x: cx + px * offset - ux * toPixelX(opening.width / 2), y: cy + py * offset - uy * toPixelX(opening.width / 2) }}
                          p2={{ x: cx + px * offset + ux * toPixelX(opening.width / 2), y: cy + py * offset + uy * toPixelX(opening.width / 2) }}
                          color={ARCH_COLORS.windowAccent}
                          strokeWidth={LINE_WEIGHT.windowLine}
                        />
                      ))}
                    </Group>
                  );
                }
              })}

              {/* ── Layer 5c: Staircase symbols ─────────────────────────── */}
              {(() => {
                const stairs: StaircaseData[] = (blueprint as any)?.staircases ?? [];
                return stairs.map((stair) => {
                  const px = toPixelX(stair.position.x);
                  const py = toPixelY(stair.position.y);
                  const w = (stair.width ?? 0.9) * PIXELS_PER_METRE;
                  const d = ((stair.totalRise ?? 3.0) / (stair.stepCount ?? 12) * 0.3) * PIXELS_PER_METRE;
                  const isSpiral = stair.type === 'spiral';
                  // Build stair outline rectangle using a Skia Path
                  const outlinePath = Skia.Path.Make();
                  outlinePath.addRect({ x: px - w / 2, y: py - d / 2, width: w, height: d });
                  // Diagonal tick marks inside — show direction of travel
                  const numTicks = Math.max(2, Math.floor((stair.stepCount ?? 12) / 3));
                  const tickPath = Skia.Path.Make();
                  for (let i = 0; i < numTicks; i++) {
                    const frac = (i + 0.5) / numTicks;
                    const tx = px - w / 2 + frac * w;
                    const ty1 = py + d / 2;
                    const ty2 = ty1 - d * 0.2;
                    tickPath.moveTo(tx - w * 0.06, ty1);
                    tickPath.lineTo(tx + w * 0.06, ty2);
                  }
                  // Spiral centre circle — line-segment approximation (no addArc/addCircle in Skia)
                  const circlePath = Skia.Path.Make();
                  if (isSpiral) {
                    const r = w * 0.25;
                    const segs = 12;
                    for (let i = 0; i <= segs; i++) {
                      const angle = (i / segs) * Math.PI * 2;
                      const cx2 = px + r * Math.cos(angle);
                      const cy2 = py + r * Math.sin(angle);
                      if (i === 0) circlePath.moveTo(cx2, cy2);
                      else circlePath.lineTo(cx2, cy2);
                    }
                    circlePath.close();
                  }
                  return (
                    <Group key={`stair_${stair.id}`}>
                      <Path path={outlinePath} color={ARCH_COLORS.ink} strokeWidth={LINE_WEIGHT.innerWall} style="stroke" />
                      <Path path={tickPath} color={ARCH_COLORS.ink} strokeWidth={1.2} style="stroke" />
                      {isSpiral && <Path path={circlePath} color={ARCH_COLORS.ink} strokeWidth={LINE_WEIGHT.innerWall} style="stroke" />}
                    </Group>
                  );
                });
              })()}

              {/* ── Layer 6: Dimension lines — architectural tick style ── */}
              {showDimensions && dimensionLines.map((dim) => {
                const sx = toPixelX(dim.offsetStart.x);
                const sy = toPixelY(dim.offsetStart.y);
                const ex = toPixelX(dim.offsetEnd.x);
                const ey = toPixelY(dim.offsetEnd.y);
                const mx = (sx + ex) / 2;
                const my = (sy + ey) / 2;

                const dx = ex - sx;
                const dy = ey - sy;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len < 4) return null;
                const ux = dx / len;
                const uy = dy / len;
                // Perpendicular for tick marks
                const px = -uy;
                const py = ux;
                const TICK = LINE_WEIGHT.tickMark * PIXELS_PER_METRE; // tick length in px

                // Tick mark lines at each end (perpendicular short lines)
                const tickPath = Skia.Path.Make();
                tickPath.moveTo(sx + px * TICK, sy + py * TICK);
                tickPath.lineTo(sx - px * TICK, sy - py * TICK);
                tickPath.moveTo(ex + px * TICK, ey + py * TICK);
                tickPath.lineTo(ex - px * TICK, ey - py * TICK);

                return (
                  <Group key={dim.id}>
                    {/* Dimension line */}
                    <Line p1={{ x: sx, y: sy }} p2={{ x: ex, y: ey }} color={ARCH_COLORS.dimensionLine} strokeWidth={LINE_WEIGHT.extensionLine} />
                    {/* Tick marks at endpoints */}
                    <Path path={tickPath} color={ARCH_COLORS.dimensionLine} strokeWidth={LINE_WEIGHT.tickMark} style="stroke" />
                    {/* Dimension text below the line */}
                    {dimFont && (
                      <SkiaText
                        x={mx - dim.displayText.length * 2.5}
                        y={my + 14}
                        text={dim.displayText}
                        color={ARCH_COLORS.dimensionText}
                        font={dimFont}
                      />
                    )}
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
                const previewColor = preview.isValid ? ARCH_COLORS.ink : DS.colors.error;

                const previewPath = Skia.Path.Make();
                previewPath.moveTo(x1, y1);
                previewPath.lineTo(x2, y2);

                return (
                  <Group>
                    {/* Dashed preview line */}
                    <Path path={previewPath} color={previewColor} strokeWidth={LINE_WEIGHT.wallDash} style="stroke">
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

              {/* ── Layer 8: Furniture — outline style ─────────────────── */}
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
                      <Path path={furPath} color={ARCH_COLORS.ink} strokeWidth={LINE_WEIGHT.furnitureSelected} style="stroke" />
                      <Path path={clearPath} color={ARCH_COLORS.ink} strokeWidth={LINE_WEIGHT.furnitureEdge} opacity={0.35} style="stroke">
                        <DashPathEffect intervals={[4, 3]} />
                      </Path>
                    </Group>
                  );
                }

                return (
                  <Group key={piece.id}>
                    <Path path={furPath} color={ARCH_COLORS.inkDim} strokeWidth={LINE_WEIGHT.furnitureEdge} style="stroke" />
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
                    <Path path={ghostPath} color={ARCH_COLORS.ink} opacity={0.25} style="fill" />
                    <Path path={ghostPath} color={ARCH_COLORS.ink} strokeWidth={1.5} opacity={0.7} style="stroke">
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
                    <Path path={measPath} color={ARCH_COLORS.doorAccent} strokeWidth={1.5} style="stroke">
                      <DashPathEffect intervals={[6, 3]} />
                    </Path>
                    <Circle cx={ax} cy={ay} r={4} color={ARCH_COLORS.doorAccent} />
                    <Circle cx={bx} cy={by} r={4} color={ARCH_COLORS.doorAccent} />
                    {dimFont && <SkiaText x={(ax + bx) / 2 - 16} y={(ay + by) / 2 - 8} text={label} color={ARCH_COLORS.doorAccent} font={dimFont} />}
                  </Group>
                );
              })()}

              {/* ── Scale bar ────────────────────────────────────── */}
              <ScaleBar
                scale={scaleRef.current}
                x={16}
                y={CANVAS_H - 28}
                color={ARCH_COLORS.scaleBarInk}
                bgColor={ARCH_COLORS.scaleBarBg}
              />

              {/* ── Dimension accuracy badge ─────────────────────── */}
              {(() => {
                const acc: DimensionAccuracy | undefined = blueprint?.metadata?.dimensionAccuracy;
                if (!acc) return null;
                const confidenceColor = acc.confidence === 'high'
                  ? '#7AB87A' : acc.confidence === 'moderate' ? '#D4A84B' : '#C0604A';
                const badgeW = 88;
                const badgeH = 24;
                const badgeX = 16;
                const badgeY = CANVAS_H - 70;
                const labelText = `±${acc.marginCm}cm`;
                // Label width approximation (9px per char at 11px font)
                const labelW = labelText.length * 7;
                const bg2 = Skia.Path.Make();
                bg2.addRect({ x: badgeX, y: badgeY, width: Math.max(badgeW, labelW + 16), height: badgeH });
                return (
                  <Group>
                    <Path path={bg2} color="rgba(30,30,30,0.85)" />
                    <SkiaText
                      x={badgeX + 8}
                      y={badgeY + 17}
                      text={labelText}
                      color={confidenceColor}
                      font={dimFont ?? null}
                    />
                  </Group>
                );
              })()}

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
                        color={ARCH_COLORS.inkDim}
                      />
                    )}
                    {dimFont && (
                      <SkiaText
                        x={cx - areaText.length * 2.8}
                        y={cy + 26}
                        text={areaText}
                        font={dimFont}
                        color={ARCH_COLORS.inkGhost}
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
                    color={ARCH_COLORS.inkGhost}
                  />
                ) : null;
              })}

              {/* ── North arrow (compass rose) ──────────────────────────── */}
              <NorthArrow
                x={SCREEN_W - 30}
                y={CANVAS_H - 30}
                size={SYMBOLS.northArrowSize}
                font={dimFont}
              />

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
