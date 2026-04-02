import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import Svg, { Line, Circle, Path, Text as SvgText, Polygon } from 'react-native-svg';
import { ArchText } from '../common/ArchText';
import { TierGate } from '../common/TierGate';
import { DS } from '../../theme/designSystem';

interface Point { x: number; y: number; }
interface Measurement { p1: Point; p2: Point; metres: number; }

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
        <Circle cx="16" cy="16" r="4" stroke={DS.colors.primary} strokeWidth="1.5" fill="none" />
        <Line x1="16" y1="2" x2="16" y2="10" stroke={DS.colors.primary} strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="16" y1="22" x2="16" y2="30" stroke={DS.colors.primary} strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="2" y1="16" x2="10" y2="16" stroke={DS.colors.primary} strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="22" y1="16" x2="30" y2="16" stroke={DS.colors.primary} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

// Anchor pin at a tapped point
function AnchorPin({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <View style={{ position: 'absolute', left: x - 6, top: y - 6, alignItems: 'center' }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: DS.colors.primary, borderWidth: 2, borderColor: DS.colors.background }} />
      <View style={{ backgroundColor: 'rgba(34,34,34,0.88)', borderRadius: 50, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4, borderWidth: 1, borderColor: DS.colors.border }}>
        <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: DS.colors.primary }}>{label}</ArchText>
      </View>
    </View>
  );
}

// Tab switcher at top of measure mode
function MeasureTabBar({ active, onChange }: { active: MeasureTab; onChange: (t: MeasureTab) => void }) {
  return (
    <View style={{
      position: 'absolute', top: 100, left: 24, right: 24, alignItems: 'center', zIndex: 20,
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
              backgroundColor: active === tab ? DS.colors.primary : 'transparent',
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

// ── Wall measure mode (original single-segment) ────────────────────────────

function WallMeasure() {
  const [point1, setPoint1] = useState<Point | null>(null);
  const [point2, setPoint2] = useState<Point | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  const currentDistance = point1 && point2
    ? Math.round((Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)) / 100) * 10) / 10
    : null;

  const handleTap = (x: number, y: number) => {
    if (!point1) {
      setPoint1({ x, y });
    } else if (!point2) {
      setPoint2({ x, y });
    } else {
      setPoint1({ x, y });
      setPoint2(null);
    }
  };

  const saveMeasurement = () => {
    if (!point1 || !point2 || currentDistance === null) return;
    setMeasurements(prev => [...prev, { p1: point1, p2: point2, metres: currentDistance }]);
    setPoint1(null);
    setPoint2(null);
  };

  const clearAll = () => {
    setPoint1(null);
    setPoint2(null);
    setMeasurements([]);
  };

  return (
    <Pressable
      style={{ flex: 1 }}
      onPress={(e) => handleTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}
    >
      {/* Instruction pill */}
      <View style={{ position: 'absolute', top: 160, left: 24, right: 24, alignItems: 'center' }}>
        <View style={{
          backgroundColor: 'rgba(34,34,34,0.9)', borderRadius: 50,
          paddingHorizontal: 20, paddingVertical: 10,
          borderWidth: 1, borderColor: DS.colors.border,
        }}>
          <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primaryDim }}>
            {!point1 ? 'Tap to set first point' : !point2 ? 'Tap to set second point' : 'Tap to start new measurement'}
          </ArchText>
        </View>
      </View>

      {/* Saved measurements list */}
      {measurements.length > 0 && (
        <View style={{ position: 'absolute', top: 210, left: 24, right: 24, gap: 6 }}>
          {measurements.map((m, i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: 'rgba(34,34,34,0.88)', borderRadius: 50,
              paddingHorizontal: 16, paddingVertical: 8,
              borderWidth: 1, borderColor: DS.colors.border,
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: DS.colors.success }} />
              <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 13, color: DS.colors.primary }}>
                {m.metres}m
              </ArchText>
              <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: DS.colors.primaryGhost }}>
                / {Math.round(m.metres * 3.281 * 10) / 10}ft
              </ArchText>
            </View>
          ))}
        </View>
      )}

      {/* Anchor pins */}
      {point1 && <AnchorPin x={point1.x} y={point1.y} label="A" />}
      {point2 && <AnchorPin x={point2.x} y={point2.y} label="B" />}

      {/* Measurement line + distance badge */}
      {point1 && point2 && currentDistance !== null && (
        <>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
            <Svg width="100%" height="100%">
              <Line
                x1={point1.x} y1={point1.y}
                x2={point2.x} y2={point2.y}
                stroke={DS.colors.primary}
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
            </Svg>
          </View>

          <View style={{
            position: 'absolute',
            left: (point1.x + point2.x) / 2 - 50,
            top: (point1.y + point2.y) / 2 - 18,
            backgroundColor: 'rgba(34,34,34,0.95)',
            borderRadius: 50, paddingHorizontal: 14, paddingVertical: 7,
            borderWidth: 1.5, borderColor: DS.colors.primary,
          }}>
            <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 14, color: DS.colors.primary }}>
              {currentDistance}m / {Math.round(currentDistance * 3.281 * 10) / 10}ft
            </ArchText>
          </View>
        </>
      )}

      {/* Action buttons */}
      {point1 && point2 && (
        <View style={{ position: 'absolute', bottom: 48, left: 20, right: 20, gap: 10 }}>
          <Pressable
            onPress={saveMeasurement}
            style={{ backgroundColor: DS.colors.primary, borderRadius: 50, paddingVertical: 14, alignItems: 'center' }}
          >
            <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 16, color: DS.colors.background }}>
              Add to Project Notes
            </ArchText>
          </Pressable>
          {measurements.length > 0 && (
            <Pressable
              style={{ backgroundColor: DS.colors.surface, borderRadius: 50, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: DS.colors.border }}
            >
              <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primary }}>
                Save All {measurements.length + 1} Measurements
              </ArchText>
            </Pressable>
          )}
          <Pressable onPress={clearAll} style={{ paddingVertical: 10, alignItems: 'center' }}>
            <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost }}>
              Clear All
            </ArchText>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

