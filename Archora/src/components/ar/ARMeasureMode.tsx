import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Line, Circle, Path } from 'react-native-svg';
import { ArchText } from '../common/ArchText';
import { TierGate } from '../common/TierGate';
import { DS } from '../../theme/designSystem';

interface Point { x: number; y: number; }
interface Measurement { p1: Point; p2: Point; metres: number; }

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

function ARMeasureModeContent() {
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
      // Reset for next measurement
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
          {/* SVG line between points */}
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

          {/* Distance badge at midpoint */}
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
