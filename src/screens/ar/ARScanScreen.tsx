import React, { useState, useEffect } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { useCameraDevice, Camera } from 'react-native-vision-camera';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
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
import { ARManualMeasureMode } from '../../components/ar/ARManualMeasureMode';
import { ARDepthScanMode } from '../../components/ar/ARDepthScanMode';
import { ARPhotoMode } from '../../components/ar/ARPhotoMode';
import { useARCapabilities } from '../../hooks/useARCore';
import { OvalButton } from '../../components/common/OvalButton';
import { useTierGate } from '../../hooks/useTierGate';

type ScanMode = 'entry' | 'manual' | 'depth' | 'photo' | 'place' | 'measure';


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


interface ScanModeCardProps {
  title: string;
  description: string;
  available: boolean;
  requires?: string;
  onPress: () => void;
  delay?: number;
}

function ScanModeCard({ title, description, available, requires, onPress, delay = 0 }: ScanModeCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }));
  }, [delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, { width: '100%' }]}>
      <Pressable
        onPress={available ? onPress : undefined}
        style={{
          backgroundColor: available ? 'rgba(240, 237, 232, 0.03)' : 'rgba(14, 11, 26, 0.50)',
          borderRadius: DS.radius.card,
          padding: 20,
          borderWidth: 1,
          borderColor: available ? 'rgba(240, 237, 232, 0.10)' : 'rgba(240, 237, 232, 0.07)',
          opacity: available ? 1 : 0.6,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
          <View style={{ flexShrink: 1 }}>
            <ArchText variant="body" style={{ fontFamily: DS.font.heading, fontSize: 18, color: available ? DS.colors.accent : DS.colors.primaryDim }} numberOfLines={1}>
              {title}
            </ArchText>
          </View>
          {!available && requires && (
            <View style={{ backgroundColor: DS.colors.warning + '20', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4 }}>
              <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 10, color: DS.colors.warning }}>
                Requires {requires}
              </ArchText>
            </View>
          )}
        </View>
        <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 14, color: DS.colors.primaryDim, lineHeight: 20 }}>
          {description}
        </ArchText>
      </Pressable>
    </Animated.View>
  );
}


