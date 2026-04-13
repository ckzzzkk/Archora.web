import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Line, Circle, Path, Text as SvgText, Polygon } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArchText } from '../common/ArchText';
import { TierGate } from '../common/TierGate';
import { DS } from '../../theme/designSystem';
import { useARCore } from '../../hooks/useARCore';
import type { Vector3D } from '../../native/ARCoreModule';

interface Point2D { x: number; y: number; }

interface Measurement3D {
  p1: Vector3D;
  p2: Vector3D;
  /** Screen positions for overlay rendering */
  screenP1: Point2D;
  screenP2: Point2D;
  metres: number;
}

type MeasureTab = 'wall' | 'room';

export function ARMeasureMode() {
  return (
    <TierGate feature="arMeasure" featureLabel="AR Measure">
      <ARMeasureModeContent />
    </TierGate>
  );
}

// Crosshair targeting reticle
function Crosshair({ x, y }: { x: number; y: number }) {
  return (
    <View style={{ position: 'absolute', left: x - 16, top: y - 16, width: 32, height: 32 }}>
      <Svg width={32} height={32} viewBox="0 0 32 32">
        <Circle cx="16" cy="16" r="4" stroke={DS.colors.success} strokeWidth="1.5" fill="none" />
        <Line x1="16" y1="2" x2="16" y2="10" stroke={DS.colors.success} strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="16" y1="22" x2="16" y2="30" stroke={DS.colors.success} strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="2" y1="16" x2="10" y2="16" stroke={DS.colors.success} strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="22" y1="16" x2="30" y2="16" stroke={DS.colors.success} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

// Anchor pin at a tapped point
function AnchorPin({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <View style={{ position: 'absolute', left: x - 6, top: y - 6, alignItems: 'center' }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: DS.colors.success, borderWidth: 2, borderColor: DS.colors.background }} />
      <View style={{ backgroundColor: 'rgba(34,34,34,0.88)', borderRadius: 50, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4, borderWidth: 1, borderColor: DS.colors.border }}>
        <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: DS.colors.success }}>{label}</ArchText>
      </View>
    </View>
  );
}

