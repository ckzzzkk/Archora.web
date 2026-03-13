import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, FlatList, Dimensions, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import {
  Canvas,
  Path as SkiaPath,
  Line as SkiaLine,
  Circle as SkiaCircle,
  useSharedValueEffect,
  useValue,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { BASE_COLORS } from '../../theme/colors';
import { useScreenSlideIn } from '../../hooks/useScreenSlideIn';
import type { RootStackParamList } from '../../navigation/types';
import type { BlueprintData, Wall, Room, RoomType, Vector2D } from '../../types/blueprint';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CANVAS_H = SCREEN_H - 200;
const PIXELS_PER_METRE = 40;
const SNAP_INTERVAL = 0.1;

function snap(v: number): number {
  return Math.round(v / SNAP_INTERVAL) * SNAP_INTERVAL;
}

function metreToPixel(m: number, scale: number, offset: number): number {
  return m * PIXELS_PER_METRE * scale + offset;
}

function pixelToMetre(px: number, scale: number, offset: number): number {
  return (px - offset) / (PIXELS_PER_METRE * scale);
}

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

// --- Types ---

interface SketchWall {
  id: string;
  start: Vector2D;
  end: Vector2D;
  isPreview: boolean;
}

type DrawTool = 'wall' | 'eraser' | 'dimension' | 'text';
type SketchMode = 'draw' | 'presets';
type PresetSize = 'small' | 'medium' | 'large';

// --- Preset data ---

interface PresetEntry {
  name: string;
  roomType: RoomType;
  buildingType: 'house' | 'apartment' | 'office' | 'studio' | 'villa';
  sizes: Record<PresetSize, { w: number; h: number }>;
  defaultCeiling: number;
}

const PRESETS: PresetEntry[] = [
  { name: 'Bedroom', roomType: 'bedroom', buildingType: 'house', sizes: { small: { w: 3, h: 3 }, medium: { w: 4, h: 4 }, large: { w: 5, h: 5 } }, defaultCeiling: 2.7 },
  { name: 'Living Room', roomType: 'living_room', buildingType: 'house', sizes: { small: { w: 4, h: 5 }, medium: { w: 6, h: 5 }, large: { w: 8, h: 6 } }, defaultCeiling: 2.7 },
  { name: 'Kitchen', roomType: 'kitchen', buildingType: 'house', sizes: { small: { w: 2.5, h: 3 }, medium: { w: 3.5, h: 4 }, large: { w: 5, h: 5 } }, defaultCeiling: 2.7 },
  { name: 'Bathroom', roomType: 'bathroom', buildingType: 'house', sizes: { small: { w: 1.5, h: 2 }, medium: { w: 2.5, h: 3 }, large: { w: 3, h: 4 } }, defaultCeiling: 2.4 },
  { name: 'Office', roomType: 'office', buildingType: 'office', sizes: { small: { w: 3, h: 3 }, medium: { w: 4, h: 5 }, large: { w: 6, h: 6 } }, defaultCeiling: 2.7 },
  { name: 'Dining Room', roomType: 'dining_room', buildingType: 'house', sizes: { small: { w: 3, h: 3 }, medium: { w: 4, h: 4 }, large: { w: 5, h: 5 } }, defaultCeiling: 2.7 },
  { name: 'Studio', roomType: 'living_room', buildingType: 'studio', sizes: { small: { w: 4, h: 6 }, medium: { w: 6, h: 8 }, large: { w: 8, h: 10 } }, defaultCeiling: 3 },
  { name: 'Open Plan', roomType: 'living_room', buildingType: 'apartment', sizes: { small: { w: 6, h: 6 }, medium: { w: 8, h: 8 }, large: { w: 10, h: 10 } }, defaultCeiling: 2.7 },
  { name: 'Garage', roomType: 'garage', buildingType: 'house', sizes: { small: { w: 3, h: 5 }, medium: { w: 5, h: 6 }, large: { w: 6, h: 7 } }, defaultCeiling: 2.4 },
  { name: 'Garden', roomType: 'balcony', buildingType: 'house', sizes: { small: { w: 4, h: 5 }, medium: { w: 6, h: 8 }, large: { w: 8, h: 10 } }, defaultCeiling: 2.4 },
];

// --- Geometry helpers ---

function dist2D(a: Vector2D, b: Vector2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function pointToSegmentDist(p: Vector2D, a: Vector2D, b: Vector2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return dist2D(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return dist2D(p, { x: a.x + t * dx, y: a.y + t * dy });
}

function shoelaceArea(pts: Vector2D[]): number {
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2;
}

function avgCentroid(pts: Vector2D[]): Vector2D {
  const n = pts.length;
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / n,
    y: pts.reduce((s, p) => s + p.y, 0) / n,
  };
}

function rectWalls(x: number, y: number, w: number, h: number): SketchWall[] {
  const corners: Vector2D[] = [
    { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
  ];
  return corners.map((c, i) => ({
    id: genId(),
    start: c,
    end: corners[(i + 1) % 4],
    isPreview: false,
  }));
}

// --- Closed polygon detection ---

function findClosedPolygon(walls: SketchWall[]): SketchWall[] | null {
  if (walls.length < 3) return null;
  const TOL = 0.15;

  function endpointsMatch(a: Vector2D, b: Vector2D): boolean {
    return dist2D(a, b) < TOL;
  }

  function dfs(
    path: SketchWall[],
    visited: Set<string>,
    startPt: Vector2D,
    currentPt: Vector2D,
  ): SketchWall[] | null {
    if (path.length >= 3 && endpointsMatch(currentPt, startPt)) {
      return path;
    }
    if (path.length >= 20) return null;

    for (const w of walls) {
      if (visited.has(w.id)) continue;
      if (endpointsMatch(currentPt, w.start)) {
        visited.add(w.id);
        const result = dfs([...path, w], visited, startPt, w.end);
        if (result) return result;
        visited.delete(w.id);
      } else if (endpointsMatch(currentPt, w.end)) {
        visited.add(w.id);
        const flipped: SketchWall = { ...w, start: w.end, end: w.start };
        const result = dfs([...path, flipped], visited, startPt, w.start);
        if (result) return result;
        visited.delete(w.id);
      }
    }
    return null;
  }

  for (const startWall of walls) {
    const visited = new Set([startWall.id]);
    const result = dfs([startWall], visited, startWall.start, startWall.end);
    if (result) return result;
  }
  return null;
}

// --- Blueprint conversion ---

function sketchToBlueprintData(
  walls: SketchWall[],
  closedPoly: SketchWall[] | null,
  roomType: RoomType,
  buildingType: 'house' | 'apartment' | 'office' | 'studio' | 'villa',
): BlueprintData {
  const now = nowISO();
  const blueprintWalls: Wall[] = walls.map((sw) => ({
    id: sw.id,
    start: sw.start,
    end: sw.end,
    thickness: 0.2,
    height: 2.7,
    texture: 'plain_white' as const,
  }));

  const rooms: Room[] = closedPoly
    ? [
        {
          id: genId(),
          name: roomType.replace('_', ' '),
          type: roomType,
          wallIds: closedPoly.map((w) => w.id),
          floorMaterial: 'hardwood' as const,
          ceilingHeight: 2.7,
          area: shoelaceArea(closedPoly.map((w) => w.start)),
          centroid: avgCentroid(closedPoly.map((w) => w.start)),
        },
      ]
    : [];

  return {
    id: genId(),
    version: 1,
    metadata: {
      style: 'modern',
      buildingType,
      totalArea: rooms.reduce((s, r) => s + r.area, 0),
      roomCount: rooms.length,
      generatedFrom: 'sketch',
    },
    walls: blueprintWalls,
    rooms,
    openings: [],
    furniture: [],
    customAssets: [],
    chatHistory: [],
    createdAt: now,
    updatedAt: now,
  };
}

// --- Drawing Pin ---

function DrawingPin({ color }: { color: string }) {
  return (
    <Svg width={18} height={22} viewBox="0 0 18 22">
      <Circle cx={9} cy={7} r={5} fill={color} opacity={0.9} />
      <Path d="M9 12 L9 22" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={0.7} />
      <Circle cx={9} cy={7} r={2} fill="#fff" opacity={0.4} />
    </Svg>
  );
}

// --- Preset Card ---

interface PresetCardProps {
  preset: PresetEntry;
  accentColor: string;
  onAddToCanvas: (preset: PresetEntry, size: PresetSize) => void;
  onSendToWorkspace: (preset: PresetEntry, size: PresetSize) => void;
}

function PresetCard({ preset, accentColor, onAddToCanvas, onSendToWorkspace }: PresetCardProps) {
  const [selectedSize, setSelectedSize] = useState<PresetSize>('medium');
  const sizes: PresetSize[] = ['small', 'medium', 'large'];

  return (
    <View
      style={{
        flex: 1,
        margin: 8,
        backgroundColor: BASE_COLORS.surface,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: BASE_COLORS.border,
        padding: 14,
        overflow: 'hidden',
      }}
    >
      {/* Drawing pin decoration */}
      <View style={{ position: 'absolute', top: -6, right: 16 }}>
        <DrawingPin color={accentColor} />
      </View>

      <Text
        style={{
          fontFamily: 'ArchitectsDaughter_400Regular',
          fontSize: 16,
          color: BASE_COLORS.textPrimary,
          marginBottom: 10,
        }}
      >
        {preset.name}
      </Text>

      {/* Size chips */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
        {sizes.map((s) => {
          const dims = preset.sizes[s];
          return (
            <Pressable
              key={s}
              onPress={() => setSelectedSize(s)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: selectedSize === s ? accentColor : BASE_COLORS.border,
                backgroundColor: selectedSize === s ? `${accentColor}20` : 'transparent',
              }}
            >
              <Text
                style={{
                  fontFamily: 'JetBrainsMono_400Regular',
                  fontSize: 10,
                  color: selectedSize === s ? accentColor : BASE_COLORS.textDim,
                }}
              >
                {s[0].toUpperCase()} {dims.w}×{dims.h}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => onAddToCanvas(preset, selectedSize)}
          style={{
            flex: 1,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1.5,
            borderColor: accentColor,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: accentColor }}>+ Canvas</Text>
        </Pressable>
        <Pressable
          onPress={() => onSendToWorkspace(preset, selectedSize)}
          style={{
            flex: 1,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: accentColor,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: BASE_COLORS.background }}>→ Workspace</Text>
        </Pressable>
      </View>
    </View>
  );
}

// --- Main SketchScreen ---

export function SketchScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { light, medium } = useHaptics();
  const slideStyle = useScreenSlideIn();

  const [mode, setMode] = useState<SketchMode>('draw');
  const [tool, setTool] = useState<DrawTool>('wall');
  const [walls, setWalls] = useState<SketchWall[]>([]);
  const [closedPolygon, setClosedPolygon] = useState<SketchWall[] | null>(null);

  // Viewport shared values (Reanimated)
  const scale = useSharedValue(1);
  const offsetX = useSharedValue(SCREEN_W / 2);
  const offsetY = useSharedValue(CANVAS_H / 2);
  const savedScale = useSharedValue(1);
  const savedOffsetX = useSharedValue(SCREEN_W / 2);
  const savedOffsetY = useSharedValue(CANVAS_H / 2);

  // Drawing shared values
  const drawStartX = useSharedValue(-9999);
  const drawStartY = useSharedValue(-9999);
  const previewEndX = useSharedValue(-9999);
  const previewEndY = useSharedValue(-9999);
  const isDrawing = useSharedValue(false);
  const lastSnappedX = useSharedValue(-9999);
  const lastSnappedY = useSharedValue(-9999);

  // Skia bridged values
  const skScale = useValue(1);
  const skOffsetX = useValue(SCREEN_W / 2);
  const skOffsetY = useValue(CANVAS_H / 2);
  const skDrawStartX = useValue(-9999);
  const skDrawStartY = useValue(-9999);
  const skPreviewEndX = useValue(-9999);
  const skPreviewEndY = useValue(-9999);
  const skIsDrawing = useValue(false);

  useSharedValueEffect(() => { skScale.current = scale.value; }, scale);
  useSharedValueEffect(() => { skOffsetX.current = offsetX.value; }, offsetX);
  useSharedValueEffect(() => { skOffsetY.current = offsetY.value; }, offsetY);
  useSharedValueEffect(() => { skDrawStartX.current = drawStartX.value; }, drawStartX);
  useSharedValueEffect(() => { skDrawStartY.current = drawStartY.value; }, drawStartY);
  useSharedValueEffect(() => { skPreviewEndX.current = previewEndX.value; }, previewEndX);
  useSharedValueEffect(() => { skPreviewEndY.current = previewEndY.value; }, previewEndY);
  useSharedValueEffect(() => { skIsDrawing.current = isDrawing.value; }, isDrawing);

  // Screen entry animations
  const headerY = useSharedValue(-40);
  const canvasOpacity = useSharedValue(0);
  const toolbarY = useSharedValue(60);

  useEffect(() => {
    headerY.value = withSpring(0, { damping: 18, stiffness: 200 });
    canvasOpacity.value = withDelay(50, withTiming(1, { duration: 300 }));
    toolbarY.value = withDelay(100, withSpring(0, { damping: 16, stiffness: 180 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerAnimStyle = useAnimatedStyle(() => ({ transform: [{ translateY: headerY.value }] }));
  const canvasAnimStyle = useAnimatedStyle(() => ({ opacity: canvasOpacity.value }));
  const toolbarAnimStyle = useAnimatedStyle(() => ({ transform: [{ translateY: toolbarY.value }] }));

  // Detect closed polygon on walls change
  useEffect(() => {
    const poly = findClosedPolygon(walls);
    setClosedPolygon(poly);
  }, [walls]);

  // Haptic snap feedback
  useAnimatedReaction(
    () => ({ x: lastSnappedX.value, y: lastSnappedY.value }),
    (curr, prev) => {
      if (prev && (curr.x !== prev.x || curr.y !== prev.y)) {
        runOnJS(light)();
      }
    },
  );

  const addWall = useCallback(
    (startX: number, startY: number, endX: number, endY: number) => {
      setWalls((prev) => [
        ...prev,
        { id: genId(), start: { x: startX, y: startY }, end: { x: endX, y: endY }, isPreview: false },
      ]);
    },
    [],
  );

  const eraseWallAt = useCallback((mx: number, my: number) => {
    setWalls((prev) =>
      prev.filter((w) => pointToSegmentDist({ x: mx, y: my }, w.start, w.end) >= 0.3),
    );
  }, []);

  // Pinch gesture
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 0.3), 4);
    });

  // Pan (viewport)
  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedOffsetX.value = offsetX.value;
      savedOffsetY.value = offsetY.value;
    })
    .onUpdate((e) => {
      offsetX.value = savedOffsetX.value + e.translationX;
      offsetY.value = savedOffsetY.value + e.translationY;
    });

  // Draw gesture
  const drawGesture = Gesture.Pan()
    .onStart((e) => {
      const mx = snap(pixelToMetre(e.x, scale.value, offsetX.value));
      const my = snap(pixelToMetre(e.y, scale.value, offsetY.value));
      drawStartX.value = mx;
      drawStartY.value = my;
      previewEndX.value = mx;
      previewEndY.value = my;
      isDrawing.value = true;
    })
    .onUpdate((e) => {
      const mx = snap(pixelToMetre(e.x, scale.value, offsetX.value));
      const my = snap(pixelToMetre(e.y, scale.value, offsetY.value));
      if (mx !== lastSnappedX.value || my !== lastSnappedY.value) {
        lastSnappedX.value = mx;
        lastSnappedY.value = my;
      }
      previewEndX.value = mx;
      previewEndY.value = my;
    })
    .onEnd(() => {
      const sx = drawStartX.value;
      const sy = drawStartY.value;
      const ex = previewEndX.value;
      const ey = previewEndY.value;
      const d = Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2);
      isDrawing.value = false;
      drawStartX.value = -9999;
      drawStartY.value = -9999;
      previewEndX.value = -9999;
      previewEndY.value = -9999;
      if (d > 0.1) {
        runOnJS(addWall)(sx, sy, ex, ey);
      }
    });

  // Tap gesture (erase)
  const tapGesture = Gesture.Tap().onEnd((e) => {
    const mx = pixelToMetre(e.x, scale.value, offsetX.value);
    const my = pixelToMetre(e.y, scale.value, offsetY.value);
    runOnJS(eraseWallAt)(mx, my);
  });

  const activeGesture =
    tool === 'wall'
      ? Gesture.Exclusive(drawGesture, Gesture.Simultaneous(pinchGesture))
      : tool === 'eraser'
      ? Gesture.Exclusive(tapGesture, Gesture.Simultaneous(pinchGesture))
      : Gesture.Simultaneous(panGesture, pinchGesture);

  const handleSend = useCallback(() => {
    medium();
    const data = sketchToBlueprintData(walls, closedPolygon, 'bedroom', 'house');
    useBlueprintStore.getState().actions.loadBlueprint(data);
    navigation.navigate('Workspace', undefined);
  }, [walls, closedPolygon, medium, navigation]);

  const handleAddPresetToCanvas = useCallback((preset: PresetEntry, size: PresetSize) => {
    light();
    const { w, h } = preset.sizes[size];
    const maxX = walls.reduce((m, wl) => Math.max(m, wl.start.x, wl.end.x), 0);
    const startX = maxX > 0 ? maxX + 1 : 0;
    const newWalls = rectWalls(startX, 0, w, h);
    setWalls((prev) => [...prev, ...newWalls]);
    setMode('draw');
  }, [walls, light]);

  const handlePresetToWorkspace = useCallback((preset: PresetEntry, size: PresetSize) => {
    medium();
    const { w, h } = preset.sizes[size];
    const rWalls = rectWalls(0, 0, w, h);
    const poly = rWalls;
    const data = sketchToBlueprintData(rWalls, poly, preset.roomType, preset.buildingType);
    useBlueprintStore.getState().actions.loadBlueprint(data);
    navigation.navigate('Workspace', undefined);
  }, [medium, navigation]);

  const accentColor = colors.primary;

  const TOOLS: { id: DrawTool; label: string }[] = [
    { id: 'wall', label: 'Wall' },
    { id: 'eraser', label: 'Erase' },
    { id: 'dimension', label: 'Dim' },
    { id: 'text', label: 'Text' },
  ];

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: BASE_COLORS.background }, slideStyle]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <Animated.View style={[headerAnimStyle, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 }]}>
          <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 24, color: BASE_COLORS.textPrimary }}>
            Sketch
          </Text>

          {/* Mode toggle pill */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: BASE_COLORS.surfaceHigh,
            borderRadius: 999,
            padding: 3,
            borderWidth: 1,
            borderColor: BASE_COLORS.border,
          }}>
            {(['draw', 'presets'] as SketchMode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => { light(); setMode(m); }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: mode === m ? accentColor : 'transparent',
                }}
              >
                <Text style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 13,
                  color: mode === m ? BASE_COLORS.background : BASE_COLORS.textSecondary,
                  textTransform: 'capitalize',
                }}>
                  {m}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {mode === 'draw' ? (
          /* --- Draw mode --- */
          <Animated.View style={[canvasAnimStyle, { flex: 1 }]}>
            <GestureDetector gesture={activeGesture}>
              <Canvas style={{ width: SCREEN_W, height: CANVAS_H }}>
                {/* Grid */}
                {Array.from({ length: 21 }, (_, i) => i - 10).map((n) => (
                  <React.Fragment key={`g${n}`}>
                    <SkiaLine
                      p1={{ x: metreToPixel(n, skScale.current, skOffsetX.current), y: 0 }}
                      p2={{ x: metreToPixel(n, skScale.current, skOffsetX.current), y: CANVAS_H }}
                      strokeWidth={0.5}
                      color={`${accentColor}22`}
                    />
                    <SkiaLine
                      p1={{ x: 0, y: metreToPixel(n, skScale.current, skOffsetY.current) }}
                      p2={{ x: SCREEN_W, y: metreToPixel(n, skScale.current, skOffsetY.current) }}
                      strokeWidth={0.5}
                      color={`${accentColor}22`}
                    />
                  </React.Fragment>
                ))}

                {/* Committed walls */}
                {walls.map((w) => (
                  <SkiaLine
                    key={w.id}
                    p1={{
                      x: metreToPixel(w.start.x, skScale.current, skOffsetX.current),
                      y: metreToPixel(w.start.y, skScale.current, skOffsetY.current),
                    }}
                    p2={{
                      x: metreToPixel(w.end.x, skScale.current, skOffsetX.current),
                      y: metreToPixel(w.end.y, skScale.current, skOffsetY.current),
                    }}
                    strokeWidth={3}
                    color={closedPolygon?.some((cw) => cw.id === w.id) ? accentColor : BASE_COLORS.textPrimary}
                  />
                ))}

                {/* Closed polygon centroid dot */}
                {closedPolygon && closedPolygon.length >= 3 && (() => {
                  const pts = closedPolygon.map((w) => w.start);
                  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
                  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
                  return (
                    <SkiaCircle
                      cx={metreToPixel(cx, skScale.current, skOffsetX.current)}
                      cy={metreToPixel(cy, skScale.current, skOffsetY.current)}
                      r={6}
                      color={`${accentColor}80`}
                    />
                  );
                })()}

                {/* Preview wall */}
                {skIsDrawing.current && (
                  <SkiaLine
                    p1={{
                      x: metreToPixel(skDrawStartX.current, skScale.current, skOffsetX.current),
                      y: metreToPixel(skDrawStartY.current, skScale.current, skOffsetY.current),
                    }}
                    p2={{
                      x: metreToPixel(skPreviewEndX.current, skScale.current, skOffsetX.current),
                      y: metreToPixel(skPreviewEndY.current, skScale.current, skOffsetY.current),
                    }}
                    strokeWidth={2}
                    color={`${accentColor}99`}
                  />
                )}
              </Canvas>
            </GestureDetector>

            {/* Bottom toolbar */}
            <Animated.View style={[
              toolbarAnimStyle,
              {
                position: 'absolute',
                bottom: 90,
                left: 20,
                right: 20,
                flexDirection: 'row',
                backgroundColor: BASE_COLORS.surfaceHigh,
                borderRadius: 999,
                padding: 6,
                borderWidth: 1,
                borderColor: BASE_COLORS.border,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              },
            ]}>
              {TOOLS.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => { light(); setTool(t.id); }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 999,
                    alignItems: 'center',
                    backgroundColor: tool === t.id ? accentColor : 'transparent',
                  }}
                >
                  <Text style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 12,
                    color: tool === t.id ? BASE_COLORS.background : BASE_COLORS.textSecondary,
                  }}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}

              {/* Divider */}
              <View style={{ width: 1, height: 24, backgroundColor: BASE_COLORS.border, marginHorizontal: 4 }} />

              {/* Send to Blueprint */}
              <Pressable
                onPress={handleSend}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: accentColor,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: BASE_COLORS.background }}>
                  Send ↗
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        ) : (
          /* --- Presets mode --- */
          <FlatList
            data={PRESETS}
            numColumns={2}
            keyExtractor={(item) => item.name}
            contentContainerStyle={{ padding: 8, paddingBottom: 120 }}
            renderItem={({ item }) => (
              <PresetCard
                preset={item}
                accentColor={accentColor}
                onAddToCanvas={handleAddPresetToCanvas}
                onSendToWorkspace={handlePresetToWorkspace}
              />
            )}
          />
        )}
      </SafeAreaView>
    </Animated.View>
  );
}
