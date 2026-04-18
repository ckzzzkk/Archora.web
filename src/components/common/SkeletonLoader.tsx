import { DS } from '../../theme/designSystem';
import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonItem({ width = '100%', height = 16, borderRadius = 6, style }: SkeletonProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [DS.colors.surface, DS.colors.surfaceHigh],
    ),
  }));

  return (
    <Animated.View
      style={[
        animStyle,
        { width: width as ViewStyle['width'], height, borderRadius },
        style,
      ]}
    />
  );
}

/**
 * MasonryCardSkeleton — skeleton that matches FeedCard shape for masonry grid.
 * Two alternating heights (200 / 260) to mimic the masonry layout.
 */
export function MasonryCardSkeleton({ height = 200 }: { height?: number }) {
  const thumbnailHeight = Math.round(height * 0.65);
  return (
    <View style={{
      borderRadius: DS.radius.card, // 24px — oval-first design system
      overflow: 'hidden',
      backgroundColor: DS.colors.surface,
      borderWidth: 1,
      borderColor: DS.colors.border,
      marginBottom: 8,
    }}>
      {/* Thumbnail */}
      <SkeletonItem
        width="100%"
        height={thumbnailHeight}
        borderRadius={0}
        style={{ borderRadius: 0 }}
      />
      {/* Author row */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingTop: 8,
        paddingBottom: 4,
        gap: 6,
      }}>
        <SkeletonItem width={28} height={28} borderRadius={14} />
        <SkeletonItem height={10} width="40%" />
      </View>
      {/* Stats row */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingBottom: 8,
      }}>
        <SkeletonItem width={32} height={14} borderRadius={4} />
        <SkeletonItem width={32} height={14} borderRadius={4} />
      </View>
    </View>
  );
}

interface SkeletonLoaderProps {
  rows?: number;
  showAvatar?: boolean;
  cardStyle?: boolean;
}

export function SkeletonLoader({ rows = 3, showAvatar = false, cardStyle = false }: SkeletonLoaderProps) {
  const wrap: ViewStyle = cardStyle
    ? {
        backgroundColor: DS.colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: DS.colors.border,
        marginBottom: 12,
      }
    : { marginBottom: 12 };

  return (
    <View style={wrap}>
      {showAvatar ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <SkeletonItem width={40} height={40} borderRadius={20} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <SkeletonItem height={12} width="50%" style={{ marginBottom: 6 }} />
            <SkeletonItem height={10} width="30%" />
          </View>
        </View>
      ) : null}

      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonItem
          key={i}
          height={14}
          width={i === rows - 1 ? '60%' : '100%'}
          style={{ marginBottom: i < rows - 1 ? 8 : 0 }}
        />
      ))}
    </View>
  );
}
