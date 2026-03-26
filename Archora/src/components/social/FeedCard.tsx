import React, { useEffect } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import Svg, { Path, Line } from 'react-native-svg';
import { BASE_COLORS } from '../../theme/colors';
import { useTheme } from '../../hooks/useTheme';
import { LikeButton } from './LikeButton';
import { SaveButton } from './SaveButton';
import type { Template } from '../../types';

interface FeedCardProps {
  template: Template;
  onPress: () => void;
  index?: number;
  height?: number;
}

function BlueprintPlaceholder({ color }: { color: string }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 120 80">
      <Line x1="0" y1="20" x2="120" y2="20" stroke={color} strokeWidth="0.5" opacity={0.3} />
      <Line x1="0" y1="40" x2="120" y2="40" stroke={color} strokeWidth="0.5" opacity={0.3} />
      <Line x1="0" y1="60" x2="120" y2="60" stroke={color} strokeWidth="0.5" opacity={0.3} />
      <Line x1="20" y1="0" x2="20" y2="80" stroke={color} strokeWidth="0.5" opacity={0.3} />
      <Line x1="60" y1="0" x2="60" y2="80" stroke={color} strokeWidth="0.5" opacity={0.3} />
      <Line x1="100" y1="0" x2="100" y2="80" stroke={color} strokeWidth="0.5" opacity={0.3} />
      <Path d="M30 25 L50 25 L50 55 L30 55 Z" stroke={color} strokeWidth="1" fill="none" opacity={0.5} />
      <Path d="M65 30 L95 30 L95 55 L65 55 Z" stroke={color} strokeWidth="1" fill="none" opacity={0.4} />
      <Path d="M35 55 L45 45" stroke={color} strokeWidth="1" opacity={0.4} />
    </Svg>
  );
}

export function FeedCard({ template, onPress, index = 0, height = 240 }: FeedCardProps) {
  const { colors } = useTheme();

  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    const delay = index * 40;
    translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 140 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 250 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: pressScale.value }],
    opacity: opacity.value,
  }));

  const thumbnailHeight = Math.round(height * 0.65);

  return (
    <Animated.View style={[animStyle, { marginBottom: 8 }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          pressScale.value = withSpring(0.97, { damping: 14 });
        }}
        onPressOut={() => {
          pressScale.value = withSpring(1, { damping: 14 });
        }}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: BASE_COLORS.surface,
          borderWidth: 1,
          borderColor: BASE_COLORS.border,
        }}
      >
        {/* Thumbnail */}
        <View
          style={{
            height: thumbnailHeight,
            backgroundColor: BASE_COLORS.surfaceHigh,
            overflow: 'hidden',
          }}
        >
          {template.thumbnailUrl ? (
            <Image
              source={{ uri: template.thumbnailUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <BlueprintPlaceholder color={colors.primary} />
            </View>
          )}
          {/* Bottom gradient overlay */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 48,
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
          />
          {/* Title overlay */}
          <Text
            numberOfLines={1}
            style={{
              position: 'absolute',
              bottom: 8,
              left: 10,
              right: 10,
              fontSize: 13,
              color: BASE_COLORS.textPrimary,
            }}
          >
            {template.title}
          </Text>
        </View>

        {/* Author row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingTop: 8,
            paddingBottom: 4,
            gap: 6,
          }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: colors.primaryDim,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {template.authorAvatarUrl ? (
              <Image
                source={{ uri: template.authorAvatarUrl }}
                style={{ width: 24, height: 24, borderRadius: 12 }}
              />
            ) : (
              <Text style={{ fontSize: 10, color: BASE_COLORS.background }}>
                {template.authorDisplayName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            )}
          </View>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 11,
              color: BASE_COLORS.textSecondary,
              flex: 1,
            }}
          >
            {template.authorDisplayName}
          </Text>
        </View>

        {/* Stats row: like + save */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 10,
            paddingBottom: 8,
          }}
        >
          <LikeButton
            templateId={template.id}
            likeCount={template.likeCount}
            isLiked={template.isLiked}
          />
          <SaveButton
            templateId={template.id}
            saveCount={template.saveCount}
            isSaved={template.isSaved}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}
