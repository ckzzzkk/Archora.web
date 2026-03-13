import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
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

function DrawingPin({ color }: { color: string }) {
  return (
    <Svg width={18} height={22} viewBox="0 0 18 22">
      <Circle cx={9} cy={7} r={5} fill={color} opacity={0.9} />
      <Path d="M9 12 L9 22" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={0.7} />
      <Circle cx={9} cy={7} r={2} fill="#fff" opacity={0.4} />
    </Svg>
  );
}

export function FeedCard({ template, onPress, index = 0, height = 240 }: FeedCardProps) {
  const { colors } = useTheme();
  const rotationOffset = useRef(Math.random() * 6 - 3).current;

  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(rotationOffset);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    const delay = index * 40;
    translateY.value = withDelay(delay, withSpring(0, { damping: 16, stiffness: 120 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    rotation.value = withDelay(delay + 150, withSpring(0, { damping: 14 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: pressScale.value },
    ],
    opacity: opacity.value,
  }));

  const thumbnailHeight = Math.round(height * 0.75);

  return (
    <Animated.View style={[animStyle, { flex: 1, margin: 6 }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { pressScale.value = withSpring(1.02, { damping: 14 }); }}
        onPressOut={() => { pressScale.value = withSpring(1, { damping: 14 }); }}
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: BASE_COLORS.surface,
          borderWidth: 1,
          borderColor: BASE_COLORS.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        {/* Thumbnail */}
        <View style={{ height: thumbnailHeight, backgroundColor: BASE_COLORS.surfaceHigh }}>
          {template.thumbnailUrl ? (
            <Image
              source={{ uri: template.thumbnailUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 32, color: colors.primaryDim }}>
                ◻
              </Text>
            </View>
          )}

          {/* Gradient overlay */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: thumbnailHeight * 0.4,
              backgroundColor: 'rgba(0,0,0,0.55)',
            }}
          />

          {/* Drawing pin */}
          <View style={{ position: 'absolute', top: -6, left: '50%', marginLeft: -9 }}>
            <DrawingPin color={colors.primary} />
          </View>

          {/* Project name overlay */}
          <Text
            numberOfLines={1}
            style={{
              position: 'absolute',
              bottom: 8,
              left: 10,
              right: 10,
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 14,
              color: '#fff',
            }}
          >
            {template.title}
          </Text>
        </View>

        {/* Body */}
        <View style={{ padding: 10 }}>
          {/* Author row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: colors.primaryDim,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 6,
              }}
            >
              {template.authorAvatarUrl ? (
                <Image
                  source={{ uri: template.authorAvatarUrl }}
                  style={{ width: 22, height: 22, borderRadius: 11 }}
                />
              ) : (
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: BASE_COLORS.background }}>
                  {template.authorDisplayName?.[0]?.toUpperCase() ?? '?'}
                </Text>
              )}
            </View>
            <Text
              numberOfLines={1}
              style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: BASE_COLORS.textSecondary, flex: 1 }}
            >
              {template.authorDisplayName}
            </Text>
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
        </View>
      </Pressable>
    </Animated.View>
  );
}
