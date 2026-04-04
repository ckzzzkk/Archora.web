import React, { useEffect, useState } from 'react';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../../components/common/ArchText';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import {
  View, Image, ScrollView, Pressable, Dimensions, Alert,
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

import { useHaptics } from '../../hooks/useHaptics';


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
  
  const { medium } = useHaptics();

  const [template, setTemplate] = useState<Template | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

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
      .catch(() => { setLoadError(true); })
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
      <View style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <CompassRoseLoader size="large" />
      </View>
    );
  }

  if (loadError || !template) {
    return (
      <View style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <ArchText variant="body" style={{ fontFamily: DS.font.heading, fontSize: 20, color: DS.colors.error, marginBottom: 12 }}>
          Failed to load template
        </ArchText>
        <Pressable onPress={() => navigation.goBack()}>
          <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 14, color: DS.colors.primary }}>Go back</ArchText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
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
            <View style={{ flex: 1, backgroundColor: DS.colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' }}>
              <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 60, color: DS.colors.primaryDim }}>◻</ArchText>
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
                    backgroundColor: DS.colors.primaryDim,
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
                    <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 16, color: DS.colors.background }}>
                      {template.authorDisplayName?.[0]?.toUpperCase() ?? '?'}
                    </ArchText>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: DS.colors.primary }}>
                    {template.authorDisplayName}
                  </ArchText>
                  <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: DS.colors.primaryGhost }}>
                    {formatDate(template.createdAt)}
                  </ArchText>
                </View>
              </View>

              {/* Title */}
              <ArchText variant="body"
                style={{
                  fontFamily: 'ArchitectsDaughter_400Regular',
                  fontSize: 26,
                  color: DS.colors.primary,
                  marginBottom: 12,
                }}
              >
                {template.title}
              </ArchText>

              {/* Stats row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <LikeButton templateId={template.id} likeCount={template.likeCount} isLiked={template.isLiked} />
                <SaveButton templateId={template.id} saveCount={template.saveCount} isSaved={template.isSaved} />
                <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: DS.colors.primaryGhost }}>
                  {template.downloadCount} dl
                </ArchText>
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
                <ArchText variant="body"
                  style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 14,
                    color: DS.colors.primaryDim,
                    lineHeight: 22,
                    marginBottom: 20,
                  }}
                >
                  {template.description}
                </ArchText>
              ) : null}

              {/* Use Template button */}
              <Pressable
                onPress={handleUse}
                style={{
                  backgroundColor: DS.colors.primary,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginBottom: 28,
                }}
              >
                <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 17, color: DS.colors.background }}>
                  {template && template.price > 0 ? `Buy for $${template.price.toFixed(2)}` : 'Use This Template'}
                </ArchText>
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
