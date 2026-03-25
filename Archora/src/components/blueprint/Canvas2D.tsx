import React, { useCallback, useRef, useState } from 'react';
import { View, Dimensions } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  Line,
  Circle,
  Group,
  Text as SkiaText,
  useFont,
  DashPathEffect,
} from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { useWallDrawing } from '../../hooks/useWallDrawing';
import { useFurniturePlacement } from '../../hooks/useFurniturePlacement';
import { useRoomDetection } from '../../hooks/useRoomDetection';
import { useDimensions } from '../../hooks/useDimensions';
import { clipboard } from '../../utils/clipboard';
import { FurnitureContextMenu } from './FurnitureContextMenu';
import { BASE_COLORS } from '../../theme/colors';
import {
  PIXELS_PER_METRE,
  metreToPixel,
  pixelToMetre,
} from '../../utils/canvasHelpers';
import type { Wall, Room, Opening, FurniturePiece } from '../../types';
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

interface Props {
  onSelectObject?: (id: string | null) => void;
  showStructuralGrid?: boolean;
  activeTool: string;
  pendingFurniturePlacement?: FurnitureDef | null;
  onFurniturePlaced?: () => void;
}

export function Canvas2D({
  onSelectObject,
  showStructuralGrid = false,
  activeTool,
  pendingFurniturePlacement,
  onFurniturePlaced,
}: Props) {
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const selectedId = useBlueprintStore((s) => s.selectedId);
  const setSelectedId = useBlueprintStore((s) => s.actions.setSelectedId);
  const deleteFurniture = useBlueprintStore((s) => s.actions.deleteFurniture);
  const { colors } = useTheme();
  const { light } = useHaptics();

  // ── Fonts ────────────────────────────────────────────────────────────────
  // Using null for now (fonts loaded via useFonts at app level)
  const dimFont = useFont(null, 10);
  const roomFont = useFont(null, 12);

  // ── Module hooks ─────────────────────────────────────────────────────────
  const wallDrawing = useWallDrawing();
  const placement = useFurniturePlacement(onFurniturePlaced);
  useRoomDetection();
  const dimensionLines = useDimensions();

  // Sync pending placement with the placement hook
  const prevPendingRef = useRef<FurnitureDef | null | undefined>(undefined);
  if (pendingFurniturePlacement !== prevPendingRef.current) {
    prevPendingRef.current = pendingFurniturePlacement;
    placement.setPendingPlacement(pendingFurniturePlacement ?? null);
  }

  // ── Local UI state ────────────────────────────────────────────────────────
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    position: { x: 0, y: 0 },
    item: null,
  });
  const [showDimensions, setShowDimensions] = useState(true);
  // Measure tool: stores tapped points
  const [measurePoints, setMeasurePoints] = useState<{ x: number; y: number }[]>([]);

  // ── Pan/zoom shared values ────────────────────────────────────────────────
  const scale = useSharedValue(1);
  const offsetX = useSharedValue(SCREEN_W / 2);
  const offsetY = useSharedValue(CANVAS_H / 2);
  const savedScale = useSharedValue(1);
  const savedOffsetX = useSharedValue(SCREEN_W / 2);
  const savedOffsetY = useSharedValue(CANVAS_H / 2);

  const scaleRef = useRef(1);
  const offsetXRef = useRef(SCREEN_W / 2);
  const offsetYRef = useRef(CANVAS_H / 2);
  scale.addListener(0, (v) => { scaleRef.current = v; });
  offsetX.addListener(1, (v) => { offsetXRef.current = v; });
  offsetY.addListener(2, (v) => { offsetYRef.current = v; });

  // ── Context menu helpers ──────────────────────────────────────────────────
  const showContextMenu = useCallback(
    (item: FurniturePiece, screenX: number, screenY: number) => {
      setContextMenu({ visible: true, position: { x: screenX, y: screenY }, item });
    },
    [],
  );
  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  // ── Measure tool tap handler ──────────────────────────────────────────────
  const handleMeasureTap = useCallback((mx: number, my: number) => {
    setMeasurePoints((pts) => {
      if (pts.length >= 2) return [{ x: mx, y: my }]; // reset on 3rd tap
      return [...pts, { x: mx, y: my }];
    });
    light();
  }, [light]);

  // ── Gestures ─────────────────────────────────────────────────────────────
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
        backgroundColor: BASE_COLORS.surface,
        alignItems: 'center', justifyContent: 'center',
      }} />
    );
  }

  // ── Handlers for context menu ─────────────────────────────────────────────
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

  // ── Render helpers ────────────────────────────────────────────────────────
  const ox = offsetX.value;
  const oy = offsetY.value;
  const sc = 1; // canvas group uses scale=1; pan/zoom via offset only (Skia group transform for perf)

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
    <View style={{ width: SCREEN_W, height: CANVAS_H }}>
      <GestureDetector gesture={combined}>
        <View style={{ width: SCREEN_W, height: CANVAS_H }}>
          <Canvas style={{ width: SCREEN_W, height: CANVAS_H }}>
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
              {blueprint.rooms.map((room) => {
                const cx = toPixelX(room.centroid.x);
                const cy = toPixelY(room.centroid.y);
                // Approximate room bounding box from area
                const halfSide = Math.sqrt(room.area) * PIXELS_PER_METRE * 0.5;
                const roomPath = Skia.Path.Make();
                roomPath.addRect({
                  x: cx - halfSide,
                  y: cy - halfSide,
                  width: halfSide * 2,
                  height: halfSide * 2,
                });
                const isSmall = room.area < SMALL_ROOM_AREA;
                return (
                  <Path
                    key={`rf_${room.id}`}
                    path={roomPath}
                    color={isSmall ? BASE_COLORS.error : colors.primary}
                    opacity={0.08}
                    style="fill"
                  />
                );
              })}

              {/* ── Layer 4: Room labels ───────────────────────────────── */}
              {blueprint.rooms.map((room) => {
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
                    color={warning ? BASE_COLORS.error : colors.primaryDim}
                    font={roomFont}
                  />
                );
              })}

              {/* ── Layer 5: Walls ─────────────────────────────────────── */}
              {blueprint.walls.map((wall) => {
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
                    color={isSelected ? colors.primary : BASE_COLORS.textPrimary}
                    strokeWidth={isSelected ? 4 : 3}
                    opacity={isSelected ? 1 : 0.9}
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
                    <Line p1={{ x: sx, y: sy }} p2={{ x: ex, y: ey }} color={BASE_COLORS.textSecondary} strokeWidth={0.5} />
                    <Path path={arrowPath1} color={BASE_COLORS.textSecondary} style="fill" />
                    <Path path={arrowPath2} color={BASE_COLORS.textSecondary} style="fill" />
                    <SkiaText x={mx - 16} y={my - 4} text={dim.displayText} color={BASE_COLORS.textSecondary} font={dimFont} />
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
                const previewColor = preview.isValid ? colors.primary : BASE_COLORS.error;

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
                    {preview.length > 0 && (
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
              {blueprint.furniture.map((piece) => {
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
                    <Path path={measPath} color={BASE_COLORS.warning} strokeWidth={1.5} style="stroke">
                      <DashPathEffect intervals={[6, 3]} />
                    </Path>
                    <Circle cx={ax} cy={ay} r={4} color={BASE_COLORS.warning} />
                    <Circle cx={bx} cy={by} r={4} color={BASE_COLORS.warning} />
                    <SkiaText x={(ax + bx) / 2 - 16} y={(ay + by) / 2 - 8} text={label} color={BASE_COLORS.warning} font={dimFont} />
                  </Group>
                );
              })()}

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
  );
}
