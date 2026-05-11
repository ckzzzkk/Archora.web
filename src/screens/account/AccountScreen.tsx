import React, { useEffect, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  View, ScrollView, Pressable, Switch, Alert, TextInput, Linking, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring, Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Path as SvgPath } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../auth/useUser';
import { OvalButton } from '../../components/common/OvalButton';
import { ArchText } from '../../components/common/ArchText';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { CompassRose } from '../../components/common/CompassRose';
import { authService } from '../../services/authService';
import { subscriptionService } from '../../services/subscriptionService';
import { supabase } from '../../lib/supabase';
import { useHaptics } from '../../hooks/useHaptics';
import { DS } from '../../theme/designSystem';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAppearanceStore } from '../../stores/appearanceStore';
import type { AppearanceMode } from '../../stores/appearanceStore';
import { TIER_LIMITS } from '../../utils/tierLimits';
import type { RootStackParamList } from '../../navigation/types';
import { notificationPreferenceService } from '../../services/notificationPreferenceService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function SectionLabel({ title, C }: { title: string; C: ReturnType<typeof useThemeColors> }) {
  return (
    <ArchText variant="label" style={{
      color: DS.colors.mutedForeground,
      marginBottom: DS.spacing.sm,
      marginLeft: 4,
      marginTop: DS.spacing.md,
    }}>
      {title}
    </ArchText>
  );
}

function SettingsRow({
  label,
  value,
  onPress,
  onPressIn,
  onPressOut,
  last = false,
  danger = false,
  right,
  animatedStyle,
  C,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  last?: boolean;
  danger?: boolean;
  right?: React.ReactNode;
  animatedStyle?: object;
  C: ReturnType<typeof useThemeColors>;
}) {
  const content = (
    <View style={{
      paddingHorizontal: 20,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 52,
    }}>
      <View style={{ flexShrink: 1, marginRight: 8 }}>
        <ArchText variant="body" style={{ fontSize: DS.fontSize.md, color: danger ? DS.colors.error : DS.colors.ink }} numberOfLines={2}>
          {label}
        </ArchText>
      </View>
      {right != null ? right : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: DS.spacing.xs }}>
          {value != null && (
            <ArchText variant="body" style={{ fontSize: DS.fontSize.sm, color: DS.colors.mutedForeground }}>{value}</ArchText>
          )}
          {onPress != null && (
            <ArchText variant="body" style={{ fontSize: 18, color: DS.colors.mutedForeground }}>›</ArchText>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View>
      {onPress != null ? (
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityLabel={danger ? `${label}, warning: this action cannot be undone` : label}
          accessibilityRole="button"
          accessibilityHint={danger ? 'This action cannot be undone' : undefined}
          style={[{ minHeight: 44, justifyContent: 'center' }, animatedStyle]}
        >{content}</Pressable>
      ) : content}
      {!last && (
        <View style={{ height: 1, backgroundColor: DS.colors.border, marginHorizontal: 20, opacity: 0.3 }} />
      )}
    </View>
  );
}

function SettingsCard({ children, danger = false, C }: { children: React.ReactNode; danger?: boolean; C: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={{
      backgroundColor: danger ? `${C.error}15` : DS.colors.card,
      borderRadius: DS.radius.large,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: danger ? DS.colors.error : DS.colors.ink,
    }}>
      {children}
    </View>
  );
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function StreakHeatmap({ streakCount, C }: { streakCount: number; C: ReturnType<typeof useThemeColors> }) {
  // Build last-7-days activity: today is always active, streak days going back
  const today = new Date().getDay(); // 0 = Sun
  const active = new Array(7).fill(false).map((_, i) => {
    // i=6 → today, i=5 → yesterday, etc.
    return i >= 7 - Math.min(streakCount, 7);
  });

  return (
    <View style={{
      backgroundColor: C.surface,
      borderRadius: DS.radius.card, // 24px — oval-first design system
      borderWidth: 1,
      borderColor: C.border,
      padding: DS.spacing.md,
      marginBottom: DS.spacing.sm,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: DS.spacing.sm }}>
        <ArchText variant="body" style={{ fontFamily: DS.font.semibold, fontSize: 13, color: DS.colors.accent, marginRight: 6 }}>
          ✦
        </ArchText>
        <ArchText variant="body" style={{ fontFamily: DS.font.semibold, fontSize: 13, color: C.primary }}>
          {streakCount}-day streak
        </ArchText>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 6 }}>
            <View style={{
              width: 32, height: 32, borderRadius: 10,
              backgroundColor: active[i] ? `${DS.colors.primary}18` : C.surfaceHigh,
              borderWidth: 1.5,
              borderColor: active[i] ? `${DS.colors.primary}60` : C.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {active[i] && (
                <Svg width={14} height={14} viewBox="0 0 24 24">
                  <SvgPath d="M20 6L9 17l-5-5" stroke={DS.colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              )}
            </View>
            <ArchText variant="body" style={{ fontSize: 10, color: active[i] ? C.primaryDim : C.primaryGhost }}>
              {label}
            </ArchText>
          </View>
        ))}
      </View>
      {streakCount === 0 && (
        <ArchText variant="body" style={{ fontSize: 12, color: C.primaryGhost, textAlign: 'center', marginTop: DS.spacing.sm }}>
          Open the app daily to build your streak
        </ArchText>
      )}
    </View>
  );
}

