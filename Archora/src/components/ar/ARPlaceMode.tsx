import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable, ScrollView, GestureResponderEvent } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import Animated, {
  useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSpring, Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { ArchText } from '../common/ArchText';
import { TierGate } from '../common/TierGate';
import { DS } from '../../theme/designSystem';

const FURNITURE_CATALOGUE = [
  { id: 'sofa',           label: 'Sofa',         icon: '🛋' },
  { id: 'armchair',       label: 'Armchair',     icon: '🪑' },
  { id: 'coffee_table',   label: 'Coffee Table', icon: '🟫' },
  { id: 'dining_table',   label: 'Dining Table', icon: '🍽' },
  { id: 'bed_king',       label: 'King Bed',     icon: '🛏' },
  { id: 'bed_double',     label: 'Double Bed',   icon: '🛏' },
  { id: 'wardrobe',       label: 'Wardrobe',     icon: '🚪' },
  { id: 'desk',           label: 'Desk',         icon: '🖥' },
  { id: 'bookshelf',      label: 'Bookshelf',    icon: '📚' },
  { id: 'plant',          label: 'Plant',        icon: '🌿' },
];

interface PlacedItem {
  id: string;
  label: string;
  x: number;
  y: number;
  confirmed: boolean;
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
        {/* Perspective floor plane */}
        <Path d="M10 50 L80 20 L150 50" stroke={active ? DS.colors.primary : DS.colors.border} strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
        <Path d="M30 55 L80 30 L130 55" stroke={active ? DS.colors.primary : DS.colors.border} strokeWidth="1" fill="none" strokeDasharray="3 4" opacity="0.5" />
        {/* Grid lines */}
        <Path d="M50 45 L50 35" stroke={active ? DS.colors.primary : DS.colors.border} strokeWidth="1" opacity="0.4" />
        <Path d="M80 50 L80 20" stroke={active ? DS.colors.primary : DS.colors.border} strokeWidth="1" opacity="0.4" />
        <Path d="M110 45 L110 35" stroke={active ? DS.colors.primary : DS.colors.border} strokeWidth="1" opacity="0.4" />
        {/* Crosshair */}
        {active && (
          <>
            <Circle cx="80" cy="35" r="4" stroke={DS.colors.primary} strokeWidth="1.5" fill="none" />
            <Path d="M80 29 L80 25" stroke={DS.colors.primary} strokeWidth="1.5" strokeLinecap="round" />
            <Path d="M80 41 L80 45" stroke={DS.colors.primary} strokeWidth="1.5" strokeLinecap="round" />
            <Path d="M74 35 L70 35" stroke={DS.colors.primary} strokeWidth="1.5" strokeLinecap="round" />
            <Path d="M86 35 L90 35" stroke={DS.colors.primary} strokeWidth="1.5" strokeLinecap="round" />
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
  const [surfaceDetected, setSurfaceDetected] = useState(false);
  const [selectedFurniture, setSelectedFurniture] = useState(FURNITURE_CATALOGUE[0]);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [showCatalogue, setShowCatalogue] = useState(true);

  useEffect(() => {
    const sub = Accelerometer.addListener(({ z }) => {
      setSurfaceDetected(Math.abs(z) < 0.35);
    });
    Accelerometer.setUpdateInterval(400);
    return () => sub.remove();
  }, []);

  const handleTap = useCallback((e: GestureResponderEvent) => {
    if (!surfaceDetected) return;
    const { locationX, locationY } = e.nativeEvent;
    setPlacedItems(prev => [...prev, {
      id: `${selectedFurniture.id}_${Date.now()}`,
      label: selectedFurniture.label,
      x: locationX - 30,
      y: locationY - 20,
      confirmed: false,
    }]);
  }, [surfaceDetected, selectedFurniture]);

  const confirmItem = (id: string) => {
    setPlacedItems(prev => prev.map(item => item.id === id ? { ...item, confirmed: true } : item));
  };

  const removeItem = (id: string) => {
    setPlacedItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Tappable camera area */}
      <Pressable style={{ flex: 1 }} onPress={handleTap}>
        {/* Surface guide illustration */}
        <SurfaceGuide active={surfaceDetected} />

        {/* Status pill */}
        <View style={{
          position: 'absolute', top: 160, left: 24, right: 24, alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: 'rgba(34,34,34,0.9)', borderRadius: 50,
            paddingHorizontal: 20, paddingVertical: 10,
            borderWidth: 1, borderColor: surfaceDetected ? DS.colors.primary : DS.colors.border,
          }}>
            <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: surfaceDetected ? DS.colors.primary : DS.colors.primaryDim }}>
              {surfaceDetected ? `Tap to place ${selectedFurniture.label}` : 'Point camera at a flat surface'}
            </ArchText>
          </View>
        </View>

        {/* Placed items */}
        {placedItems.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => item.confirmed ? removeItem(item.id) : confirmItem(item.id)}
            style={{
              position: 'absolute', left: item.x, top: item.y,
              backgroundColor: item.confirmed ? 'rgba(34,34,34,0.92)' : 'rgba(200,200,200,0.2)',
              borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
              borderWidth: 1.5,
              borderColor: item.confirmed ? DS.colors.primary : DS.colors.primaryGhost,
              borderStyle: item.confirmed ? 'solid' : 'dashed',
            }}
          >
            <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.primary }}>
              {item.label}
            </ArchText>
            {!item.confirmed && (
              <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: DS.colors.primaryGhost, textAlign: 'center' }}>
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
            {FURNITURE_CATALOGUE.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedFurniture(item)}
                style={{
                  alignItems: 'center', gap: 4,
                  backgroundColor: selectedFurniture.id === item.id ? `${DS.colors.primary}22` : 'transparent',
                  borderRadius: 14, padding: 10,
                  borderWidth: 1.5,
                  borderColor: selectedFurniture.id === item.id ? DS.colors.primary : DS.colors.border,
                  minWidth: 68,
                }}
              >
                <ArchText variant="body" style={{ fontSize: 22 }}>{item.icon}</ArchText>
                <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: selectedFurniture.id === item.id ? DS.colors.primary : DS.colors.primaryDim, textAlign: 'center' }}>
                  {item.label}
                </ArchText>
              </Pressable>
            ))}
          </ScrollView>

          {/* Screenshot button */}
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <Pressable style={{ backgroundColor: DS.colors.surface, borderRadius: 50, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: DS.colors.border }}>
              <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: DS.colors.primary }}>
                Take Screenshot
              </ArchText>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
