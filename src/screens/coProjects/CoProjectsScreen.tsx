import React, { useEffect, useCallback } from 'react';
import { View, Text, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoProjectStore } from '../../stores/coProjectStore';
import { useSession } from '../../auth/useSession';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { OvalButton } from '../../components/common/OvalButton';
import { CoProjectCard } from '../../components/coProjects/CoProjectCard';
import { DS } from '../../theme/designSystem';
import type { RootStackParamList } from '../../navigation/types';
import type { CoProject } from '../../services/coProjectService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const C = useThemeColors();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    translateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));

  return (
    <Animated.View style={[animStyle, { flex: 1, alignItems: 'center', justifyContent: 'center', padding: DS.spacing.xl }]}>
      <Text style={{ fontSize: 56, marginBottom: DS.spacing.lg }}>
        {/* Architectural compass icon */}
        <Text style={{ fontSize: 56 }}>🧭</Text>
      </Text>
      <Text style={{ fontFamily: DS.font.heading, fontSize: 22, color: C.primary, textAlign: 'center', marginBottom: DS.spacing.sm }}>
        Co-Design awaits
      </Text>
      <Text style={{ fontFamily: DS.font.regular, fontSize: DS.fontSize.md, color: C.primaryDim, textAlign: 'center', lineHeight: 22, marginBottom: DS.spacing.xl }}>
        Invite collaborators to your{'\n'}architectural projects
      </Text>
      <OvalButton label="Create Co-Project" variant="filled" onPress={onCreate} />
    </Animated.View>
  );
}

function CreateModal({ visible, onClose, onCreate }: {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}) {
  const [TextInput] = React.useState(() => require('react-native').TextInput);
  const C = useThemeColors();
  const modalInsets = useSafeAreaInsets();
  const [name, setName] = React.useState('');

  return (
    <View>
      {visible && (
        <View style={{
          position: 'absolute', inset: 0,
          backgroundColor: DS.colors.overlay,
          alignItems: 'center', justifyContent: 'center', zIndex: 10,
        }}>
          <View style={{
            backgroundColor: C.surface,
            borderRadius: DS.radius.modal,
            borderWidth: 1, borderColor: DS.colors.border,
            padding: DS.spacing.lg,
            marginHorizontal: DS.spacing.lg,
            width: '100%',
            maxWidth: 400,
          }}>
            <Text style={{ fontFamily: DS.font.heading, fontSize: 22, color: C.primary, marginBottom: DS.spacing.lg }}>
              New Co-Project
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Project name..."
              placeholderTextColor={C.primaryGhost}
              autoFocus
              style={{
                backgroundColor: C.background,
                borderRadius: DS.radius.input,
                borderWidth: 1, borderColor: C.border,
                paddingHorizontal: DS.spacing.lg, paddingVertical: 14,
                fontFamily: DS.font.regular, fontSize: 15, color: C.primary,
                marginBottom: DS.spacing.lg,
              }}
            />
            <OvalButton
              label="Create"
              variant="filled"
              onPress={() => { onCreate(name.trim()); setName(''); }}
              disabled={!name.trim()}
              fullWidth
            />
            <OvalButton label="Cancel" variant="ghost" onPress={onClose} fullWidth />
          </View>
        </View>
      )}
    </View>
  );
}

export function CoProjectsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { light } = useHaptics();
  const C = useThemeColors();
  const { user } = useSession();
  const { coProjects, isLoading, fetchCoProjects, createCoProject } = useCoProjectStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);

  useEffect(() => {
    if (user?.id) void fetchCoProjects();
  }, [user?.id]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchCoProjects(); } finally { setRefreshing(false); }
  }, [fetchCoProjects]);

  const handleCreate = async (name: string) => {
    const project = await createCoProject(name);
    setShowCreate(false);
    navigation.navigate('CoProjectDetail' as any, { projectId: project.id } as any);
  };

  const handleProjectPress = (project: CoProject) => {
    light();
    navigation.navigate('CoProjectDetail' as any, { projectId: project.id } as any);
  };

  const renderItem = useCallback(
    ({ item, index }: { item: CoProject; index: number }) => (
      <CoProjectCard project={item} index={index} onPress={() => handleProjectPress(item)} />
    ),
    [],
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScreenHeader
        title="Co-Projects"
        onBack={() => navigation.goBack()}
        rightAction={
          <OvalButton label="New" variant="outline" size="small" onPress={() => { light(); setShowCreate(true); }} />
        }
      />
      {isLoading && coProjects.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <CompassRoseLoader size="medium" />
        </View>
      ) : (
        <FlashList
          data={coProjects}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<EmptyState onCreate={() => setShowCreate(true)} />}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: Math.max(120, insets.bottom + 88) }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { void handleRefresh(); }} tintColor={C.primary} />
          }
        />
      )}
      <CreateModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </View>
  );
}