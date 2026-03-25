import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { arService, type ARScanResult } from '../../services/arService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useAuthStore } from '../../stores/authStore';
import { useTierGate } from '../../hooks/useTierGate';
import { useHaptics } from '../../hooks/useHaptics';
import { BASE_COLORS } from '../../theme/colors';
import { HeaderLogoMark } from '../../components/common/HeaderLogoMark';
import { FURNITURE_DEFAULTS } from '../../utils/procedural/furniture';
import type { FurniturePiece } from '../../types/blueprint';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface PlacedItem {
  id: string;
  name: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

const QUICK_FURNITURE = [
  'sofa', 'dining_table', 'bed', 'armchair', 'coffee_table',
  'wardrobe', 'desk', 'bookshelf',
] as const;

export function ARScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [activeFurniture, setActiveFurniture] = useState<string>('sofa');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ARScanResult | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const navigation = useNavigation();
  const { light, medium } = useHaptics();
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const addFurniture = useBlueprintStore((s) => s.actions.addFurniture);
  const cameraRef = useRef<CameraView>(null);

  const { allowed: arAllowed, requiredTier } = useTierGate('arScansPerMonth');

  const overlayOpacity = useSharedValue(0);
  const pickerTranslateY = useSharedValue(200);

  React.useEffect(() => {
    pickerTranslateY.value = showPicker
      ? withSpring(0, { damping: 20, stiffness: 250 })
      : withTiming(200, { duration: 200 });
  }, [showPicker, pickerTranslateY]);

  // Stop polling when scan completes or component unmounts
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleScanRoom = useCallback(async () => {
    if (scanning || !cameraRef.current) return;
    setScanning(true);
    setScanResult(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      if (!photo?.uri) throw new Error('No photo captured');

      const frameUrl = await arService.uploadScanFrame(photo.uri);
      const result = await arService.startReconstruction([frameUrl]);
      setScanResult(result);

      if (result.status === 'processing' && result.scanId) {
        pollIntervalRef.current = setInterval(async () => {
          try {
            const updated = await arService.checkMeshyStatus(result.scanId);
            setScanResult(updated);
            if (updated.status !== 'processing') {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              if (updated.status === 'complete') {
                Alert.alert('Scan Complete', '3D reconstruction is ready.');
              }
            }
          } catch {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          }
        }, 5000);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scan failed';
      Alert.alert('Scan Error', msg);
    } finally {
      setScanning(false);
    }
  }, [scanning]);

  const pickerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pickerTranslateY.value }],
  }));

  const handleTap = useCallback(
    (evt: { nativeEvent: { locationX: number; locationY: number } }) => {
      if (!arAllowed) return;
      light();
      const { locationX: x, locationY: y } = evt.nativeEvent;
      const newItem: PlacedItem = {
        id: `ar_${Date.now()}`,
        name: activeFurniture,
        x,
        y,
        scale: 1,
        rotation: 0,
      };
      setPlacedItems((prev) => [...prev, newItem]);
      setSelectedItemId(newItem.id);
    },
    [arAllowed, activeFurniture, light]
  );

  const handleAddToProject = useCallback(() => {
    if (!blueprint || placedItems.length === 0) return;

    placedItems.forEach((item) => {
      const defaults = FURNITURE_DEFAULTS[item.name as keyof typeof FURNITURE_DEFAULTS];
      const piece: FurniturePiece = {
        id: `fur_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: item.name.replace(/_/g, ' '),
        category: defaults?.category ?? 'living',
        roomId: blueprint.rooms[0]?.id ?? '',
        position: {
          x: ((item.x / SCREEN_W) - 0.5) * 10,
          y: 0,
          z: ((item.y / SCREEN_H) - 0.5) * 10,
        },
        rotation: { x: 0, y: item.rotation, z: 0 },
        dimensions: defaults
          ? { x: defaults.w * item.scale, y: defaults.h, z: defaults.d }
          : { x: 1 * item.scale, y: 1, z: 1 },
        procedural: true,
      };
      addFurniture(piece);
    });

    medium();
    Alert.alert(
      'Added to Project',
      `${placedItems.length} item${placedItems.length > 1 ? 's' : ''} added to your blueprint.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  }, [blueprint, placedItems, addFurniture, medium, navigation]);

  // Permission not determined yet
  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: BASE_COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: BASE_COLORS.textDim, fontFamily: 'Inter_400Regular' }}>
          Checking camera permission…
        </Text>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📷</Text>
          <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 22, color: BASE_COLORS.textPrimary, textAlign: 'center', marginBottom: 12 }}>
            Camera Access Required
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textSecondary, textAlign: 'center', marginBottom: 32 }}>
            AR placement needs your camera to overlay furniture on your space.
          </Text>
          <Pressable
            onPress={requestPermission}
            style={{ backgroundColor: BASE_COLORS.textPrimary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: BASE_COLORS.background }}>
              Enable Camera
            </Text>
          </Pressable>
          <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.textDim }}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Tier gate — AR not on Starter
  if (!arAllowed) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
          <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 22, color: BASE_COLORS.textPrimary, textAlign: 'center', marginBottom: 12 }}>
            AR on Creator & Above
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textSecondary, textAlign: 'center', marginBottom: 32 }}>
            Place virtual furniture in your space with AR. Available on Creator and Architect plans.
          </Text>
          <Pressable
            onPress={() => (navigation as any).navigate('Subscription', { feature: 'AR Placement' })}
            style={{ backgroundColor: BASE_COLORS.textPrimary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: BASE_COLORS.background }}>
              Upgrade to Creator
            </Text>
          </Pressable>
          <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.textDim }}>
              Maybe Later
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Camera feed */}
        <Pressable onPress={handleTap} style={{ flex: 1 }}>
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />

          {/* Instruction banner */}
          <View style={{ position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#FFF', textAlign: 'center' }}>
                Point at a flat surface and tap to place
              </Text>
            </View>
          </View>

          {/* Placed items overlay */}
          {placedItems.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setSelectedItemId(item.id === selectedItemId ? null : item.id)}
              style={{
                position: 'absolute',
                left: item.x - 32,
                top: item.y - 32,
                width: 64,
                height: 64,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                borderWidth: selectedItemId === item.id ? 2 : 0,
                borderColor: BASE_COLORS.warning,
                backgroundColor: selectedItemId === item.id
                  ? `${BASE_COLORS.warning}26`
                  : 'rgba(255,255,255,0.1)',
              }}
            >
              <Text style={{ fontSize: 28 }}>🛋</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 8, color: '#FFF', textAlign: 'center' }} numberOfLines={1}>
                {item.name.replace(/_/g, ' ')}
              </Text>
            </Pressable>
          ))}

          {/* Close button */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={{ position: 'absolute', top: 56, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 20 }}
          >
            <Text style={{ color: '#FFF', fontSize: 16 }}>✕</Text>
          </Pressable>

          {/* Detection results overlay */}
          {scanResult && scanResult.detectedObjects.length > 0 && (
            <View style={{ position: 'absolute', top: 110, left: 16, right: 16 }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, padding: 12 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: BASE_COLORS.warning, marginBottom: 6 }}>
                  Detected Objects
                </Text>
                {scanResult.detectedObjects.slice(0, 5).map((obj, i) => (
                  <Text key={i} style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#FFF', marginBottom: 2 }}>
                    • {obj.label} ({Math.round(obj.confidence * 100)}%)
                  </Text>
                ))}
                {scanResult.status === 'processing' && (
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                    3D reconstruction in progress…
                  </Text>
                )}
                {scanResult.status === 'complete' && (
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: BASE_COLORS.success, marginTop: 4 }}>
                    3D model ready
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Scanning indicator */}
          {scanning && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 16, padding: 24, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#FFF' }}>Scanning room…</Text>
              </View>
            </View>
          )}

          {/* Selected item controls */}
          {selectedItemId && (
            <View style={{ position: 'absolute', bottom: 220, left: 0, right: 0, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  onPress={() => setPlacedItems((prev) => prev.filter((i) => i.id !== selectedItemId))}
                  style={{ backgroundColor: 'rgba(255,50,50,0.8)', padding: 10, borderRadius: 12 }}
                >
                  <Text style={{ color: '#FFF', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>Remove</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Pressable>

        {/* Bottom controls */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          {/* Furniture picker */}
          <Animated.View style={[pickerStyle, { backgroundColor: 'rgba(20,20,20,0.95)', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 }]}>
            {showPicker && (
              <>
                <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                  <View style={{ width: 32, height: 3, borderRadius: 2, backgroundColor: '#555' }} />
                </View>
                <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 16, color: '#FFF', paddingHorizontal: 20, marginBottom: 12 }}>
                  Choose Furniture
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 }}>
                  {QUICK_FURNITURE.map((name) => (
                    <Pressable
                      key={name}
                      onPress={() => { light(); setActiveFurniture(name); setShowPicker(false); }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: activeFurniture === name ? '#FFF' : 'rgba(255,255,255,0.12)',
                        borderWidth: 1,
                        borderColor: activeFurniture === name ? '#FFF' : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: activeFurniture === name ? '#000' : '#FFF' }}>
                        {name.replace(/_/g, ' ')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </Animated.View>

          {/* Action bar */}
          {!showPicker && (
            <View style={{ backgroundColor: 'rgba(20,20,20,0.92)', padding: 16, paddingBottom: 34, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Pressable
                  onPress={() => { light(); setShowPicker(true); }}
                  style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFF' }}>
                    ⊕ Change Item
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    {activeFurniture.replace(/_/g, ' ')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => { medium(); void handleScanRoom(); }}
                  disabled={scanning}
                  style={{
                    flex: 1,
                    backgroundColor: scanning ? 'rgba(255,255,255,0.06)' : `${BASE_COLORS.warning}26`,
                    borderRadius: 12,
                    padding: 14,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: scanning ? 'rgba(255,255,255,0.1)' : `${BASE_COLORS.warning}80`,
                  }}
                >
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: scanning ? 'rgba(255,255,255,0.3)' : BASE_COLORS.warning }}>
                    {scanning ? 'Scanning…' : '◎ Scan Room'}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    Detect objects
                  </Text>
                </Pressable>
              </View>

              {placedItems.length > 0 && (
                <Pressable
                  onPress={handleAddToProject}
                  style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 14, alignItems: 'center' }}
                >
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#000' }}>
                    Add to Project
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: 'rgba(0,0,0,0.5)', marginTop: 2 }}>
                    {placedItems.length} item{placedItems.length > 1 ? 's' : ''} placed
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {showPicker && (
            <Pressable
              onPress={() => setShowPicker(false)}
              style={{ backgroundColor: 'rgba(20,20,20,0.95)', paddingHorizontal: 20, paddingBottom: 10 }}
            >
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                Tap camera to dismiss
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
