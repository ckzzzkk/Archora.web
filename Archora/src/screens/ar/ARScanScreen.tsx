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
import { SUNRISE } from '../../theme/sunrise';
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
          backgroundColor: available ? SUNRISE.glass.subtleBg : 'rgba(14, 11, 26, 0.50)',
          borderRadius: DS.radius.card,
          padding: 20,
          borderWidth: 1,
          borderColor: available ? SUNRISE.goldBorderDim : SUNRISE.glass.subtleBorder,
          opacity: available ? 1 : 0.6,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <ArchText variant="body" style={{ fontFamily: DS.font.heading, fontSize: 18, color: available ? SUNRISE.gold : SUNRISE.textSecondary }}>
            {title}
          </ArchText>
          {!available && requires && (
            <View style={{ backgroundColor: DS.colors.warning + '20', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4 }}>
              <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 10, color: DS.colors.warning }}>
                Requires {requires}
              </ArchText>
            </View>
          )}
        </View>
        <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 14, color: SUNRISE.textSecondary, lineHeight: 20 }}>
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
  const hasARCore = support?.hasARCore ?? false;

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
      <View style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ArchText variant="body" style={{ color: DS.colors.primaryDim }}>No camera found</ArchText>
      </View>
    );
  }

  // Entry screen - mode selection
  if (scanMode === 'entry') {
    return (
      <View style={{ flex: 1, backgroundColor: SUNRISE.background, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <ArchText variant="body" style={{ fontFamily: DS.font.heading, fontSize: 28, color: SUNRISE.gold, marginBottom: 8 }}>
            AR Scan
          </ArchText>
          <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 14, color: SUNRISE.textSecondary }}>
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
                description="Tap corners to measure your room wall by wall. Works on all Android devices."
                available={hasARCore && canScan}
                requires={!canScan ? scanRequiredTier ?? 'Creator' : !hasARCore ? 'ARCore' : undefined}
                onPress={() => handleSelectScanMode('manual')}
                delay={0}
              />
              <ScanModeCard
                title="Auto Depth Scan"
                description="Walk around and let ARCore automatically detect walls using Depth API."
                available={hasARCore && hasDepthAPI && canScan}
                requires={!canScan ? scanRequiredTier ?? 'Creator' : !hasARCore ? 'ARCore' : !hasDepthAPI ? 'Depth API' : undefined}
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
              available={hasARCore && canScan}
              requires={!canScan ? scanRequiredTier ?? 'Creator' : !hasARCore ? 'ARCore' : undefined}
              onPress={() => handleSelectScanMode('place')}
            />
          )}

          {mode === 'measure' && (
            <ScanModeCard
              title="Measure Mode"
              description="Measure distances between points in your space."
              available={hasARCore && canMeasure}
              requires={!canMeasure ? measureRequiredTier ?? 'Pro' : !hasARCore ? 'ARCore' : undefined}
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
      <View style={{ flex: 1, backgroundColor: SUNRISE.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <ArchText variant="body" style={{ fontFamily: DS.font.heading, fontSize: 22, color: SUNRISE.gold, textAlign: 'center', marginBottom: 12 }}>
          Creator tier required
        </ArchText>
        <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 14, color: SUNRISE.textSecondary, textAlign: 'center', marginBottom: 24 }}>
          AR scanning is available on Creator and above plans.
        </ArchText>
        <OvalButton label="Upgrade" onPress={() => navigation.navigate('Subscription')} />
        <Pressable onPress={handleBackToEntry} style={{ marginTop: 16 }}>
          <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 14, color: SUNRISE.textSecondary }}>Go back</ArchText>
        </Pressable>
      </View>
    );
  }
  if (scanMode === 'measure' && !canMeasure) {
    return (
      <View style={{ flex: 1, backgroundColor: SUNRISE.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <ArchText variant="body" style={{ fontFamily: DS.font.heading, fontSize: 22, color: SUNRISE.gold, textAlign: 'center', marginBottom: 12 }}>
          Pro tier required
        </ArchText>
        <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 14, color: SUNRISE.textSecondary, textAlign: 'center', marginBottom: 24 }}>
          AR Measure is available on Pro and above plans.
        </ArchText>
        <OvalButton label="Upgrade" onPress={() => navigation.navigate('Subscription')} />
        <Pressable onPress={handleBackToEntry} style={{ marginTop: 16 }}>
          <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 14, color: SUNRISE.textSecondary }}>Go back</ArchText>
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
