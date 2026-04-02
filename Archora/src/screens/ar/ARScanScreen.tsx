import React, { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { useCameraDevice, Camera } from 'react-native-vision-camera';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../../components/common/ArchText';
import { ARPermissionRequest } from '../../components/ar/ARPermissionRequest';
import { ARModeSelector } from '../../components/ar/ARModeSelector';
import type { ARMode } from '../../components/ar/ARModeSelector';
import { ARBackButton } from '../../components/ar/ARBackButton';
import { ARScanMode } from '../../components/ar/ARScanMode';
import { ARPlaceMode } from '../../components/ar/ARPlaceMode';
import { ARMeasureMode } from '../../components/ar/ARMeasureMode';

// ── Entry instruction card shown before camera opens ─────────────────────────

const MODE_INFO: Record<ARMode, { title: string; desc: string; tip: string }> = {
  scan: {
    title: 'Room Scan',
    desc: 'Point your camera at the room and walk slowly around the space to capture the geometry.',
    tip: 'Keep the camera steady. Move at walking pace for best results.',
  },
  place: {
    title: 'Furniture Placement',
    desc: 'Point your camera at a flat surface, then select and tap to place furniture in your space.',
    tip: 'Works best on floors with good lighting. Tap placed items to confirm.',
  },
  measure: {
    title: 'Measure',
    desc: 'Tap two points in your space to measure the distance between them.',
    tip: '100px ≈ 1m. Save measurements directly to your project notes.',
  },
};

function RoomScanIllustration() {
  return (
    <Svg width={100} height={80} viewBox="0 0 100 80">
      {/* Room walls */}
      <Rect x="10" y="10" width="80" height="60" rx="3" stroke={DS.colors.border} strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
      {/* Floor */}
      <Line x1="10" y1="55" x2="90" y2="55" stroke={DS.colors.border} strokeWidth="1" />
      {/* Person / phone walking */}
      <Circle cx="50" cy="35" r="5" stroke={DS.colors.primary} strokeWidth="1.5" fill="none" />
      <Line x1="50" y1="40" x2="50" y2="52" stroke={DS.colors.primary} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M44 46 L50 44 L56 46" stroke={DS.colors.primary} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <Line x1="46" y1="52" x2="50" y2="56" stroke={DS.colors.primary} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="54" y1="52" x2="50" y2="56" stroke={DS.colors.primary} strokeWidth="1.5" strokeLinecap="round" />
      {/* Scan arc */}
      <Path d="M30 35 Q50 15 70 35" stroke={DS.colors.primaryDim} strokeWidth="1" fill="none" strokeDasharray="3 3" />
      {/* Corner brackets */}
      <Path d="M10 22 L10 10 L22 10" stroke={DS.colors.primary} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Path d="M78 10 L90 10 L90 22" stroke={DS.colors.primary} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function FurniturePlaceIllustration() {
  return (
    <Svg width={100} height={80} viewBox="0 0 100 80">
      {/* Floor plane in perspective */}
      <Path d="M10 65 L50 40 L90 65" stroke={DS.colors.border} strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
      <Path d="M25 70 L50 50 L75 70" stroke={DS.colors.border} strokeWidth="1" fill="none" strokeDasharray="3 4" opacity="0.5" />
      {/* Furniture silhouette (sofa) */}
      <Rect x="32" y="48" width="36" height="16" rx="4" stroke={DS.colors.primary} strokeWidth="1.5" fill="none" />
      <Rect x="35" y="44" width="10" height="8" rx="2" stroke={DS.colors.primary} strokeWidth="1" fill="none" />
      <Rect x="55" y="44" width="10" height="8" rx="2" stroke={DS.colors.primary} strokeWidth="1" fill="none" />
      {/* Placement cursor */}
      <Circle cx="50" cy="56" r="3" stroke={DS.colors.primary} strokeWidth="1.5" fill="none" />
    </Svg>
  );
}

function MeasureIllustration() {
  return (
    <Svg width={100} height={80} viewBox="0 0 100 80">
      {/* Wall */}
      <Line x1="20" y1="10" x2="20" y2="70" stroke={DS.colors.border} strokeWidth="2" />
      <Line x1="80" y1="10" x2="80" y2="70" stroke={DS.colors.border} strokeWidth="2" />
      {/* Measurement line */}
      <Line x1="20" y1="40" x2="80" y2="40" stroke={DS.colors.primary} strokeWidth="1.5" strokeDasharray="5 3" />
      {/* End caps */}
      <Line x1="20" y1="35" x2="20" y2="45" stroke={DS.colors.primary} strokeWidth="2" strokeLinecap="round" />
      <Line x1="80" y1="35" x2="80" y2="45" stroke={DS.colors.primary} strokeWidth="2" strokeLinecap="round" />
      {/* Distance badge */}
      <Rect x="35" y="33" width="30" height="14" rx="7" stroke={DS.colors.primary} strokeWidth="1" fill="none" />
      <Line x1="42" y1="40" x2="42" y2="40" stroke={DS.colors.primary} strokeWidth="1" />
      {/* Anchor dots */}
      <Circle cx="20" cy="40" r="3" stroke={DS.colors.primary} strokeWidth="1.5" fill="none" />
      <Circle cx="80" cy="40" r="3" stroke={DS.colors.primary} strokeWidth="1.5" fill="none" />
    </Svg>
  );
}

const ILLUSTRATIONS: Record<ARMode, React.ReactNode> = {
  scan:    <RoomScanIllustration />,
  place:   <FurniturePlaceIllustration />,
  measure: <MeasureIllustration />,
};

function EntryCard({ mode, onStart }: { mode: ARMode; onStart: () => void }) {
  const insets = useSafeAreaInsets();
  const info = MODE_INFO[mode];

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) });
  }, [mode, opacity, translateY]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background, paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}>
      {/* Back button */}
      <ARBackButton onPress={() => {}} />

      <Animated.View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }, cardStyle]}>
        {/* Illustration */}
        <View style={{
          width: 140, height: 120,
          backgroundColor: DS.colors.surface, borderRadius: 24,
          borderWidth: 1, borderColor: DS.colors.border,
          alignItems: 'center', justifyContent: 'center',
        }}>
          {ILLUSTRATIONS[mode]}
        </View>

        {/* Title + desc */}
        <ArchText variant="body" style={{
          fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 26,
          color: DS.colors.primary, textAlign: 'center',
        }}>
          {info.title}
        </ArchText>

        <ArchText variant="body" style={{
          fontFamily: 'Inter_400Regular', fontSize: 15,
          color: DS.colors.primaryDim, textAlign: 'center', lineHeight: 24,
        }}>
          {info.desc}
        </ArchText>

        {/* Tip */}
        <View style={{ backgroundColor: DS.colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: DS.colors.border, width: '100%' }}>
          <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost, lineHeight: 20 }}>
            💡  {info.tip}
          </ArchText>
        </View>

        {/* Start button */}
        <Pressable
          onPress={onStart}
          style={{ backgroundColor: DS.colors.primary, borderRadius: 50, paddingVertical: 16, paddingHorizontal: 40, width: '100%', alignItems: 'center', marginTop: 8 }}
        >
          <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 17, color: DS.colors.background }}>
            Open Camera
          </ArchText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ── Main AR screen ────────────────────────────────────────────────────────────

