import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Pressable, TextInput, Modal,
  KeyboardAvoidingView, Platform, RefreshControl, Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, withSequence, withSpring, Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import type { Project } from '../../types';
import { useHaptics } from '../../hooks/useHaptics';
import { useStreak } from '../../hooks/useStreak';
import { useThemeColors } from '../../hooks/useThemeColors';
import { NotificationPanel } from '../../components/dashboard/NotificationPanel';
import { OvalButton } from '../../components/common/OvalButton';
import { ArchText } from '../../components/common/ArchText';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import {
  getNotifications,
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from '../../services/notificationService';
import { DS } from '../../theme/designSystem';
import { TIER_LIMITS } from '../../utils/tierLimits';
import type { RootStackParamList } from '../../navigation/types';
import type { BuildingType } from '../../types';
import type { EdgeInsets } from 'react-native-safe-area-context';
import type { AnimatedStyle } from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const BUILDING_TYPES: { key: BuildingType; label: string }[] = [
  { key: 'house',     label: 'House' },
  { key: 'apartment', label: 'Apartment' },
  { key: 'office',    label: 'Office' },
  { key: 'studio',    label: 'Studio' },
  { key: 'villa',     label: 'Villa' },
];

function NewProjectModal({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, type: BuildingType) => void;
}) {
  const C = useThemeColors();
  const [name, setName] = useState('');
  const [buildingType, setBuildingType] = useState<BuildingType>('house');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), buildingType);
    setName('');
    setBuildingType('house');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={{ flex: 1, backgroundColor: C.overlay }} onPress={onClose} />
        <View style={{
          backgroundColor: C.surfaceHigh,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 32,
          paddingBottom: 48,
          borderTopWidth: 1,
          borderTopColor: C.border,
        }}>
          <ArchText variant="heading" style={{ fontSize: 24, color: C.primary, marginBottom: 24 }}>New Project</ArchText>

          <ArchText variant="body" style={{ fontSize: 12, color: C.primaryDim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Project Name
          </ArchText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="My Dream Home"
            placeholderTextColor={C.primaryGhost}
            autoFocus
            style={{
              fontFamily: DS.font.regular,
              fontSize: 16,
              color: C.primary,
              borderBottomWidth: 1.5,
              borderBottomColor: C.accent,
              paddingVertical: 10,
              marginBottom: 24,
            }}
          />

          <ArchText variant="body" style={{ fontSize: 12, color: C.primaryDim, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Building Type
          </ArchText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
            {BUILDING_TYPES.map((type) => (
              <Pressable
                key={type.key}
                onPress={() => setBuildingType(type.key)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: buildingType === type.key ? C.accent : C.border,
                  backgroundColor: buildingType === type.key ? `${C.accent}20` : 'transparent',
                }}
              >
                <ArchText variant="body" style={{
                  fontFamily: DS.font.medium,
                  fontSize: 13,
                  color: buildingType === type.key ? C.accent : C.primaryDim,
                }}>
                  {type.label}
                </ArchText>
              </Pressable>
            ))}
          </View>

          <OvalButton
            label="Create Project"
            variant={name.trim() ? 'filled' : 'ghost'}
            fullWidth
            disabled={!name.trim()}
            onPress={handleCreate}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function StatCard({ label, value, limit }: { label: string; value: number; limit: number }) {
  const C = useThemeColors();
  const fillPct = useSharedValue(0);

  useEffect(() => {
    const pct = limit > 0 ? Math.min(value / limit, 1) : 0;
    fillPct.value = withTiming(pct * 100, { duration: 600, easing: Easing.out(Easing.cubic) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, limit]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${fillPct.value}%` as unknown as number,
  }));

  return (
    <View style={{
      flex: 1,
      backgroundColor: C.surface,
      borderRadius: 20,
      padding: DS.spacing.md,
      borderWidth: 1,
      borderColor: C.border,
    }}>
      <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 28, color: C.primary }}>
        {value}
      </ArchText>
      <ArchText variant="body" style={{ fontSize: 12, color: C.primaryDim, marginTop: 2 }}>
        {label}
      </ArchText>
      <View style={{ height: 3, borderRadius: 2, backgroundColor: C.border, marginTop: DS.spacing.sm, overflow: 'hidden' }}>
        <Animated.View style={[{ height: 3, borderRadius: 2, backgroundColor: C.accent }, barStyle]} />
      </View>
    </View>
  );
}

function EmptyState({ onPress }: { onPress: () => void }) {
  const C = useThemeColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: DS.spacing.xl }}>
      <Svg width={120} height={120} viewBox="0 0 120 120">
        <Rect x="20" y="40" width="80" height="55" rx="4" stroke={C.border} strokeWidth="1.5" fill="none" />
        <Line x1="20" y1="60" x2="100" y2="60" stroke={C.border} strokeWidth="1" />
        <Line x1="60" y1="40" x2="60" y2="95" stroke={C.border} strokeWidth="1" />
        <Path d="M30 50 L50 50 M30 70 L55 70 M30 80 L45 80" stroke={C.borderLight} strokeWidth="1" strokeLinecap="round" />
        <Path d="M10 40 L20 40 M100 40 L110 40 M60 25 L60 40" stroke={C.border} strokeWidth="1.5" strokeLinecap="round" />
        <Circle cx="60" cy="25" r="5" stroke={C.border} strokeWidth="1.5" fill="none" />
      </Svg>
      <ArchText variant="heading" style={{ fontSize: 22, color: C.primary, textAlign: 'center', marginTop: DS.spacing.lg }}>
        Your first project is waiting
      </ArchText>
      <ArchText variant="body" style={{ fontSize: DS.fontSize.sm, color: C.primaryDim, textAlign: 'center', marginTop: DS.spacing.sm }}>
        Tap below to start building
      </ArchText>
      <View style={{ marginTop: DS.spacing.lg }}>
        <OvalButton label="Create Design" variant="filled" onPress={onPress} />
      </View>
    </View>
  );
}

function InlineProjectCard({
  project,
  onPress,
  index,
}: {
  project: Project;
  onPress: () => void;
  index: number;
}) {
  const C = useThemeColors();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const delay = index * 55;
    const ease = Easing.out(Easing.cubic);
    opacity.value = withDelay(delay, withTiming(1, { duration: 320, easing: ease }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 320, easing: ease }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const formattedDate = new Date(
    project.updatedAt ?? project.createdAt ?? Date.now()
  ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const roomCount = project.roomCount ?? project.blueprintData?.rooms?.length ?? 0;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: C.surface,
          borderRadius: 20,
          marginHorizontal: DS.spacing.lg,
          marginBottom: DS.spacing.sm,
          padding: DS.spacing.md,
          borderWidth: 1,
          borderColor: C.border,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: DS.spacing.sm }}>
          <ArchText variant="body" style={{ fontFamily: DS.font.medium, fontSize: DS.fontSize.md, color: C.primary, flex: 1 }}>
            {project.name}
          </ArchText>
          <ArchText variant="body" style={{ fontSize: 12, color: C.primaryDim }}>{formattedDate}</ArchText>
        </View>

        <View style={{
          height: 80,
          backgroundColor: C.background,
          borderRadius: DS.spacing.sm,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: DS.spacing.sm,
          borderWidth: 1,
          borderColor: C.border,
        }}>
          <Svg width={80} height={50} viewBox="0 0 80 50">
            <Rect x="5" y="5" width="70" height="40" rx="2" stroke={C.border} strokeWidth="1" fill="none" />
            <Line x1="5" y1="25" x2="75" y2="25" stroke={C.gridLine} strokeWidth="1" />
            <Line x1="40" y1="5" x2="40" y2="45" stroke={C.gridLine} strokeWidth="1" />
          </Svg>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ArchText variant="body" style={{ fontSize: 12, color: C.primaryDim }}>
            {roomCount} {roomCount === 1 ? 'room' : 'rooms'}
          </ArchText>
          <OvalButton label="Open" variant="outline" size="small" onPress={onPress} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// --- Fix 1: DashboardHeader extracted as a named component outside DashboardScreen ---

interface DashboardHeaderProps {
  insets: EdgeInsets;
  C: ReturnType<typeof useThemeColors>;
  streakCount: number;
  flameStyle: AnimatedStyle<ViewStyle>;
  projects: Project[];
  aiLimit: number;
  projLimit: number;
  handleNewProject: () => void;
  hasUnread: boolean;
  onOpenNotifications: () => void;
  currentUserAiGenerationsUsed: number;
}

function DashboardHeader({
  insets,
  C,
  streakCount,
  flameStyle,
  projects,
  aiLimit,
  projLimit,
  handleNewProject,
  hasUnread,
  onOpenNotifications,
  currentUserAiGenerationsUsed,
}: DashboardHeaderProps) {
  return (
    <>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 16,
        paddingHorizontal: DS.spacing.lg,
        paddingBottom: DS.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm }}>
          <ArchText variant="heading" style={{ fontSize: 24, color: C.primary }}>Your Projects</ArchText>
          {streakCount > 0 && (
            <Animated.View style={[flameStyle, { flexDirection: 'row', alignItems: 'center' }]}>
              <ArchText variant="body" style={{ fontSize: 18 }}>🔥</ArchText>
              <ArchText variant="body" style={{ fontFamily: DS.font.semibold, fontSize: 13, color: '#FF6B35' }}>
                {streakCount}
              </ArchText>
            </Animated.View>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: DS.spacing.sm }}>
          <Pressable
            onPress={handleNewProject}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: C.surface,
              borderWidth: 1, borderColor: C.border,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path d="M12 5v14M5 12h14" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round" />
            </Svg>
          </Pressable>
          <Pressable
            onPress={onOpenNotifications}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: C.surface,
              borderWidth: 1, borderColor: C.border,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke={C.primary} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            {hasUnread && (
              <View style={{
                position: 'absolute', top: 7, right: 7,
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: C.success,
              }} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', marginHorizontal: DS.spacing.lg, gap: DS.spacing.sm, marginBottom: DS.spacing.lg }}>
        <StatCard
          label="AI Designs"
          value={currentUserAiGenerationsUsed}
          limit={aiLimit !== -1 ? aiLimit : 9999}
        />
        <StatCard
          label="Projects"
          value={projects.length}
          limit={projLimit !== -1 ? projLimit : 9999}
        />
      </View>
    </>
  );
}

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { light } = useHaptics();
  const C = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const userTier = user?.subscriptionTier ?? 'starter';
  const tierLimits = TIER_LIMITS[userTier] ?? TIER_LIMITS.starter;
  const { projects, isLoading, actions } = useProjectStore();
  const [showNewProject, setShowNewProject] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const { streakCount } = useStreak();

  const flameScale = useSharedValue(1);
  useEffect(() => {
    if (streakCount > 0) {
      flameScale.value = withRepeat(
        withSequence(withSpring(1.15, { damping: 8 }), withSpring(1, { damping: 12 })),
        3,
      );
    }
  }, [streakCount, flameScale]);
  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scale: flameScale.value }] }));

  useEffect(() => {
    if (!user?.id) return;
    void actions.load(user.id);
    void getNotifications().then((data) => {
      setHasUnread(data.some((n) => !n.read));
    });
    const channel = subscribeToNotifications(user.id, () => { setHasUnread(true); });
    return () => { unsubscribeFromNotifications(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await actions.refresh(user.id);
    setRefreshing(false);
  }, [user?.id, actions]);

  const handleCreate = async (name: string, buildingType: BuildingType) => {
    if (!user?.id) return;
    const tierLimit = TIER_LIMITS[user.subscriptionTier ?? 'starter'] ?? TIER_LIMITS.starter;
    if (tierLimit.savedProjects !== -1 && projects.length >= tierLimit.savedProjects) {
      Alert.alert('Project Limit Reached', `Your ${user.subscriptionTier ?? 'starter'} plan allows ${tierLimit.savedProjects} projects. Upgrade to save more.`);
      return;
    }
    setShowNewProject(false);
    const project = await actions.create(user.id, name, buildingType);
    navigation.navigate('Workspace', { projectId: project.id });
  };

  const handleNewProject = useCallback(() => { light(); setShowNewProject(true); }, [light]);

  const handleOpenNotifications = useCallback(() => {
    light();
    setShowNotifications(true);
    setHasUnread(false);
  }, [light]);

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' }}>
        <CompassRoseLoader size="medium" />
      </View>
    );
  }

  const aiLimit = tierLimits.aiGenerationsPerMonth;
  const projLimit = tierLimits.savedProjects;
  const currentUserAiGenerationsUsed = user.aiGenerationsUsed ?? 0;

  // Fix 1: stable listHeader callback — only recreates when its deps change
  const listHeader = useCallback(
    () => (
      <DashboardHeader
        insets={insets}
        C={C}
        streakCount={streakCount}
        flameStyle={flameStyle}
        projects={projects}
        aiLimit={aiLimit}
        projLimit={projLimit}
        handleNewProject={handleNewProject}
        hasUnread={hasUnread}
        onOpenNotifications={handleOpenNotifications}
        currentUserAiGenerationsUsed={currentUserAiGenerationsUsed}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [insets, C, streakCount, flameStyle, projects, aiLimit, projLimit, handleNewProject, hasUnread, handleOpenNotifications, currentUserAiGenerationsUsed],
  );

  // Fix 2: memoized renderItem
  const renderItem = useCallback(
    ({ item, index }: { item: Project; index: number }) => (
      <InlineProjectCard
        project={item}
        index={index}
        onPress={() => navigation.navigate('Workspace', { projectId: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      {isLoading ? (
        <>
          {listHeader()}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <CompassRoseLoader size="medium" />
          </View>
        </>
      ) : (
        <FlashList
          data={projects}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={<EmptyState onPress={handleNewProject} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { void handleRefresh(); }}
              tintColor={C.primary}
            />
          }
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <NewProjectModal
        visible={showNewProject}
        onClose={() => setShowNewProject(false)}
        onCreate={(name, type) => { void handleCreate(name, type); }}
      />
      <NotificationPanel
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
}