// ── Room corner-to-corner tracing mode ────────────────────────────────────

function dist(a: Point, b: Point) {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

function polygonArea(pts: Point[]) {
  // Shoelace formula — screen pixels → then convert to m²
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.abs(area / 2);
}

function segmentLabel(a: Point, b: Point): string {
  const px = dist(a, b);
  const metres = Math.round((px / 100) * 10) / 10;
  return `${metres}m`;
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function RoomMiniMap({ corners }: { corners: Point[] }) {
  if (corners.length < 2) return null;

  // Find bounding box to normalize into 80×80 preview
  const xs = corners.map(p => p.x);
  const ys = corners.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const PAD = 10, SIZE = 80;
  const scale = (SIZE - PAD * 2) / Math.max(rangeX, rangeY);

  const norm = (p: Point) => ({
    x: PAD + (p.x - minX) * scale,
    y: PAD + (p.y - minY) * scale,
  });

  const normalized = corners.map(norm);
  const pointsStr = normalized.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={{
      position: 'absolute', top: 160, right: 16,
      width: 88, height: 88,
      backgroundColor: 'rgba(26,26,26,0.92)',
      borderRadius: 16, borderWidth: 1, borderColor: DS.colors.border,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Svg width={SIZE} height={SIZE}>
        {corners.length >= 3 && (
          <Polygon
            points={pointsStr}
            stroke={DS.colors.primary}
            strokeWidth="1"
            fill={`${DS.colors.primary}18`}
            strokeDasharray="3 2"
          />
        )}
        {normalized.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={DS.colors.primary} />
        ))}
        {normalized.slice(0, -1).map((p, i) => {
          const q = normalized[i + 1];
          return <Line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={DS.colors.primary} strokeWidth="1" />;
        })}
      </Svg>
      <ArchText variant="body" style={{ position: 'absolute', bottom: 6, fontFamily: 'JetBrainsMono_400Regular', fontSize: 8, color: DS.colors.primaryGhost }}>
        Floor Plan
      </ArchText>
    </View>
  );
}

function RoomMeasure() {
  const [corners, setCorners] = useState<Point[]>([]);
  const [closed, setClosed] = useState(false);

  const CLOSE_RADIUS = 30; // px proximity to first corner to close the polygon

  const handleTap = (x: number, y: number) => {
    if (closed) return;

    if (corners.length >= 3) {
      const first = corners[0];
      if (dist({ x, y }, first) <= CLOSE_RADIUS) {
        setClosed(true);
        return;
      }
    }
    setCorners(prev => [...prev, { x, y }]);
  };

  const areaPixels = closed ? polygonArea(corners) : 0;
  const areaMetres = Math.round((areaPixels / (100 * 100)) * 100) / 100;

  const reset = () => {
    setCorners([]);
    setClosed(false);
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
      <View style={{ position: 'absolute', top: 160, left: 24, right: closed ? 112 : 24, alignItems: 'flex-start' }}>
        <View style={{
          backgroundColor: 'rgba(34,34,34,0.9)', borderRadius: 50,
          paddingHorizontal: 20, paddingVertical: 10,
          borderWidth: 1, borderColor: closed ? DS.colors.success : DS.colors.border,
        }}>
          <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: closed ? DS.colors.success : DS.colors.primaryDim }}>
            {instruction}
          </ArchText>
        </View>
      </View>

      {/* Mini floor-plan preview */}
      <RoomMiniMap corners={corners} />

      {/* SVG overlay: lines + wall-length labels */}
      {corners.length >= 1 && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
          <Svg width="100%" height="100%">
            {/* Drawn segments */}
            {corners.slice(0, -1).map((pt, i) => {
              const next = corners[i + 1];
              const mid = midpoint(pt, next);
              return (
                <React.Fragment key={i}>
                  <Line
                    x1={pt.x} y1={pt.y} x2={next.x} y2={next.y}
                    stroke={DS.colors.primary} strokeWidth="1.5" strokeDasharray="6 3"
                  />
                  <SvgText
                    x={mid.x} y={mid.y - 8}
                    fontSize="11" fill={DS.colors.primary}
                    textAnchor="middle" fontFamily="JetBrainsMono_400Regular"
                  >
                    {segmentLabel(pt, next)}
                  </SvgText>
                </React.Fragment>
              );
            })}
            {/* Closing segment when polygon is closed */}
            {closed && corners.length >= 3 && (() => {
              const last = corners[corners.length - 1];
              const first = corners[0];
              const mid = midpoint(last, first);
              return (
                <React.Fragment>
                  <Line
                    x1={last.x} y1={last.y} x2={first.x} y2={first.y}
                    stroke={DS.colors.success} strokeWidth="1.5"
                  />
                  <SvgText
                    x={mid.x} y={mid.y - 8}
                    fontSize="11" fill={DS.colors.success}
                    textAnchor="middle" fontFamily="JetBrainsMono_400Regular"
                  >
                    {segmentLabel(last, first)}
                  </SvgText>
                </React.Fragment>
              );
            })()}
            {/* "Near first corner" proximity guide ring */}
            {!closed && corners.length >= 3 && (
              <Circle cx={corners[0].x} cy={corners[0].y} r={CLOSE_RADIUS}
                stroke={DS.colors.primary} strokeWidth="1" strokeDasharray="4 3" fill="none" opacity="0.4" />
            )}
          </Svg>
        </View>
      )}

      {/* Corner anchor dots */}
      {corners.map((pt, i) => (
        <AnchorPin key={i} x={pt.x} y={pt.y} label={String(i + 1)} />
      ))}

      {/* Closed room: area badge + actions */}
      {closed && (
        <>
          {/* Area badge at centroid approx */}
          {(() => {
            const cx = corners.reduce((s, p) => s + p.x, 0) / corners.length;
            const cy = corners.reduce((s, p) => s + p.y, 0) / corners.length;
            return (
              <View style={{
                position: 'absolute',
                left: cx - 60, top: cy - 20,
                backgroundColor: 'rgba(34,34,34,0.96)',
                borderRadius: 50, paddingHorizontal: 18, paddingVertical: 9,
                borderWidth: 1.5, borderColor: DS.colors.success,
              }}>
                <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 14, color: DS.colors.success }}>
                  {areaMetres} m²
                </ArchText>
              </View>
            );
          })()}

          <View style={{ position: 'absolute', bottom: 48, left: 20, right: 20, gap: 10 }}>
            <Pressable
              style={{ backgroundColor: DS.colors.primary, borderRadius: 50, paddingVertical: 14, alignItems: 'center' }}
            >
              <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 16, color: DS.colors.background }}>
                Import Room to Studio
              </ArchText>
            </Pressable>
            <Pressable
              style={{ backgroundColor: DS.colors.surface, borderRadius: 50, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: DS.colors.border }}
            >
              <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primary }}>
                Save to Project Notes
              </ArchText>
            </Pressable>
            <Pressable onPress={reset} style={{ paddingVertical: 10, alignItems: 'center' }}>
              <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost }}>
                Trace Again
              </ArchText>
            </Pressable>
          </View>
        </>
      )}
    </Pressable>
  );
}

// ── Root content with tab switcher ────────────────────────────────────────

function ARMeasureModeContent() {
  const [tab, setTab] = useState<MeasureTab>('wall');

  return (
    <View style={{ flex: 1 }}>
      <MeasureTabBar active={tab} onChange={setTab} />
      {tab === 'wall' ? <WallMeasure /> : <RoomMeasure />}
    </View>
  );
}
