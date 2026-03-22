import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, Pressable, Dimensions, Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { inspoService } from '../../services/inspoService';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { BASE_COLORS } from '../../theme/colors';
import { LogoLoader } from '../../components/common/LogoLoader';
import { LikeButton } from '../../components/social/LikeButton';
import { SaveButton } from '../../components/social/SaveButton';
import { RatingStars } from '../../components/social/RatingStars';
import { CommentThread } from '../../components/social/CommentThread';
import type { Template, Comment } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TemplateDetail'>;

const SCREEN_H = Dimensions.get('window').height;
const HERO_H = SCREEN_H * 0.55;

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M19 12 H5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M10 7 L5 12 L10 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function TemplateDetailScreen({ navigation, route }: Props) {
  const { templateId } = route.params;
  const { colors } = useTheme();
  const { medium } = useHaptics();

  const [template, setTemplate] = useState<Template | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const heroScale = useSharedValue(1.06);
  const contentY = useSharedValue(30);
  const contentOp = useSharedValue(0);

  useEffect(() => {
    heroScale.value = withTiming(1, { duration: 400 });
    contentY.value = withDelay(200, withSpring(0, { damping: 18, stiffness: 160 }));
    contentOp.value = withDelay(200, withTiming(1, { duration: 350 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Promise.all([
      inspoService.getTemplate(templateId),
      inspoService.getComments(templateId),
    ])
      .then(([t, c]) => {
        setTemplate(t);
        setComments(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [templateId]);

  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentY.value }],
    opacity: contentOp.value,
  }));

  const handleUse = () => {
    if (!template) return;
    medium();
    if (template.price && template.price > 0) {
      navigation.navigate('PurchaseTemplate', { templateId: template.id });
    } else {
      navigation.navigate('Workspace', { projectId: template.projectId });
      void inspoService.incrementDownload(templateId);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BASE_COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <LogoLoader size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
      {/* Hero */}
      <View style={{ height: HERO_H, overflow: 'hidden' }}>
        <Animated.View style={[{ width: '100%', height: '100%' }, heroStyle]}>
          {template?.thumbnailUrl ? (
            <Image
              source={{ uri: template.thumbnailUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ flex: 1, backgroundColor: BASE_COLORS.surfaceHigh, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 60, color: colors.primaryDim }}>◻</Text>
            </View>
          )}
        </Animated.View>

        {/* Gradient overlay */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: HERO_H * 0.4,
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}
        />

        {/* Back button */}
        <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }} edges={['top']}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              margin: 16,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(0,0,0,0.45)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BackArrow color="#fff" />
          </Pressable>
        </SafeAreaView>
      </View>

      {/* Scrollable body */}
      <Animated.View style={[{ flex: 1 }, contentStyle]}>
        <ScrollView
          bounces
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {template && (
            <>
              {/* Author card */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.primaryDim,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  {template.authorAvatarUrl ? (
                    <Image
                      source={{ uri: template.authorAvatarUrl }}
                      style={{ width: 40, height: 40, borderRadius: 20 }}
                    />
                  ) : (
                    <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 16, color: BASE_COLORS.background }}>
                      {template.authorDisplayName?.[0]?.toUpperCase() ?? '?'}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: BASE_COLORS.textPrimary }}>
                    {template.authorDisplayName}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: BASE_COLORS.textDim }}>
                    {formatDate(template.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text
                style={{
                  fontFamily: 'ArchitectsDaughter_400Regular',
                  fontSize: 26,
                  color: BASE_COLORS.textPrimary,
                  marginBottom: 12,
                }}
              >
                {template.title}
              </Text>

              {/* Stats row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <LikeButton templateId={template.id} likeCount={template.likeCount} isLiked={template.isLiked} />
                <SaveButton templateId={template.id} saveCount={template.saveCount} isSaved={template.isSaved} />
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: BASE_COLORS.textDim }}>
                  {template.downloadCount} dl
                </Text>
              </View>

              {/* Rating */}
              <View style={{ marginBottom: 14 }}>
                <RatingStars
                  rating={template.avgRating}
                  count={template.ratingCount}
                  readonly={false}
                  size={18}
                  templateId={template.id}
                  userRating={template.userRating}
                />
              </View>

              {/* Description */}
              {template.description ? (
                <Text
                  style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 14,
                    color: BASE_COLORS.textSecondary,
                    lineHeight: 22,
                    marginBottom: 20,
                  }}
                >
                  {template.description}
                </Text>
              ) : null}

              {/* Use Template button */}
              <Pressable
                onPress={handleUse}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginBottom: 28,
                }}
              >
                <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 17, color: BASE_COLORS.background }}>
                  {template && template.price > 0 ? `Buy for $${template.price.toFixed(2)}` : 'Use This Template'}
                </Text>
              </Pressable>

              {/* Comments */}
              <CommentThread templateId={templateId} comments={comments} />
            </>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
