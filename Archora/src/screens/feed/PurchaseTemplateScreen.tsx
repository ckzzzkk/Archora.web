import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, Pressable, Dimensions, Linking, Alert,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import type { PurchaseTemplateScreenProps } from '../../navigation/types';
import { inspoService } from '../../services/inspoService';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { supabase } from '../../utils/supabaseClient';
import { BASE_COLORS } from '../../theme/colors';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import type { Template } from '../../types';

const SCREEN_W = Dimensions.get('window').width;
const HERO_H = SCREEN_W * 0.65;

const WHAT_YOU_GET = [
  'Full blueprint with all rooms and dimensions',
  'All furniture placements and configurations',
  'Material and colour palette selections',
  'Yours forever — use in any project',
];

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M19 12 H5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M10 7 L5 12 L10 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function StarIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PurchaseTemplateScreen({ navigation, route }: PurchaseTemplateScreenProps) {
  const { templateId } = route.params;
  const { colors } = useTheme();
  const { medium } = useHaptics();
  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.actions.showToast);

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const heroOp = useSharedValue(0);
  const contentY = useSharedValue(20);
  const contentOp = useSharedValue(0);
  const btnScale = useSharedValue(1);

  const heroStyle = useAnimatedStyle(() => ({ opacity: heroOp.value }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentY.value }],
    opacity: contentOp.value,
  }));
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  useEffect(() => {
    inspoService.getTemplate(templateId)
      .then((t) => {
        setTemplate(t);
        heroOp.value = withTiming(1, { duration: 400 });
        contentOp.value = withTiming(1, { duration: 500 });
        contentY.value = withTiming(0, { duration: 500 });
      })
      .catch(() => showToast('Failed to load template', 'error'))
      .finally(() => setLoading(false));
  }, [templateId]);

  const handleFree = async () => {
    if (!template) return;
    medium();
    navigation.navigate('Workspace', { projectId: template.projectId });
    void inspoService.incrementDownload(templateId);
  };

  const handleBuy = async () => {
    if (!template || !user) return;
    medium();
    btnScale.value = withSequence(withSpring(0.94), withSpring(1));
    setPurchasing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { templateId },
      });

      if (error) throw error;

      const { url } = data as { url: string };
      if (!url) throw new Error('No checkout URL returned');

      await Linking.openURL(url);
    } catch {
      showToast('Payment setup failed. Please try again.', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BASE_COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <CompassRoseLoader size="large" />
      </View>
    );
  }

  if (!template) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BASE_COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: BASE_COLORS.textSecondary }}>Template not found</Text>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.primary }}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isFree = !template.price || template.price <= 0;
  const stars = Math.round(template.avgRating);

  return (
    <View style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
      {/* Hero image */}
      <Animated.View style={[{ height: HERO_H, overflow: 'hidden' }, heroStyle]}>
        {template.thumbnailUrl ? (
          <Image
            source={{ uri: template.thumbnailUrl }}
            style={{ width: SCREEN_W, height: HERO_H, resizeMode: 'cover' }}
          />
        ) : (
          <View style={{ width: SCREEN_W, height: HERO_H, backgroundColor: BASE_COLORS.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 13, color: BASE_COLORS.textDim }}>No preview</Text>
          </View>
        )}
        {/* Gradient overlay + back button */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' }}>
          <SafeAreaView>
            <Pressable
              onPress={() => navigation.goBack()}
              style={{
                margin: 16,
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: 'rgba(0,0,0,0.45)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BackArrow color="#FFFFFF" />
            </Pressable>
          </SafeAreaView>
        </View>
      </Animated.View>

      <Animated.View style={[{ flex: 1 }, contentStyle]}>
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          {/* Title row */}
          <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 22, color: BASE_COLORS.textPrimary, marginBottom: 4 }}>
            {template.title}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textSecondary, marginBottom: 10 }}>
            by {template.authorDisplayName}
          </Text>

          {/* Rating row */}
          {template.ratingCount > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <StarIcon key={n} filled={n <= stars} color={colors.primary} />
              ))}
              <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 12, color: BASE_COLORS.textDim, marginLeft: 4 }}>
                ({template.ratingCount})
              </Text>
            </View>
          )}

          {/* Price */}
          {!isFree && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 32, color: BASE_COLORS.textPrimary }}>
                ${template.price.toFixed(2)}
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.textDim, marginTop: 2 }}>
                One-time purchase — yours forever
              </Text>
            </View>
          )}

          {/* What you get */}
          <View style={{ backgroundColor: BASE_COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: BASE_COLORS.textPrimary, marginBottom: 12 }}>
              What you get
            </Text>
            {WHAT_YOU_GET.map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <Text style={{ color: colors.primary, fontSize: 14, lineHeight: 20 }}>•</Text>
                <Text style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.textSecondary, lineHeight: 20 }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* Description */}
          {template.description ? (
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textSecondary, lineHeight: 22, marginBottom: 24 }}>
              {template.description}
            </Text>
          ) : null}

          {/* CTA button */}
          <Animated.View style={btnStyle}>
            <Pressable
              onPress={isFree ? handleFree : handleBuy}
              disabled={purchasing}
              style={{
                backgroundColor: purchasing ? BASE_COLORS.border : colors.primary,
                borderRadius: 50,
                paddingVertical: 18,
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              {purchasing ? (
                <CompassRoseLoader size="small" />
              ) : (
                <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 18, color: BASE_COLORS.background }}>
                  {isFree ? 'Use This Template' : `Buy for $${template.price.toFixed(2)}`}
                </Text>
              )}
            </Pressable>
          </Animated.View>

          {!isFree && (
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: BASE_COLORS.textDim, textAlign: 'center', marginBottom: 24 }}>
              Secure payment via Stripe. No subscription required.
            </Text>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
