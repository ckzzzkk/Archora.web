import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useCameraDevice, Camera } from 'react-native-vision-camera';
import { BASE_COLORS } from '../../theme/colors';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { ARPermissionRequest } from '../../components/ar/ARPermissionRequest';
import { ARModeSelector } from '../../components/ar/ARModeSelector';
import type { ARMode } from '../../components/ar/ARModeSelector';
import { ARBackButton } from '../../components/ar/ARBackButton';
import { ARScanMode } from '../../components/ar/ARScanMode';
import { ARPlaceMode } from '../../components/ar/ARPlaceMode';
import { ARMeasureMode } from '../../components/ar/ARMeasureMode';

export function ARScanScreen() {
  const [mode, setMode] = useState<ARMode>('scan');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const device = useCameraDevice('back');
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  useEffect(() => {
    Camera.requestCameraPermission().then(status => {
      setHasPermission(status === 'granted');
    });
  }, []);

  if (hasPermission === null) {
    return (
      <View style={{ flex: 1, backgroundColor: BASE_COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: BASE_COLORS.textSecondary }}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <ARPermissionRequest
        onRequest={() =>
          Camera.requestCameraPermission().then(s => setHasPermission(s === 'granted'))
        }
      />
    );
  }

  if (!device) {
    return (
      <View style={{ flex: 1, backgroundColor: BASE_COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: BASE_COLORS.textSecondary }}>No camera found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
      <Camera style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} device={device} isActive={isFocused} photo={false} />
      <ARModeSelector current={mode} onChange={setMode} />
      <ARBackButton onPress={() => navigation.goBack()} />
      {mode === 'scan' && <ARScanMode />}
      {mode === 'place' && <ARPlaceMode />}
      {mode === 'measure' && <ARMeasureMode />}
    </View>
  );
}
