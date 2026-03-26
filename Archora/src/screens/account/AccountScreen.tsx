import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Switch, Alert, TextInput, Dimensions, Linking, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/authService';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { BASE_COLORS } from '../../theme/colors';
import { HeaderLogoMark } from '../../components/common/HeaderLogoMark';
import { TIER_LIMITS } from '../../utils/tierLimits';
import { useScreenSlideIn } from '../../hooks/useScreenSlideIn';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SCREEN_W = Dimensions.get('window').width;

const CARD_STYLE = {
  backgroundColor: BASE_COLORS.surface,
  borderRadius: 20,
  borderWidth: 1.5,
  borderColor: BASE_COLORS.border,
  marginBottom: 12,
  overflow: 'hidden' as const,
  shadowColor: BASE_COLORS.background,
  shadowOffset: { width: 1, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 0,
};

const ROW_STYLE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  paddingHorizontal: 16,
  paddingVertical: 14,
  borderBottomWidth: 1,
  borderBottomColor: BASE_COLORS.border,
};

const ROW_STYLE_LAST = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  paddingHorizontal: 16,
  paddingVertical: 14,
};

function SectionTitle({ title }: { title: string }) {
  return (
    <Text
      style={{
        fontFamily: 'ArchitectsDaughter_400Regular',
        fontSize: 18,
        color: BASE_COLORS.textPrimary,
        marginBottom: 8,
        marginTop: 4,
      }}
    >
      {title}
    </Text>
  );
}

function CompassRoseSVG({ size, color }: { size: number; color: string }) {
  const c = size / 2;
  const r = size * 0.42;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={c} cy={c} r={r} stroke={color} strokeWidth={size * 0.04} fill="none" opacity={0.3} />
      <Path
        d={`M ${c} ${c - r * 0.3} L ${c - r * 0.15} ${c - r * 0.9} L ${c} ${c - r} L ${c + r * 0.15} ${c - r * 0.9} Z`}
        fill={color}
      />
      <Path
        d={`M ${c} ${c + r * 0.3} L ${c - r * 0.15} ${c + r * 0.9} L ${c} ${c + r} L ${c + r * 0.15} ${c + r * 0.9} Z`}
        fill={color} opacity={0.5}
      />
      <Path
        d={`M ${c + r * 0.3} ${c} L ${c + r * 0.9} ${c - r * 0.15} L ${c + r} ${c} L ${c + r * 0.9} ${c + r * 0.15} Z`}
        fill={color} opacity={0.5}
      />
      <Path
        d={`M ${c - r * 0.3} ${c} L ${c - r * 0.9} ${c - r * 0.15} L ${c - r} ${c} L ${c - r * 0.9} ${c + r * 0.15} Z`}
        fill={color} opacity={0.5}
      />
      <Circle cx={c} cy={c} r={size * 0.04} fill={color} />
    </Svg>
  );
}

interface ProgressBarProps {
  label: string;
  used: number;
  limit: number;
  color: string;
}

function ProgressBar({ label, used, limit, color }: ProgressBarProps) {
  const pct = isFinite(limit) && limit > 0 ? Math.min(used / limit, 1) : 0;
  const barMaxWidth = SCREEN_W - 40;
  const barWidth = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withTiming(pct * barMaxWidth, { duration: 800, easing: Easing.out(Easing.cubic) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const barStyle = useAnimatedStyle(() => ({ width: barWidth.value }));

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: BASE_COLORS.textDim }}>
          {label}
        </Text>
        <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: color }}>
          {used} / {isFinite(limit) ? limit : '∞'}
        </Text>
      </View>
      <View style={{ height: 2, backgroundColor: BASE_COLORS.border, borderRadius: 1 }}>
        <Animated.View
          style={[barStyle, { height: 2, backgroundColor: color, borderRadius: 1 }]}
        />
      </View>
    </View>
  );
}

