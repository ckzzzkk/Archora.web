import React, { useEffect } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Polygon, Line, Circle } from 'react-native-svg';
import { ArchText } from '../common/ArchText';
import { OvalButton } from '../common/OvalButton';
import { DS } from '../../theme/designSystem';
import type { BlueprintData } from '../../types/blueprint';

interface ARResultScreenProps {
  result: {
    blueprint: BlueprintData;
    dimensions: {
      width: number;
      height: number;
      area: number;
    };
    roomType: string;
    pointCount: number;
  };
  onOpenInStudio: () => void;
  onScanAgain: () => void;
  onBack: () => void;
}

export function ARResultScreen({
  result,
  onOpenInStudio,
  onScanAgain,
  onBack,
}: ARResultScreenProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);

  useEffect(() => {
    opacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(100, withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }));
  }, [opacity, translateY]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const { blueprint, dimensions, roomType, pointCount } = result;
  const room = blueprint.rooms[0];
  const walls = blueprint.walls;

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
      <Animated.View style={[{ flex: 1 }, containerStyle]}>
        {/* Header */}
        <View style={{ paddingTop: 80, paddingHorizontal: 24, marginBottom: 24 }}>
          <ArchText
            variant="body"
            style={{
              fontFamily: DS.font.heading,
              fontSize: 28,
              color: DS.colors.primary,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Room Captured
          </ArchText>
          <ArchText
            variant="body"
            style={{
              fontFamily: DS.font.regular,
              fontSize: 14,
              color: DS.colors.primaryDim,
              textAlign: 'center',
            }}
          >
            Your room has been scanned and converted to a blueprint
          </ArchText>
        </View>

        {/* Mini floor plan preview */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <FloorPlanPreview walls={walls} width={200} />
        </View>

        {/* Stats cards */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              backgroundColor: DS.colors.surface,
              borderRadius: DS.radius.card,
              padding: 16,
              borderWidth: 1,
              borderColor: DS.colors.border,
            }}
          >
            <StatCard label="Area" value={`${dimensions.area.toFixed(1)}m²`} accent />
            <StatCard label="Width" value={`${dimensions.width.toFixed(1)}m`} />
            <StatCard label="Depth" value={`${dimensions.height.toFixed(1)}m`} />
          </View>

          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              marginTop: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: DS.colors.surface,
                borderRadius: DS.radius.card,
                padding: 12,
                borderWidth: 1,
                borderColor: DS.colors.border,
              }}
            >
              <ArchText
                variant="body"
                style={{
                  fontFamily: DS.font.mono,
                  fontSize: 11,
                  color: DS.colors.primaryGhost,
                  marginBottom: 4,
                }}
              >
                Room Type
              </ArchText>
              <ArchText
                variant="body"
                style={{
                  fontFamily: DS.font.medium,
                  fontSize: 14,
                  color: DS.colors.primary,
                  textTransform: 'capitalize',
                }}
              >
                {roomType.replace('_', ' ')}
              </ArchText>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: DS.colors.surface,
                borderRadius: DS.radius.card,
                padding: 12,
                borderWidth: 1,
                borderColor: DS.colors.border,
              }}
            >
              <ArchText
                variant="body"
                style={{
                  fontFamily: DS.font.mono,
                  fontSize: 11,
                  color: DS.colors.primaryGhost,
                  marginBottom: 4,
                }}
              >
                Walls
              </ArchText>
              <ArchText
                variant="body"
                style={{
                  fontFamily: DS.font.medium,
                  fontSize: 14,
                  color: DS.colors.primary,
                }}
              >
                {walls.length}
              </ArchText>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View
          style={{
            position: 'absolute',
            bottom: 48,
            left: 20,
            right: 20,
            gap: 10,
          }}
        >
          <OvalButton label="Open in Studio" onPress={onOpenInStudio} variant="filled" fullWidth />
          <OvalButton label="Scan Again" onPress={onScanAgain} variant="outline" fullWidth />
          <OvalButton label="Discard" onPress={onBack} variant="ghost" fullWidth />
        </View>
      </Animated.View>
    </View>
  );
}

// ── Stat Card Component ──────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  accent?: boolean;
}

function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <ArchText
        variant="body"
        style={{
          fontFamily: DS.font.mono,
          fontSize: 10,
          color: DS.colors.primaryGhost,
          marginBottom: 4,
        }}
      >
        {label}
      </ArchText>
      <ArchText
        variant="body"
        style={{
          fontFamily: DS.font.mono,
          fontSize: 18,
          color: accent ? DS.colors.success : DS.colors.primary,
        }}
      >
        {value}
      </ArchText>
    </View>
  );
}

// ── Floor Plan Preview Component ─────────────────────────────────────────────

interface FloorPlanPreviewProps {
  walls: Array<{
    start: { x: number; y: number };
    end: { x: number; y: number };
  }>;
  width: number;
}

function FloorPlanPreview({ walls, width }: FloorPlanPreviewProps) {
  if (walls.length === 0) return null;

  // Calculate bounds
  const allPoints = walls.flatMap((w) => [w.start, w.end]);
  const xs = allPoints.map((p) => p.x);
  const ys = allPoints.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const PAD = 16;
  const inner = width - PAD * 2;
  const scale = (inner - PAD) / Math.max(rangeX, rangeY);

  // Center the floor plan
  const offsetX = (width - rangeX * scale) / 2 - minX * scale;
  const offsetY = (width - rangeY * scale) / 2 - minY * scale;

  const normalize = (p: { x: number; y: number }) => ({
    x: PAD + (p.x - minX) * scale + (inner - rangeX * scale) / 2,
    y: PAD + (p.y - minY) * scale + (inner - rangeY * scale) / 2,
  });

  return (
    <View
      style={{
        width: width + 16,
        height: width + 16,
        backgroundColor: DS.colors.surface,
        borderRadius: DS.radius.card,
        borderWidth: 1,
        borderColor: DS.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={width} height={width}>
        {/* Grid background */}
        {Array.from({ length: 10 }).map((_, i) => (
          <React.Fragment key={i}>
            <Line
              x1={PAD + (i * (width - 2 * PAD)) / 9}
              y1={PAD}
              x2={PAD + (i * (width - 2 * PAD)) / 9}
              y2={width - PAD}
              stroke={`${DS.colors.border}40`}
              strokeWidth="0.5"
            />
            <Line
              x1={PAD}
              y1={PAD + (i * (width - 2 * PAD)) / 9}
              x2={width - PAD}
              y2={PAD + (i * (width - 2 * PAD)) / 9}
              stroke={`${DS.colors.border}40`}
              strokeWidth="0.5"
            />
          </React.Fragment>
        ))}

        {/* Walls */}
        {walls.map((wall, i) => {
          const start = normalize(wall.start);
          const end = normalize(wall.end);
          return (
            <Line
              key={i}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={DS.colors.primary}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })}

        {/* Corner points */}
        {walls.map((wall, i) => {
          const start = normalize(wall.start);
          return <Circle key={i} cx={start.x} cy={start.y} r={4} fill={DS.colors.success} />;
        })}
      </Svg>
    </View>
  );
}
