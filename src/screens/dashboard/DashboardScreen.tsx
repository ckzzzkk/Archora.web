import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Pressable, TextInput, Modal,
  KeyboardAvoidingView, Platform, RefreshControl, Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring, Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line, Rect, Polyline, G } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../../auth/useSession';
import { useProjectStore } from '../../stores/projectStore';
import type { Project } from '../../types';
import { useHaptics } from '../../hooks/useHaptics';
import { useStreak } from '../../hooks/useStreak';
import { useThemeColors } from '../../hooks/useThemeColors';
import { NotificationPanel } from '../../components/dashboard/NotificationPanel';
import { OvalButton } from '../../components/common/OvalButton';
import { ArchText } from '../../components/common/ArchText';
import { CompassRose } from '../../components/common/CompassRose';
import { BlueprintThumbnail as SharedBlueprintThumbnail } from '../../components/common/BlueprintThumbnail';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { SkeletonLoader, SkeletonItem } from '../../components/common/SkeletonLoader';
import {
  getNotifications,
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from '../../services/notificationService';
import { DS } from '../../theme/designSystem';
import { useDeviceType } from '../../hooks/useDeviceType';
import { getResponsiveTokens } from '../../theme/responsive';
import { TIER_LIMITS } from '../../utils/tierLimits';
import type { RootStackParamList } from '../../navigation/types';
import type { BuildingType } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const BUILDING_TYPES: { key: BuildingType; label: string }[] = [
  { key: 'house',     label: 'House' },
  { key: 'apartment', label: 'Apartment' },
  { key: 'office',    label: 'Office' },
  { key: 'studio',    label: 'Studio' },
  { key: 'villa',     label: 'Villa' },
];

// Daily challenges — rotated by day-of-year
const DAILY_CHALLENGES = [
  'Design a studio apartment under 40m²',
  'Create an open-plan kitchen flowing to garden',
  'Build a home office with natural light',
  'Design a 2-bed with en-suite under 100m²',
  'Create a minimalist loft with exposed beams',
  'Design a villa with indoor-outdoor living',
  'Build a 3-floor townhouse under 180m²',
];

function getDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDailyChallenge(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
}

// SVG architectural line-art thumbnails per building type
function BlueprintThumbnail({ type, color, size = 64 }: { type: BuildingType; color: string; size?: number }) {
  const s = size;
  const c = color;
  if (type === 'house') {
    return (
      <Svg width={s} height={s * 0.8} viewBox="0 0 64 52">
        <Polyline points="3,24 32,4 61,24" stroke={c} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
        <Rect x="8" y="24" width="48" height="24" stroke={c} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <Rect x="26" y="36" width="12" height="12" stroke={c} strokeWidth="1.2" fill="none" />
        <Rect x="12" y="28" width="9" height="9" stroke={c} strokeWidth="1.2" fill="none" />
        <Rect x="43" y="28" width="9" height="9" stroke={c} strokeWidth="1.2" fill="none" />
        <Line x1="32" y1="4" x2="32" y2="48" stroke={c} strokeWidth="0.8" opacity={0.3} />
      </Svg>
    );
  }
  if (type === 'apartment') {
    return (
      <Svg width={s * 0.75} height={s} viewBox="0 0 48 64">
        <Rect x="5" y="8" width="38" height="52" stroke={c} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <Line x1="5" y1="18" x2="43" y2="18" stroke={c} strokeWidth="1" opacity={0.6} />
        <Line x1="5" y1="30" x2="43" y2="30" stroke={c} strokeWidth="1" opacity={0.6} />
        <Line x1="5" y1="42" x2="43" y2="42" stroke={c} strokeWidth="1" opacity={0.6} />
        <Rect x="9" y="10" width="6" height="6" stroke={c} strokeWidth="1" fill="none" opacity={0.7} />
        <Rect x="21" y="10" width="6" height="6" stroke={c} strokeWidth="1" fill="none" opacity={0.7} />
        <Rect x="33" y="10" width="6" height="6" stroke={c} strokeWidth="1" fill="none" opacity={0.7} />
        <Rect x="9" y="22" width="6" height="6" stroke={c} strokeWidth="1" fill="none" opacity={0.7} />
        <Rect x="21" y="22" width="6" height="6" stroke={c} strokeWidth="1" fill="none" opacity={0.7} />
        <Rect x="33" y="22" width="6" height="6" stroke={c} strokeWidth="1" fill="none" opacity={0.7} />
        <Rect x="18" y="44" width="12" height="16" stroke={c} strokeWidth="1.2" fill="none" />
        <Line x1="5" y1="8" x2="5" y2="3" stroke={c} strokeWidth="1.4" strokeLinecap="round" opacity={0.5} />
        <Line x1="43" y1="8" x2="43" y2="3" stroke={c} strokeWidth="1.4" strokeLinecap="round" opacity={0.5} />
        <Line x1="3" y1="3" x2="45" y2="3" stroke={c} strokeWidth="1.4" strokeLinecap="round" opacity={0.5} />
      </Svg>
    );
  }
  if (type === 'office') {
    return (
      <Svg width={s} height={s} viewBox="0 0 64 64">
        <Rect x="8" y="6" width="48" height="54" stroke={c} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <Line x1="8" y1="16" x2="56" y2="16" stroke={c} strokeWidth="1" opacity={0.5} />
        <Line x1="8" y1="28" x2="56" y2="28" stroke={c} strokeWidth="1" opacity={0.5} />
        <Line x1="8" y1="40" x2="56" y2="40" stroke={c} strokeWidth="1" opacity={0.5} />
        <G opacity={0.75}>
          <Rect x="12" y="8" width="7" height="6" stroke={c} strokeWidth="1" fill="none" />
          <Rect x="24" y="8" width="7" height="6" stroke={c} strokeWidth="1" fill="none" />
          <Rect x="36" y="8" width="7" height="6" stroke={c} strokeWidth="1" fill="none" />
          <Rect x="12" y="20" width="7" height="6" stroke={c} strokeWidth="1" fill="none" />
          <Rect x="24" y="20" width="7" height="6" stroke={c} strokeWidth="1" fill="none" />
          <Rect x="36" y="20" width="7" height="6" stroke={c} strokeWidth="1" fill="none" />
          <Rect x="12" y="32" width="7" height="6" stroke={c} strokeWidth="1" fill="none" />
          <Rect x="24" y="32" width="7" height="6" stroke={c} strokeWidth="1" fill="none" />
          <Rect x="36" y="32" width="7" height="6" stroke={c} strokeWidth="1" fill="none" />
        </G>
        <Rect x="22" y="42" width="20" height="18" stroke={c} strokeWidth="1.2" fill="none" />
      </Svg>
    );
  }
  if (type === 'villa') {
    return (
      <Svg width={s} height={s * 0.7} viewBox="0 0 80 56">
        <Polyline points="2,28 20,8 40,28" stroke={c} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Polyline points="40,28 58,12 78,28" stroke={c} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Rect x="6" y="28" width="34" height="24" stroke={c} strokeWidth="1.4" fill="none" />
        <Rect x="44" y="28" width="30" height="24" stroke={c} strokeWidth="1.4" fill="none" />
        <Rect x="14" y="34" width="8" height="8" stroke={c} strokeWidth="1" fill="none" opacity={0.8} />
        <Rect x="28" y="34" width="8" height="8" stroke={c} strokeWidth="1" fill="none" opacity={0.8} />
        <Rect x="22" y="40" width="8" height="12" stroke={c} strokeWidth="1.1" fill="none" />
        <Rect x="50" y="33" width="8" height="8" stroke={c} strokeWidth="1" fill="none" opacity={0.8} />
        <Rect x="62" y="33" width="8" height="8" stroke={c} strokeWidth="1" fill="none" opacity={0.8} />
      </Svg>
    );
  }
  // studio / default — floor plan view
  return (
    <Svg width={s} height={s * 0.75} viewBox="0 0 64 48">
      <Rect x="3" y="3" width="58" height="42" stroke={c} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <Line x1="32" y1="3" x2="32" y2="45" stroke={c} strokeWidth="1.2" opacity={0.7} />
      <Line x1="3" y1="24" x2="32" y2="24" stroke={c} strokeWidth="1" opacity={0.7} />
      <Line x1="3" y1="14" x2="32" y2="14" stroke={c} strokeWidth="1" opacity={0.5} />
      <Line x1="32" y1="32" x2="61" y2="32" stroke={c} strokeWidth="1" opacity={0.5} />
      <Path d="M32 24 Q38 24 38 18" stroke={c} strokeWidth="1" strokeDasharray="2 2" fill="none" opacity={0.6} />
      <Path d="M3 14 Q9 14 9 20" stroke={c} strokeWidth="1" strokeDasharray="2 2" fill="none" opacity={0.6} />
    </Svg>
  );
}

/**
 * ProjectCardSkeleton — skeleton that matches InlineProjectCard shape.
 */
function ProjectCardSkeleton({ C }: { C: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={{
      backgroundColor: C.surface,
      borderRadius: DS.radius.card, // 24px — oval-first design system
      marginHorizontal: DS.spacing.lg,
      marginBottom: DS.spacing.sm,
      borderWidth: 1,
      borderColor: C.border,
      overflow: 'hidden',
    }}>
      {/* Thumbnail */}
      <SkeletonItem width="100%" height={88} borderRadius={0} style={{ borderRadius: 0 }} />
      {/* Content */}
      <View style={{ padding: DS.spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <SkeletonItem height={14} width="55%" style={{ marginBottom: 0 }} />
          <SkeletonItem height={10} width="20%" style={{ marginBottom: 0 }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <SkeletonItem height={20} width={56} borderRadius={6} style={{ marginBottom: 0 }} />
            <SkeletonItem height={20} width={56} borderRadius={6} style={{ marginBottom: 0 }} />
          </View>
          <SkeletonItem height={28} width={52} borderRadius={50} style={{ marginBottom: 0 }} />
        </View>
      </View>
    </View>
  );
}

function SkeletonCards({ C }: { C: ReturnType<typeof useThemeColors> }) {
  return (
    <>
      {[0, 1, 2].map((i) => <ProjectCardSkeleton key={i} C={C} />)}
    </>
  );
}

function DailyChallengeBanner({ C }: { C: ReturnType<typeof useThemeColors> }) {
  const challenge = getDailyChallenge();
  const scale = useSharedValue(0.97);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  }, []);
  const bannerStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[bannerStyle, { marginHorizontal: DS.spacing.lg, marginBottom: DS.spacing.md }]}>
      <View style={{
        borderRadius: DS.radius.large,
        borderWidth: 2, borderColor: DS.colors.ink,
        backgroundColor: DS.colors.amber,
        padding: DS.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: DS.spacing.sm,
        shadowColor: DS.colors.ink, shadowOffset: { width: 3, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
      }}>
        <View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: DS.colors.background,
          borderWidth: 2, borderColor: DS.colors.ink,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2L14.5 9H22L16 13.5L18.5 20.5L12 16L5.5 20.5L8 13.5L2 9H9.5Z"
              stroke={DS.colors.ink} strokeWidth="1.5" strokeLinejoin="round" />
          </Svg>
        </View>
        <View style={{ flex: 1 }}>
          <ArchText variant="label" style={{ fontSize: 9, color: DS.colors.paper }}>
            Daily Challenge
          </ArchText>
          <ArchText variant="body" style={{ fontSize: 13, color: DS.colors.paper, fontFamily: DS.font.bold }}>
            {challenge}
          </ArchText>
        </View>
      </View>
    </Animated.View>
  );
}

function EmptyState({ onPress }: { onPress: () => void }) {
  const C = useThemeColors();
  const op = useSharedValue(0);
  const y = useSharedValue(20);
  useEffect(() => {
    op.value = withTiming(1, { duration: 600 });
    y.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: y.value }] }));

  return (
    <Animated.View style={[animStyle, { flex: 1, alignItems: 'center', justifyContent: 'center', padding: DS.spacing.xl }]}>
      <Svg width={140} height={110} viewBox="0 0 140 110">
        {/* House */}
        <Polyline points="12,54 50,18 88,54" stroke={C.primary} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
        <Rect x="18" y="54" width="64" height="40" stroke={C.primary} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <Rect x="40" y="72" width="16" height="22" stroke={C.primary} strokeWidth="1.2" fill="none" />
        <Rect x="24" y="60" width="12" height="10" stroke={C.primary} strokeWidth="1.1" fill="none" opacity={0.7} />
        <Rect x="64" y="60" width="12" height="10" stroke={C.primary} strokeWidth="1.1" fill="none" opacity={0.7} />
        {/* Compass rose hint */}
        <Circle cx="112" cy="26" r="16" stroke={C.primaryGhost} strokeWidth="1" fill="none" strokeDasharray="2 3" />
        <Line x1="112" y1="12" x2="112" y2="40" stroke={C.primaryGhost} strokeWidth="1" opacity={0.6} />
        <Line x1="98" y1="26" x2="126" y2="26" stroke={C.primaryGhost} strokeWidth="1" opacity={0.6} />
        <Polyline points="112,13 115,22 112,20 109,22" stroke={C.primary} strokeWidth="1.2" fill="none" opacity={0.7} />
        {/* Grid lines background */}
        <Line x1="0" y1="94" x2="140" y2="94" stroke={C.border} strokeWidth="0.8" opacity={0.5} />
        <Line x1="0" y1="84" x2="14" y2="84" stroke={C.border} strokeWidth="0.8" opacity={0.3} />
        <Line x1="86" y1="84" x2="140" y2="84" stroke={C.border} strokeWidth="0.8" opacity={0.3} />
      </Svg>
      <ArchText variant="heading" style={{ fontSize: 22, color: C.primary, textAlign: 'center', marginTop: DS.spacing.lg }}>
        Your canvas awaits
      </ArchText>
      <ArchText variant="body" style={{ fontSize: DS.fontSize.sm, color: C.primaryDim, textAlign: 'center', marginTop: DS.spacing.sm, lineHeight: 20 }}>
        Describe your vision — ARIA will{'\n'}generate your first floor plan
      </ArchText>
      <View style={{ marginTop: DS.spacing.lg }}>
        <OvalButton label="Start Designing" variant="filled" onPress={onPress} />
      </View>
    </Animated.View>
  );
}

