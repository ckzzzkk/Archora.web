import React, { useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoProjectStore } from '../../stores/coProjectStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { OvalButton } from '../../components/common/OvalButton';
import { ActivityFeed } from '../../components/coProjects/ActivityFeed';
import { MemberList } from '../../components/coProjects/MemberList';
import { InviteModal } from '../../components/coProjects/InviteModal';
import { DS } from '../../theme/designSystem';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, 'CoProjectDetail'>;

export function CoProjectDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const insets = useSafeAreaInsets();
  const { light } = useHaptics();
  const C = useThemeColors();
  const { activeProject, members, activityFeed, isLoading, fetchCoProject, fetchMembers, fetchActivityFeed, removeMember } = useCoProjectStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showInvite, setShowInvite] = React.useState(false);

  const projectId = route.params?.projectId;

  useEffect(() => {
    if (projectId) {
      void fetchCoProject(projectId);
      void fetchMembers(projectId);
      void fetchActivityFeed(projectId);
    }
  }, [projectId]);

  const handleRefresh = useCallback(async () => {
    if (!projectId) return;
    setRefreshing(true);
    try {
      await Promise.all([
        fetchCoProject(projectId),
        fetchMembers(projectId),
        fetchActivityFeed(projectId),
      ]);
    } finally { setRefreshing(false); }
  }, [projectId, fetchCoProject, fetchMembers, fetchActivityFeed]);

  if (isLoading && !activeProject) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' }}>
        <CompassRoseLoader size="large" />
      </View>
    );
  }

  if (!activeProject) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background }}>
        <ScreenHeader title="Co-Project" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: DS.font.regular, fontSize: DS.fontSize.md, color: C.primaryDim }}>
            Project not found
          </Text>
        </View>
      </View>
    );
  }

  const roleBadgeColor = activeProject.yourRole === 'owner'
    ? DS.colors.accent
    : activeProject.yourRole === 'editor'
    ? C.success
    : C.primaryDim;

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScreenHeader
        title={activeProject.name}
        onBack={() => navigation.goBack()}
        rightAction={
          activeProject.yourRole !== 'viewer' ? (
            <OvalButton
              label="Invite"
              variant="filled"
              size="small"
              onPress={() => { light(); setShowInvite(true); }}
            />
          ) : undefined
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Math.max(120, insets.bottom + 88) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { void handleRefresh(); }} tintColor={C.primary} />
        }
      >
        {/* Project meta */}
        <View style={{
          marginHorizontal: DS.spacing.lg,
          marginTop: DS.spacing.lg,
          marginBottom: DS.spacing.md,
          padding: DS.spacing.md,
          backgroundColor: C.surface,
          borderRadius: DS.radius.card,
          borderWidth: 1, borderColor: C.border,
        }}>
          {activeProject.description ? (
            <Text style={{ fontFamily: DS.font.regular, fontSize: DS.fontSize.md, color: C.primary, lineHeight: 22 }}>
              {activeProject.description}
            </Text>
          ) : (
            <Text style={{ fontFamily: DS.font.regular, fontSize: DS.fontSize.sm, color: C.primaryGhost, fontStyle: 'italic' }}>
              No description yet
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm, marginTop: DS.spacing.md }}>
            <View style={{
              backgroundColor: `${roleBadgeColor}20`,
              borderWidth: 1, borderColor: `${roleBadgeColor}40`,
              borderRadius: 50, paddingHorizontal: 12, paddingVertical: 4,
            }}>
              <Text style={{ fontFamily: DS.font.mono, fontSize: 11, color: roleBadgeColor, textTransform: 'uppercase' }}>
                {activeProject.yourRole}
              </Text>
            </View>
            <Text style={{ fontFamily: DS.font.mono, fontSize: 11, color: C.primaryGhost }}>
              {activeProject.memberCount ?? members.length} member{((activeProject.memberCount ?? members.length) !== 1 ? 's' : '')}
            </Text>
          </View>
        </View>

        {/* Codesign CTA */}
        {activeProject.blueprintId && (
          <View style={{ marginHorizontal: DS.spacing.lg, marginBottom: DS.spacing.lg }}>
            <OvalButton
              label="Enter Codesign Session"
              variant="filled"
              fullWidth
              onPress={() => {
                light();
                navigation.navigate('Workspace' as any, { projectId: activeProject.blueprintId } as any);
              }}
            />
          </View>
        )}

        {/* Members */}
        <View style={{ marginHorizontal: DS.spacing.lg, marginBottom: DS.spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: DS.spacing.md }}>
            <Text style={{ fontFamily: DS.font.semibold, fontSize: DS.fontSize.md, color: C.primary }}>
              Members
            </Text>
            {activeProject.yourRole === 'owner' && (
              <OvalButton label="Invite" variant="ghost" size="small" onPress={() => { light(); setShowInvite(true); }} />
            )}
          </View>
          <MemberList members={members} showRemove canRemove={activeProject.yourRole === 'owner'} onRemove={(projectId, userId) => { void removeMember(projectId, userId); }} />
        </View>

        {/* Activity Feed */}
        <View style={{ marginHorizontal: DS.spacing.lg, marginBottom: DS.spacing.lg }}>
          <Text style={{ fontFamily: DS.font.semibold, fontSize: DS.fontSize.md, color: C.primary, marginBottom: DS.spacing.md }}>
            Activity
          </Text>
          <ActivityFeed entries={activityFeed} />
        </View>
      </ScrollView>

      <InviteModal
        visible={showInvite}
        onClose={() => setShowInvite(false)}
        projectId={projectId ?? ''}
      />
    </View>
  );
}