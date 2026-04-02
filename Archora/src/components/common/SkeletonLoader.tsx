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

function SkeletonItem({ width = '100%', height = 16, borderRadius = 6, style }: SkeletonProps) {
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
