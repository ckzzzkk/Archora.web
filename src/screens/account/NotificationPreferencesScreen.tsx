/**
 * NotificationPreferencesScreen
 *
 * Per-type notification toggles for the logged-in user.
 * Reads and writes from notification_preferences table via
 * notificationPreferenceService.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, ScrollView, Switch, Pressable,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArchText } from '../../components/common/ArchText';
import { useThemeColors } from '../../hooks/useThemeColors';
import { notificationPreferenceService, type NotificationPreferences } from '../../services/notificationPreferenceService';
import { useHaptics } from '../../hooks/useHaptics';
import { DS } from '../../theme/designSystem';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ── Preference categories ─────────────────────────────────────────────────────

const CATEGORIES: { title: string; key: keyof NotificationPreferences; items: { key: keyof NotificationPreferences; label: string }[] }[] = [
  {
    title: 'AI Generation',
    key: 'gen_complete',
    items: [
      { key: 'gen_complete',   label: 'Generation complete' },
      { key: 'gen_failed',     label: 'Generation failed' },
      { key: 'ai_furniture',   label: 'AI furniture ready' },
      { key: 'ai_texture',     label: 'AI texture ready' },
      { key: 'transcription',   label: 'Voice transcription ready' },
    ],
  },
  {
    title: 'Social',
    key: 'like_received',
    items: [
      { key: 'like_received',     label: 'Likes on your design' },
      { key: 'save_received',     label: 'Saves on your design' },
      { key: 'follow_received',   label: 'New followers' },
      { key: 'comment_received',  label: 'Comments on your design' },
      { key: 'design_featured',   label: 'Design featured' },
      { key: 'template_purchased', label: 'Template purchased' },
    ],
  },
  {
    title: 'Gamification',
    key: 'streak_milestone',
    items: [
      { key: 'streak_milestone',   label: 'Streak milestones' },
      { key: 'points_awarded',     label: 'Points awarded' },
      { key: 'challenge_ending',    label: 'Challenge ending soon' },
      { key: 'daily_goal_reached', label: 'Daily editing goal reached' },
      { key: 'level_up',           label: 'Level up' },
    ],
  },
  {
    title: 'Quota & Billing',
    key: 'quota_warning',
    items: [
      { key: 'quota_warning',    label: 'Quota warning (80% used)' },
      { key: 'quota_reached',    label: 'Quota exhausted' },
      { key: 'subscription_new',  label: 'Subscription activated' },
      { key: 'payment_failed',   label: 'Payment failed' },
    ],
  },
  {
    title: 'AR & Collaboration',
    key: 'ar_session_complete',
    items: [
      { key: 'ar_session_complete', label: 'AR session complete' },
      { key: 'project_shared',       label: 'Project shared with you' },
      { key: 'annotation_added',     label: 'Annotation added to project' },
      { key: 'export_ready',         label: 'Export ready to download' },
      { key: 'design_of_week',      label: 'Design of the Week — you\'re featured' },
    ],
  },
];

// ── Row component ─────────────────────────────────────────────────────────────

function PrefRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (next: boolean) => void;
}) {
  const C = useThemeColors();
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    }}>
      <ArchText variant="body" style={{ flex: 1, fontSize: DS.fontSize.md, color: C.primary }}>
        {label}
      </ArchText>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: C.border, true: DS.colors.accent }}
        thumbColor={value ? C.primary : C.primaryDim}
      />
    </View>
  );
}

function CategorySection({
  category,
  prefs,
  onToggle,
  index,
}: {
  category: (typeof CATEGORIES)[number];
  prefs: NotificationPreferences;
  onToggle: (key: keyof NotificationPreferences, value: boolean) => void;
  index: number;
}) {
  const C = useThemeColors();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    opacity.value = withDelay(index * 60, withTiming(1, { duration: 300, easing: ease }));
    translateY.value = withDelay(index * 60, withTiming(0, { duration: 300, easing: ease }));
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));

  return (
    <Animated.View style={style}>
      <ArchText variant="body" style={{
        fontFamily: DS.font.medium,
        fontSize: 11,
        color: C.primaryGhost,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        paddingHorizontal: 20,
        paddingTop: index === 0 ? 0 : DS.spacing.md,
        paddingBottom: DS.spacing.sm,
      }}>
        {category.title}
      </ArchText>
      <View style={{
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        overflow: 'hidden',
        marginHorizontal: 20,
      }}>
        {category.items.map((item, i) => (
          <PrefRow
            key={item.key}
            label={item.label}
            value={prefs[item.key] ?? true}
            onToggle={(next) => onToggle(item.key, next)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export function NotificationPreferencesScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const C = useThemeColors();
  const { light } = useHaptics();

  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const data = await notificationPreferenceService.getPreferences();
      setPrefs(data ?? {
        gen_complete: true, gen_failed: true, ai_furniture: true, ai_texture: true,
        transcription: true, like_received: true, save_received: true, follow_received: true,
        comment_received: true, design_featured: true, template_purchased: true,
        streak_milestone: true, points_awarded: true, challenge_ending: true,
        daily_goal_reached: true, level_up: true, quota_warning: true, quota_reached: true,
        subscription_new: true, payment_failed: true, ar_session_complete: true,
        project_shared: true, annotation_added: true, export_ready: true, design_of_week: true,
        push_enabled: true,
      });
      setLoading(false);
    })();
  }, []);

  const handleToggle = useCallback(async (key: keyof NotificationPreferences, value: boolean) => {
    light();
    setPrefs((prev) => prev ? { ...prev, [key]: value } : prev);

    // Fire and forget — will be re-fetched on next mount
    setSaving(true);
    try {
      await notificationPreferenceService.updatePreferences({ [key]: value });
    } finally {
      setSaving(false);
    }
  }, [light]);

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      {/* Header */}
      <Animated.View style={[
        {
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        },
      ]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={{ marginRight: 16 }}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        </Pressable>
        <View style={{ flex: 1 }}>
          <ArchText variant="heading" style={{ fontSize: 20, color: C.primary }}>
            Notifications
          </ArchText>
        </View>
        {saving && (
          <ArchText variant="body" style={{ fontSize: 12, color: C.primaryDim }}>
            Saving…
          </ArchText>
        )}
      </Animated.View>

      {/* Global push toggle */}
      {prefs && (
        <View style={{ paddingHorizontal: 20, paddingVertical: DS.spacing.md }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: C.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: C.border,
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}>
            <View style={{ flex: 1 }}>
              <ArchText variant="body" style={{ fontSize: DS.fontSize.md, color: C.primary, marginBottom: 2 }}>
                Push Notifications
              </ArchText>
              <ArchText variant="body" style={{ fontSize: 12, color: C.primaryDim }}>
                Master toggle for all push notifications
              </ArchText>
            </View>
            <Switch
              value={prefs.push_enabled}
              onValueChange={(next) => handleToggle('push_enabled', next)}
              trackColor={{ false: C.border, true: DS.colors.accent }}
              thumbColor={prefs.push_enabled ? C.primary : C.primaryDim}
            />
          </View>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ArchText variant="body" style={{ color: C.primaryGhost }}>Loading…</ArchText>
        </View>
      ) : prefs && (
        <ScrollView
          contentContainerStyle={{ paddingBottom: Math.max(120, insets.bottom + 88) }}
          showsVerticalScrollIndicator={false}
        >
          {CATEGORIES.map((cat, i) => (
            <CategorySection
              key={cat.title}
              category={cat}
              prefs={prefs}
              onToggle={handleToggle}
              index={i}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
