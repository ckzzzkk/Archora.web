import React, { useEffect } from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Rect, Line, Circle, Text as SvgText } from 'react-native-svg';
import { CompassRoseLoader } from '../common/CompassRoseLoader';
import { OvalButton } from '../common/OvalButton';
import { DS } from '../../theme/designSystem';

export interface ARResultScreenProps {
  visible: boolean;
  isProcessing?: boolean;
  wallCount?: number;
  roomDimensions?: { width: number; length: number };
  roomLabel?: string;
  detectedObjects?: Array<{ label: string; width: number; length: number }>;
  onImportToStudio: () => void;
  onSaveScan: () => void;
  onScanAgain: () => void;
}

// Mock objects for preview when none provided
const DEFAULT_OBJECTS = [
  { label: 'Sofa', width: 2.2, length: 0.9 },
  { label: 'Coffee Table', width: 1.2, length: 0.6 },
  { label: 'TV Stand', width: 1.8, length: 0.4 },
  { label: 'Armchair', width: 0.9, length: 0.9 },
  { label: 'Bookshelf', width: 1.0, length: 0.3 },
];

export function ARResultScreen({
  visible,
  isProcessing = false,
  wallCount = 0,
  roomDimensions,
  roomLabel,
  detectedObjects,
  onImportToStudio,
  onSaveScan,
  onScanAgain,
}: ARResultScreenProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);

  useEffect(() => {
    if (visible) {
      opacity.value = withDelay(80, withTiming(1, { duration: 400 }));
      translateY.value = withDelay(
        80,
        withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }),
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(40, { duration: 200 });
    }
  }, [visible, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  const objects = detectedObjects ?? DEFAULT_OBJECTS;
  const statsLine = [
    wallCount > 0 ? `${wallCount} wall${wallCount !== 1 ? 's' : ''}` : null,
    roomDimensions
      ? `${roomDimensions.width.toFixed(1)}m × ${roomDimensions.length.toFixed(1)}m`
      : null,
    objects.length > 0 ? `${objects.length} object${objects.length !== 1 ? 's' : ''} detected` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  if (isProcessing) {
    return (
      <View style={{ flex: 1, backgroundColor: DS.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View style={animatedStyle}>
          <CompassRoseLoader size="large" />
          <Text
            style={{
              fontFamily: DS.font.heading,
              fontSize: DS.fontSize.xl,
              color: DS.colors.primary,
              textAlign: 'center',
              marginTop: DS.spacing.lg,
            }}
          >
            Processing scan...
          </Text>
          <Text
            style={{
              fontFamily: DS.font.regular,
              fontSize: DS.fontSize.sm,
              color: DS.colors.primaryGhost,
              textAlign: 'center',
              marginTop: DS.spacing.sm,
            }}
          >
            Analysing room geometry and detecting objects
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        {/* Header */}
        <View style={{ paddingTop: 80, paddingHorizontal: DS.spacing.lg, marginBottom: DS.spacing.md }}>
          <Text
            style={{
              fontFamily: DS.font.heading,
              fontSize: DS.fontSize.xxl,
              color: DS.colors.primary,
              textAlign: 'center',
              marginBottom: DS.spacing.xs,
            }}
          >
            Scan Complete
          </Text>
          <Text
            style={{
              fontFamily: DS.font.mono,
              fontSize: DS.fontSize.xs,
              color: DS.colors.primaryGhost,
              textAlign: 'center',
            }}
          >
            {statsLine}
          </Text>
        </View>

        {/* 2D Floor Plan Preview */}
        <View style={{ alignItems: 'center', marginBottom: DS.spacing.lg }}>
          <FloorPlanPreview
            width={200}
            dimensions={roomDimensions}
            roomLabel={roomLabel}
          />
        </View>

        {/* Detected Objects List */}
        <View
          style={{
            flex: 1,
            paddingHorizontal: DS.spacing.lg,
          }}
        >
          <Text
            style={{
              fontFamily: DS.font.mono,
              fontSize: DS.fontSize.xs,
              color: DS.colors.primaryGhost,
              marginBottom: DS.spacing.sm,
              letterSpacing: 1,
            }}
          >
            DETECTED OBJECTS
          </Text>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: DS.spacing.sm }}
            showsVerticalScrollIndicator={false}
          >
            {objects.map((obj, index) => (
              <ObjectRow key={index} label={obj.label} width={obj.width} length={obj.length} />
            ))}
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View
          style={{
            paddingHorizontal: DS.spacing.lg,
            paddingBottom: DS.spacing.xxl,
            gap: DS.spacing.sm,
          }}
        >
          {/* Primary: Import to Studio */}
          <Pressable
            onPress={onImportToStudio}
            style={{
              height: 58,
              borderRadius: DS.radius.button,
              backgroundColor: DS.colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <Text
              style={{
                fontFamily: DS.font.bold,
                fontSize: DS.fontSize.lg,
                color: DS.colors.background,
                letterSpacing: 0.3,
              }}
            >
              Import to Studio
            </Text>
          </Pressable>

          {/* Secondary: Save Scan to Project */}
          <OvalButton
            label="Save Scan to Project"
            onPress={onSaveScan}
            variant="outline"
            size="large"
            fullWidth
          />

          {/* Tertiary: Scan Again */}
          <OvalButton
            label="Scan Again"
            onPress={onScanAgain}
            variant="ghost"
            size="large"
            fullWidth
          />
        </View>
      </Animated.View>
    </View>
  );
}

interface FloorPlanPreviewProps {
  width: number;
  dimensions?: { width: number; length: number };
  roomLabel?: string;
}

function FloorPlanPreview({ width, dimensions, roomLabel }: FloorPlanPreviewProps) {
  // Normalise to a square aspect ratio for the preview
  const w = dimensions?.width ?? 6.2;
  const l = dimensions?.length ?? 4.8;
  const maxDim = Math.max(w, l);

  const PAD = 20;
  const inner = width - PAD * 2;
  const scale = inner / maxDim;

  const roomW = w * scale;
  const roomH = l * scale;
  const offsetX = PAD + (inner - roomW) / 2;
  const offsetY = PAD + (inner - roomH) / 2;

  const centerX = offsetX + roomW / 2;
  const centerY = offsetY + roomH / 2;

  return (
    <View
      style={{
        width: width + PAD,
        height: width + PAD,
        backgroundColor: DS.colors.surface,
        borderRadius: DS.radius.card,
        borderWidth: 1,
        borderColor: DS.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={width} height={width}>
        {/* Grid */}
        {Array.from({ length: 6 }).map((_, i) => (
          <React.Fragment key={`grid-${i}`}>
            <Line
              x1={PAD + (i * (width - 2 * PAD)) / 5}
              y1={PAD}
              x2={PAD + (i * (width - 2 * PAD)) / 5}
              y2={width - PAD}
              stroke={`${DS.colors.border}40`}
              strokeWidth="0.5"
            />
            <Line
              x1={PAD}
              y1={PAD + (i * (width - 2 * PAD)) / 5}
              x2={width - PAD}
              y2={PAD + (i * (width - 2 * PAD)) / 5}
              stroke={`${DS.colors.border}40`}
              strokeWidth="0.5"
            />
          </React.Fragment>
        ))}

        {/* Room rectangle */}
        <Rect
          x={offsetX}
          y={offsetY}
          width={roomW}
          height={roomH}
          stroke={DS.colors.primary}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dimension lines */}
        <Line
          x1={offsetX}
          y1={offsetY - 8}
          x2={offsetX + roomW}
          y2={offsetY - 8}
          stroke={DS.colors.primaryGhost}
          strokeWidth="1"
        />
        <Line
          x1={offsetX}
          y1={offsetY - 4}
          x2={offsetX}
          y2={offsetY - 12}
          stroke={DS.colors.primaryGhost}
          strokeWidth="1"
        />
        <Line
          x1={offsetX + roomW}
          y1={offsetY - 4}
          x2={offsetX + roomW}
          y2={offsetY - 12}
          stroke={DS.colors.primaryGhost}
          strokeWidth="1"
        />

        <Line
          x1={offsetX + roomW + 8}
          y1={offsetY}
          x2={offsetX + roomW + 8}
          y2={offsetY + roomH}
          stroke={DS.colors.primaryGhost}
          strokeWidth="1"
        />
        <Line
          x1={offsetX + roomW + 4}
          y1={offsetY}
          x2={offsetX + roomW + 12}
          y2={offsetY}
          stroke={DS.colors.primaryGhost}
          strokeWidth="1"
        />
        <Line
          x1={offsetX + roomW + 4}
          y1={offsetY + roomH}
          x2={offsetX + roomW + 12}
          y2={offsetY + roomH}
          stroke={DS.colors.primaryGhost}
          strokeWidth="1"
        />

        {/* Dimension labels */}
        <SvgText
          x={centerX}
          y={offsetY - 14}
          fontSize="9"
          fill={DS.colors.primaryGhost}
          fontFamily="JetBrainsMono_400Regular"
          textAnchor="middle"
        >
          {w.toFixed(1)}m
        </SvgText>
        <SvgText
          x={offsetX + roomW + 14}
          y={centerY + 4}
          fontSize="9"
          fill={DS.colors.primaryGhost}
          fontFamily="JetBrainsMono_400Regular"
          textAnchor="start"
        >
          {l.toFixed(1)}m
        </SvgText>

        {/* Room label */}
        <SvgText
          x={centerX}
          y={centerY + 4}
          fontSize="11"
          fill={DS.colors.primary}
          fontFamily="ArchitectsDaughter_400Regular"
          textAnchor="middle"
          opacity={0.7}
        >
          {roomLabel ?? 'Room'}
        </SvgText>

        {/* Corner ticks */}
        {[
          [offsetX, offsetY],
          [offsetX + roomW, offsetY],
          [offsetX, offsetY + roomH],
          [offsetX + roomW, offsetY + roomH],
        ].map(([cx, cy], i) => (
          <Circle key={i} cx={cx} cy={cy} r={3} fill={DS.colors.success} />
        ))}
      </Svg>
    </View>
  );
}

interface ObjectRowProps {
  label: string;
  width: number;
  length: number;
}

function ObjectRow({ label, width, length }: ObjectRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: DS.colors.surface,
        borderRadius: DS.radius.card,
        borderWidth: 1,
        borderColor: DS.colors.border,
        paddingVertical: DS.spacing.sm,
        paddingHorizontal: DS.spacing.md,
        gap: DS.spacing.md,
        minHeight: 44,
      }}
    >
      {/* Footprint icon — overhead circle */}
      <View style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={28} height={28}>
          <Circle
            cx={14}
            cy={14}
            r={10}
            stroke={DS.colors.primary}
            strokeWidth="1.5"
            fill={DS.colors.primaryGhost + '30'}
          />
          <Circle cx={14} cy={14} r={3} fill={DS.colors.primary} />
        </Svg>
      </View>

      {/* Label */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: DS.font.medium,
            fontSize: DS.fontSize.md,
            color: DS.colors.primary,
          }}
        >
          {label}
        </Text>
      </View>

      {/* Dimensions */}
      <Text
        style={{
          fontFamily: DS.font.mono,
          fontSize: DS.fontSize.sm,
          color: DS.colors.primaryGhost,
        }}
      >
        {width.toFixed(1)}m × {length.toFixed(1)}m
      </Text>
    </View>
  );
}