const ProjectThumbnailColors: Record<string, string> = {
  house:     '#C9FFFD',
  apartment: '#FFEE8C',
  office:    '#C9FFFD',
  villa:     '#FFEE8C',
  studio:    '#C9FFFD',
};

function InlineProjectCard({ project, onPress, index }: { project: Project; onPress: () => void; index: number }) {
  const C = useThemeColors();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    const delay = index * 60;
    const ease = Easing.out(Easing.cubic);
    opacity.value = withDelay(delay, withTiming(1, { duration: 340, easing: ease }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 340, easing: ease }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));

  const formattedDate = new Date(project.updatedAt ?? project.createdAt ?? Date.now())
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const roomCount = project.roomCount ?? project.blueprintData?.rooms?.length ?? 0;
  const btype = (project.buildingType ?? 'studio') as BuildingType;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        accessibilityLabel={`${project.name}, ${btype} with ${roomCount} rooms, updated ${formattedDate}`}
        accessibilityRole="button"
        accessibilityHint="Opens this design in the workspace"
        style={{
          backgroundColor: DS.colors.card,
          borderRadius: DS.radius.large,
          marginHorizontal: DS.spacing.lg,
          marginBottom: DS.spacing.sm,
          borderWidth: 2, borderColor: DS.colors.ink,
          overflow: 'hidden',
          shadowColor: DS.colors.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0,
        }}
      >
        {/* Thumbnail with BlueprintThumbnail SVG */}
        <View style={{
          height: 100,
          backgroundColor: DS.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          borderBottomWidth: 2, borderBottomColor: DS.colors.ink,
        }}>
          <SharedBlueprintThumbnail kind={btype} color={DS.colors.ink} size={90} animate={true} />
        </View>

        <View style={{ padding: DS.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <ArchText variant="body" style={{ fontFamily: DS.font.bold, fontSize: DS.fontSize.md, color: DS.colors.ink, flex: 1 }}>
              {project.name}
            </ArchText>
            <ArchText variant="label" style={{ fontSize: 10 }}>{formattedDate}</ArchText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{
                borderWidth: 1, borderColor: DS.colors.ink,
                borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
              }}>
                <ArchText variant="mono" style={{ fontSize: 10, color: DS.colors.ink }}>
                  {roomCount} rooms
                </ArchText>
              </View>
              <View style={{
                borderWidth: 1, borderColor: DS.colors.ink,
                borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
              }}>
                <ArchText variant="mono" style={{ fontSize: 10, color: DS.colors.mutedForeground, textTransform: 'capitalize' }}>
                  {btype}
                </ArchText>
              </View>
            </View>
            <OvalButton label="Open" variant="outline" size="small" onPress={onPress} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function NewProjectModal({ visible, onClose, onCreate }: {
  visible: boolean; onClose: () => void;
  onCreate: (name: string, type: BuildingType) => void;
}) {
  const C = useThemeColors();
  const modalInsets = useSafeAreaInsets();
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
      <View style={{ flex: 1, backgroundColor: DS.colors.overlay, justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{
            backgroundColor: DS.colors.card,
            borderTopLeftRadius: 40, borderTopRightRadius: 40,
            borderTopWidth: 2, borderColor: DS.colors.ink,
            borderLeftWidth: 2, borderRightWidth: 2,
            paddingHorizontal: DS.spacing.lg,
            paddingTop: DS.spacing.lg,
            paddingBottom: Math.max(DS.spacing.xxl, modalInsets.bottom + DS.spacing.lg),
          }}>
            {/* Handle */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: DS.colors.ink, opacity: 0.3, alignSelf: 'center', marginBottom: DS.spacing.lg }} />
            <ArchText variant="title" style={{ fontSize: 22, color: DS.colors.ink, marginBottom: DS.spacing.lg }}>
              new project
            </ArchText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="name your project..."
              placeholderTextColor={DS.colors.mutedForeground}
              autoFocus
              style={{
                backgroundColor: DS.colors.background,
                borderRadius: 50, borderWidth: 2, borderColor: DS.colors.ink,
                paddingHorizontal: DS.spacing.lg, paddingVertical: 14,
                fontFamily: DS.font.heading, fontSize: 15, color: DS.colors.ink,
                marginBottom: DS.spacing.lg,
              }}
            />
            <ArchText variant="label" style={{ fontSize: 10, color: DS.colors.mutedForeground, marginBottom: DS.spacing.sm }}>
              building type
            </ArchText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.sm, marginBottom: DS.spacing.xl }}>
              {BUILDING_TYPES.map((bt) => (
                <Pressable
                  key={bt.key}
                  onPress={() => setBuildingType(bt.key)}
                  accessibilityLabel={bt.label}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: buildingType === bt.key }}
                  accessibilityHint="Double tap to select this building type"
                  style={{
                    paddingHorizontal: DS.spacing.md, paddingVertical: DS.spacing.sm,
                    borderRadius: 50, borderWidth: 2,
                    borderColor: buildingType === bt.key ? DS.colors.ink : DS.colors.border,
                    backgroundColor: buildingType === bt.key ? DS.colors.amber : 'transparent',
                  }}
                >
                  <ArchText variant="body" style={{ fontSize: 13, fontFamily: DS.font.heading, color: buildingType === bt.key ? DS.colors.paper : DS.colors.mutedForeground }}>
                    {bt.label}
                  </ArchText>
                </Pressable>
              ))}
            </View>
            <OvalButton label="create design" variant="amber" onPress={handleCreate} disabled={!name.trim()} fullWidth />
            <Pressable onPress={onClose} style={{ marginTop: DS.spacing.md, alignItems: 'center' }}>
              <ArchText variant="body" style={{ fontSize: 14, color: DS.colors.mutedForeground }}>Cancel</ArchText>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function DashboardHeader({
  insets,
  C,
  streakCount,
  points,
  projectCount,
  hasUnread,
  onOpenNotifications,
  onNewProject,
}: {
  insets: ReturnType<typeof useSafeAreaInsets>;
  C: ReturnType<typeof useThemeColors>;
  streakCount: number;
  points: number;
  projectCount: number;
  hasUnread: boolean;
  onOpenNotifications: () => void;
  onNewProject: () => void;
}) {
  const greeting = getDayGreeting();
  return (
    <View
      style={{
        paddingTop: insets.top + 12,
        paddingHorizontal: DS.spacing.lg,
        paddingBottom: DS.spacing.lg,
        backgroundColor: DS.colors.background,
      }}
    >
      {/* Top bar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: DS.spacing.lg,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: DS.spacing.sm }}>
          <CompassRose size={28} color={DS.colors.ink} />
          <ArchText variant="title" style={{ fontSize: 22 }}>ASORIA</ArchText>
        </View>
        <View style={{ flexDirection: 'row', gap: DS.spacing.sm }}>
          <Pressable
            onPress={onNewProject}
            accessibilityLabel="Create new design"
            accessibilityRole="button"
            accessibilityHint="Opens the new project dialog"
            style={{
              width: 44, height: 44, borderRadius: 22,
              borderWidth: 2, borderColor: DS.colors.ink,
              backgroundColor: DS.colors.card,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: DS.colors.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0,
            }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path d="M12 5v14M5 12h14" stroke={DS.colors.ink} strokeWidth="2" strokeLinecap="round" />
            </Svg>
          </Pressable>
          <Pressable
            onPress={onOpenNotifications}
            accessibilityLabel={`Notifications${hasUnread ? ', unread notifications' : ''}`}
            accessibilityRole="button"
            accessibilityHint="Opens the notifications panel"
            style={{
              width: 44, height: 44, borderRadius: 22,
              borderWidth: 2, borderColor: DS.colors.ink,
              backgroundColor: DS.colors.card,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: DS.colors.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0,
            }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                stroke={DS.colors.ink} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            {hasUnread && (
              <View style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: DS.colors.amber, borderWidth: 1, borderColor: DS.colors.ink }} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Streak + stats strip — ink bordered cards with sketch shadow */}
      <View style={{
        flexDirection: 'row',
        gap: DS.spacing.sm,
      }}>
        {/* Streak */}
        <View style={{
          flex: 1.5,
          flexDirection: 'row',
          alignItems: 'center',
          gap: DS.spacing.sm,
          backgroundColor: DS.colors.card,
          borderWidth: 2, borderColor: DS.colors.ink,
          borderRadius: 24, paddingHorizontal: DS.spacing.md, paddingVertical: 10,
          shadowColor: DS.colors.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0,
        }}>
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path d="M12 2C12 2 8 6 8 10C8 12.2 9.5 14 12 14C14.5 14 16 12.2 16 10C16 6 12 2 12 2Z" fill={DS.colors.amber} stroke={DS.colors.ink} strokeWidth="1" />
            <Path d="M10 14C10 14 8 16 8 18C8 20 10 22 12 22C14 22 16 20 16 18C16 16 14 14 14 14" stroke={DS.colors.ink} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </Svg>
          <View>
            <ArchText variant="mono" style={{ fontSize: 16, fontFamily: DS.font.bold, color: DS.colors.ink }}>{streakCount}</ArchText>
            <ArchText variant="label" style={{ fontSize: 9 }}>day streak</ArchText>
          </View>
        </View>
        {/* Points */}
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: DS.colors.card,
          borderWidth: 2, borderColor: DS.colors.ink,
          borderRadius: 24, paddingVertical: 10,
          shadowColor: DS.colors.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0,
        }}>
          <ArchText variant="mono" style={{ fontSize: 14, fontFamily: DS.font.bold, color: DS.colors.amber }}>{points.toLocaleString()}</ArchText>
          <ArchText variant="label" style={{ fontSize: 9 }}>pts</ArchText>
        </View>
        {/* Projects */}
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: DS.colors.card,
          borderWidth: 2, borderColor: DS.colors.ink,
          borderRadius: 24, paddingVertical: 10,
          shadowColor: DS.colors.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0,
        }}>
          <ArchText variant="mono" style={{ fontSize: 14, fontFamily: DS.font.bold, color: DS.colors.ink }}>{projectCount}</ArchText>
          <ArchText variant="label" style={{ fontSize: 9 }}>designs</ArchText>
        </View>
      </View>
    </View>
  );
}

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { light } = useHaptics();
  const C = useThemeColors();
  const { user } = useSession();
  const userTier = user?.subscriptionTier ?? 'starter';
  const { projects, isLoading, actions } = useProjectStore();
  const [showNewProject, setShowNewProject] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [refreshError, setRefreshError] = useState(false);

  const device = useDeviceType();
  const tokens = getResponsiveTokens(device.layout);

  const { streakCount } = useStreak();
  const points = user?.pointsTotal ?? 0;

  useEffect(() => {
    if (!user?.id) return;
    void actions.load(user.id);
    void getNotifications().then((data) => { setHasUnread(data.some((n) => !n.read)); });
    const channel = subscribeToNotifications(user.id, () => { setHasUnread(true); });
    return () => { unsubscribeFromNotifications(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    setRefreshError(false);
    try {
      await actions.refresh(user.id);
    } catch {
      setRefreshError(true);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, actions]);

  const handleCreate = async (name: string, buildingType: BuildingType) => {
    if (!user?.id) return;
    const tierLimit = TIER_LIMITS[user.subscriptionTier ?? 'starter'] ?? TIER_LIMITS.starter;
    if (tierLimit.savedProjects !== -1 && projects.length >= tierLimit.savedProjects) {
      Alert.alert('Project Limit Reached', `Your plan allows ${tierLimit.savedProjects} projects. Upgrade to save more.`);
      return;
    }
    setShowNewProject(false);
    const project = await actions.create(user.id, name, buildingType);
    navigation.navigate('Workspace', { projectId: project.id });
  };

  const handleNewProject = useCallback(() => { light(); setShowNewProject(true); }, [light]);
  const handleOpenNotifications = useCallback(() => { light(); setShowNotifications(true); setHasUnread(false); }, [light]);

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' }}>
        <CompassRoseLoader size="medium" />
      </View>
    );
  }

  const listHeader = useCallback(
    () => (
      <>
        <DashboardHeader
          insets={insets}
          C={C}
          streakCount={streakCount}
          points={points}
          projectCount={projects.length}
          hasUnread={hasUnread}
          onOpenNotifications={handleOpenNotifications}
          onNewProject={handleNewProject}
        />
        <View style={{ height: DS.spacing.md }} />
        <DailyChallengeBanner C={C} />
        <View style={{ paddingHorizontal: DS.spacing.lg, marginBottom: DS.spacing.sm }}>
          <ArchText variant="body" style={{ fontSize: 11, color: C.primaryGhost, fontFamily: DS.font.mono, textTransform: 'uppercase', letterSpacing: 1 }}>
            Your Designs
          </ArchText>
        </View>
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [insets, C, streakCount, points, projects.length, hasUnread, handleOpenNotifications, handleNewProject],
  );

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
          <SkeletonCards C={C} />
        </>
      ) : (
        <View style={{ paddingHorizontal: tokens.horizontalPadding }}>
          <FlashList
            data={projects}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={refreshError ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 }}>
                <Svg width={56} height={56} viewBox="0 0 56 56" style={{ marginBottom: DS.spacing.md }}>
                  <Circle cx="28" cy="28" r="22" stroke={C.border} strokeWidth="1.5" fill="none" />
                  <Path d="M20 20 L36 36 M36 20 L20 36" stroke={C.primaryDim} strokeWidth="1.8" strokeLinecap="round" />
                  <Circle cx="28" cy="44" r="2" fill={C.primaryDim} />
                </Svg>
                <ArchText variant="heading" style={{ fontSize: 20, color: C.primary, textAlign: 'center', marginBottom: DS.spacing.xs }}>
                  Connection hiccup
                </ArchText>
                <ArchText variant="body" style={{ fontSize: DS.fontSize.sm, color: C.primaryDim, textAlign: 'center', lineHeight: 20, marginBottom: DS.spacing.lg }}>
                  Could not reach the server. Check your connection and try again.
                </ArchText>
                <OvalButton label="Retry" variant="outline" size="small" onPress={() => { void handleRefresh(); }} />
              </View>
            ) : (
              <EmptyState onPress={handleNewProject} />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { void handleRefresh(); }}
                tintColor={C.primary}
              />
            }
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: Math.max(120, insets.bottom + 88) }}
            showsVerticalScrollIndicator={false}
            // @ts-expect-error -- FlashList v2 performance props not in types
            windowSize={5}
            maxToRenderPerBatch={8}
            initialNumToRender={6}
            updateCellsBatchingPeriod={50}
          />
        </View>
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