// Tab switcher
function MeasureTabBar({ active, onChange }: { active: MeasureTab; onChange: (t: MeasureTab) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{
      position: 'absolute', top: insets.top + 20, left: 24, right: 24, alignItems: 'center', zIndex: 20,
    }}>
      <View style={{
        flexDirection: 'row',
        backgroundColor: 'rgba(26,26,26,0.95)',
        borderRadius: 50, borderWidth: 1, borderColor: DS.colors.border,
        padding: 3, gap: 2,
      }}>
        {(['wall', 'room'] as MeasureTab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            style={{
              paddingHorizontal: 22, paddingVertical: 8,
              borderRadius: 50,
              backgroundColor: active === tab ? DS.colors.success : 'transparent',
            }}
          >
            <ArchText variant="body" style={{
              fontFamily: 'Inter_500Medium', fontSize: 13,
              color: active === tab ? DS.colors.background : DS.colors.primaryDim,
            }}>
              {tab === 'wall' ? 'Wall' : 'Room'}
            </ArchText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function WallMeasure() {
  const insets = useSafeAreaInsets();
  const { state, startSession, stopSession, hitTest: arHitTest, distanceBetween: arDistance } = useARCore();

  const [point1, setPoint1] = useState<{ world: Vector3D; screen: Point2D } | null>(null);
  const [point2, setPoint2] = useState<{ world: Vector3D; screen: Point2D } | null>(null);
  const [measurements, setMeasurements] = useState<Measurement3D[]>([]);
  const [status, setStatus] = useState<'ready' | 'point1' | 'point2' | 'done'>('ready');

  // Start AR session
  useEffect(() => {
    void startSession();
    return () => { void stopSession(); };
  }, [startSession, stopSession]);

  const currentMetres = point1 && point2
    ? (async () => {
        const d = await arDistance(point1.world, point2.world);
        return Math.round(d * 100) / 100;
      })()
    : null;

  const handleTap = useCallback(
    async (x: number, y: number) => {
      if (!state.isSessionActive) return;

      const worldPos: Vector3D | null = await arHitTest(x, y);
      if (!worldPos) return;

      if (!point1) {
        setPoint1({ world: worldPos, screen: { x, y } });
        setStatus('point1');
      } else if (!point2) {
        setPoint2({ world: worldPos, screen: { x, y } });
        setStatus('point2');
      } else {
        setPoint1({ world: worldPos, screen: { x, y } });
        setPoint2(null);
        setStatus('point1');
      }
    },
    [state.isSessionActive, point1, point2, arHitTest],
  );

  const saveMeasurement = useCallback(async () => {
    if (!point1 || !point2) return;
    const d = await arDistance(point1.world, point2.world);
    const metres = Math.round(d * 100) / 100;
    setMeasurements(prev => [...prev, {
      p1: point1.world,
      p2: point2.world,
      screenP1: point1.screen,
      screenP2: point2.screen,
      metres,
    }]);
    setPoint1(null);
    setPoint2(null);
    setStatus('ready');
  }, [point1, point2, arDistance]);

  const clearAll = () => {
    setPoint1(null);
    setPoint2(null);
    setMeasurements([]);
    setStatus('ready');
  };

  const instructionText = ({
    ready: 'Point at a surface and tap to set first point',
    point1: 'Tap to set second point',
    point2: 'Tap to start new measurement',
  } as Record<string, string>)[status];

  return (
    <Pressable
      style={{ flex: 1 }}
      onPress={(e) => handleTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}
    >
      {/* Instruction pill */}
      <View style={{ position: 'absolute', top: insets.top + 80, left: 24, right: 24, alignItems: 'center' }}>
        <View style={{
          backgroundColor: 'rgba(34,34,34,0.9)', borderRadius: 50,
          paddingHorizontal: 20, paddingVertical: 10,
          borderWidth: 1, borderColor: DS.colors.border,
        }}>
          <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primaryDim }}>
            {!state.isSessionActive ? 'Starting AR…' : instructionText}
          </ArchText>
        </View>
      </View>

      {/* Saved measurements list */}
      {measurements.length > 0 && (
        <View style={{ position: 'absolute', top: insets.top + 130, left: 24, right: 24, gap: 6 }}>
          {measurements.map((m, i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: 'rgba(34,34,34,0.88)', borderRadius: 50,
              paddingHorizontal: 16, paddingVertical: 8,
              borderWidth: 1, borderColor: DS.colors.border,
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: DS.colors.success }} />
              <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 13, color: DS.colors.success }}>
                {m.metres.toFixed(2)}m
              </ArchText>
              <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: DS.colors.primaryGhost }}>
                / {Math.round(m.metres * 3.281 * 10) / 10}ft
              </ArchText>
            </View>
          ))}
        </View>
      )}

      {/* Anchor pins */}
      {point1 && <AnchorPin x={point1.screen.x} y={point1.screen.y} label="A" />}
      {point2 && <AnchorPin x={point2.screen.x} y={point2.screen.y} label="B" />}

      {/* Current measurement overlay */}
      {point1 && point2 && (
        <MeasureOverlay p1={point1.screen} p2={point2.screen} metres={null} arDistance={arDistance} p1World={point1.world} p2World={point2.world} />
      )}

      {/* Action buttons */}
      {point1 && point2 && (
        <View style={{ position: 'absolute', bottom: insets.bottom + 24, left: 20, right: 20, gap: 10 }}>
          <Pressable
            onPress={(e) => { e.stopPropagation(); void saveMeasurement(); }}
            style={{ backgroundColor: DS.colors.success, borderRadius: 50, paddingVertical: 14, alignItems: 'center' }}
          >
            <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 16, color: DS.colors.background }}>
              Save Measurement
            </ArchText>
          </Pressable>
          <Pressable onPress={(e) => { e.stopPropagation(); clearAll(); }} style={{ paddingVertical: 10, alignItems: 'center' }}>
            <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost }}>
              Clear All
            </ArchText>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

// Renders the dashed line + distance badge for a wall measurement
function MeasureOverlay({
  p1, p2, metres, arDistance, p1World, p2World
}: {
  p1: Point2D; p2: Point2D;
  metres: number | null;
  arDistance: (a: Vector3D, b: Vector3D) => Promise<number>;
  p1World: Vector3D; p2World: Vector3D;
}) {
  const [displayM, setDisplayM] = useState<number | null>(null);

  useEffect(() => {
    if (metres !== null) { setDisplayM(metres); return; }
    void arDistance(p1World, p2World).then(d => setDisplayM(Math.round(d * 100) / 100));
  }, [metres, arDistance, p1World, p2World]);

  if (displayM === null) return null;

  const midX = (p1.x + p2.x) / 2 - 50;
  const midY = (p1.y + p2.y) / 2 - 18;

  return (
    <>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
        <Svg width="100%" height="100%">
          <Line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={DS.colors.success} strokeWidth="1.5" strokeDasharray="6 4" />
        </Svg>
      </View>
      <View style={{
        position: 'absolute',
        left: midX + 50, top: midY,
        backgroundColor: 'rgba(34,34,34,0.95)',
        borderRadius: 50, paddingHorizontal: 14, paddingVertical: 7,
        borderWidth: 1.5, borderColor: DS.colors.success,
      }}>
        <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 14, color: DS.colors.success }}>
          {displayM.toFixed(2)}m
        </ArchText>
      </View>
    </>
  );
}

