import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable, ScrollView, GestureResponderEvent, useWindowDimensions, Alert } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSpring, Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArchText } from '../common/ArchText';
import { TierGate } from '../common/TierGate';
import { DS } from '../../theme/designSystem';
import { useARCore } from '../../hooks/useARCore';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { fetchCustomFurniture, type VigaMesh } from '../../services/vigaService';
import type { Vector3D } from '../../native/ARCoreModule';
import type { RootStackParamList } from '../../navigation/types';

interface CatalogueItem {
  id: string;
  label: string;
  icon: string;
  w: number;
  d: number;
  cat: string;
  meshUrl?: string;
}

const BUILTIN_CATALOGUE: CatalogueItem[] = [
  { id: 'sofa',           label: 'Sofa',         icon: '🛋',  w: 2.2, d: 0.95, cat: 'living' },
  { id: 'armchair',       label: 'Armchair',     icon: '🪑',  w: 0.95, d: 0.95, cat: 'living' },
  { id: 'coffee_table',   label: 'Coffee Table', icon: '🟫',  w: 1.2,  d: 0.6,  cat: 'living' },
  { id: 'dining_table',   label: 'Dining Table', icon: '🍽',  w: 1.8,  d: 0.9,  cat: 'dining' },
  { id: 'bed_king',       label: 'King Bed',     icon: '🛏',  w: 2.0,  d: 2.0,  cat: 'bedroom' },
  { id: 'bed_double',     label: 'Double Bed',   icon: '🛏',  w: 1.4,  d: 2.0,  cat: 'bedroom' },
  { id: 'wardrobe',       label: 'Wardrobe',     icon: '🚪',  w: 1.8,  d: 0.6,  cat: 'bedroom' },
  { id: 'desk',           label: 'Desk',         icon: '🖥',  w: 1.4,  d: 0.7,  cat: 'office' },
  { id: 'bookshelf',      label: 'Bookshelf',    icon: '📚',  w: 0.9,  d: 0.35, cat: 'storage' },
  { id: 'plant',          label: 'Plant',        icon: '🌿',  w: 0.4,  d: 0.4,  cat: 'outdoor' },
];

interface PlacedItem {
  id: string;
  label: string;
  icon: string;
  category: string;
  /** Real AR world position (metres) */
  worldX: number;
  worldY: number;
  worldZ: number;
  /** Screen position for overlay rendering */
  screenX: number;
  screenY: number;
  confirmed: boolean;
  /** Physical dimensions (metres) */
  width: number;
  depth: number;
}

function SurfaceGuide({ active }: { active: boolean }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (active) {
      opacity.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      opacity.value = withTiming(0.4);
    }
  }, [active, opacity]);

  const guideStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[{ position: 'absolute', bottom: 200, left: 0, right: 0, alignItems: 'center' }, guideStyle]}>
      <Svg width={160} height={60} viewBox="0 0 160 60">
        <Path d="M10 50 L80 20 L150 50" stroke={active ? DS.colors.success : DS.colors.border} strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
        <Path d="M30 55 L80 30 L130 55" stroke={active ? DS.colors.success : DS.colors.border} strokeWidth="1" fill="none" strokeDasharray="3 4" opacity="0.5" />
        <Path d="M50 45 L50 35" stroke={active ? DS.colors.success : DS.colors.border} strokeWidth="1" opacity="0.4" />
        <Path d="M80 50 L80 20" stroke={active ? DS.colors.success : DS.colors.border} strokeWidth="1" opacity="0.4" />
        <Path d="M110 45 L110 35" stroke={active ? DS.colors.success : DS.colors.border} strokeWidth="1" opacity="0.4" />
        {active && (
          <>
            <Circle cx="80" cy="35" r="4" stroke={DS.colors.success} strokeWidth="1.5" fill="none" />
            <Path d="M80 29 L80 25" stroke={DS.colors.success} strokeWidth="1.5" strokeLinecap="round" />
            <Path d="M80 41 L80 45" stroke={DS.colors.success} strokeWidth="1.5" strokeLinecap="round" />
            <Path d="M74 35 L70 35" stroke={DS.colors.success} strokeWidth="1.5" strokeLinecap="round" />
            <Path d="M86 35 L90 35" stroke={DS.colors.success} strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
      </Svg>
    </Animated.View>
  );
}

