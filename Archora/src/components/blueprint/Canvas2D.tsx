import React, { useCallback, useRef, useState } from 'react';
import { View, Dimensions } from 'react-native';
import {
  Canvas,
  Path,
  Line,
  Circle,
  Skia,
  Group,
  Text as SkiaText,
  useFont,
  Paint,
  DashPathEffect,
} from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { clipboard } from '../../utils/clipboard';
import { FurnitureContextMenu } from './FurnitureContextMenu';
import { BASE_COLORS } from '../../theme/colors';
import type { Wall, Room, Opening, FurniturePiece } from '../../types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CANVAS_H = SCREEN_H * 0.72;
const PIXELS_PER_METRE = 40; // 40px = 1 metre
const SNAP_INTERVAL = 0.1; // snap to 0.1m

function snap(value: number): number {
  return Math.round(value / SNAP_INTERVAL) * SNAP_INTERVAL;
}

function metreToPixel(m: number, scale: number, offset: number): number {
  return m * PIXELS_PER_METRE * scale + offset;
}

function pixelToMetre(px: number, scale: number, offset: number): number {
  return (px - offset) / (PIXELS_PER_METRE * scale);
}

interface ContextMenuState {
  visible: boolean;
  position: { x: number; y: number };
  item: FurniturePiece | null;
}

interface Props {
  onSelectObject?: (id: string | null) => void;
  showStructuralGrid?: boolean;
}