export function ARScanScreen() {
  const [mode, setMode] = useState<ARMode>('scan');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const device = useCameraDevice('back');
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  useEffect(() => {
    Camera.requestCameraPermission().then(status => {
      setHasPermission(status === 'granted');
    });
  }, []);

  // Reset camera view when mode changes
  const handleModeChange = (newMode: ARMode) => {
    setCameraOpen(false);
    setMode(newMode);
  };

  if (hasPermission === null) {
    return (
      <View style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ArchText variant="body" style={{ color: DS.colors.primaryDim }}>Requesting camera permission…</ArchText>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <ARPermissionRequest
        onRequest={() => Camera.requestCameraPermission().then(s => setHasPermission(s === 'granted'))}
      />
    );
  }

  if (!device) {
    return (
      <View style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ArchText variant="body" style={{ color: DS.colors.primaryDim }}>No camera found</ArchText>
      </View>
    );
  }

  // Entry instruction card (before camera opens)
  if (!cameraOpen) {
    return (
      <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
        {/* Mode selector always visible at top */}
        <ARModeSelector current={mode} onChange={handleModeChange} />
        <ARBackButton onPress={() => navigation.goBack()} />
        <EntryCard mode={mode} onStart={() => setCameraOpen(true)} />
      </View>
    );
  }

  // Live camera view
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Camera
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        device={device}
        isActive={isFocused}
        photo={false}
      />
      <ARModeSelector current={mode} onChange={handleModeChange} />
      <ARBackButton onPress={() => setCameraOpen(false)} />
      {mode === 'scan'    && <ARScanMode />}
      {mode === 'place'   && <ARPlaceMode />}
      {mode === 'measure' && <ARMeasureMode />}
    </View>
  );
}
