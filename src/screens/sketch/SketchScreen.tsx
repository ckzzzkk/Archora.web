import React, { useState, useRef, useEffect, useCallback, useReducer } from 'react';
import { View, Pressable, FlatList, useWindowDimensions, Alert } from 'react-native';
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
  Skia,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useHaptics } from '../../hooks/useHaptics';
import { useTierGate } from '../../hooks/useTierGate';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../../components/common/ArchText';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { useDeviceType } from '../../hooks/useDeviceType';
import { getResponsiveTokens } from '../../theme/responsive';
import type { RootStackParamList } from '../../navigation/types';
import type { BlueprintData, Wall, Room, RoomType, Vector2D, FloorData } from '../../types/blueprint';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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

type DrawTool = 'wall' | 'line' | 'curve' | 'arc' | 'eraser' | 'dimension' | 'text';
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

/** Compute the 3 control points for a circular arc from start to end with given bulge direction */
function circularArcPoints(start: Vector2D, end: Vector2D, bulgeDir: Vector2D): { cx: number; cy: number; r: number; startAngle: number; endAngle: number } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const chord = Math.sqrt(dx * dx + dy * dy);
  const dist = Math.sqrt(bulgeDir.x * bulgeDir.x + bulgeDir.y * bulgeDir.y);
  if (dist === 0) {
    // Degenerate — just return midpoint
    return { cx: (start.x + end.x) / 2, cy: (start.y + end.y) / 2, r: chord / 2, startAngle: 0, endAngle: Math.PI };
  }
  // Unit direction from bulge
  const nx = bulgeDir.x / dist;
  const ny = bulgeDir.y / dist;
  // Perpendicular to chord (for arc center offset)
  const perpX = -dy / chord;
  const perpY = dx / chord;
  // Signed distance from chord midpoint to arc center (sagitta)
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const sagitta = Math.abs(dx * nx + dy * ny);
  const r = (chord / 2) / Math.sin(Math.atan2(sagitta, chord / 2));
  // Sign: dot product with perpendicular determines which side
  const sign = (dx * perpX + dy * perpY) >= 0 ? 1 : -1;
  const cx = midX + sign * perpX * r * (1 - Math.cos(Math.atan2(sagitta, chord / 2)));
  const cy = midY + sign * perpY * r * (1 - Math.cos(Math.atan2(sagitta, chord / 2)));
  const startAngle = Math.atan2(start.y - cy, start.x - cx);
  const endAngle = Math.atan2(end.y - cy, end.x - cx);
  return { cx, cy, r, startAngle, endAngle };
}

/** Catmull-Rom cubic Bezier spline through points — returns array of {cp1, cp2, end} for Skia cubicTo */
function catmullRomToBezier(pts: Vector2D[], tension = 0.5): Array<{ cp1: Vector2D; cp2: Vector2D; end: Vector2D }> {
  if (pts.length < 2) return [];
  if (pts.length === 2) {
    return [{ cp1: pts[0], cp2: pts[1], end: pts[1] }];
  }
  const result: Array<{ cp1: Vector2D; cp2: Vector2D; end: Vector2D }> = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[0];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i < pts.length - 2 ? pts[i + 2] : pts[pts.length - 1];
    const cp1: Vector2D = { x: p1.x + (p2.x - p0.x) * tension / 3, y: p1.y + (p2.y - p0.y) * tension / 3 };
    const cp2: Vector2D = { x: p2.x - (p3.x - p1.x) * tension / 3, y: p2.y - (p3.y - p1.y) * tension / 3 };
    result.push({ cp1, cp2, end: p2 });
  }
  return result;
}

// --- Curve / arc tessellation to wall segments ---

