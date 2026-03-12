import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '../common/Card';
import { LikeButton } from './LikeButton';
import { RatingStars } from './RatingStars';
import { BASE_COLORS } from '../../theme/colors';
import { useTheme } from '../../hooks/useTheme';
import type { Template } from '../../types';

interface FeedCardProps {
  template: Template;
  onPress: () => void;
  index?: number;
}

export function FeedCard({ template, onPress, index = 0 }: FeedCardProps) {
  const { colors } = useTheme();

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <Card onPress={onPress} padded={false} style={{ marginBottom: 16, overflow: 'hidden' }}>
        {/* Thumbnail */}
        <View
          style={{
            height: 180,
            backgroundColor: BASE_COLORS.surfaceHigh,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {template.thumbnailUrl ? (
            <Image
              source={{ uri: template.thumbnailUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <Text
              style={{
                fontFamily: 'ArchitectsDaughter_400Regular',
                fontSize: 40,
                color: colors.primaryDim,
              }}
            >
              ◻
            </Text>
          )}

          {/* Featured badge */}
          {template.isFeatured ? (
            <View
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                backgroundColor: colors.primary,
                borderRadius: 4,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text
                style={{
                  fontFamily: 'JetBrainsMono_400Regular',
                  fontSize: 9,
                  color: BASE_COLORS.background,
                  letterSpacing: 1,
                }}
              >
                FEATURED
              </Text>
            </View>
          ) : null}

          {/* Price badge */}
          {template.price > 0 ? (
            <View
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: BASE_COLORS.surface + 'DD',
                borderRadius: 4,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderWidth: 1,
                borderColor: BASE_COLORS.border,
              }}
            >
              <Text
                style={{
                  fontFamily: 'JetBrainsMono_400Regular',
                  fontSize: 11,
                  color: BASE_COLORS.warning,
                }}
              >
                ${template.price.toFixed(2)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Content */}
        <View style={{ padding: 14 }}>
          {/* Author row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colors.primaryDim,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              {template.authorAvatarUrl ? (
                <Image
                  source={{ uri: template.authorAvatarUrl }}
                  style={{ width: 28, height: 28, borderRadius: 14 }}
                />
              ) : (
                <Text style={{ color: BASE_COLORS.background, fontFamily: 'Inter_400Regular', fontSize: 12 }}>
                  {template.authorDisplayName?.[0]?.toUpperCase() ?? '?'}
                </Text>
              )}
            </View>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: BASE_COLORS.textSecondary }}>
              {template.authorDisplayName}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: BASE_COLORS.textDim }}>
              {template.buildingType}
            </Text>
          </View>

          {/* Title */}
          <Text
            style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 17,
              color: BASE_COLORS.textPrimary,
              marginBottom: 4,
            }}
            numberOfLines={1}
          >
            {template.title}
          </Text>

          {/* Description */}
          {template.description ? (
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 13,
                color: BASE_COLORS.textSecondary,
                lineHeight: 18,
                marginBottom: 10,
              }}
              numberOfLines={2}
            >
              {template.description}
            </Text>
          ) : null}

          {/* Stats row */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LikeButton templateId={template.id} likeCount={template.likeCount} isLiked={template.isLiked} />
            <View style={{ width: 12 }} />
            <RatingStars rating={template.avgRating} count={template.ratingCount} readonly size={14} />
            <View style={{ flex: 1 }} />
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: BASE_COLORS.textDim }}>
              {template.downloadCount} downloads
            </Text>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}