const APPEARANCE_OPTIONS: { mode: AppearanceMode; label: string }[] = [
  { mode: 'dark',   label: 'Dark'   },
  { mode: 'light',  label: 'Light'  },
  { mode: 'system', label: 'System' },
];

function AppearanceChips({ C }: { C: ReturnType<typeof useThemeColors> }) {
  const mode    = useAppearanceStore((s) => s.mode);
  const setMode = useAppearanceStore((s) => s.setMode);

  const appearancePressScale = useSharedValue(1);
  const appearanceAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: appearancePressScale.value }],
  }));
  const handleAppearancePressIn = () => {
    appearancePressScale.value = withSpring(0.97, { damping: 14, stiffness: 300 });
  };
  const handleAppearancePressOut = () => {
    appearancePressScale.value = withSpring(1, { damping: 14, stiffness: 300 });
  };

  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {APPEARANCE_OPTIONS.map(({ mode: m, label }) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              onPressIn={handleAppearancePressIn}
              onPressOut={handleAppearancePressOut}
              accessibilityLabel={`${label} appearance mode`}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityHint="Double tap to select this appearance mode"
              style={[{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 50,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? DS.colors.ink : 'transparent',
                borderWidth: 2,
                borderColor: active ? DS.colors.ink : DS.colors.border,
              }, appearanceAnimatedStyle as StyleProp<ViewStyle>]}
            >
              <ArchText
                variant="body"
                style={{
                  fontFamily: DS.font.bold,
                  fontSize: 13,
                  color: active ? DS.colors.paper : DS.colors.mutedForeground,
                  letterSpacing: 0.3,
                }}
              >
                {label}
              </ArchText>
            </Pressable>
          );
        })}
      </View>
      <ArchText
        variant="body"
        style={{
          fontSize: 11,
          color: DS.colors.mutedForeground,
          marginTop: 8,
          textAlign: 'center',
        }}
      >
        {mode === 'system' ? 'Follows your device appearance setting' : `Always use ${mode} mode`}
      </ArchText>
    </View>
  );
}

