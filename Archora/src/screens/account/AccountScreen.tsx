import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, Pressable, Switch, Alert, TextInput, Linking, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore, clearAllUserData } from '../../stores/authStore';
import { OvalButton } from '../../components/common/OvalButton';
import { ArchText } from '../../components/common/ArchText';
import { authService } from '../../services/authService';
import { useHaptics } from '../../hooks/useHaptics';
import { DS } from '../../theme/designSystem';
import { TIER_LIMITS } from '../../utils/tierLimits';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ── Section label ─────────────────────────────────────────────────────────
function SectionLabel({ title }: { title: string }) {
  return (
    <ArchText variant="body" style={{
      fontFamily: DS.font.medium,
      fontSize: 12,
      color: DS.colors.primaryGhost,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginBottom: DS.spacing.sm,
      marginLeft: 4,
      marginTop: DS.spacing.md,
    }}>
      {title}
    </ArchText>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────
function SettingsRow({
  label,
  value,
  onPress,
  last = false,
  danger = false,
  right,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
  danger?: boolean;
  right?: React.ReactNode;
}) {
  const content = (
    <View style={{
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <ArchText variant="body" style={{ fontSize: DS.fontSize.md, color: danger ? DS.colors.error : DS.colors.primary }}>
        {label}
      </ArchText>
      {right != null ? right : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: DS.spacing.xs }}>
          {value != null && (
            <ArchText variant="body" style={{ fontSize: DS.fontSize.sm, color: DS.colors.primaryDim }}>{value}</ArchText>
          )}
          {onPress != null && (
            <ArchText variant="body" style={{ fontSize: 18, color: DS.colors.primaryGhost }}>›</ArchText>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View>
      {onPress != null ? (
        <Pressable onPress={onPress}>{content}</Pressable>
      ) : content}
      {!last && (
        <View style={{ height: 1, backgroundColor: '#2A2A2A', marginHorizontal: 20 }} />
      )}
    </View>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────
function SettingsCard({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <View style={{
      backgroundColor: danger ? '#C0604A10' : DS.colors.surface,
      borderRadius: 20,
      overflow: 'hidden',
    }}>
      {children}
    </View>
  );
}

// ── AccountScreen ─────────────────────────────────────────────────────────
export function AccountScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { light, medium } = useHaptics();

  const user = useAuthStore((s) => s.user);
  const authActions = useAuthStore((s) => s.actions);

  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(user?.displayName ?? '');
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  const limits = TIER_LIMITS[user?.subscriptionTier ?? 'starter'] ?? TIER_LIMITS.starter;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOp.value, transform: [{ translateY: headerY.value }] }));
  const bodyStyle   = useAnimatedStyle(() => ({ opacity: bodyOp.value,   transform: [{ translateY: bodyY.value }] }));

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ArchText variant="body" style={{ color: DS.colors.primaryDim }}>Loading...</ArchText>
      </View>
    );
  }

  const initial = user.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'A';
  const tierLabel = (user.subscriptionTier ?? 'starter').charAt(0).toUpperCase() + (user.subscriptionTier ?? 'starter').slice(1);

  const tierBadgeColors = {
    starter:   { border: DS.colors.border,    text: DS.colors.primaryDim },
    creator:   { border: '#7AB87A80',          text: DS.colors.success    },
    pro:       { border: '#C8C8C850',          text: DS.colors.accent     },
    architect: { border: '#D4A84B80',          text: DS.colors.warning    },
  };
  const tierColors = tierBadgeColors[user.subscriptionTier ?? 'starter'] ?? tierBadgeColors.starter;

  const submitName = async () => {
    setEditing(false);
    if (!nameVal.trim() || nameVal === user.displayName) return;
    authActions.updateUser({ displayName: nameVal.trim() });
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
    authActions.updateUser({ avatarUrl: publicUrl });
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { url, error } = await authService.getStripePortalUrl();
      if (error || !url) throw new Error('Could not open billing portal');
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open the billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { void authActions.signOut(); } },
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
                  await authActions.deleteAccount();
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
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: DS.spacing.lg,
          paddingBottom: 120,
        }}
      >
        {/* ── Avatar + name header ───────────────────────────────────────── */}
        <Animated.View style={[{ alignItems: 'center', paddingTop: insets.top + 24, paddingBottom: DS.spacing.xl }, headerStyle]}>
          {/* Avatar */}
          <Pressable
            onPress={() => { void pickAvatar(); }}
            style={{ position: 'relative', marginBottom: DS.spacing.md }}
          >
            <View style={{
              width: 84, height: 84, borderRadius: 42,
              backgroundColor: DS.colors.surface,
              alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: 84, height: 84 }} />
              ) : (
                <ArchText variant="heading" style={{ fontSize: 32, color: DS.colors.primary }}>{initial}</ArchText>
              )}
            </View>
            {/* Camera badge */}
            <View style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: DS.colors.primary,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: DS.colors.background,
            }}>
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#1A1A1A" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <Circle cx="12" cy="13" r="4" stroke="#1A1A1A" strokeWidth="1.8" fill="none" />
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
                color: DS.colors.primary,
                borderBottomWidth: 1.5,
                borderBottomColor: DS.colors.accent,
                textAlign: 'center',
                minWidth: 120,
                paddingBottom: 4,
                marginBottom: DS.spacing.sm,
              }}
            />
          ) : (
            <Pressable onPress={() => setEditing(true)} hitSlop={8}>
              <ArchText variant="heading" style={{ fontSize: 24, marginBottom: DS.spacing.sm }}>{user.displayName ?? 'Unnamed'}</ArchText>
            </Pressable>
          )}

          <ArchText variant="body" style={{ fontSize: DS.fontSize.sm, color: DS.colors.primaryDim, marginBottom: DS.spacing.sm }}>
            {user.email}
          </ArchText>

          {/* Tier badge */}
          <View style={{
            paddingHorizontal: 12, paddingVertical: 4,
            borderRadius: 50,
            borderWidth: 1,
            borderColor: tierColors.border,
          }}>
            <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 11, color: tierColors.text, letterSpacing: 1 }}>
              {tierLabel}
            </ArchText>
          </View>
        </Animated.View>

        {/* ── Settings sections ──────────────────────────────────────────── */}
        <Animated.View style={bodyStyle}>

          {/* SUBSCRIPTION */}
          <SectionLabel title="Subscription" />
          <SettingsCard>
            <SettingsRow
              label="Current Plan"
              value={tierLabel}
            />
            {user.subscriptionTier !== 'starter' ? (
              <SettingsRow
                label={portalLoading ? 'Opening…' : 'Manage Subscription'}
                onPress={() => { medium(); void handleManageSubscription(); }}
                last
              />
            ) : (
              <SettingsRow
                label="Upgrade Plan"
                onPress={() => { medium(); navigation.navigate('Subscription'); }}
                last
              />
            )}
          </SettingsCard>

          {/* ACCOUNT */}
          <SectionLabel title="Account" />
          <SettingsCard>
            <SettingsRow
              label="Edit Profile"
              onPress={() => setEditing(true)}
            />
            <SettingsRow
              label="Change Password"
              onPress={() => {
                light();
                Alert.alert('Change Password', 'A password reset link will be sent to your email.');
              }}
            />
            <SettingsRow
              label="Export Data"
              onPress={() => { light(); handleExportData(); }}
            />
            <SettingsRow
              label="Theme"
              onPress={() => { light(); navigation.navigate('ThemeCustomiser'); }}
            />
            <SettingsRow
              label="Notifications"
              last
              right={
                <Switch
                  value={notificationsOn}
                  onValueChange={setNotificationsOn}
                  trackColor={{ false: DS.colors.border, true: DS.colors.accent }}
                  thumbColor={notificationsOn ? DS.colors.background : DS.colors.primaryDim}
                />
              }
            />
          </SettingsCard>

          {/* SUPPORT */}
          <SectionLabel title="Support" />
          <SettingsCard>
            <SettingsRow label="Help & FAQ"        onPress={() => { light(); navigation.navigate('HelpFAQ'); }} />
            <SettingsRow label="Privacy Policy"    onPress={() => { light(); navigation.navigate('PrivacyPolicy'); }} />
            <SettingsRow label="Terms of Service"  onPress={() => { light(); navigation.navigate('Terms'); }} />
            <SettingsRow label="Contact Support"   onPress={() => { light(); void Linking.openURL('mailto:support@asoria.app'); }} last />
          </SettingsCard>

          {/* USAGE */}
          <SectionLabel title="Usage" />
          <SettingsCard>
            <SettingsRow
              label="AI Designs"
              value={`${user.aiGenerationsUsed ?? 0} / ${limits.aiGenerationsPerMonth === -1 ? '∞' : limits.aiGenerationsPerMonth}`}
              last={false}
            />
            <SettingsRow
              label="AR Scans"
              value={`${user.arScansUsed ?? 0} / ${limits.arScansPerMonth === -1 ? '∞' : limits.arScansPerMonth}`}
              last
            />
          </SettingsCard>

          {/* DANGER ZONE */}
          <SectionLabel title="Danger Zone" />
          <SettingsCard danger>
            <SettingsRow label="Sign Out"       danger onPress={handleSignOut} />
            <SettingsRow label="Delete Account" danger onPress={handleDeleteAccount} last />
          </SettingsCard>

          {/* DEV only */}
          {__DEV__ && (
            <View style={{ marginTop: DS.spacing.md, alignItems: 'center' }}>
              <OvalButton
                label="Clear app data (dev)"
                variant="danger"
                onPress={() => { void clearAllUserData(); }}
              />
            </View>
          )}

          <ArchText variant="body" style={{ textAlign: 'center', fontSize: 12, color: DS.colors.primaryGhost, marginTop: DS.spacing.xl }}>
            ASORIA v1.0.0
          </ArchText>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
