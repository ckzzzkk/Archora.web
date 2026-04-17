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
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import {
  getNotifications,
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from '../../services/notificationService';
import { DS } from '../../theme/designSystem';
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

function SkeletonCards() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            marginHorizontal: DS.spacing.lg,
            marginBottom: DS.spacing.sm,
          }}
        >
          <SkeletonLoader rows={3} cardStyle />
        </View>
      ))}
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
        borderRadius: 16,
        borderWidth: 1,
        borderColor: `${DS.colors.accent}30`,
        backgroundColor: `${DS.colors.accent}08`,
        padding: DS.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: DS.spacing.sm,
      }}>
        <View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: `${DS.colors.accent}15`,
          borderWidth: 1, borderColor: `${DS.colors.accent}30`,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2L14.5 9H22L16 13.5L18.5 20.5L12 16L5.5 20.5L8 13.5L2 9H9.5Z"
              stroke={DS.colors.accent} strokeWidth="1.5" strokeLinejoin="round" />
          </Svg>
        </View>
        <View style={{ flex: 1 }}>
          <ArchText variant="body" style={{ fontSize: 10, color: DS.colors.accent, fontFamily: DS.font.mono, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>
            Daily Challenge
          </ArchText>
          <ArchText variant="body" style={{ fontSize: 12, color: C.primary, fontFamily: DS.font.regular, lineHeight: 17 }}>
            {challenge}
          </ArchText>
        </View>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M9 18l6-6-6-6" stroke={C.primaryGhost} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
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
  const thumbColor = ProjectThumbnailColors[btype] ?? '#C9FFFD';
  const thumbBg = btype === 'apartment' || btype === 'villa' ? '#0A2020' : '#081818';

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: C.surface,
          borderRadius: 20,
          marginHorizontal: DS.spacing.lg,
          marginBottom: DS.spacing.sm,
          borderWidth: 1,
          borderColor: C.border,
          overflow: 'hidden',
        }}
      >
        {/* Thumbnail with SVG line-art */}
        <View style={{
          height: 88,
          backgroundColor: thumbBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <BlueprintThumbnail type={btype} color={thumbColor} size={60} />
        </View>

        <View style={{ padding: DS.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <ArchText variant="body" style={{ fontFamily: DS.font.semibold, fontSize: DS.fontSize.md, color: C.primary, flex: 1 }}>
              {project.name}
            </ArchText>
            <ArchText variant="body" style={{ fontSize: 11, color: C.primaryGhost, fontFamily: DS.font.mono }}>
              {formattedDate}
            </ArchText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{
                backgroundColor: `${thumbColor}15`,
                borderWidth: 1, borderColor: `${thumbColor}25`,
                borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
              }}>
                <ArchText variant="body" style={{ fontSize: 10, color: thumbColor, fontFamily: DS.font.mono }}>
                  {roomCount} {roomCount === 1 ? 'room' : 'rooms'}
                </ArchText>
              </View>
              <View style={{
                backgroundColor: `${C.border}`,
                borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
              }}>
                <ArchText variant="body" style={{ fontSize: 10, color: C.primaryDim, fontFamily: DS.font.mono, textTransform: 'capitalize' }}>
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
            backgroundColor: C.surface,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            borderTopWidth: 1, borderColor: DS.colors.border,
            paddingHorizontal: DS.spacing.lg,
            paddingTop: DS.spacing.lg,
            paddingBottom: Math.max(DS.spacing.xxl, modalInsets.bottom + DS.spacing.lg),
          }}>
            {/* Handle */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(240, 237, 232, 0.25)', alignSelf: 'center', marginBottom: DS.spacing.lg }} />
            <ArchText variant="heading" style={{ fontSize: 22, color: C.primary, marginBottom: DS.spacing.lg }}>
              New Design
            </ArchText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Name your project..."
              placeholderTextColor={C.primaryGhost}
              autoFocus
              style={{
                backgroundColor: C.background,
                borderRadius: 50, borderWidth: 1, borderColor: C.border,
                paddingHorizontal: DS.spacing.lg, paddingVertical: 14,
                fontFamily: DS.font.regular, fontSize: 15, color: C.primary,
                marginBottom: DS.spacing.lg,
              }}
            />
            <ArchText variant="body" style={{ fontSize: 12, color: C.primaryDim, fontFamily: DS.font.mono, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: DS.spacing.sm }}>
              Building Type
            </ArchText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.sm, marginBottom: DS.spacing.xl }}>
              {BUILDING_TYPES.map((bt) => (
                <Pressable
                  key={bt.key}
                  onPress={() => setBuildingType(bt.key)}
                  style={{
                    paddingHorizontal: DS.spacing.md, paddingVertical: DS.spacing.sm,
                    borderRadius: 50, borderWidth: 1,
                    borderColor: buildingType === bt.key ? C.primary : C.border,
                    backgroundColor: buildingType === bt.key ? `${C.primary}15` : 'transparent',
                  }}
                >
                  <ArchText variant="body" style={{ fontSize: 13, color: buildingType === bt.key ? C.primary : C.primaryDim }}>
                    {bt.label}
                  </ArchText>
                </Pressable>
              ))}
            </View>
            <OvalButton label="Create Design" variant="filled" onPress={handleCreate} disabled={!name.trim()} />
            <Pressable onPress={onClose} style={{ marginTop: DS.spacing.md, alignItems: 'center' }}>
              <ArchText variant="body" style={{ fontSize: 14, color: C.primaryDim }}>Cancel</ArchText>
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
    <LinearGradient
      colors={['#1F3030', '#1C2828', DS.colors.background]}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Top bar */}
      <View style={{
        paddingTop: insets.top + 12,
        paddingHorizontal: DS.spacing.lg,
        paddingBottom: DS.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <View style={{ flex: 1 }}>
          <ArchText variant="body" style={{ fontSize: 11, color: `${C.primary}60`, fontFamily: DS.font.mono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
            {greeting}
          </ArchText>
          <ArchText variant="heading" style={{ fontSize: 24, color: C.primary }}>
            ASORIA
          </ArchText>
        </View>
        <View style={{ flexDirection: 'row', gap: DS.spacing.sm }}>
          <Pressable
            onPress={onNewProject}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: `${C.primary}12`,
              borderWidth: 1, borderColor: `${C.primary}30`,
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
              backgroundColor: `${C.primary}12`,
              borderWidth: 1, borderColor: `${C.primary}30`,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                stroke={C.primary} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            {hasUnread && (
              <View style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: C.success }} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Streak + stats strip */}
      <View style={{
        marginHorizontal: DS.spacing.lg,
        marginBottom: DS.spacing.lg,
        flexDirection: 'row',
        gap: DS.spacing.sm,
      }}>
        {/* Streak */}
        <View style={{
          flex: 1.5,
          flexDirection: 'row',
          alignItems: 'center',
          gap: DS.spacing.sm,
          backgroundColor: 'rgba(240, 237, 232, 0.03)',
          borderWidth: 1, borderColor: 'rgba(240, 237, 232, 0.10)',
          borderRadius: 14, paddingHorizontal: DS.spacing.md, paddingVertical: 10,
        }}>
          <ArchText variant="body" style={{ fontSize: 18 }}>🔥</ArchText>
          <View>
            <ArchText variant="body" style={{ fontSize: 15, color: C.primary, fontFamily: DS.font.mono, fontWeight: '700' }}>
              {streakCount}
            </ArchText>
            <ArchText variant="body" style={{ fontSize: 10, color: C.primaryDim, fontFamily: DS.font.mono, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              day streak
            </ArchText>
          </View>
        </View>
        {/* Points */}
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(240, 237, 232, 0.03)',
          borderWidth: 1, borderColor: 'rgba(240, 237, 232, 0.10)',
          borderRadius: 14, paddingVertical: 10,
        }}>
          <ArchText variant="body" style={{ fontSize: 14, color: DS.colors.accent, fontFamily: DS.font.mono, fontWeight: '700' }}>
            {points.toLocaleString()}
          </ArchText>
          <ArchText variant="body" style={{ fontSize: 10, color: C.primaryDim, fontFamily: DS.font.mono, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            pts
          </ArchText>
        </View>
        {/* Projects */}
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(240, 237, 232, 0.03)',
          borderWidth: 1, borderColor: 'rgba(240, 237, 232, 0.10)',
          borderRadius: 14, paddingVertical: 10,
        }}>
          <ArchText variant="body" style={{ fontSize: 14, color: C.primary, fontFamily: DS.font.mono, fontWeight: '700' }}>
            {projectCount}
          </ArchText>
          <ArchText variant="body" style={{ fontSize: 10, color: C.primaryDim, fontFamily: DS.font.mono, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            designs
          </ArchText>
        </View>
      </View>
    </LinearGradient>
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
    await actions.refresh(user.id);
    setRefreshing(false);
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
          <SkeletonCards />
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
          contentContainerStyle={{ paddingBottom: Math.max(120, insets.bottom + 88) }}
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