export function AccountScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { light, medium } = useHaptics();
  const C = useThemeColors();

  const { user, signOut } = useUser();

  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(user?.displayName ?? '');
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  const limits = TIER_LIMITS[user?.subscriptionTier ?? 'starter'] ?? TIER_LIMITS.starter;

  // Settings row press animation
  const settingsPressScale = useSharedValue(1);
  const settingsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: settingsPressScale.value }],
  }));
  const handleSettingsPressIn = () => {
    settingsPressScale.value = withSpring(0.97, { damping: 14, stiffness: 300 });
  };
  const handleSettingsPressOut = () => {
    settingsPressScale.value = withSpring(1, { damping: 14, stiffness: 300 });
  };

  // Entry animations
  const headerOp = useSharedValue(0);
  const headerY  = useSharedValue(-20);
  const bodyOp   = useSharedValue(0);
  const bodyY    = useSharedValue(12);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    headerOp.value = withTiming(1, { duration: 350, easing: ease });
    headerY.value  = withTiming(0, { duration: 350, easing: ease });
    bodyOp.value   = withDelay(150, withTiming(1, { duration: 350, easing: ease }));
    bodyY.value    = withDelay(150, withTiming(0, { duration: 350, easing: ease }));

    // Load notification preferences
    void (async () => {
      setNotifLoading(true);
      const prefs = await notificationPreferenceService.getPreferences();
      if (prefs) setNotificationsOn(prefs.push_enabled);
      setNotifLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOp.value, transform: [{ translateY: headerY.value }] }));
  const bodyStyle   = useAnimatedStyle(() => ({ opacity: bodyOp.value,   transform: [{ translateY: bodyY.value }] }));

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background }}>
        {/* Header skeleton */}
        <View style={{ alignItems: 'center', paddingTop: 60, paddingBottom: DS.spacing.xl }}>
          <SkeletonLoader showAvatar={false} rows={1} cardStyle={false} />
          <View style={{ marginTop: DS.spacing.md, alignItems: 'center' }}>
            <SkeletonLoader rows={1} cardStyle={false} />
            <View style={{ height: DS.spacing.xs }} />
            <SkeletonLoader rows={1} cardStyle={false} />
          </View>
        </View>
        {/* Settings cards skeleton */}
        <View style={{ paddingHorizontal: DS.spacing.lg }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ marginBottom: DS.spacing.md }}>
              <SkeletonLoader rows={3} cardStyle />
            </View>
          ))}
        </View>
      </View>
    );
  }

  const initial = user.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'A';
  const tierLabel = (user.subscriptionTier ?? 'starter').charAt(0).toUpperCase() + (user.subscriptionTier ?? 'starter').slice(1);

  const tierBadgeColors = {
    starter:   { border: DS.colors.border, text: DS.colors.mutedForeground },
    creator:   { border: DS.colors.success, text: DS.colors.success },
    pro:       { border: DS.colors.ink,     text: DS.colors.ink     },
    architect: { border: DS.colors.amber,  text: DS.colors.amber   },
  };
  const tierColors = tierBadgeColors[user.subscriptionTier ?? 'starter'] ?? tierBadgeColors.starter;

  const submitName = async () => {
    setEditing(false);
    if (!nameVal.trim() || nameVal === user.displayName) return;
    // Update display name in users table via Supabase
    await supabase.from('users').update({ display_name: nameVal.trim() }).eq('id', user.id);
    // AuthProvider's onAuthStateChange will fire and update user data reactively
  };

  const pickAvatar = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1] as [number, number],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const file = result.assets[0];
    if (!user.id) return;
    const publicUrl = await authService.uploadAvatar(user.id, file.uri);
    if (!publicUrl) { Alert.alert('Upload Failed', 'Could not upload avatar. Please try again.'); return; }
    await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id);
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const returnUrl = 'asoria://account';
      const url = await subscriptionService.manageSubscriptionPortal(returnUrl);
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open subscription page. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { void signOut(); } },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This will permanently delete your account and all your data. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Account',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Confirm Delete', 'This action is irreversible.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Yes, Delete Everything',
              style: 'destructive',
              onPress: async () => {
                try {
                  await authService.deleteAccount();
                } catch {
                  Alert.alert('Error', 'Could not delete your account. Please contact support.');
                }
              },
            },
          ]);
        },
      },
    ]);
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Your data export will be sent to your email.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Export',
        onPress: async () => {
          const { error } = await authService.exportUserData();
          if (error) {
            Alert.alert('Export Failed', 'Could not export your data. Please try again later.');
          } else {
            Alert.alert('Export Sent', 'Your data export has been sent to your email address.');
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: DS.spacing.lg,
          paddingBottom: Math.max(120, insets.bottom + 88),
        }}
      >
        {/* Avatar + name header */}
        <Animated.View style={[{ alignItems: 'center', paddingTop: insets.top + 24, paddingBottom: DS.spacing.xl }, headerStyle]}>
          {/* Avatar */}
          <Pressable
            onPress={() => { void pickAvatar(); }}
            accessibilityLabel="Change profile photo"
            accessibilityRole="button"
            accessibilityHint="Opens the photo library to select a new profile picture"
            style={{ position: 'relative', marginBottom: DS.spacing.md }}
          >
            <View style={{
              width: 88, height: 88, borderRadius: 44,
              backgroundColor: DS.colors.surfaceHigh,
              alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: DS.colors.ink,
            }}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: 88, height: 88, resizeMode: 'cover' }} />
              ) : (
                <ArchText variant="heading" style={{ fontSize: 34, color: DS.colors.ink }}>{initial}</ArchText>
              )}
            </View>
            {/* Camera badge */}
            <View style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: DS.colors.amber,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: DS.colors.ink,
            }}>
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={DS.colors.paper} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <Circle cx="12" cy="13" r="4" stroke={DS.colors.paper} strokeWidth="1.8" fill="none" />
              </Svg>
            </View>
          </Pressable>

          {/* Display name (editable) */}
          {editing ? (
            <TextInput
              value={nameVal}
              onChangeText={setNameVal}
              onBlur={() => { void submitName(); }}
              onSubmitEditing={() => { void submitName(); }}
              autoFocus
              style={{
                fontFamily: DS.font.heading,
                fontSize: 24,
                color: C.primary,
                borderBottomWidth: 1.5,
                borderBottomColor: C.accent,
                textAlign: 'center',
                minWidth: 120,
                paddingBottom: 4,
                marginBottom: DS.spacing.sm,
              }}
            />
          ) : (
            <Pressable
              onPress={() => setEditing(true)}
              accessibilityLabel={`Edit display name, currently ${user.displayName ?? 'Unnamed'}`}
              accessibilityRole="button"
              accessibilityHint="Double tap to edit your display name"
              hitSlop={8}
            >
              <ArchText variant="heading" style={{ fontSize: 24, color: C.primary, marginBottom: DS.spacing.sm }}>{user.displayName ?? 'Unnamed'}</ArchText>
            </Pressable>
          )}

          <ArchText variant="body" style={{ fontSize: DS.fontSize.sm, color: C.primaryDim, marginBottom: DS.spacing.sm }}>
            {user.email ?? ''}
          </ArchText>

          {/* Tier badge */}
          <View style={{
            paddingHorizontal: 14, paddingVertical: 5,
            borderRadius: 50,
            borderWidth: 1.5,
            borderColor: tierColors.border,
          }}>
            <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 11, color: tierColors.text, letterSpacing: 1.2 }}>
              {tierLabel}
            </ArchText>
          </View>
        </Animated.View>

        {/* Settings sections */}
        <Animated.View style={bodyStyle}>

          {/* STREAK HEATMAP */}
          <SectionLabel title="Activity" C={C} />
          <StreakHeatmap streakCount={user.streakCount ?? 0} C={C} />

          {/* APPEARANCE */}
          <SectionLabel title="Appearance" C={C} />
          <SettingsCard C={C}>
            <AppearanceChips C={C} />
          </SettingsCard>

          {/* SUBSCRIPTION */}
          <SectionLabel title="Subscription" C={C} />
          <SettingsCard C={C}>
            <SettingsRow
              label="Current Plan"
              value={tierLabel}
              C={C}
            />
            {user.subscriptionTier !== 'starter' ? (
              <SettingsRow
                label={portalLoading ? 'Opening…' : 'Manage Subscription'}
                onPress={() => { medium(); void handleManageSubscription(); }}
                onPressIn={handleSettingsPressIn}
                onPressOut={handleSettingsPressOut}
                animatedStyle={settingsAnimatedStyle}
                last
                C={C}
              />
            ) : (
              <SettingsRow
                label="Upgrade Plan"
                onPress={() => { medium(); navigation.navigate('Subscription'); }}
                onPressIn={handleSettingsPressIn}
                onPressOut={handleSettingsPressOut}
                animatedStyle={settingsAnimatedStyle}
                last
                C={C}
              />
            )}
          </SettingsCard>

          {/* ACCOUNT */}
          <SectionLabel title="Account" C={C} />
          <SettingsCard C={C}>
            <SettingsRow
              label="Edit Profile"
              onPress={() => setEditing(true)}
              onPressIn={handleSettingsPressIn}
              onPressOut={handleSettingsPressOut}
              animatedStyle={settingsAnimatedStyle}
              C={C}
            />
            <SettingsRow
              label="Change Password"
              onPress={() => {
                light();
                Alert.alert(
                  'Change Password',
                  'A password reset link will be sent to your email. Click the link to set a new password.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Send Link',
                      onPress: async () => {
                        try {
                          const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                            redirectTo: 'asoria://reset-password',
                          });
                          if (error) {
                            Alert.alert('Error', error.message);
                          } else {
                            Alert.alert('Email Sent', `Reset link sent to ${user.email}. Check your inbox.`);
                          }
                        } catch {
                          Alert.alert('Error', 'Failed to send reset email. Please try again.');
                        }
                      },
                    },
                  ],
                );
              }}
              onPressIn={handleSettingsPressIn}
              onPressOut={handleSettingsPressOut}
              animatedStyle={settingsAnimatedStyle}
              C={C}
            />
            <SettingsRow
              label="Export Data"
              onPress={() => { light(); handleExportData(); }}
              onPressIn={handleSettingsPressIn}
              onPressOut={handleSettingsPressOut}
              animatedStyle={settingsAnimatedStyle}
              C={C}
            />
            <SettingsRow
              label="Theme"
              onPress={() => { light(); navigation.navigate('ThemeCustomiser'); }}
              onPressIn={handleSettingsPressIn}
              onPressOut={handleSettingsPressOut}
              animatedStyle={settingsAnimatedStyle}
              C={C}
            />
            <SettingsRow
              label="Notifications"
              onPress={() => { light(); navigation.navigate('NotificationPreferences'); }}
              onPressIn={handleSettingsPressIn}
              onPressOut={handleSettingsPressOut}
              animatedStyle={settingsAnimatedStyle}
              last
              C={C}
              right={
                notifLoading ? (
                  <ArchText variant="body" style={{ fontSize: 12, color: C.primaryGhost }}>…</ArchText>
                ) : (
                  <Switch
                    value={notificationsOn}
                    onValueChange={(next) => {
                      light();
                      setNotificationsOn(next);
                      void notificationPreferenceService.updatePreferences({ push_enabled: next });
                    }}
                    trackColor={{ false: C.border, true: C.accent }}
                    thumbColor={notificationsOn ? C.background : C.primaryDim}
                    accessibilityLabel="Push notifications"
                    accessibilityRole="switch"
                    accessibilityState={{ checked: notificationsOn }}
                    accessibilityHint="Double tap to toggle push notifications"
                  />
                )
              }
            />
          </SettingsCard>

          {/* SUPPORT */}
          <SectionLabel title="Support" C={C} />
          <SettingsCard C={C}>
            <SettingsRow label="Help & FAQ"        onPress={() => { light(); navigation.navigate('HelpFAQ'); }}         onPressIn={handleSettingsPressIn} onPressOut={handleSettingsPressOut} animatedStyle={settingsAnimatedStyle} C={C} />
            <SettingsRow label="Privacy Policy"    onPress={() => { light(); navigation.navigate('PrivacyPolicy'); }}   onPressIn={handleSettingsPressIn} onPressOut={handleSettingsPressOut} animatedStyle={settingsAnimatedStyle} C={C} />
            <SettingsRow label="Terms of Service"  onPress={() => { light(); navigation.navigate('Terms'); }}           onPressIn={handleSettingsPressIn} onPressOut={handleSettingsPressOut} animatedStyle={settingsAnimatedStyle} C={C} />
            <SettingsRow label="Contact Support"   onPress={() => { light(); void Linking.openURL('mailto:support@asoria.app'); }} onPressIn={handleSettingsPressIn} onPressOut={handleSettingsPressOut} animatedStyle={settingsAnimatedStyle} last C={C} />
          </SettingsCard>

          {/* USAGE */}
          <SectionLabel title="Usage" C={C} />
          <SettingsCard C={C}>
            <SettingsRow
              label="AI Designs"
              value={`${user.aiGenerationsUsed ?? 0} / ${limits.aiGenerationsPerMonth === -1 ? '∞' : limits.aiGenerationsPerMonth}`}
              last={false}
              C={C}
            />
            <SettingsRow
              label="AR Scans"
              value={`${user.arScansUsed ?? 0} / ${limits.arScansPerMonth === -1 ? '∞' : limits.arScansPerMonth}`}
              last
              C={C}
            />
          </SettingsCard>

          {/* DANGER ZONE */}
          <SectionLabel title="Danger Zone" C={C} />
          <SettingsCard danger C={C}>
            <SettingsRow label="Sign Out"       danger onPress={handleSignOut}       onPressIn={handleSettingsPressIn} onPressOut={handleSettingsPressOut} animatedStyle={settingsAnimatedStyle} C={C} />
            <SettingsRow label="Delete Account" danger onPress={handleDeleteAccount} last onPressIn={handleSettingsPressIn} onPressOut={handleSettingsPressOut} animatedStyle={settingsAnimatedStyle} C={C} />
          </SettingsCard>

          {/* DEV only */}
          {__DEV__ && (
            <View style={{ marginTop: DS.spacing.md, alignItems: 'center' }}>
              <OvalButton
                label="Clear app data (dev)"
                variant="danger"
                onPress={() => { void signOut(); }}
              />
            </View>
          )}

          <ArchText variant="body" style={{ textAlign: 'center', fontSize: 12, color: C.primaryGhost, marginTop: DS.spacing.xl }}>
            ASORIA v1.0.0
          </ArchText>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
