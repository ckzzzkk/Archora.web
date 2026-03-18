import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Svg, { Rect, Line } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useTierGate } from '../../hooks/useTierGate';
import { TIER_LIMITS } from '../../utils/tierLimits';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { FurnitureLibrarySheet } from '../../components/blueprint/FurnitureLibrarySheet';
import { AIChatPanel } from '../../components/blueprint/AIChatPanel';
import { SurfacesSheet } from '../../components/blueprint/SurfacesSheet';
import { FloorSelectorBar } from '../../components/blueprint/FloorSelectorBar';
import { StaircasePromptSheet } from '../../components/blueprint/StaircasePromptSheet';
import { TierGate } from '../../components/common/TierGate';
import { BASE_COLORS } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import type { ViewMode } from '../../types';
import type { StaircaseType } from '../../types/blueprint';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TOOLS = [
  { id: 'select',    label: 'Select',    icon: '↖' },
  { id: 'wall',      label: 'Wall',      icon: '▬' },
  { id: 'door',      label: 'Door',      icon: '⊡' },
  { id: 'window',    label: 'Window',    icon: '⊞' },
  { id: 'furniture', label: 'Furniture', icon: '⊕' },
  { id: 'surfaces',  label: 'Surfaces',  icon: '◫' },
  { id: 'measure',   label: 'Measure',   icon: '↔' },
] as const;

type ToolId = typeof TOOLS[number]['id'];

function ToolButton({ tool, active, onPress }: { tool: typeof TOOLS[number]; active: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable onPress={() => {
      scale.value = withSpring(0.88, { damping: 10 }, () => { scale.value = withSpring(1, { damping: 14 }); });
      onPress();
    }}>
      <Animated.View style={[animStyle, { width: 52, height: 52, borderRadius: 14, backgroundColor: active ? BASE_COLORS.textPrimary + '18' : BASE_COLORS.surfaceHigh, borderWidth: 1, borderColor: active ? BASE_COLORS.textPrimary : BASE_COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: 8 }]}>
        <Text style={{ fontSize: 18, color: active ? BASE_COLORS.textPrimary : BASE_COLORS.textDim }}>{tool.icon}</Text>
        <Text style={{ fontSize: 8, fontFamily: 'Inter_400Regular', color: active ? BASE_COLORS.textPrimary : BASE_COLORS.textDim, marginTop: 2 }}>{tool.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function ViewModeToggle({ mode, onSelect }: { mode: ViewMode; onSelect: (m: ViewMode) => void }) {
  const modes: ViewMode[] = ['2D', '3D', 'FirstPerson'];
  return (
    <View style={{ flexDirection: 'row', backgroundColor: BASE_COLORS.surfaceHigh, borderRadius: 12, padding: 3, borderWidth: 1, borderColor: BASE_COLORS.border }}>
      {modes.map((m) => (
        <Pressable key={m} onPress={() => onSelect(m)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9, backgroundColor: mode === m ? BASE_COLORS.textPrimary + '20' : 'transparent', borderWidth: mode === m ? 1 : 0, borderColor: mode === m ? BASE_COLORS.textPrimary : 'transparent' }}>
          <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: mode === m ? BASE_COLORS.textPrimary : BASE_COLORS.textDim }}>
            {m === 'FirstPerson' ? '1P' : m}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function EmptyBlueprint({ onGenerate }: { onGenerate: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
      <Svg width={80} height={80} viewBox="0 0 80 80" style={{ marginBottom: 20, opacity: 0.4 }}>
        <Rect x="8" y="8" width="64" height="64" rx="4" stroke={BASE_COLORS.textPrimary} strokeWidth="2" fill="none" strokeDasharray="4 4" />
        <Line x1="8" y1="30" x2="72" y2="30" stroke={BASE_COLORS.textPrimary} strokeWidth="1" strokeDasharray="2 4" />
        <Line x1="30" y1="8" x2="30" y2="72" stroke={BASE_COLORS.textPrimary} strokeWidth="1" strokeDasharray="2 4" />
      </Svg>
      <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 22, color: BASE_COLORS.textPrimary, textAlign: 'center', marginBottom: 10 }}>No Blueprint Yet</Text>
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 28 }}>
        Generate a building with AI, scan a room, or start drawing manually.
      </Text>
      <Pressable onPress={onGenerate} style={{ backgroundColor: BASE_COLORS.textPrimary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 }}>
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: BASE_COLORS.background }}>Generate with AI</Text>
      </Pressable>
    </View>
  );
}