/** Convert a smooth curve (array of points) to SketchWall segments for the blueprint */
function curveToWalls(pts: Vector2D[], resolution = 0.1): SketchWall[] {
  if (pts.length < 2) return [];
  const walls: SketchWall[] = [];
  const segments = catmullRomToBezier(pts);
  for (const seg of segments) {
    // Sample cubic Bezier at intervals
    const steps = Math.max(4, Math.ceil(Math.sqrt((seg.end.x - seg.cp2.x) ** 2 + (seg.end.y - seg.cp2.y) ** 2) / resolution));
    let prevPt = pts[segments.indexOf(seg)];
    if (segments.indexOf(seg) === 0) prevPt = pts[0];
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      // Cubic Bezier: B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
      const t2 = t * t, t3 = t2 * t, mt = 1 - t, mt2 = mt * mt;
      const prevSegIdx = segments.indexOf(seg);
      const startPt = i === 1 ? (prevSegIdx === 0 ? pts[0] : pts[prevSegIdx]) : prevPt;
      const endPt = {
        x: mt2 * mt * (prevSegIdx === 0 ? pts[0].x : pts[prevSegIdx].x) + 3 * mt2 * t * seg.cp1.x + 3 * mt * t2 * seg.cp2.x + t3 * seg.end.x,
        y: mt2 * mt * (prevSegIdx === 0 ? pts[0].y : pts[prevSegIdx].y) + 3 * mt2 * t * seg.cp1.y + 3 * mt * t2 * seg.cp2.y + t3 * seg.end.y,
      };
      if (i > 1) {
        walls.push({ id: genId(), start: prevPt, end: endPt, isPreview: false });
      }
      prevPt = endPt;
    }
  }
  // Simpler approximation: just connect points linearly for reliability
  const simpleWalls: SketchWall[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const steps = Math.max(2, Math.ceil(dist2D(pts[i], pts[i + 1]) / resolution));
    for (let s = 0; s < steps; s++) {
      const t0 = s / steps;
      const t1 = (s + 1) / steps;
      const x0 = pts[i].x + (pts[i + 1].x - pts[i].x) * t0;
      const y0 = pts[i].y + (pts[i + 1].y - pts[i].y) * t0;
      const x1 = pts[i].x + (pts[i + 1].x - pts[i].x) * t1;
      const y1 = pts[i].y + (pts[i + 1].y - pts[i].y) * t1;
      simpleWalls.push({ id: genId(), start: { x: x0, y: y0 }, end: { x: x1, y: y1 }, isPreview: false });
    }
  }
  return simpleWalls;
}

/** Convert a circular arc to SketchWall segments */
function arcToWalls(start: Vector2D, end: Vector2D, bulgeDir: Vector2D, resolution = 0.1): SketchWall[] {
  const { cx, cy, r, startAngle, endAngle } = circularArcPoints(start, end, bulgeDir);
  const arcLen = Math.abs(r * ((endAngle - startAngle + Math.PI * 3) % (Math.PI * 2) - Math.PI));
  const steps = Math.max(4, Math.ceil(arcLen / resolution));
  const walls: SketchWall[] = [];
  let prevAngle = startAngle;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const totalRange = ((endAngle - startAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const angle = startAngle + totalRange * t;
    const x0 = cx + r * Math.cos(prevAngle);
    const y0 = cy + r * Math.sin(prevAngle);
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    if (i > 1) {
      walls.push({ id: genId(), start: { x: x0, y: y0 }, end: { x: x1, y: y1 }, isPreview: false });
    }
    prevAngle = angle;
  }
  return walls;
}

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
  extraWalls: SketchWall[] = [],
): BlueprintData {
  const now = nowISO();
  const allWalls = [...walls, ...extraWalls];
  const blueprintWalls: Wall[] = allWalls.map((sw) => ({
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

  const groundFloor: FloorData = {
      id: genId(),
      label: 'G',
      index: 0,
      walls: blueprintWalls,
      rooms,
      openings: [],
      furniture: [],
      staircases: [],
      elevators: [],
      slabs: [],
      ceilings: [],
      roofs: [],
      roofSegments: [],
    };

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
    floors: [groundFloor],
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
        backgroundColor: DS.colors.surface,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: DS.colors.border,
        padding: 14,
        overflow: 'hidden',
      }}
    >
      {/* Drawing pin decoration */}
      <View style={{ position: 'absolute', top: -6, right: 16 }}>
        <DrawingPin color={accentColor} />
      </View>

      <ArchText variant="body"
        style={{
          fontFamily: 'ArchitectsDaughter_400Regular',
          fontSize: 16,
          color: DS.colors.primary,
          marginBottom: 10,
        }}
      >
        {preset.name}
      </ArchText>

      {/* Size chips */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
        {sizes.map((s) => {
          const dims = preset.sizes?.[s] ?? preset.sizes['medium'];
          return (
            <Pressable
              key={s}
              onPress={() => setSelectedSize(s)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: selectedSize === s ? accentColor : DS.colors.border,
                backgroundColor: selectedSize === s ? `${accentColor}20` : 'transparent',
              }}
            >
              <ArchText variant="body"
                style={{
                  fontFamily: 'JetBrainsMono_400Regular',
                  fontSize: 10,
                  color: selectedSize === s ? accentColor : DS.colors.primaryGhost,
                }}
              >
                {s[0].toUpperCase()} {dims.w}×{dims.h}
              </ArchText>
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
          <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: accentColor }}>+ Canvas</ArchText>
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
          <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: DS.colors.background }}>→ Workspace</ArchText>
        </Pressable>
      </View>
    </View>
  );
}