function dist2D(a: Point2D, b: Point2D) {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

function midpoint2D(a: Point2D, b: Point2D): Point2D {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function polygonAreaScreen(pts: Point2D[]) {
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.abs(area / 2);
}

function RoomMiniMap({ corners }: { corners: Point2D[] }) {
  const insets = useSafeAreaInsets();
  if (corners.length < 2) return null;

  const xs = corners.map(p => p.x);
  const ys = corners.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const PAD = 10, SIZE = 80;
  const scale = (SIZE - PAD * 2) / Math.max(rangeX, rangeY);

  const norm = (p: Point2D) => ({ x: PAD + (p.x - minX) * scale, y: PAD + (p.y - minY) * scale });
  const normalized = corners.map(norm);
  const pointsStr = normalized.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={{
      position: 'absolute', top: insets.top + 80, right: 16,
      width: 88, height: 88,
      backgroundColor: 'rgba(26,26,26,0.92)',
      borderRadius: 16, borderWidth: 1, borderColor: DS.colors.border,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Svg width={SIZE} height={SIZE}>
        {corners.length >= 3 && (
          <Polygon points={pointsStr} stroke={DS.colors.success} strokeWidth="1" fill={`${DS.colors.success}18`} strokeDasharray="3 2" />
        )}
        {normalized.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={DS.colors.success} />
        ))}
        {normalized.slice(0, -1).map((p, i) => (
          <Line key={i} x1={p.x} y1={p.y} x2={normalized[i + 1].x} y2={normalized[i + 1].y} stroke={DS.colors.success} strokeWidth="1" />
        ))}
      </Svg>
      <ArchText variant="body" style={{ position: 'absolute', bottom: 6, fontFamily: 'JetBrainsMono_400Regular', fontSize: 8, color: DS.colors.primaryGhost }}>
        Floor Plan
      </ArchText>
    </View>
  );
}

interface RoomCorner3D {
  world: Vector3D;
  screen: Point2D;
}

function RoomMeasure() {
  const insets = useSafeAreaInsets();
  const { state, startSession, stopSession, hitTest: arHitTest, distanceBetween: arDistance } = useARCore();
  const [corners, setCorners] = useState<RoomCorner3D[]>([]);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    void startSession();
    return () => { void stopSession(); };
  }, [startSession, stopSession]);

  const CLOSE_RADIUS = 30;

  const handleTap = useCallback(
    async (x: number, y: number) => {
      if (closed || !state.isSessionActive) return;

      const worldPos: Vector3D | null = await arHitTest(x, y);
      if (!worldPos) return;

      const newCorner: RoomCorner3D = { world: worldPos, screen: { x, y } };

      if (corners.length >= 3) {
        const first = corners[0];
        if (dist2D({ x, y }, first.screen) <= CLOSE_RADIUS) {
          setClosed(true);
          return;
        }
      }
      setCorners(prev => [...prev, newCorner]);
    },
    [closed, state.isSessionActive, corners, arHitTest],
  );

  // Calculate total wall length and estimated floor area from real 3D distances
  const [totalWallLength, setTotalWallLength] = useState(0);
  useEffect(() => {
    if (corners.length < 2) return;
    void (async () => {
      let total = 0;
      for (let i = 0; i < corners.length - 1; i++) {
        total += await arDistance(corners[i].world, corners[i + 1].world);
      }
      if (closed && corners.length >= 3) {
        total += await arDistance(corners[corners.length - 1].world, corners[0].world);
      }
      setTotalWallLength(Math.round(total * 100) / 100);
    })();
  }, [corners, closed, arDistance]);

  // Approximate room area using screen polygon scaled by avg wall distance / avg screen distance
  const screenAreaPixels = closed ? polygonAreaScreen(corners.map(c => c.screen)) : 0;
  const avgWallLen = corners.length >= 2
    ? totalWallLength / (closed ? corners.length : corners.length - 1)
    : 0;
  const avgScreenDist = corners.length >= 2
    ? (() => {
        let s = 0;
        for (let i = 0; i < corners.length - 1; i++) s += dist2D(corners[i].screen, corners[i + 1].screen);
        if (closed && corners.length >= 3) s += dist2D(corners[corners.length - 1].screen, corners[0].screen);
        return s / (closed ? corners.length : corners.length - 1);
      })()
    : 0;
  const pxToMetres = avgScreenDist > 0 ? avgWallLen / avgScreenDist : 0;
  const estimatedAreaM2 = pxToMetres > 0 ? Math.round(screenAreaPixels * pxToMetres * pxToMetres * 100) / 100 : 0;

  const reset = () => {
    setCorners([]);
    setClosed(false);
    setTotalWallLength(0);
  };

  const instruction = closed
    ? 'Room traced'
    : corners.length === 0
      ? 'Tap each corner of the room'
      : corners.length < 3
        ? `Corner ${corners.length + 1} — tap next corner`
        : 'Tap near first corner to close room';

  return (
    <Pressable
      style={{ flex: 1 }}
      onPress={(e) => handleTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}
    >
      {/* Instruction pill */}
      <View style={{ position: 'absolute', top: insets.top + 80, left: 24, right: closed ? 112 : 24, alignItems: 'flex-start' }}>
        <View style={{
          backgroundColor: 'rgba(34,34,34,0.9)', borderRadius: 50,
          paddingHorizontal: 20, paddingVertical: 10,
          borderWidth: 1, borderColor: closed ? DS.colors.success : DS.colors.border,
        }}>
          <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: closed ? DS.colors.success : DS.colors.primaryDim }}>
            {!state.isSessionActive ? 'Starting AR…' : instruction}
          </ArchText>
        </View>
      </View>

      {/* Wall length + area badge */}
      {closed && totalWallLength > 0 && (
        <View style={{ position: 'absolute', top: insets.top + 130, left: 24, gap: 6 }}>
          <View style={{
            backgroundColor: 'rgba(34,34,34,0.88)', borderRadius: 50,
            paddingHorizontal: 16, paddingVertical: 8,
            borderWidth: 1, borderColor: DS.colors.border,
          }}>
            <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 12, color: DS.colors.primary }}>
              Perimeter: {totalWallLength.toFixed(2)}m
            </ArchText>
          </View>
          {estimatedAreaM2 > 0 && (
            <View style={{
              backgroundColor: 'rgba(34,34,34,0.88)', borderRadius: 50,
              paddingHorizontal: 16, paddingVertical: 8,
              borderWidth: 1, borderColor: DS.colors.border,
            }}>
              <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 12, color: DS.colors.primary }}>
                Area: ~{estimatedAreaM2.toFixed(1)}m²
              </ArchText>
            </View>
          )}
        </View>
      )}

      {/* Mini floor-plan preview */}
      <RoomMiniMap corners={corners.map(c => c.screen)} />

      {/* SVG overlay: lines + wall-length labels */}
      {corners.length >= 1 && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
          <Svg width="100%" height="100%">
            {corners.slice(0, -1).map((pt, i) => {
              const next = corners[i + 1];
              const mid = midpoint2D(pt.screen, next.screen);
              const wLen = totalWallLength > 0
                ? (async () => {
                    const d = await arDistance(pt.world, next.world);
                    return Math.round(d * 100) / 100;
                  })()
                : null;
              return (
                <React.Fragment key={i}>
                  <Line x1={pt.screen.x} y1={pt.screen.y} x2={next.screen.x} y2={next.screen.y}
                    stroke={DS.colors.success} strokeWidth="1.5" strokeDasharray="6 3" />
                </React.Fragment>
              );
            })}
            {closed && corners.length >= 3 && (() => {
              const last = corners[corners.length - 1];
              const first = corners[0];
              return (
                <Line x1={last.screen.x} y1={last.screen.y} x2={first.screen.x} y2={first.screen.y}
                  stroke={DS.colors.success} strokeWidth="1.5" />
              );
            })()}
            {!closed && corners.length >= 3 && (
              <Circle cx={corners[0].screen.x} cy={corners[0].screen.y} r={CLOSE_RADIUS}
                stroke={DS.colors.success} strokeWidth="1" strokeDasharray="4 3" fill="none" opacity="0.4" />
            )}
          </Svg>
        </View>
      )}

      {/* Corner anchor dots */}
      {corners.map((pt, i) => (
        <AnchorPin key={i} x={pt.screen.x} y={pt.screen.y} label={String(i + 1)} />
      ))}

      {/* Closed room: area badge + actions */}
      {closed && (
        <View style={{ position: 'absolute', bottom: insets.bottom + 24, left: 20, right: 20, gap: 10 }}>
          <Pressable
            onPress={(e) => { e.stopPropagation(); }}
            style={{ backgroundColor: DS.colors.success, borderRadius: 50, paddingVertical: 14, alignItems: 'center' }}
          >
            <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 16, color: DS.colors.background }}>
              Import Room to Studio
            </ArchText>
          </Pressable>
          <Pressable onPress={(e) => { e.stopPropagation(); reset(); }} style={{ paddingVertical: 10, alignItems: 'center' }}>
            <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost }}>
              Trace Again
            </ArchText>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

function ARMeasureModeContent() {
  const [tab, setTab] = useState<MeasureTab>('wall');

  return (
    <View style={{ flex: 1 }}>
      <MeasureTabBar active={tab} onChange={setTab} />
      {tab === 'wall' ? <WallMeasure /> : <RoomMeasure />}
    </View>
  );
}