export function BlueprintWorkspaceScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [activeTool, setActiveTool] = useState<ToolId>('select');
  const [showFurniture, setShowFurniture] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSurfaces, setShowSurfaces] = useState(false);
  const [showStaircasePrompt, setShowStaircasePrompt] = useState(false);

  const blueprint = useBlueprintStore((s) => s.blueprint);
  const viewMode = useBlueprintStore((s) => s.viewMode);
  const isDirty = useBlueprintStore((s) => s.isDirty);
  const currentFloorIndex = useBlueprintStore((s) => s.currentFloorIndex);
  const {
    setViewMode,
    setCurrentFloor,
    addFloor,
    deleteFloor,
    copyFloor,
    addStaircase,
    addElevator,
  } = useBlueprintStore((s) => s.actions);

  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.actions.showToast);
  const tier = user?.subscriptionTier ?? 'starter';
  const maxFloors = TIER_LIMITS[tier].maxFloors;

  const { allowed: walkthroughAllowed } = useTierGate('walkthrough');

  const handleToolPress = useCallback((toolId: ToolId) => {
    if (toolId === 'furniture') { setShowFurniture(true); return; }
    if (toolId === 'surfaces') { setShowSurfaces(true); return; }
    setActiveTool(toolId);
  }, []);

  const handleViewModeSelect = useCallback((m: ViewMode) => {
    if (m === 'FirstPerson' && !walkthroughAllowed) {
      showToast('Upgrade to Creator to walk through your design', 'info');
      navigation.navigate('Subscription', { feature: 'walkthrough' });
      return;
    }
    setViewMode(m);
  }, [walkthroughAllowed, setViewMode, showToast, navigation]);

  const handleAddFloor = useCallback(() => {
    if (!blueprint) return;
    if (blueprint.floors.length >= maxFloors) {
      showToast('Upgrade your plan to add more floors', 'info');
      navigation.navigate('Subscription', { feature: 'maxFloors' });
      return;
    }
    addFloor();
  }, [blueprint, maxFloors, addFloor, showToast, navigation]);

  const handleStaircaseSelect = useCallback((type: StaircaseType) => {
    if (!blueprint) return;
    const floorIndex = blueprint.floors.length - 1;
    addStaircase(floorIndex, {
      id: Math.random().toString(36).slice(2),
      type,
      position: { x: 0, y: 0 },
      connectsFloors: [floorIndex - 1, floorIndex],
    });
    setShowStaircasePrompt(false);
  }, [blueprint, addStaircase]);

  const handleAddElevator = useCallback(() => {
    if (!blueprint) return;
    addElevator({
      id: Math.random().toString(36).slice(2),
      position: { x: 0, y: 0 },
      servesFloors: blueprint.floors.map((_, i) => i),
    });
    setShowStaircasePrompt(false);
  }, [blueprint, addElevator]);

  return (
    <View style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: BASE_COLORS.border, backgroundColor: BASE_COLORS.surface, gap: 10 }}>
        <Pressable onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: BASE_COLORS.surfaceHigh, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BASE_COLORS.border }}>
          <Text style={{ color: BASE_COLORS.textSecondary, fontSize: 16 }}>✕</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 16, color: BASE_COLORS.textPrimary }} numberOfLines={1}>
            {blueprint?.metadata.style ?? 'Blueprint Workspace'}
          </Text>
          {isDirty && (
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 9, color: BASE_COLORS.textDim, marginTop: 1 }}>unsaved changes</Text>
          )}
        </View>
        <ViewModeToggle mode={viewMode} onSelect={handleViewModeSelect} />
      </View>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BASE_COLORS.border, backgroundColor: BASE_COLORS.surface }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {TOOLS.map((tool) => (
            <ToolButton key={tool.id} tool={tool} active={activeTool === tool.id} onPress={() => handleToolPress(tool.id)} />
          ))}
        </ScrollView>
      </View>

      {/* ── Floor selector ──────────────────────────────────────────────── */}
      {blueprint && (
        <FloorSelectorBar
          floors={blueprint.floors}
          currentIndex={currentFloorIndex}
          onSelect={setCurrentFloor}
          onAdd={handleAddFloor}
          onCopyFloor={copyFloor}
          onDeleteFloor={deleteFloor}
          onStaircasePrompt={() => setShowStaircasePrompt(true)}
        />
      )}

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <View style={{ flex: 1, position: 'relative' }}>
        {blueprint ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: BASE_COLORS.textDim, textAlign: 'center' }}>
              {viewMode} view — Floor {blueprint.floors[currentFloorIndex]?.label ?? 'G'}{'\n'}
              {blueprint.rooms.length} rooms · {blueprint.walls.length} walls{'\n'}
              {blueprint.furniture.length} furniture pieces
            </Text>
            <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 13, color: BASE_COLORS.textSecondary, marginTop: 16, textAlign: 'center' }}>
              {blueprint.metadata.style}
            </Text>
            {blueprint.floors.length > 1 && (
              <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: BASE_COLORS.textDim, marginTop: 4 }}>
                {blueprint.floors.length} floors total
              </Text>
            )}
          </View>
        ) : (
          <EmptyBlueprint onGenerate={() => navigation.navigate('Generation')} />
        )}

        {blueprint && <AIChatPanel visible={showChat} onToggle={() => setShowChat((v) => !v)} />}
      </View>

      {/* ── Sheets ──────────────────────────────────────────────────────── */}
      <FurnitureLibrarySheet visible={showFurniture} onClose={() => setShowFurniture(false)} />
      <SurfacesSheet visible={showSurfaces} onClose={() => setShowSurfaces(false)} />
      {blueprint && (
        <StaircasePromptSheet
          visible={showStaircasePrompt}
          floorCount={blueprint.floors.length}
          onSelect={handleStaircaseSelect}
          onAddElevator={handleAddElevator}
          onDismiss={() => setShowStaircasePrompt(false)}
        />
      )}
    </View>
  );
}