export function ARScanScreen() {
  const [mode, setMode] = useState<ARMode>('scan');
  const [scanMode, setScanMode] = useState<ScanMode>('entry');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const device = useCameraDevice('back');
  type ARNavProp = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'AR'>,
    NativeStackNavigationProp<RootStackParamList>
  >;
  const navigation = useNavigation<ARNavProp>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { support, isLoading: isLoadingCapabilities } = useARCapabilities();

  const hasDepthAPI = support?.hasDepthAPI ?? false;
  const hasLiDAR = support?.hasLiDAR ?? false;
  // hasARCore means "ARKit available" on iOS, "ARCore available" on Android
  const hasAR = support?.hasARCore ?? false;

  const { allowed: canScan, requiredTier: scanRequiredTier } = useTierGate('arScansPerMonth');
  const { allowed: canMeasure, requiredTier: measureRequiredTier } = useTierGate('arMeasure');

  useEffect(() => {
    Camera.requestCameraPermission().then(status => {
      setHasPermission(status === 'granted');
    });
  }, []);

  // Reset when mode changes
  const handleModeChange = (newMode: ARMode) => {
    setScanMode('entry');
    setMode(newMode);
  };

  const handleSelectScanMode = (selected: ScanMode) => {
    setScanMode(selected);
  };

  const handleBackToEntry = () => {
    setScanMode('entry');
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
      <View style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Svg width={64} height={64} viewBox="0 0 64 64" style={{ marginBottom: 20 }}>
          <Circle cx="32" cy="32" r="24" stroke={DS.colors.border} strokeWidth="1.5" fill="none" />
          <Path d="M20 24 L28 24 L32 18 L36 24 L44 24" stroke={DS.colors.primaryDim} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="32" cy="36" r="8" stroke={DS.colors.primaryDim} strokeWidth="1.5" fill="none" />
          <Circle cx="32" cy="36" r="3" stroke={DS.colors.primaryDim} strokeWidth="1.2" fill="none" />
        </Svg>
        <ArchText variant="body" style={{ fontFamily: DS.font.heading, fontSize: 20, color: DS.colors.primary, textAlign: 'center', marginBottom: 8 }}>
          No camera found
        </ArchText>
        <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 14, color: DS.colors.primaryDim, textAlign: 'center', lineHeight: 20 }}>
          We couldn&apos;t find a camera on this device. Try restarting the app or check your device settings.
        </ArchText>
      </View>
    );
  }

  // Entry screen - mode selection
  if (scanMode === 'entry') {
    return (
      <View style={{ flex: 1, backgroundColor: DS.colors.background, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <ArchText variant="body" style={{ fontFamily: DS.font.heading, fontSize: 28, color: DS.colors.accent, marginBottom: 8 }}>
            AR Scan
          </ArchText>
          <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 14, color: DS.colors.primaryDim }}>
            Choose a scanning method to capture your room
          </ArchText>
        </View>

        {/* Mode selector */}
        <ARModeSelector current={mode} onChange={handleModeChange} />

        {/* Back button */}
        <ARBackButton onPress={() => navigation.goBack()} />

        {/* Scan mode options */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 40, gap: 16 }}>
          {mode === 'scan' && (
            <>
              <ScanModeCard
                title="Manual Measure"
                description="Tap corners to measure your room wall by wall. Works on all devices."
                available={hasAR && canScan}
                requires={!canScan ? scanRequiredTier ?? 'Creator' : !hasAR ? 'AR' : undefined}
                onPress={() => handleSelectScanMode('manual')}
                delay={0}
              />
              <ScanModeCard
                title="Auto Depth Scan"
                description="Walk around and let AR automatically detect walls using Depth API or LiDAR."
                available={hasAR && (hasDepthAPI || hasLiDAR) && canScan}
                requires={!canScan ? scanRequiredTier ?? 'Creator' : !hasAR ? 'AR' : !hasDepthAPI && !hasLiDAR ? 'LiDAR/Depth' : undefined}
                onPress={() => handleSelectScanMode('depth')}
                delay={100}
              />
              <ScanModeCard
                title="Photo Analysis"
                description="Take photos of each wall and let AI analyze dimensions. Works on all devices."
                available={canScan}
                requires={!canScan ? scanRequiredTier ?? 'Creator' : undefined}
                onPress={() => handleSelectScanMode('photo')}
                delay={200}
              />
            </>
          )}

          {mode === 'place' && (
            <ScanModeCard
              title="Furniture Placement"
              description="Place furniture in your space using surface detection."
              available={hasAR && canScan}
              requires={!canScan ? scanRequiredTier ?? 'Creator' : !hasAR ? 'AR' : undefined}
              onPress={() => handleSelectScanMode('place')}
            />
          )}

          {mode === 'measure' && (
            <ScanModeCard
              title="Measure Mode"
              description="Measure distances between points in your space."
              available={hasAR && canMeasure}
              requires={!canMeasure ? measureRequiredTier ?? 'Pro' : !hasAR ? 'AR' : undefined}
              onPress={() => handleSelectScanMode('measure')}
            />
          )}
        </ScrollView>
      </View>
    );
  }

  // Guard: block scan/photo/depth modes for tier-locked users
  const isScanMode = scanMode === 'manual' || scanMode === 'depth' || scanMode === 'photo' || scanMode === 'place';
  if (isScanMode && !canScan) {
    return (
      <View style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <ArchText variant="body" style={{ fontFamily: DS.font.heading, fontSize: 22, color: DS.colors.accent, textAlign: 'center', marginBottom: 12 }}>
          Creator tier required
        </ArchText>
        <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 14, color: DS.colors.primaryDim, textAlign: 'center', marginBottom: 24 }}>
          AR scanning is available on Creator and above plans.
        </ArchText>
        <OvalButton label="Upgrade" onPress={() => navigation.navigate('Subscription')} />
        <Pressable onPress={handleBackToEntry} style={{ marginTop: 16 }}>
          <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 14, color: DS.colors.primaryDim }}>Go back</ArchText>
        </Pressable>
      </View>
    );
  }
  if (scanMode === 'measure' && !canMeasure) {
    return (
      <View style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <ArchText variant="body" style={{ fontFamily: DS.font.heading, fontSize: 22, color: DS.colors.accent, textAlign: 'center', marginBottom: 12 }}>
          Pro tier required
        </ArchText>
        <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 14, color: DS.colors.primaryDim, textAlign: 'center', marginBottom: 24 }}>
          AR Measure is available on Pro and above plans.
        </ArchText>
        <OvalButton label="Upgrade" onPress={() => navigation.navigate('Subscription')} />
        <Pressable onPress={handleBackToEntry} style={{ marginTop: 16 }}>
          <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 14, color: DS.colors.primaryDim }}>Go back</ArchText>
        </Pressable>
      </View>
    );
  }

  // Live camera view with selected mode
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Camera
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        device={device}
        isActive={isFocused}
        photo={mode === 'scan' && scanMode === 'photo'}
      />

      {/* Mode selector at top */}
      <ARModeSelector current={mode} onChange={handleModeChange} />

      {/* Back button */}
      <ARBackButton onPress={handleBackToEntry} />

      {/* Render the appropriate mode */}
      {scanMode === 'manual' && <ARManualMeasureMode />}
      {scanMode === 'depth' && <ARDepthScanMode />}
      {scanMode === 'photo' && <ARPhotoMode />}
      {scanMode === 'place' && <ARPlaceMode />}
      {scanMode === 'measure' && <ARMeasureMode />}
    </View>
  );
}
