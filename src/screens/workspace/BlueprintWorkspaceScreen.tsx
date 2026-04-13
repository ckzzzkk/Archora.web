import React, { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Share, Modal } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, interpolate,
} from 'react-native-reanimated';
import Svg, { Rect, Line, Path } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useTierGate } from '../../hooks/useTierGate';
import { useEditTimer } from '../../hooks/useEditTimer';
import { useShakeDetector } from '../../hooks/useShakeDetector';
import { use2D3DSync } from '../../hooks/use2D3DSync';
import { TIER_LIMITS } from '../../utils/tierLimits';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Canvas2D } from '../../components/blueprint/Canvas2D';
import type { Canvas2DHandle } from '../../components/blueprint/Canvas2D';
import { FurnitureLibrarySheet } from '../../components/blueprint/FurnitureLibrarySheet';
import { StyleSelectorSheet } from '../../components/blueprint/StyleSelectorSheet';
import { AIChatPanel } from '../../components/blueprint/AIChatPanel';
import { SurfacesSheet } from '../../components/blueprint/SurfacesSheet';
import { FloorSelectorBar } from '../../components/blueprint/FloorSelectorBar';
import { StaircasePromptSheet } from '../../components/blueprint/StaircasePromptSheet';
import { ImageToFurnitureSheet } from '../../components/blueprint/ImageToFurnitureSheet';
import { CopyPasteSheet } from '../../components/blueprint/CopyPasteSheet';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { InHouseView } from '../../components/3d/InHouseView';
import { DS } from '../../theme/designSystem';
import { SUNRISE } from '../../theme/sunrise';
import { ArchText } from '../../components/common/ArchText';
import { SimulationPanel } from '../../components/blueprint/SimulationPanel';
import { CostEstimatorModal } from '../../components/common/CostEstimatorModal';
import { exportBlueprintToDXF } from '../../utils/dxfExport';
import { simulationService } from '../../services/simulationService';
import type { SimulationReport } from '../../types/blueprint';
import { randomUUID } from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import type { RootStackParamList } from '../../navigation/types';
import type { ViewMode } from '../../types';
import type { StaircaseType } from '../../types/blueprint';
import type { FurnitureDef } from '../../hooks/useFurniturePlacement';

const Viewer3D = React.lazy(() =>
  import('../../components/3d/Viewer3D')
    .then((m) => ({ default: m.Viewer3D }))
);

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
      <Animated.View style={[animStyle, { width: 52, height: 52, borderRadius: 20, backgroundColor: active ? DS.colors.primary + '18' : DS.colors.surfaceHigh, borderWidth: 1, borderColor: active ? DS.colors.primary : DS.colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 8 }]}>
        <ArchText variant="body" style={{ fontSize: 18, color: active ? DS.colors.primary : DS.colors.primaryGhost }}>{tool.icon}</ArchText>
        <ArchText variant="body" style={{ fontSize: 8, fontFamily: 'Inter_400Regular', color: active ? DS.colors.primary : DS.colors.primaryGhost, marginTop: 2 }}>{tool.label}</ArchText>
      </Animated.View>
    </Pressable>
  );
}

function ViewModeToggle({ mode, onSelect }: { mode: ViewMode; onSelect: (m: ViewMode) => void }) {
  const modes: ViewMode[] = ['2D', '3D', 'FirstPerson'];
  return (
    <View style={{ flexDirection: 'row', backgroundColor: DS.colors.surfaceHigh, borderRadius: 12, padding: 3, borderWidth: 1, borderColor: DS.colors.border }}>
      {modes.map((m) => (
        <Pressable key={m} onPress={() => onSelect(m)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9, backgroundColor: mode === m ? DS.colors.primary + '20' : 'transparent', borderWidth: mode === m ? 1 : 0, borderColor: mode === m ? DS.colors.primary : 'transparent' }}>
          <ArchText variant="body" style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: mode === m ? DS.colors.primary : DS.colors.primaryGhost }}>
            {m === 'FirstPerson' ? '1P' : m}
          </ArchText>
        </Pressable>
      ))}
    </View>
  );
}