export function ARPlaceMode() {
  return (
    <TierGate feature="arScansPerMonth" featureLabel="AR Furniture Placement">
      <ARPlaceModeContent />
    </TierGate>
  );
}

function ARPlaceModeContent() {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [surfaceDetected, setSurfaceDetected] = useState(false);
  const [customItems, setCustomItems] = useState<CatalogueItem[]>([]);
  const [combinedCatalogue, setCombinedCatalogue] = useState<CatalogueItem[]>(BUILTIN_CATALOGUE);
  const [selectedFurniture, setSelectedFurniture] = useState<CatalogueItem>(BUILTIN_CATALOGUE[0]);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [showCatalogue, setShowCatalogue] = useState(true);

  const {
    state,
    detectedPlanes,
    startSession,
    stopSession,
    hitTest: arHitTest,
  } = useARCore();

  // Start ARCore session on mount
  useEffect(() => {
    void startSession();
    return () => { void stopSession(); };
  }, [startSession, stopSession]);

  // Load custom VIGA meshes and merge with built-in catalogue
  useEffect(() => {
    fetchCustomFurniture()
      .then((meshes: VigaMesh[]) => {
        const custom: CatalogueItem[] = meshes.map((m) => ({
          id: m.id,
          label: m.name,
          icon: '🏠',
          w: m.dimensions.x,
          d: m.dimensions.z,
          cat: m.category,
          meshUrl: m.meshUrl,
        }));
        setCustomItems(custom);
        setCombinedCatalogue([...BUILTIN_CATALOGUE, ...custom]);
      })
      .catch(() => {});
  }, []);

  // Update surface detection from real AR planes
  useEffect(() => {
    const hasFloor = detectedPlanes.some(p => p.type === 'floor');
    const hasPlane = detectedPlanes.length > 0;
    setSurfaceDetected(hasFloor || hasPlane);
  }, [detectedPlanes]);

  const handleTap = useCallback(
    async (e: GestureResponderEvent) => {
      if (!surfaceDetected || !state.isSessionActive) return;

      const { locationX, locationY } = e.nativeEvent;

      // Call ARCore hit test to get real 3D world position
      const worldPos: Vector3D | null = await arHitTest(locationX, locationY);
      if (!worldPos) return;

      const itemId = `${selectedFurniture.id}_${Date.now()}`;

      setPlacedItems(prev => [...prev, {
        id: itemId,
        label: selectedFurniture.label,
        icon: selectedFurniture.icon,
        category: selectedFurniture.cat,
        worldX: worldPos.x,
        worldY: worldPos.y,
        worldZ: worldPos.z,
        screenX: locationX - 30,
        screenY: locationY - 20,
        confirmed: false,
        width: selectedFurniture.w,
        depth: selectedFurniture.d,
      }]);
    },
    [surfaceDetected, state.isSessionActive, selectedFurniture, arHitTest],
  );

  const confirmItem = (id: string) => {
    setPlacedItems(prev => prev.map(item => item.id === id ? { ...item, confirmed: true } : item));
  };

  const removeItem = (id: string) => {
    setPlacedItems(prev => prev.filter(item => item.id !== id));
  };

  // Export placed furniture to blueprint store
  const addFurnitureFromAR = useBlueprintStore((s) => s.actions.addFurnitureFromAR);
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const handleExportToStudio = useCallback(() => {
    const confirmed = placedItems.filter(item => item.confirmed);
    if (confirmed.length === 0) return;
    if (!blueprint) {
      Alert.alert('No project open', 'Please open or create a project in Studio first, then add AR furniture.');
      return;
    }
    addFurnitureFromAR(confirmed.map(item => ({
      id: item.id,
      name: item.label,
      category: item.category,
      worldX: item.worldX,
      worldY: item.worldY,
      worldZ: item.worldZ,
      width: item.width,
      depth: item.depth,
    })));
    navigation.navigate('Workspace', { fromAR: true });
  }, [placedItems, addFurnitureFromAR, blueprint, navigation]);

  return (
    <View style={{ flex: 1 }}>
      {/* Tappable camera area */}
      <Pressable style={{ flex: 1 }} onPress={handleTap}>
        <SurfaceGuide active={surfaceDetected} />

        {/* Status pill */}
        <View style={{
          position: 'absolute', top: 160, left: 24, right: 24, alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: 'rgba(34,34,34,0.9)', borderRadius: 50,
            paddingHorizontal: 20, paddingVertical: 10,
            borderWidth: 1, borderColor: surfaceDetected ? DS.colors.success : DS.colors.border,
          }}>
            <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: surfaceDetected ? DS.colors.success : DS.colors.primaryDim }}>
              {!surfaceDetected
                ? state.isSessionActive ? 'Scanning for surfaces…' : 'Starting AR…'
                : `Tap to place ${selectedFurniture.label}`}
            </ArchText>
          </View>
        </View>

        {/* Placed items overlay */}
        {placedItems.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => item.confirmed ? removeItem(item.id) : confirmItem(item.id)}
            style={{
              position: 'absolute',
              left: item.screenX,
              top: item.screenY,
              backgroundColor: item.confirmed ? 'rgba(34,34,34,0.92)' : 'rgba(200,200,200,0.2)',
              borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
              borderWidth: 1.5,
              borderColor: item.confirmed ? DS.colors.success : DS.colors.primary,
              borderStyle: item.confirmed ? 'solid' : 'dashed',
            }}
          >
            <ArchText variant="body" style={{ fontSize: 18 }}>{item.icon}</ArchText>
            <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: DS.colors.primary }}>
              {item.label}
            </ArchText>
            {item.confirmed && (
              <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 8, color: DS.colors.success }}>
                {item.worldX.toFixed(1)}m
              </ArchText>
            )}
            {!item.confirmed && (
              <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 9, color: DS.colors.primaryDim }}>
                tap to confirm
              </ArchText>
            )}
          </Pressable>
        ))}
      </Pressable>

      {/* Furniture catalogue strip */}
      {showCatalogue && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: 'rgba(26,26,26,0.96)',
          borderTopWidth: 1, borderTopColor: DS.colors.border,
          paddingBottom: 32, paddingTop: 12,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 }}>
            <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: DS.colors.primaryDim, textTransform: 'uppercase', letterSpacing: 1 }}>
              Furniture
            </ArchText>
            {placedItems.length > 0 && (
              <Pressable onPress={() => setPlacedItems([])}>
                <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.error }}>
                  Clear All
                </ArchText>
              </Pressable>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {combinedCatalogue.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedFurniture(item)}
                style={{
                  alignItems: 'center', gap: 4,
                  backgroundColor: selectedFurniture.id === item.id ? `${DS.colors.success}22` : 'transparent',
                  borderRadius: 14, padding: 10,
                  borderWidth: 1.5,
                  borderColor: selectedFurniture.id === item.id ? DS.colors.success : DS.colors.border,
                  minWidth: 68,
                }}
              >
                <ArchText variant="body" style={{ fontSize: 22 }}>{item.icon}</ArchText>
                <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: selectedFurniture.id === item.id ? DS.colors.success : DS.colors.primaryDim, textAlign: 'center' }}>
                  {item.label}
                </ArchText>
              </Pressable>
            ))}
          </ScrollView>

          {/* Export to Studio — only when items are confirmed */}
          {placedItems.filter(i => i.confirmed).length > 0 && (
            <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
              <Pressable
                onPress={() => void handleExportToStudio()}
                style={{ backgroundColor: DS.colors.success, borderRadius: 50, paddingVertical: 13, alignItems: 'center' }}
              >
                <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 15, color: DS.colors.background }}>
                  Export {placedItems.filter(i => i.confirmed).length} Item{placedItems.filter(i => i.confirmed).length !== 1 ? 's' : ''} to Studio
                </ArchText>
              </Pressable>
            </View>
          )}

          {/* Screenshot button */}
          <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
            <Pressable
              onPress={() => {}}
              style={{ backgroundColor: DS.colors.surface, borderRadius: 50, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: DS.colors.border }}
            >
              <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: DS.colors.primaryDim }}>
                Screenshot (via volume key)
              </ArchText>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
