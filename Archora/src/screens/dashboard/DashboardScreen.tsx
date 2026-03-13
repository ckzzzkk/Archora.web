import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput, Modal,
  KeyboardAvoidingView, Platform, RefreshControl, Alert,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { ProjectCard } from '../../components/dashboard/ProjectCard';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { BASE_COLORS } from '../../theme/colors';
import { TIER_LIMITS } from '../../utils/tierLimits';
import type { RootStackParamList } from '../../navigation/types';
import type { BuildingType } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const BUILDING_TYPES: { key: BuildingType; label: string }[] = [
  { key: 'house', label: 'House' },
  { key: 'apartment', label: 'Apartment' },
  { key: 'office', label: 'Office' },
  { key: 'studio', label: 'Studio' },
  { key: 'villa', label: 'Villa' },
];

function NewProjectModal({
  visible,
  onClose,
  onCreate,
  accentColor,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, type: BuildingType) => void;
  accentColor: string;
}) {
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
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
          onPress={onClose}
        />
        <View style={{
          backgroundColor: BASE_COLORS.surfaceHigh,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 32,
          paddingBottom: 48,
          borderTopWidth: 1,
          borderTopColor: BASE_COLORS.border,
        }}>
          <Text style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 24,
            color: BASE_COLORS.textPrimary,
            marginBottom: 24,
          }}>
            New Project
          </Text>

          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: BASE_COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Project Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="My Dream Home"
            placeholderTextColor={BASE_COLORS.textDim}
            autoFocus
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 16,
              color: BASE_COLORS.textPrimary,
              borderBottomWidth: 1.5,
              borderBottomColor: accentColor,
              paddingVertical: 10,
              marginBottom: 24,
            }}
          />

          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: BASE_COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Building Type
          </Text>
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
                  borderColor: buildingType === type.key ? accentColor : BASE_COLORS.border,
                  backgroundColor: buildingType === type.key ? `${accentColor}20` : 'transparent',
                }}
              >
                <Text style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 13,
                  color: buildingType === type.key ? accentColor : BASE_COLORS.textSecondary,
                }}>
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={handleCreate}
            disabled={!name.trim()}
            style={{
              backgroundColor: name.trim() ? accentColor : BASE_COLORS.border,
              borderRadius: 24,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 17,
              color: BASE_COLORS.background,
            }}>
              Create Project
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EmptyState({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Svg width={120} height={100} viewBox="0 0 120 100" style={{ marginBottom: 24 }}>
        {/* Drafting table */}
        <Path d="M10 80 H110 V85 H10 Z" fill={BASE_COLORS.surface} stroke={BASE_COLORS.border} strokeWidth="1" />
        <Path d="M15 20 H105 V80 H15 Z" fill={BASE_COLORS.surface} stroke={BASE_COLORS.border} strokeWidth="1.5" />
        {/* Blank paper */}
        <Path d="M25 28 H95 V75 H25 Z" fill={BASE_COLORS.surfaceHigh} stroke={colors.primary} strokeWidth="0.8" opacity={0.6} />
        {/* Resting pencil */}
        <Path d="M30 68 L90 40" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
        <Path d="M90 40 L93 37 L90 40" stroke={colors.primary} strokeWidth="1.5" fill={colors.primary} />
        {/* Compass */}
        <Circle cx={75} cy={60} r={8} stroke={colors.primary} strokeWidth="1" fill="none" opacity={0.5} />
        <Path d="M75 52 L76.5 58 L75 60 L73.5 58 Z" fill={colors.primary} opacity={0.5} />
      </Svg>
      <Text style={{
        fontFamily: 'ArchitectsDaughter_400Regular',
        fontSize: 22,
        color: BASE_COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 12,
      }}>
        Your first project is waiting to be drawn.
      </Text>
      <Text style={{
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: BASE_COLORS.textSecondary,
        textAlign: 'center',
      }}>
        Tap the + button to start building
      </Text>
    </View>
  );
}

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { medium } = useHaptics();
  const user = useAuthStore((s) => s.user);
  const { projects, isLoading, actions } = useProjectStore();
  const [showNewProject, setShowNewProject] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fabScale = useSharedValue(0);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const headerY = useSharedValue(-30);
  const headerOp = useSharedValue(0);
  const headerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerY.value }],
    opacity: headerOp.value,
  }));

  useEffect(() => {
    headerY.value = withSpring(0, { damping: 18, stiffness: 200 });
    headerOp.value = withTiming(1, { duration: 250 });
    fabScale.value = withDelay(400, withSpring(1, { damping: 14, stiffness: 180 }));
  }, []);

  useEffect(() => {
    if (user?.id) {
      void actions.load(user.id);
    }
  }, [user?.id]);

  const handleRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await actions.refresh(user.id);
    setRefreshing(false);
  }, [user?.id]);

  const handleCreate = async (name: string, buildingType: BuildingType) => {
    if (!user?.id) return;
    const tierLimit = TIER_LIMITS[user.subscriptionTier];
    if (projects.length >= tierLimit.savedProjects) {
      Alert.alert('Project Limit Reached', `Your ${user.subscriptionTier} plan allows ${tierLimit.savedProjects} projects. Upgrade to save more.`);
      return;
    }
    setShowNewProject(false);
    const project = await actions.create(user.id, name, buildingType);
    navigation.navigate('Workspace', { projectId: project.id });
  };

  const handleFabPress = () => {
    medium();
    fabScale.value = withSpring(0.9, {}, () => { fabScale.value = withSpring(1); });
    setShowNewProject(true);
  };

  // Usage bar for AI generations
  const usagePercent = user
    ? Math.min((user.aiGenerationsUsed / TIER_LIMITS[user.subscriptionTier].aiGenerationsPerMonth) * 100, 100)
    : 0;
  const usageLimit = user ? TIER_LIMITS[user.subscriptionTier].aiGenerationsPerMonth : 15;

  return (
    <View style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
      {/* Header */}
      <Animated.View style={[{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 }, headerAnimStyle]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Text style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 28,
            color: BASE_COLORS.textPrimary,
          }}>
            Your Projects
          </Text>
          {/* Avatar */}
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 16,
              color: BASE_COLORS.background,
            }}>
              {user?.displayName?.[0]?.toUpperCase() ?? 'A'}
            </Text>
          </View>
        </View>

        {/* Usage dimension line */}
        {user && isFinite(usageLimit) && (
          <View style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: BASE_COLORS.textDim }}>
                AI Generations
              </Text>
              <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: colors.primary }}>
                {user.aiGenerationsUsed} / {usageLimit}
              </Text>
            </View>
            <View style={{ height: 2, backgroundColor: BASE_COLORS.border, borderRadius: 1 }}>
              <View style={{
                height: 2,
                width: `${usagePercent}%`,
                backgroundColor: usagePercent > 85 ? BASE_COLORS.error : colors.primary,
                borderRadius: 1,
              }} />
            </View>
          </View>
        )}
      </Animated.View>

      {/* Projects grid */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <CompassRoseLoader size="medium" />
        </View>
      ) : projects.length === 0 ? (
        <EmptyState colors={colors} />
      ) : (
        <FlatList
          data={projects}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { void handleRefresh(); }} tintColor={colors.primary} />
          }
          renderItem={({ item, index }) => (
            <ProjectCard
              project={item}
              index={index}
              onPress={() => navigation.navigate('Workspace', { projectId: item.id })}
              onDelete={() => { void actions.delete(item.id); }}
              onRename={() => {
                Alert.prompt(
                  'Rename Project',
                  '',
                  (text) => { if (text) void actions.rename(item.id, text); },
                  'plain-text',
                  item.name,
                );
              }}
            />
          )}
        />
      )}

      {/* FAB */}
      <Animated.View
        style={[
          fabStyle,
          {
            position: 'absolute',
            bottom: 100,
            right: 20,
          },
        ]}
      >
        <Pressable
          onPress={handleFabPress}
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Text style={{ fontSize: 28, color: BASE_COLORS.background, lineHeight: 32 }}>+</Text>
        </Pressable>
      </Animated.View>

      <NewProjectModal
        visible={showNewProject}
        onClose={() => setShowNewProject(false)}
        onCreate={(name, type) => { void handleCreate(name, type); }}
        accentColor={colors.primary}
      />
    </View>
  );
}