export function AccountScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { light, medium } = useHaptics();
  const slideStyle = useScreenSlideIn();

  const user = useAuthStore((s) => s.user);
  const authActions = useAuthStore((s) => s.actions);

  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(user?.displayName ?? '');
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  const limits = TIER_LIMITS[user?.subscriptionTier ?? 'starter'] ?? TIER_LIMITS.starter;

  // Entry animations
  const headerY = useSharedValue(-30);
  const headerOp = useSharedValue(0);
  const s0Y = useSharedValue(-20); const s0Op = useSharedValue(0);
  const s1Y = useSharedValue(-20); const s1Op = useSharedValue(0);
  const s2Y = useSharedValue(-20); const s2Op = useSharedValue(0);
  const s3Y = useSharedValue(-20); const s3Op = useSharedValue(0);
  const s4Y = useSharedValue(-20); const s4Op = useSharedValue(0);
  const s5Y = useSharedValue(-20); const s5Op = useSharedValue(0);

  useEffect(() => {
    headerY.value = withSpring(0, { damping: 18, stiffness: 200 });
    headerOp.value = withTiming(1, { duration: 250 });
    const pairs = [[s0Y, s0Op], [s1Y, s1Op], [s2Y, s2Op], [s3Y, s3Op], [s4Y, s4Op], [s5Y, s5Op]];
    pairs.forEach(([y, op], i) => {
      y.value = withDelay(100 + i * 60, withSpring(0, { damping: 16 }));
      op.value = withDelay(100 + i * 60, withTiming(1, { duration: 250 }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerY.value }],
    opacity: headerOp.value,
  }));
  const s0Style = useAnimatedStyle(() => ({ transform: [{ translateY: s0Y.value }], opacity: s0Op.value }));
  const s1Style = useAnimatedStyle(() => ({ transform: [{ translateY: s1Y.value }], opacity: s1Op.value }));
  const s2Style = useAnimatedStyle(() => ({ transform: [{ translateY: s2Y.value }], opacity: s2Op.value }));
  const s3Style = useAnimatedStyle(() => ({ transform: [{ translateY: s3Y.value }], opacity: s3Op.value }));
  const s4Style = useAnimatedStyle(() => ({ transform: [{ translateY: s4Y.value }], opacity: s4Op.value }));
  const s5Style = useAnimatedStyle(() => ({ transform: [{ translateY: s5Y.value }], opacity: s5Op.value }));

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: BASE_COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: BASE_COLORS.textSecondary, fontSize: 13 }}>Loading...</Text>
      </View>
    );
  }

  const submitName = async () => {
    setEditing(false);
    if (!nameVal.trim() || nameVal === user?.displayName) return;
    authActions.updateUser({ displayName: nameVal.trim() });
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
    const userId = user?.id;
    if (!userId) return;

    const publicUrl = await authService.uploadAvatar(userId, file.uri);
    if (!publicUrl) {
      Alert.alert('Upload Failed', 'Could not upload avatar. Please try again.');
      return;
    }
    authActions.updateUser({ avatarUrl: publicUrl });
  };

  const tierLabel = user?.subscriptionTier?.toUpperCase() ?? 'STARTER';
  const initial = user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'A';

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: BASE_COLORS.background }, slideStyle]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <Animated.View style={[headerAnimStyle, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }]}>
          <HeaderLogoMark size={32} />
          <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 28, color: BASE_COLORS.textPrimary, marginLeft: 10 }}>
            Account
          </Text>
        </Animated.View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

          {/* Header section */}
          <Animated.View style={[headerAnimStyle, { alignItems: 'center', marginBottom: 24 }]}>
            <Pressable
              onPress={() => { void pickAvatar(); }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primaryDim,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                borderWidth: 2,
                borderColor: colors.primary,
                overflow: 'hidden',
              }}
            >
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                />
              ) : (
                <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 36, color: BASE_COLORS.background }}>
                  {initial}
                </Text>
              )}
            </Pressable>

            {editing ? (
              <TextInput
                value={nameVal}
                onChangeText={setNameVal}
                onBlur={() => { void submitName(); }}
                onSubmitEditing={() => { void submitName(); }}
                autoFocus
                style={{
                  fontFamily: 'ArchitectsDaughter_400Regular',
                  fontSize: 22,
                  color: BASE_COLORS.textPrimary,
                  borderBottomWidth: 1.5,
                  borderBottomColor: colors.primary,
                  textAlign: 'center',
                  minWidth: 120,
                  paddingBottom: 4,
                  marginBottom: 8,
                }}
              />
            ) : (
              <Pressable onPress={() => setEditing(true)}>
                <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 22, color: BASE_COLORS.textPrimary, marginBottom: 8 }}>
                  {user?.displayName ?? 'Unnamed'}
                </Text>
              </Pressable>
            )}

            {/* Tier badge */}
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                backgroundColor: `${colors.primary}20`,
                borderRadius: 50,
                borderWidth: 1,
                borderColor: colors.primary,
                transform: [{ rotate: '-12deg' }],
              }}
            >
              <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: colors.primary, letterSpacing: 1, textTransform: 'uppercase' }}>
                {tierLabel}
              </Text>
            </View>

            {/* Points + streak row */}
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
              {(user?.pointsTotal ?? 0) > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: `${colors.primary}15`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: `${colors.primary}40` }}>
                  <Text style={{ fontSize: 14, marginRight: 4 }}>⭐</Text>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.primary }}>
                    {user?.pointsTotal ?? 0} pts
                  </Text>
                </View>
              )}
              {(user?.streakCount ?? 0) > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: `${BASE_COLORS.warning}15`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: `${BASE_COLORS.warning}40` }}>
                  <Text style={{ fontSize: 14, marginRight: 4 }}>🔥</Text>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: BASE_COLORS.warning }}>
                    {user?.streakCount ?? 0} day streak
                  </Text>
                </View>
              )}
            </View>

            {/* Stats row */}
            <View style={{ flexDirection: 'row', gap: 20, marginTop: 20 }}>
              {[
                { label: 'Generations', value: String(user?.aiGenerationsUsed ?? 0) },
                { label: 'AR Scans', value: String(user?.arScansUsed ?? 0) },
              ].map((stat) => (
                <View key={stat.label} style={{
                  alignItems: 'center',
                  backgroundColor: BASE_COLORS.surface,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: BASE_COLORS.border,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  minWidth: 76,
                }}>
                  <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 18, color: colors.primary }}>
                    {stat.value}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: BASE_COLORS.textDim, marginTop: 2 }}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Usage section */}
          <Animated.View style={s0Style}>
            <SectionTitle title="Usage" />
            <View style={CARD_STYLE}>
              <ProgressBar
                label="AI Generations"
                used={user?.aiGenerationsUsed ?? 0}
                limit={limits.aiGenerationsPerMonth}
                color={colors.primary}
              />
              <View style={{ height: 1, backgroundColor: BASE_COLORS.border }} />
              <ProgressBar
                label="AR Scans"
                used={user?.arScansUsed ?? 0}
                limit={limits.arScansPerMonth}
                color={colors.primary}
              />
            </View>
          </Animated.View>

          {/* Subscription card */}
          <Animated.View style={s1Style}>
            <SectionTitle title="Subscription" />
            <View style={CARD_STYLE}>
              <View style={ROW_STYLE}>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary }}>Current Plan</Text>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.primary, textTransform: 'capitalize' }}>
                  {user?.subscriptionTier ?? 'Starter'}
                </Text>
              </View>
              {user?.subscriptionTier !== 'starter' ? (
                <Pressable
                  style={ROW_STYLE_LAST}
                  onPress={() => { medium(); void handleManageSubscription(); }}
                  disabled={portalLoading}
                >
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary }}>
                    {portalLoading ? 'Opening…' : 'Manage Subscription'}
                  </Text>
                  <Text style={{ color: BASE_COLORS.textDim }}>›</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={ROW_STYLE_LAST}
                  onPress={() => { medium(); navigation.navigate('Subscription'); }}
                >
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.primary }}>Upgrade Plan</Text>
                  <Text style={{ color: colors.primary }}>›</Text>
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* Account card */}
          <Animated.View style={s2Style}>
            <SectionTitle title="Account" />
            <View style={CARD_STYLE}>
              <Pressable
                style={ROW_STYLE}
                onPress={() => {
                  Alert.alert('Change Password', 'A password reset link will be sent to your email.');
                }}
              >
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary }}>Change Password</Text>
                <Text style={{ color: BASE_COLORS.textDim }}>›</Text>
              </Pressable>
              <Pressable
                style={ROW_STYLE}
                onPress={() => {
                  Alert.alert('Export Data', 'Preparing your data export… This may take a moment.', [
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
                }}
              >
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary }}>Export Data</Text>
                <Text style={{ color: BASE_COLORS.textDim }}>›</Text>
              </Pressable>
              <Pressable
                style={ROW_STYLE_LAST}
                onPress={() => {
                  Alert.alert(
                    'Delete Account',
                    'This will permanently delete your account and all your data. This cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete Account',
                        style: 'destructive',
                        onPress: () => {
                          Alert.alert(
                            'Confirm Delete',
                            'Type DELETE to confirm.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Yes, Delete Everything',
                                style: 'destructive',
                                onPress: async () => {
                                  const { error } = await authService.deleteAccount();
                                  if (error) {
                                    Alert.alert('Error', 'Could not delete your account. Please try again or contact support.');
                                  } else {
                                    await authActions.signOut();
                                  }
                                },
                              },
                            ],
                          );
                        },
                      },
                    ],
                  );
                }}
              >
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.error }}>Delete Account</Text>
                <Text style={{ color: BASE_COLORS.textDim }}>›</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Preferences card */}
          <Animated.View style={s3Style}>
            <SectionTitle title="Preferences" />
            <View style={CARD_STYLE}>
              <View style={ROW_STYLE}>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary }}>Notifications</Text>
                <Switch
                  value={notificationsOn}
                  onValueChange={setNotificationsOn}
                  trackColor={{ false: BASE_COLORS.border, true: colors.primary }}
                  thumbColor={notificationsOn ? BASE_COLORS.background : BASE_COLORS.textDim}
                />
              </View>
              <Pressable
                style={ROW_STYLE_LAST}
                onPress={() => { light(); navigation.navigate('ThemeCustomiser'); }}
              >
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary }}>Theme</Text>
                <Text style={{ color: BASE_COLORS.textDim }}>›</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Support card */}
          <Animated.View style={s4Style}>
            <SectionTitle title="Support" />
            <View style={CARD_STYLE}>
              <Pressable style={ROW_STYLE} onPress={() => { light(); navigation.navigate('HelpFAQ'); }}>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary }}>Help & FAQ</Text>
                <Text style={{ color: BASE_COLORS.textDim }}>›</Text>
              </Pressable>
              <Pressable style={ROW_STYLE} onPress={() => { light(); navigation.navigate('PrivacyPolicy'); }}>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary }}>Privacy Policy</Text>
                <Text style={{ color: BASE_COLORS.textDim }}>›</Text>
              </Pressable>
              <Pressable style={ROW_STYLE_LAST} onPress={() => { light(); navigation.navigate('Terms'); }}>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary }}>Terms of Service</Text>
                <Text style={{ color: BASE_COLORS.textDim }}>›</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* About card */}
          <Animated.View style={s5Style}>
            <SectionTitle title="About" />
            <View style={[CARD_STYLE, { alignItems: 'center', paddingVertical: 20 }]}>
              <CompassRoseSVG size={40} color={colors.primary} />
              <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 13, color: BASE_COLORS.textPrimary, marginTop: 12, letterSpacing: 1 }}>
                ASORIA v1.0.0
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: BASE_COLORS.textSecondary, fontStyle: 'italic', marginTop: 4 }}>
                Built with architectural precision.
              </Text>
            </View>
          </Animated.View>

          {/* Sign Out */}
          <Pressable
            onPress={handleSignOut}
            style={{
              borderWidth: 1.5,
              borderColor: BASE_COLORS.error,
              borderRadius: 50,
              paddingVertical: 16,
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 14, color: BASE_COLORS.error, letterSpacing: 0.5 }}>
              SIGN OUT
            </Text>
          </Pressable>

        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}
