import React from 'react';
import { View } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, Polygon } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../common/ArchText';

interface Point { x: number; y: number; }


interface CrosshairProps {
  x: number;
  y: number;
}

export function Crosshair({ x, y }: CrosshairProps) {
  return (
    <View style={{ position: 'absolute', left: x - 20, top: y - 20, width: 40, height: 40 }}>
      <Svg width={40} height={40} viewBox="0 0 40 40">
        {/* Center dot */}
        <Circle cx="20" cy="20" r="3" fill={DS.colors.primary} />
        {/* Horizontal lines */}
        <Line x1="8" y1="20" x2="16" y2="20" stroke={DS.colors.primary} strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="24" y1="20" x2="32" y2="20" stroke={DS.colors.primary} strokeWidth="1.5" strokeLinecap="round" />
        {/* Vertical lines */}
        <Line x1="20" y1="8" x2="20" y2="16" stroke={DS.colors.primary} strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="20" y1="24" x2="20" y2="32" stroke={DS.colors.primary} strokeWidth="1.5" strokeLinecap="round" />
        {/* Outer circle */}
        <Circle cx="20" cy="20" r="15" stroke={DS.colors.primary} strokeWidth="1" fill="none" strokeDasharray="4 4" opacity="0.5" />
      </Svg>
    </View>
  );
}


interface AnchorPinProps {
  x: number;
  y: number;
  label: string;
  isFirst?: boolean;
}

export function AnchorPin({ x, y, label, isFirst }: AnchorPinProps) {
  return (
    <View style={{ position: 'absolute', left: x - 12, top: y - 12, alignItems: 'center' }}>
      <View style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: isFirst ? DS.colors.success : DS.colors.primary,
        borderWidth: 3,
        borderColor: DS.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <ArchText variant="body" style={{
          fontFamily: DS.font.monoBold,
          fontSize: 10,
          color: DS.colors.background,
        }}>
          {label}
        </ArchText>
      </View>
    </View>
  );
}


interface MeasurementLineProps {
  p1: Point;
  p2: Point;
  distance: number;
  isClosed?: boolean;
}

export function MeasurementLine({ p1, p2, distance, isClosed }: MeasurementLineProps) {
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  const color = isClosed ? DS.colors.success : DS.colors.primary;

  return (
    <>
      {/* SVG line */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
        <Svg width="100%" height="100%">
          <Line
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={color}
            strokeWidth="2"
            strokeDasharray={isClosed ? undefined : "6 4"}
          />
          {/* End caps */}
          <Circle cx={p1.x} cy={p1.y} r="4" fill={color} />
          <Circle cx={p2.x} cy={p2.y} r="4" fill={color} />
        </Svg>
      </View>

      {/* Distance badge */}
      <View style={{
        position: 'absolute',
        left: midX - 40,
        top: midY - 24,
        backgroundColor: 'rgba(26,26,26,0.95)',
        borderRadius: 50,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: color,
      }}>
        <ArchText variant="body" style={{
          fontFamily: DS.font.mono,
          fontSize: 12,
          color: color,
        }}>
          {distance.toFixed(1)}m
        </ArchText>
      </View>
    </>
  );
}


interface ProximityRingProps {
  x: number;
  y: number;
  radius: number;
}

export function ProximityRing({ x, y, radius }: ProximityRingProps) {
  return (
    <View style={{ position: 'absolute', left: x - radius, top: y - radius, width: radius * 2, height: radius * 2 }}>
      <Svg width={radius * 2} height={radius * 2}>
        <Circle
          cx={radius}
          cy={radius}
          r={radius - 2}
          stroke={DS.colors.success}
          strokeWidth="2"
          strokeDasharray="6 4"
          fill="none"
          opacity="0.6"
        />
      </Svg>
    </View>
  );
}


interface FloorPlanMiniMapProps {
  points: Point[];
  width?: number;
}

export function FloorPlanMiniMap({ points, width = 88 }: FloorPlanMiniMapProps) {
  const insets = useSafeAreaInsets();
  if (points.length < 2) return null;

  const SIZE = width - 8;
  const PAD = 8;
  const inner = SIZE - PAD * 2;

  // Find bounds
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const scale = (inner - PAD * 2) / Math.max(rangeX, rangeY);

  const normalized = points.map(p => ({
    x: PAD + (p.x - minX) * scale + (SIZE - inner) / 2,
    y: PAD + (p.y - minY) * scale + (SIZE - inner) / 2,
  }));

  const pointsStr = normalized.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={{
      position: 'absolute',
      top: insets.top + 80,
      right: 16,
      width,
      height: width,
      backgroundColor: 'rgba(26,26,26,0.92)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: DS.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Svg width={SIZE} height={SIZE}>
        {/* Floor area */}
        {points.length >= 3 && (
          <SvgText
            x={SIZE / 2}
            y={PAD - 2}
            textAnchor="middle"
            fontSize="8"
            fill={DS.colors.primaryGhost}
            fontFamily={DS.font.mono}
          >
            N
          </SvgText>
        )}
        {/* Polygon outline */}
        {points.length >= 3 && (
          <Polygon
            points={pointsStr}
            stroke={DS.colors.primary}
            strokeWidth="1.5"
            fill={`${DS.colors.primary}15`}
          />
        )}
        {/* Points */}
        {normalized.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={i === 0 ? DS.colors.success : DS.colors.primary} />
        ))}
        {/* Connecting lines */}
        {normalized.slice(0, -1).map((p, i) => {
          const next = normalized[i + 1];
          return (
            <Line
              key={i}
              x1={p.x}
              y1={p.y}
              x2={next.x}
              y2={next.y}
              stroke={DS.colors.primary}
              strokeWidth="1"
            />
          );
        })}
      </Svg>
      <ArchText variant="body" style={{
        position: 'absolute',
        bottom: 4,
        fontFamily: DS.font.mono,
        fontSize: 8,
        color: DS.colors.primaryGhost,
      }}>
        {points.length} points
      </ArchText>
    </View>
  );
}