// --- Main SketchScreen ---

export function SketchScreen() {
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const device = useDeviceType();
  const tokens = getResponsiveTokens(device.layout);
  // Reserve 240px for header + toolbar + bottom safe area; minimum 400px usable canvas
  const CANVAS_H = Math.max(SCREEN_H - 240, 400);

  const navigation = useNavigation<Nav>();
  const { light, medium } = useHaptics();
  const [mode, setMode] = useState<SketchMode>('draw');
  const [tool, setTool] = useState<DrawTool>('wall');
  const [walls, setWalls] = useState<SketchWall[]>([]);
  const [closedPolygon, setClosedPolygon] = useState<SketchWall[] | null>(null);

  // Line tool state: first anchor point
  const [lineAnchor, setLineAnchor] = useState<Vector2D | null>(null);

  // Curve tool state: list of tapped points
  const [curvePoints, setCurvePoints] = useState<Vector2D[]>([]);

  // Arc tool state: start + end + bulge
  const [arcStart, setArcStart] = useState<Vector2D | null>(null);
  const [arcEnd, setArcEnd] = useState<Vector2D | null>(null);
  const [arcDragBulge, setArcDragBulge] = useState<Vector2D | null>(null); // drag offset while setting bulge

  // Refine with AI state
  const [isRefining, setIsRefining] = useState(false);
  const { allowed: refineAllowed } = useTierGate('aiGenerationsPerMonth');

  // Arc drag shared value for smooth preview
  const arcDragX = useSharedValue(-9999);
  const arcDragY = useSharedValue(-9999);
  const arcDragActive = useSharedValue(false);

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

  // Mirror Reanimated shared values into refs for Skia canvas reads.
  // useValue / useSharedValueEffect were removed in newer @shopify/react-native-skia;
  // we use plain refs updated via useAnimatedReaction and force a React re-render
  // so the Canvas picks up the latest values on each gesture frame.
  const skScale = useRef(1);
  const skOffsetX = useRef(SCREEN_W / 2);
  const skOffsetY = useRef(CANVAS_H / 2);
  const skDrawStartX = useRef(-9999);
  const skDrawStartY = useRef(-9999);
  const skPreviewEndX = useRef(-9999);
  const skPreviewEndY = useRef(-9999);
  const skIsDrawing = useRef(false);
  const skArcDragX = useRef(-9999);
  const skArcDragY = useRef(-9999);
  const skArcDragActive = useRef(false);

  const [, forceCanvasRender] = useReducer((n: number) => n + 1, 0);

  useAnimatedReaction(
    () => ({
      s: scale.value,
      ox: offsetX.value,
      oy: offsetY.value,
      dsx: drawStartX.value,
      dsy: drawStartY.value,
      pex: previewEndX.value,
      pey: previewEndY.value,
      id: isDrawing.value,
      adx: arcDragX.value,
      ady: arcDragY.value,
      ada: arcDragActive.value,
    }),
    (curr) => {
      skScale.current = curr.s;
      skOffsetX.current = curr.ox;
      skOffsetY.current = curr.oy;
      skDrawStartX.current = curr.dsx;
      skDrawStartY.current = curr.dsy;
      skPreviewEndX.current = curr.pex;
      skPreviewEndY.current = curr.pey;
      skIsDrawing.current = curr.id;
      skArcDragX.current = curr.adx;
      skArcDragY.current = curr.ady;
      skArcDragActive.current = curr.ada;
      runOnJS(forceCanvasRender)();
    },
  );

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

  // Line tool: tap once = first anchor, tap twice = commit wall
  const handleLineTap = useCallback((mx: number, my: number) => {
    if (lineAnchor === null) {
      setLineAnchor({ x: mx, y: my });
    } else {
      setWalls((prev) => [
        ...prev,
        { id: genId(), start: lineAnchor, end: { x: mx, y: my }, isPreview: false },
      ]);
      setLineAnchor(null);
    }
  }, [lineAnchor]);

  // Curve tool: tap to add points, double-tap to commit as tessellated walls
  const handleCurveTap = useCallback((mx: number, my: number) => {
    setCurvePoints((prev) => [...prev, { x: mx, y: my }]);
  }, []);

  const handleCurveCommit = useCallback(() => {
    if (curvePoints.length < 2) { setCurvePoints([]); return; }
    const tessellated = curveToWalls(curvePoints);
    setWalls((prev) => [...prev, ...tessellated]);
    setCurvePoints([]);
  }, [curvePoints]);

  // Arc tool: tap start → tap end → drag bulge → release commits
  const handleArcTap = useCallback((mx: number, my: number) => {
    if (arcStart === null) {
      setArcStart({ x: mx, y: my });
      setArcEnd(null);
      setArcDragBulge(null);
    } else if (arcEnd === null) {
      setArcEnd({ x: mx, y: my });
    }
  }, [arcStart, arcEnd]);

  const handleArcDrag = useCallback((mx: number, my: number) => {
    setArcDragBulge({ x: mx, y: my });
  }, []);

  const handleArcCommit = useCallback(() => {
    if (arcStart !== null && arcEnd !== null && arcDragBulge !== null) {
      const walls = arcToWalls(arcStart, arcEnd, arcDragBulge);
      setWalls((prev) => [...prev, ...walls]);
    }
    setArcStart(null);
    setArcEnd(null);
    setArcDragBulge(null);
  }, [arcStart, arcEnd, arcDragBulge]);

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

  // Line tool: tap first point, tap second point → commits a wall
  const lineTapGesture = Gesture.Tap()
    .onEnd((e) => {
      const mx = snap(pixelToMetre(e.x, scale.value, offsetX.value));
      const my = snap(pixelToMetre(e.y, scale.value, offsetY.value));
      runOnJS(handleLineTap)(mx, my);
    });

  // Curve tool: tap to add point, double-tap to finish
  const curveTapGesture = Gesture.Tap()
    .onEnd((e) => {
      const mx = snap(pixelToMetre(e.x, scale.value, offsetX.value));
      const my = snap(pixelToMetre(e.y, scale.value, offsetY.value));
      runOnJS(handleCurveTap)(mx, my);
    });
  const curveDoubleTapGesture = Gesture.Tap().numberOfTaps(2)
    .onEnd((e) => {
      const mx = snap(pixelToMetre(e.x, scale.value, offsetX.value));
      const my = snap(pixelToMetre(e.y, scale.value, offsetY.value));
      runOnJS(handleCurveCommit)();
    });

  // Arc tool: tap start, tap end, drag to set bulge
  const arcTapGesture = Gesture.Tap()
    .onEnd((e) => {
      const mx = snap(pixelToMetre(e.x, scale.value, offsetX.value));
      const my = snap(pixelToMetre(e.y, scale.value, offsetY.value));
      runOnJS(handleArcTap)(mx, my);
    });
  const arcPanGesture = Gesture.Pan()
    .onStart(() => {
      arcDragActive.value = true;
    })
    .onUpdate((e) => {
      const mx = snap(pixelToMetre(e.x, scale.value, offsetX.value));
      const my = snap(pixelToMetre(e.y, scale.value, offsetY.value));
      arcDragX.value = mx;
      arcDragY.value = my;
      runOnJS(handleArcDrag)(mx, my);
    })
    .onEnd(() => {
      arcDragActive.value = false;
      runOnJS(handleArcCommit)();
    });

  const activeGesture =
    tool === 'wall'
      ? Gesture.Exclusive(drawGesture, Gesture.Simultaneous(pinchGesture))
      : tool === 'line'
      ? Gesture.Exclusive(lineTapGesture, Gesture.Simultaneous(pinchGesture, panGesture))
      : tool === 'curve'
      ? Gesture.Exclusive(Gesture.Exclusive(curveTapGesture, curveDoubleTapGesture), Gesture.Simultaneous(pinchGesture, panGesture))
      : tool === 'arc'
      ? Gesture.Race(arcTapGesture, Gesture.Exclusive(arcPanGesture, Gesture.Simultaneous(pinchGesture, panGesture)))
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

  const handleRefineWithAI = useCallback(async () => {
    if (walls.length === 0) return;
    medium();
    setIsRefining(true);
    try {
      const data = sketchToBlueprintData(walls, closedPolygon, 'bedroom', 'house');
      const { refineSketch } = await import('../../services/aiService').then(m => m.aiService);
      const refined = await refineSketch(data.id);
      useBlueprintStore.getState().actions.loadBlueprint(refined);
      navigation.navigate('Workspace', undefined);
    } catch (err) {
      Alert.alert('Refinement failed', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setIsRefining(false);
    }
  }, [walls, closedPolygon, medium, navigation]);

  const accentColor = DS.colors.primary;

  // Mode toggle press animation
  const modePressScale = useSharedValue(1);
  const modeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modePressScale.value }],
  }));
  const handleModePressIn = () => {
    modePressScale.value = withSpring(0.97, { damping: 14, stiffness: 300 });
  };
  const handleModePressOut = () => {
    modePressScale.value = withSpring(1, { damping: 14, stiffness: 300 });
  };

  // Bottom toolbar press animation
  const toolPressScale = useSharedValue(1);
  const toolAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: toolPressScale.value }],
  }));
  const handleToolPressIn = () => {
    toolPressScale.value = withSpring(0.97, { damping: 14, stiffness: 300 });
  };
  const handleToolPressOut = () => {
    toolPressScale.value = withSpring(1, { damping: 14, stiffness: 300 });
  };

  const TOOLS: { id: DrawTool; label: string }[] = [
    { id: 'wall', label: 'Wall' },
    { id: 'line', label: 'Line' },
    { id: 'curve', label: 'Curve' },
    { id: 'arc', label: 'Arc' },
    { id: 'eraser', label: 'Erase' },
    { id: 'dimension', label: 'Dim' },
    { id: 'text', label: 'Text' },
  ];

  return (
    <Animated.View style={{ flex: 1, backgroundColor: DS.colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <Animated.View style={[headerAnimStyle, { paddingHorizontal: 20, paddingVertical: 14 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 24, color: DS.colors.primary }}>
              Sketch
            </ArchText>
          </View>

          {/* Mode toggle pill */}
          <Animated.View style={[
            modeAnimatedStyle,
            {
              flexDirection: 'row',
              backgroundColor: DS.colors.surfaceHigh,
              borderRadius: 999,
              padding: 3,
              borderWidth: 1,
              borderColor: DS.colors.border,
              alignSelf: 'flex-start',
            },
          ]}>
            {(['draw', 'presets'] as SketchMode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => { light(); setMode(m); }}
                onPressIn={handleModePressIn}
                onPressOut={handleModePressOut}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: mode === m ? accentColor : 'transparent',
                }}
              >
                <ArchText variant="body" style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 13,
                  color: mode === m ? DS.colors.background : DS.colors.primaryDim,
                  textTransform: 'capitalize',
                }}>
                  {m}
                </ArchText>
              </Pressable>
            ))}
          </Animated.View>
        </Animated.View>

        {mode === 'draw' ? (
          /* --- Draw mode --- */
          <Animated.View style={[canvasAnimStyle, { flex: 1, maxWidth: 1200, alignSelf: 'center' }]}>
            <ErrorBoundary fallback={<View style={{ width: SCREEN_W, height: CANVAS_H, backgroundColor: '#1A1A1A' }} />}>
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
                    color={closedPolygon?.some((cw) => cw.id === w.id) ? accentColor : DS.colors.primary}
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

                {/* Line tool preview: first anchor dot */}
                {tool === 'line' && lineAnchor !== null && (
                  <SkiaCircle
                    cx={metreToPixel(lineAnchor.x, skScale.current, skOffsetX.current)}
                    cy={metreToPixel(lineAnchor.y, skScale.current, skOffsetY.current)}
                    r={8}
                    color={accentColor}
                  />
                )}

                {/* Curve tool preview: points + smooth curve */}
                {tool === 'curve' && curvePoints.length > 0 && (() => {
                  const m2p = (pt: Vector2D) => ({
                    x: metreToPixel(pt.x, skScale.current, skOffsetX.current),
                    y: metreToPixel(pt.y, skScale.current, skOffsetY.current),
                  });
                  const pixelPts = curvePoints.map(m2p);
                  // Build SVG path string (Catmull-Rom → cubic Bezier)
                  const svgParts: string[] = [];
                  if (pixelPts.length > 0) {
                    svgParts.push(`M ${pixelPts[0].x} ${pixelPts[0].y}`);
                    if (pixelPts.length === 2) {
                      svgParts.push(`L ${pixelPts[1].x} ${pixelPts[1].y}`);
                    } else if (pixelPts.length > 2) {
                      for (let i = 0; i < pixelPts.length - 1; i++) {
                        const p0 = pixelPts[Math.max(0, i - 1)];
                        const p1 = pixelPts[i];
                        const p2 = pixelPts[i + 1];
                        const p3 = pixelPts[Math.min(pixelPts.length - 1, i + 2)];
                        const cp1x = p1.x + (p2.x - p0.x) * 0.35;
                        const cp1y = p1.y + (p2.y - p0.y) * 0.35;
                        const cp2x = p2.x - (p3.x - p1.x) * 0.35;
                        const cp2y = p2.y - (p3.y - p1.y) * 0.35;
                        svgParts.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`);
                      }
                    }
                  }
                  const curvePath = Skia.Path.Make();
                  if (pixelPts.length === 2) {
                    curvePath.moveTo(pixelPts[0].x, pixelPts[0].y);
                    curvePath.lineTo(pixelPts[1].x, pixelPts[1].y);
                  } else if (pixelPts.length > 2) {
                    // Approximate Catmull-Rom with line segments (20 per segment)
                    for (let i = 0; i < pixelPts.length - 1; i++) {
                      const p0 = pixelPts[Math.max(0, i - 1)];
                      const p1 = pixelPts[i];
                      const p2 = pixelPts[i + 1];
                      const p3 = pixelPts[Math.min(pixelPts.length - 1, i + 2)];
                      for (let t = 0; t <= 1; t += 0.05) {
                        const t2 = t * t;
                        const t3 = t2 * t;
                        const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
                        const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
                        if (t === 0 && i === 0) curvePath.moveTo(x, y);
                        else curvePath.lineTo(x, y);
                      }
                    }
                  }
                  return (
                    <>
                      {pixelPts.map((pt, i) => (
                        <SkiaCircle key={i} cx={pt.x} cy={pt.y} r={i === 0 ? 8 : 5} color={i === 0 ? accentColor : `${accentColor}aa`} />
                      ))}
                      <SkiaPath
                        path={curvePath}
                        style="stroke"
                        strokeWidth={2.5}
                        color={`${accentColor}cc`}
                      />
                    </>
                  );
                })()}

                {/* Arc tool preview */}
                {tool === 'arc' && arcStart !== null && (() => {
                  const startPx = { x: metreToPixel(arcStart.x, skScale.current, skOffsetX.current), y: metreToPixel(arcStart.y, skScale.current, skOffsetY.current) };
                  const endPx = arcEnd !== null ? { x: metreToPixel(arcEnd.x, skScale.current, skOffsetX.current), y: metreToPixel(arcEnd.y, skScale.current, skOffsetY.current) } : null;
                  const dragPx = skArcDragActive.current ? { x: metreToPixel(skArcDragX.current, skScale.current, skOffsetX.current), y: metreToPixel(skArcDragY.current, skScale.current, skOffsetY.current) } : null;

                  let arcPath: ReturnType<typeof Skia.Path.Make> | null = null;
                  if (endPx !== null && dragPx !== null) {
                    // Circular arc from start to end through drag direction
                    const { r, startAngle, endAngle } = circularArcPoints(
                      arcStart,
                      arcEnd ?? arcStart,
                      { x: skArcDragX.current - (arcStart.x), y: skArcDragY.current - (arcStart.y) }
                    );
                    const arcR = r * skScale.current * PIXELS_PER_METRE;
                    const sweep = ((endAngle - startAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
                    const useSmallArc = Math.abs(sweep) <= Math.PI;
                    const isCCW = sweep < 0;
                    arcPath = Skia.Path.Make();
                    arcPath.moveTo(startPx.x, startPx.y);
                    // Sample arc as line segments
                    const { cx, cy } = circularArcPoints(
                      arcStart,
                      arcEnd ?? arcStart,
                      { x: skArcDragX.current - arcStart.x, y: skArcDragY.current - arcStart.y }
                    );
                    const acx = metreToPixel(cx, skScale.current, skOffsetX.current);
                    const acy = metreToPixel(cy, skScale.current, skOffsetY.current);
                    const asteps = 24;
                    for (let i = 1; i <= asteps; i++) {
                      const a = startAngle + (sweep / asteps) * i;
                      arcPath.lineTo(acx + arcR * Math.cos(a), acy + arcR * Math.sin(a));
                    }
                  }
                  return (
                    <>
                      {/* Start anchor */}
                      <SkiaCircle cx={startPx.x} cy={startPx.y} r={8} color={accentColor} />
                      {/* End anchor */}
                      {endPx !== null && <SkiaCircle cx={endPx.x} cy={endPx.y} r={8} color={accentColor} />}
                      {/* Drag indicator */}
                      {endPx !== null && dragPx !== null && (
                        <>
                          <SkiaLine p1={startPx} p2={endPx} strokeWidth={1} color={`${accentColor}44`} />
                          <SkiaLine p1={endPx} p2={dragPx} strokeWidth={1.5} color={`${accentColor}88`} />
                          {arcPath && <SkiaPath path={arcPath} style="stroke" strokeWidth={2.5} color={`${accentColor}cc`} />}
                          <SkiaCircle cx={dragPx.x} cy={dragPx.y} r={6} color={accentColor} />
                        </>
                      )}
                      {endPx === null && (
                        <SkiaLine
                          p1={startPx}
                          p2={dragPx ?? { x: startPx.x + 40, y: startPx.y - 30 }}
                          strokeWidth={1.5}
                          color={`${accentColor}88`}
                        />
                      )}
                    </>
                  );
                })()}
                </Canvas>
              </GestureDetector>
            </ErrorBoundary>

            {/* Refine with AI loading overlay */}
            {isRefining && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11,30,61,0.85)', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <CompassRoseLoader size="large" />
                <ArchText variant="body" style={{ fontFamily: DS.font.heading, fontSize: 18, color: DS.colors.primary, marginTop: 20 }}>
                  Refining sketch...
                </ArchText>
                <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryDim, marginTop: 8 }}>
                  Converting to architectural standards
                </ArchText>
              </View>
            )}

            {/* Bottom toolbar */}
            <Animated.View style={[
              toolAnimatedStyle,
              {
                position: 'absolute',
                bottom: 90,
                left: 20,
                right: 20,
                flexDirection: 'row',
                backgroundColor: DS.colors.surfaceHigh,
                borderRadius: 999,
                padding: 6,
                borderWidth: 1,
                borderColor: DS.colors.border,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              },
            ]}>
              <Animated.View style={toolbarAnimStyle}>
              {TOOLS.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => { light(); setTool(t.id); }}
                  onPressIn={handleToolPressIn}
                  onPressOut={handleToolPressOut}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 999,
                    alignItems: 'center',
                    backgroundColor: tool === t.id ? accentColor : 'transparent',
                  }}
                >
                  <ArchText variant="body" style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 12,
                    color: tool === t.id ? DS.colors.background : DS.colors.primaryDim,
                  }}>
                    {t.label}
                  </ArchText>
                </Pressable>
              ))}

              {/* Divider */}
              <View style={{ width: 1, height: 24, backgroundColor: DS.colors.border, marginHorizontal: 4 }} />

              {/* Refine with AI — Pro/Architect only */}
              {refineAllowed && walls.length > 0 && (
                <Pressable
                  onPress={handleRefineWithAI}
                  onPressIn={handleToolPressIn}
                  onPressOut={handleToolPressOut}
                  disabled={isRefining}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: isRefining ? DS.colors.surfaceHigh : `${DS.colors.warning}18`,
                    borderWidth: 1,
                    borderColor: isRefining ? DS.colors.border : `${DS.colors.warning}60`,
                    alignItems: 'center',
                  }}
                >
                  <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: isRefining ? DS.colors.primaryGhost : DS.colors.warning }}>
                    Refine with AI
                  </ArchText>
                </Pressable>
              )}

              {/* Divider */}
              <View style={{ width: 1, height: 24, backgroundColor: DS.colors.border, marginHorizontal: 4 }} />

              {/* Send to Blueprint */}
              <Pressable
                onPress={handleSend}
                onPressIn={handleToolPressIn}
                onPressOut={handleToolPressOut}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: accentColor,
                  alignItems: 'center',
                }}
              >
                <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: DS.colors.background }}>
                  Send ↗
                </ArchText>
              </Pressable>
              </Animated.View>
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