function EmptyBlueprint({ onGenerate }: { onGenerate: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
      <Svg width={80} height={80} viewBox="0 0 80 80" style={{ marginBottom: 20, opacity: 0.4 }}>
        <Rect x="8" y="8" width="64" height="64" rx="4" stroke={DS.colors.primary} strokeWidth="2" fill="none" strokeDasharray="4 4" />
        <Line x1="8" y1="30" x2="72" y2="30" stroke={DS.colors.primary} strokeWidth="1" strokeDasharray="2 4" />
        <Line x1="30" y1="8" x2="30" y2="72" stroke={DS.colors.primary} strokeWidth="1" strokeDasharray="2 4" />
      </Svg>
      <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 22, color: DS.colors.primary, textAlign: 'center', marginBottom: 10 }}>No Blueprint Yet</ArchText>
      <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primaryDim, textAlign: 'center', lineHeight: 20, marginBottom: 28 }}>
        Generate a building with AI, scan a room, or start drawing manually.
      </ArchText>
      <Pressable onPress={onGenerate} style={{ backgroundColor: DS.colors.primary, borderRadius: 50, paddingHorizontal: 24, paddingVertical: 12 }}>
        <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: DS.colors.background }}>Generate with AI</ArchText>
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
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [pendingFurniturePlacement, setPendingFurniturePlacement] = useState<FurnitureDef | null>(null);

  const undo = useBlueprintStore((s) => s.actions.undo);
  const redo = useBlueprintStore((s) => s.actions.redo);

  // Shake to undo/redo
  useShakeDetector({ onShake: undo, onDoubleShake: redo });

  // Edit timer (Starter tier)
  useEditTimer();

  // 2D/3D sync with cross-fade
  const { syncStatus, transitionProgress } = use2D3DSync();

  const canvas2DStyle = useAnimatedStyle(() => ({
    opacity: interpolate(transitionProgress.value, [0, 0.5], [1, 0], 'clamp'),
    pointerEvents: transitionProgress.value < 0.5 ? 'auto' : 'none',
  }));
  const viewer3DStyle = useAnimatedStyle(() => ({
    opacity: interpolate(transitionProgress.value, [0.5, 1], [0, 1], 'clamp'),
    pointerEvents: transitionProgress.value >= 0.5 ? 'auto' : 'none',
  }));

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
  const { allowed: commercialAllowed } = useTierGate('commercialBuildings');
  const { allowed: publishAllowed } = useTierGate('publishTemplates');
  const { allowed: cadExportAllowed } = useTierGate('cadExport');
  const { allowed: costEstimatorAllowed } = useTierGate('costEstimator');
  const { allowed: customFurnitureAllowed } = useTierGate('customFurniture');

  const [showImageToFurniture, setShowImageToFurniture] = useState(false);
  const [showCopyPaste, setShowCopyPaste] = useState(false);

  const route = useRoute<NativeStackScreenProps<RootStackParamList, 'Workspace'>['route']>();
  const currentProjectId = route.params?.projectId;

  const [showStructuralGrid, setShowStructuralGrid] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationReport, setSimulationReport] = useState<SimulationReport | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const [showCostEstimator, setShowCostEstimator] = useState(false);
  const canvasRef = useRef<Canvas2DHandle>(null);

  const handleToolPress = useCallback((toolId: ToolId) => {
    if (toolId === 'furniture') { setShowFurniture(true); return; }
    if (toolId === 'surfaces') { setShowSurfaces(true); return; }
    setActiveTool(toolId);
  }, []);

  const handleSelectFurniture = useCallback((def: FurnitureDef) => {
    setPendingFurniturePlacement(def);
    setActiveTool('furniture');
  }, []);

  const handleFurniturePlaced = useCallback(() => {
    setPendingFurniturePlacement(null);
    setActiveTool('select');
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
      id: randomUUID(),
      type,
      position: { x: 0, y: 0 },
      connectsFloors: [floorIndex - 1, floorIndex],
    });
    setShowStaircasePrompt(false);
  }, [blueprint, addStaircase]);

  const handleAddElevator = useCallback(() => {
    if (!blueprint) return;
    addElevator({
      id: randomUUID(),
      position: { x: 0, y: 0 },
      servesFloors: blueprint.floors.map((_, i) => i),
    });
    setShowStaircasePrompt(false);
  }, [blueprint, addElevator]);

  const exportBlueprintToFile = useCallback(async (): Promise<string | null> => {
    const image = canvasRef.current?.makeImageSnapshot();
    if (!image) return null;
    const base64 = image.encodeToBase64();
    const uri = (FileSystem.documentDirectory ?? '') + `blueprint-${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return uri;
  }, []);

  const exportImage = useCallback(async () => {
    const image = canvasRef.current?.makeImageSnapshot();
    if (!image) {
      showToast('Nothing to export — switch to 2D view first', 'info');
      return;
    }
    try {
      const base64 = image.encodeToBase64();
      const uri = (FileSystem.documentDirectory ?? '') + 'blueprint.png';
      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showToast('Photo library permission denied', 'error');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      showToast('Blueprint saved to photos', 'success');
    } catch {
      showToast('Export failed — please try again', 'error');
    }
  }, [showToast]);

  const handleSimulate = useCallback(async () => {
    if (!blueprint) {
      showToast('Generate a blueprint first before simulating', 'info');
      return;
    }
    setIsSimulating(true);
    try {
      const result = await simulationService.simulate(blueprint, 'temperate', 'north');
      setSimulationReport(result);
      setShowSimulation(true);
    } catch {
      showToast('Simulation failed — try again', 'error');
    } finally {
      setIsSimulating(false);
    }
  }, [blueprint, showToast]);

  const handleShare = useCallback(async () => {
    const uri = await exportBlueprintToFile();
    if (!uri) {
      showToast('Switch to 2D view to share the floor plan', 'info');
      return;
    }
    try {
      const projectName = blueprint?.metadata.style ?? 'My Floor Plan';
      await Share.share({
        title: `${projectName} — designed with ASORIA`,
        url: uri,
        message: `Check out my floor plan designed with ASORIA! ${projectName}`,
      });
    } catch {
      showToast('Share failed — please try again', 'error');
    }
  }, [exportBlueprintToFile, blueprint, showToast]);

  const handleCADExport = useCallback(async () => {
    if (!blueprint) {
      showToast('Generate a blueprint first to export as CAD', 'info');
      return;
    }
    if (!cadExportAllowed) {
      navigation.navigate('Subscription', { feature: 'cadExport' });
      return;
    }
    try {
      const filename = `asoria-${blueprint.metadata.style ?? 'floorplan'}-${Date.now()}.dxf`;
      const uri = await exportBlueprintToDXF(blueprint, filename);
      await Share.share({
        title: `${blueprint.metadata.style ?? 'Floor Plan'} — ASORIA DXF`,
        url: uri,
        message: 'AutoCAD DXF exported from ASORIA',
      });
      showToast('DXF exported successfully', 'success');
    } catch {
      showToast('CAD export failed — please try again', 'error');
    }
  }, [blueprint, cadExportAllowed, navigation, showToast]);

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: DS.colors.border, backgroundColor: DS.colors.surface, gap: 10 }}>
        <Pressable onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: DS.colors.surfaceHigh, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: DS.colors.border }}>
          <ArchText variant="body" style={{ color: DS.colors.primaryDim, fontSize: 16 }}>✕</ArchText>
        </Pressable>
        <View style={{ flex: 1 }}>
          <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 16, color: DS.colors.primary }} numberOfLines={1}>
            {blueprint?.metadata.style ?? 'Design Studio'}
          </ArchText>
          {isDirty && (
            <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 9, color: DS.colors.primaryGhost, marginTop: 1 }}>unsaved changes</ArchText>
          )}
        </View>
        {syncStatus === 'syncing' && (
          <CompassRoseLoader size="small" />
        )}
        <ViewModeToggle mode={viewMode} onSelect={handleViewModeSelect} />
        {blueprint && (
          <Pressable
            onPress={() => void handleSimulate()}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50,
              backgroundColor: isSimulating ? DS.colors.surfaceHigh : `${SUNRISE.amber}18`,
              borderWidth: 1, borderColor: `${SUNRISE.amber}40`,
            }}
          >
            {isSimulating ? (
              <CompassRoseLoader size="small" />
            ) : (
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={SUNRISE.amber} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
            <ArchText variant="body" style={{ fontSize: 12, fontFamily: DS.font.medium, color: SUNRISE.amber }}>
              {isSimulating ? 'Analysing\u2026' : 'Simulate'}
            </ArchText>
          </Pressable>
        )}
      </View>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: DS.colors.border, backgroundColor: DS.colors.surface }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}>
          {TOOLS.map((tool) => (
            <ToolButton key={tool.id} tool={tool} active={activeTool === tool.id} onPress={() => handleToolPress(tool.id)} />
          ))}
          {/* Structural grid toggle — Architect only */}
          {commercialAllowed && viewMode === '2D' && (
            <Pressable
              onPress={() => setShowStructuralGrid((v) => !v)}
              style={{
                width: 52,
                height: 52,
                borderRadius: 20,
                backgroundColor: showStructuralGrid ? DS.colors.primary + '18' : DS.colors.surfaceHigh,
                borderWidth: 1,
                borderColor: showStructuralGrid ? DS.colors.primary : DS.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              <ArchText variant="body" style={{ fontSize: 14, color: showStructuralGrid ? DS.colors.primary : DS.colors.primaryGhost }}>⊞</ArchText>
              <ArchText variant="body" style={{ fontSize: 8, fontFamily: 'Inter_400Regular', color: showStructuralGrid ? DS.colors.primary : DS.colors.primaryGhost, marginTop: 2 }}>GRID</ArchText>
            </Pressable>
          )}
          {/* Export — available in 2D view with a blueprint loaded */}
          {blueprint && viewMode === '2D' && (
            <Pressable
              onPress={exportImage}
              style={{
                width: 64,
                height: 52,
                borderRadius: 20,
                backgroundColor: DS.colors.surfaceHigh,
                borderWidth: 1,
                borderColor: DS.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              <ArchText variant="body" style={{ fontSize: 14, color: DS.colors.primaryGhost }}>⤓</ArchText>
              <ArchText variant="body" style={{ fontSize: 8, fontFamily: 'Inter_400Regular', color: DS.colors.primaryGhost, marginTop: 2 }}>EXPORT</ArchText>
            </Pressable>
          )}
          {/* Cost Estimator — Pro+ */}
          {costEstimatorAllowed && blueprint && (
            <Pressable
              onPress={() => setShowCostEstimator(true)}
              style={{
                width: 64,
                height: 52,
                borderRadius: 20,
                backgroundColor: DS.colors.surfaceHigh,
                borderWidth: 1,
                borderColor: DS.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              <ArchText variant="body" style={{ fontSize: 14, color: DS.colors.primaryGhost }}>$</ArchText>
              <ArchText variant="body" style={{ fontSize: 8, fontFamily: 'Inter_400Regular', color: DS.colors.primaryGhost, marginTop: 2 }}>COST</ArchText>
            </Pressable>
          )}
          {/* CAD Export — Architect only */}
          {blueprint && (
            <Pressable
              onPress={() => void handleCADExport()}
              style={{
                width: 64,
                height: 52,
                borderRadius: 20,
                backgroundColor: cadExportAllowed ? `${DS.colors.success}18` : DS.colors.surfaceHigh,
                borderWidth: 1,
                borderColor: cadExportAllowed ? DS.colors.success : DS.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              <ArchText variant="body" style={{ fontSize: 14, color: cadExportAllowed ? DS.colors.success : DS.colors.primaryDim }}>⬛</ArchText>
              <ArchText variant="body" style={{ fontSize: 8, fontFamily: 'Inter_400Regular', color: cadExportAllowed ? DS.colors.success : DS.colors.primaryDim, marginTop: 2 }}>CAD</ArchText>
            </Pressable>
          )}
          {/* Photo → 3D — Pro+ only */}
          {blueprint && customFurnitureAllowed && (
            <Pressable
              onPress={() => setShowImageToFurniture(true)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50,
                backgroundColor: `${SUNRISE.amber}18`, borderWidth: 1,
                borderColor: `${SUNRISE.amber}40`, flexDirection: 'row', alignItems: 'center', gap: 4,
                marginRight: 8,
              }}
            >
              <Text style={{ fontSize: 14 }}>📷</Text>
              <ArchText variant="body" style={{ fontSize: 11, fontFamily: DS.font.medium, color: SUNRISE.amber }}>Photo → 3D</ArchText>
            </Pressable>
          )}
          {/* Copy/Paste — clipboard access */}
          <Pressable
            onPress={() => setShowCopyPaste(true)}
            style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50,
              backgroundColor: `${DS.colors.primary}18`, borderWidth: 1,
              borderColor: `${DS.colors.primary}40`, flexDirection: 'row', alignItems: 'center', gap: 4,
              marginRight: 8,
            }}
          >
            <Text style={{ fontSize: 14 }}>📋</Text>
            <ArchText variant="body" style={{ fontSize: 11, fontFamily: DS.font.medium, color: DS.colors.primary }}>Copy</ArchText>
          </Pressable>
          {/* Share — available in 2D view with a blueprint loaded */}
          {blueprint && viewMode === '2D' && (
            <Pressable
              onPress={() => { void handleShare(); }}
              style={{
                width: 64,
                height: 52,
                borderRadius: 20,
                backgroundColor: DS.colors.surfaceHigh,
                borderWidth: 1,
                borderColor: DS.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              <ArchText variant="body" style={{ fontSize: 14, color: DS.colors.primaryGhost }}>⤴</ArchText>
              <ArchText variant="body" style={{ fontSize: 8, fontFamily: 'Inter_400Regular', color: DS.colors.primaryGhost, marginTop: 2 }}>SHARE</ArchText>
            </Pressable>
          )}
          {/* Publish — Creator+ only, only shown when blueprint has rooms */}
          {blueprint && blueprint.rooms.length > 0 && (
            <Pressable
              onPress={() => {
                if (!publishAllowed) {
                  navigation.navigate('Subscription', { feature: 'publishTemplates' });
                  return;
                }
                if (!currentProjectId) {
                  showToast('Save your project first before publishing', 'info');
                  return;
                }
                navigation.navigate('PublishTemplate', { projectId: currentProjectId });
              }}
              style={{
                width: 64,
                height: 52,
                borderRadius: 20,
                backgroundColor: DS.colors.surfaceHigh,
                borderWidth: 1,
                borderColor: DS.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              <ArchText variant="body" style={{ fontSize: 14, color: DS.colors.primaryGhost }}>⬆</ArchText>
              <ArchText variant="body" style={{ fontSize: 8, fontFamily: 'Inter_400Regular', color: DS.colors.primaryGhost, marginTop: 2 }}>PUBLISH</ArchText>
            </Pressable>
          )}
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
        {!blueprint ? (
          <EmptyBlueprint onGenerate={() => navigation.navigate('Generation')} />
        ) : viewMode === 'FirstPerson' ? (
          <InHouseView onExit={() => setViewMode('2D')} />
        ) : (
          // 2D + 3D — both mounted, cross-fade driven by transitionProgress
          <>
            <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, canvas2DStyle]}>
              <Canvas2D
                ref={canvasRef}
                showStructuralGrid={showStructuralGrid}
                activeTool={activeTool}
                pendingFurniturePlacement={pendingFurniturePlacement}
                onFurniturePlaced={handleFurniturePlaced}
              />
            </Animated.View>
            <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, viewer3DStyle]}>
              <React.Suspense fallback={<CompassRoseLoader size="large" />}>
                <Viewer3D />
              </React.Suspense>
            </Animated.View>
          </>
        )}

        {blueprint && <AIChatPanel visible={showChat} onToggle={() => setShowChat((v) => !v)} />}

        {/* Floating AI assistant button */}
        {blueprint && (
          <Pressable
            style={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: DS.colors.surface,
              borderWidth: 1,
              borderColor: DS.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => setShowChat((v) => !v)}
          >
            <ArchText variant="body" style={{ color: DS.colors.primary, fontSize: 20 }}>✦</ArchText>
          </Pressable>
        )}
      </View>

      {/* ── Sheets ──────────────────────────────────────────────────────── */}
      <FurnitureLibrarySheet
        visible={showFurniture}
        onClose={() => setShowFurniture(false)}
        onSelectFurniture={handleSelectFurniture}
      />
      <StyleSelectorSheet visible={showStyleSelector} onClose={() => setShowStyleSelector(false)} />
      <SurfacesSheet visible={showSurfaces} onClose={() => setShowSurfaces(false)} />
      {showImageToFurniture && (
        <Modal transparent animationType="slide" onRequestClose={() => setShowImageToFurniture(false)}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowImageToFurniture(false)} />
          <ImageToFurnitureSheet onClose={() => setShowImageToFurniture(false)} />
        </Modal>
      )}
      {showCopyPaste && (
        <Modal transparent animationType="slide" onRequestClose={() => setShowCopyPaste(false)}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowCopyPaste(false)} />
          <CopyPasteSheet onClose={() => setShowCopyPaste(false)} />
        </Modal>
      )}
      {blueprint && (
        <StaircasePromptSheet
          visible={showStaircasePrompt}
          floorCount={blueprint.floors.length}
          onSelect={handleStaircaseSelect}
          onAddElevator={handleAddElevator}
          onDismiss={() => setShowStaircasePrompt(false)}
        />
      )}

      <EditLimitModal />

      {/* Simulation Report Modal */}
      <Modal
        visible={showSimulation}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSimulation(false)}
      >
        <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: DS.colors.border,
              backgroundColor: DS.colors.surface,
            }}
          >
            <ArchText
              variant="body"
              style={{ fontFamily: DS.font.heading, fontSize: 18, color: DS.colors.primary }}
            >
              Build Analysis
            </ArchText>
            <Pressable
              onPress={() => setShowSimulation(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: DS.colors.surfaceHigh,
                borderWidth: 1,
                borderColor: DS.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArchText variant="body" style={{ color: DS.colors.primaryDim, fontSize: 14 }}>✕</ArchText>
            </Pressable>
          </View>
          {simulationReport && (
            <SimulationPanel
              report={simulationReport}
              onClose={() => setShowSimulation(false)}
              onReanalyse={() => {
                setShowSimulation(false);
                void handleSimulate();
              }}
            />
          )}
          <CostEstimatorModal
            visible={showCostEstimator}
            onClose={() => setShowCostEstimator(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

function EditLimitModal() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.actions.closeModal);

  if (activeModal !== 'edit_limit_reached') return null;

  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const secondsToMidnight = Math.floor((midnight.getTime() - now.getTime()) / 1000);
  const hours = Math.floor(secondsToMidnight / 3600);
  const mins = Math.floor((secondsToMidnight % 3600) / 60);

  return (
    <View style={{
      position: 'absolute', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      zIndex: 999,
    }}>
      <CompassRoseLoader size="large" />
      <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 24, color: DS.colors.primary, textAlign: 'center', marginTop: 24, marginBottom: 12 }}>
        Daily Editing Time Reached
      </ArchText>
      <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primaryDim, textAlign: 'center', marginBottom: 8 }}>
        Starter plan includes 45 minutes of editing per day.
      </ArchText>
      <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 13, color: DS.colors.primaryGhost, textAlign: 'center', marginBottom: 32 }}>
        Resets in {hours}h {mins}m
      </ArchText>
      <Pressable
        onPress={() => {
          closeModal();
          navigation.navigate('Subscription', { feature: 'Daily Edit Time' });
        }}
        style={{ backgroundColor: DS.colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 50, marginBottom: 16, width: '100%', alignItems: 'center' }}
      >
        <ArchText variant="body" style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: DS.colors.background }}>Upgrade Now</ArchText>
      </Pressable>
      <Pressable
        onPress={() => { closeModal(); }}
        style={{ paddingVertical: 12 }}
      >
        <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost }}>Save and Exit</ArchText>
      </Pressable>
    </View>
  );
}
