import React, { useCallback, useRef } from 'react';
import { View, Dimensions } from 'react-native';
import {
  Canvas,
  Path,
  Line,
  Circle,
  Skia,
  useSharedValueEffect,
  useValue,
  Group,
  Text as SkiaText,
  useFont,
  Paint,
  DashPathEffect,
} from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedReaction,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { BASE_COLORS } from '../../theme/colors';
import type { Wall, Room, Opening } from '../../types';

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

interface Props {
  onSelectObject?: (id: string | null) => void;
}

export function Canvas2D({ onSelectObject }: Props) {
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const selectedId = useBlueprintStore((s) => s.selectedId);
  const setSelectedId = useBlueprintStore((s) => s.actions.setSelectedId);
  const { colors } = useTheme();
  const { light } = useHaptics();

  const scale = useSharedValue(1);
  const offsetX = useSharedValue(SCREEN_W / 2);
  const offsetY = useSharedValue(CANVAS_H / 2);
  const savedScale = useSharedValue(1);
  const savedOffsetX = useSharedValue(SCREEN_W / 2);
  const savedOffsetY = useSharedValue(CANVAS_H / 2);

  // Pinch to zoom
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 0.3), 4);
    });

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

  const combined = Gesture.Simultaneous(
    Gesture.Race(tapGesture, panGesture),
    pinchGesture,
  );

  if (!blueprint) {
    return (
      <View style={{ width: SCREEN_W, height: CANVAS_H, backgroundColor: BASE_COLORS.surface, alignItems: 'center', justifyContent: 'center' }}>
        <SkiaText
          x={SCREEN_W / 2 - 80}
          y={CANVAS_H / 2}
          text="No blueprint loaded"
          color={BASE_COLORS.textDim}
          font={null}
        />
      </View>
    );
  }

  return (
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
  );
}