export function Canvas2D({ onSelectObject, showStructuralGrid = false }: Props) {
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const selectedId = useBlueprintStore((s) => s.selectedId);
  const setSelectedId = useBlueprintStore((s) => s.actions.setSelectedId);
  const deleteFurniture = useBlueprintStore((s) => s.actions.deleteFurniture);
  const { colors } = useTheme();
  const { light } = useHaptics();

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    position: { x: 0, y: 0 },
    item: null,
  });

  const scale = useSharedValue(1);
  const offsetX = useSharedValue(SCREEN_W / 2);
  const offsetY = useSharedValue(CANVAS_H / 2);
  const savedScale = useSharedValue(1);
  const savedOffsetX = useSharedValue(SCREEN_W / 2);
  const savedOffsetY = useSharedValue(CANVAS_H / 2);

  // Keep scale/offset readable from gesture callbacks
  const scaleRef = useRef(1);
  const offsetXRef = useRef(SCREEN_W / 2);
  const offsetYRef = useRef(CANVAS_H / 2);
  scale.addListener(0, (v) => { scaleRef.current = v; });
  offsetX.addListener(1, (v) => { offsetXRef.current = v; });
  offsetY.addListener(2, (v) => { offsetYRef.current = v; });

  const showContextMenu = useCallback(
    (item: FurniturePiece, screenX: number, screenY: number) => {
      setContextMenu({ visible: true, position: { x: screenX, y: screenY }, item });
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  // Pinch to zoom
  const pinchGesture = Gesture.Pinch()
    .onStart(() => { savedScale.value = scale.value; })
    .onUpdate((e) => { scale.value = Math.min(Math.max(savedScale.value * e.scale, 0.3), 4); });

  // Pan
  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedOffsetX.value = offsetX.value;
      savedOffsetY.value = offsetY.value;
    })
    .onUpdate((e) => {
      offsetX.value = savedOffsetX.value + e.translationX;
      offsetY.value = savedOffsetY.value + e.translationY;
    });

  // Tap to select
  const tapGesture = Gesture.Tap()
    .onEnd((e) => {
      const mx = pixelToMetre(e.x, scale.value, offsetX.value);
      const my = pixelToMetre(e.y, scale.value, offsetY.value);

      if (!blueprint) {
        runOnJS(setSelectedId)(null);
        return;
      }

      // Hit test walls
      for (const wall of blueprint.walls) {
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) continue;
        const t = ((mx - wall.start.x) * dx + (my - wall.start.y) * dy) / (len * len);
        const clampedT = Math.max(0, Math.min(1, t));
        const closestX = wall.start.x + clampedT * dx;
        const closestY = wall.start.y + clampedT * dy;
        const dist = Math.sqrt((mx - closestX) ** 2 + (my - closestY) ** 2);
        if (dist < 0.3) {
          runOnJS(light)();
          runOnJS(setSelectedId)(wall.id);
          return;
        }
      }

      runOnJS(setSelectedId)(null);
    });

  // Long press to show furniture context menu
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart((e) => {
      if (!blueprint) return;
      const mx = pixelToMetre(e.x, scaleRef.current, offsetXRef.current);
      // In 2D top-down view, furniture.position.z maps to the Y axis
      const mz = pixelToMetre(e.y, scaleRef.current, offsetYRef.current);

      for (const piece of blueprint.furniture) {
        const halfW = piece.dimensions.x / 2;
        const halfD = piece.dimensions.z / 2;
        const px = piece.position.x;
        const pz = piece.position.z;
        if (mx >= px - halfW && mx <= px + halfW && mz >= pz - halfD && mz <= pz + halfD) {
          runOnJS(light)();
          runOnJS(setSelectedId)(piece.id);
          runOnJS(showContextMenu)(piece, e.x, e.y);
          return;
        }
      }
    });

  const combined = Gesture.Simultaneous(
    Gesture.Race(tapGesture, longPressGesture, panGesture),
    pinchGesture,
  );

  if (!blueprint) {
    return (
      <View style={{ width: SCREEN_W, height: CANVAS_H, backgroundColor: BASE_COLORS.surface, alignItems: 'center', justifyContent: 'center' }} />
    );
  }

  const handleCopy = () => {
    if (!contextMenu.item || !blueprint) return;
    clipboard.push({
      type: 'furniture',
      data: contextMenu.item,
      sourceBlueprintId: blueprint.id,
      sourceWallNeighbors: blueprint.walls.slice(0, 2).map((w) => w.id),
    });
  };

  const handleCut = () => {
    handleCopy();
    if (contextMenu.item) deleteFurniture(contextMenu.item.id);
  };

  const handleDelete = () => {
    if (contextMenu.item) deleteFurniture(contextMenu.item.id);
  };

  return (
    <View style={{ width: SCREEN_W, height: CANVAS_H }}>
      <GestureDetector gesture={combined}>
        <View style={{ width: SCREEN_W, height: CANVAS_H }}>
          <Canvas style={{ width: SCREEN_W, height: CANVAS_H }}>
            <Group>
              {/* Blueprint grid */}
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

              {/* Structural grid — dashed lines at 3m/6m/9m intervals (Architect) */}
              {showStructuralGrid && (() => {
                const STRUCT_INTERVAL = 3; // metres
                const gridCount = 20;
                const lines = [];
                for (let i = 0; i <= gridCount; i++) {
                  const xPx = metreToPixel(i * STRUCT_INTERVAL, 1, offsetX.value);
                  const yPx = metreToPixel(i * STRUCT_INTERVAL, 1, offsetY.value);
                  lines.push(
                    <Line
                      key={`sg_v${i}`}
                      p1={{ x: xPx, y: 0 }}
                      p2={{ x: xPx, y: CANVAS_H }}
                      color={colors.primary}
                      strokeWidth={1}
                      opacity={0.18}
                    />,
                    <Line
                      key={`sg_h${i}`}
                      p1={{ x: 0, y: yPx }}
                      p2={{ x: SCREEN_W, y: yPx }}
                      color={colors.primary}
                      strokeWidth={1}
                      opacity={0.18}
                    />,
                  );
                }
                return lines;
              })()}

              {/* Walls */}
              {blueprint.walls.map((wall) => {
                const isSelected = selectedId === wall.id;
                const x1 = metreToPixel(wall.start.x, 1, offsetX.value);
                const y1 = metreToPixel(wall.start.y, 1, offsetY.value);
                const x2 = metreToPixel(wall.end.x, 1, offsetX.value);
                const y2 = metreToPixel(wall.end.y, 1, offsetY.value);
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

              {/* Furniture markers (small circles) */}
              {blueprint.furniture.map((piece) => {
                const isSelected = selectedId === piece.id;
                const px = metreToPixel(piece.position.x, 1, offsetX.value);
                const py = metreToPixel(piece.position.z, 1, offsetY.value);
                return (
                  <Circle
                    key={piece.id}
                    cx={px}
                    cy={py}
                    r={isSelected ? 8 : 5}
                    color={isSelected ? colors.primary : colors.primaryDim}
                    opacity={0.7}
                  />
                );
              })}

              {/* Room labels */}
              {blueprint.rooms.map((room) => {
                const cx = metreToPixel(room.centroid.x, 1, offsetX.value);
                const cy = metreToPixel(room.centroid.y, 1, offsetY.value);
                return (
                  <SkiaText
                    key={room.id}
                    x={cx - 30}
                    y={cy}
                    text={room.name}
                    color={colors.primaryDim}
                    font={null}
                  />
                );
              })}
            </Group>
          </Canvas>
        </View>
      </GestureDetector>

      {/* Furniture context menu overlay */}
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
