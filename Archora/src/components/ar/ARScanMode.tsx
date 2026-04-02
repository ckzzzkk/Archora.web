import React, { useState, useRef, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { ArchText } from '../common/ArchText';
import { TierGate } from '../common/TierGate';
import { DS } from '../../theme/designSystem';

const TOTAL_FRAMES = 10;

// Pulsing scan ring while scanning
function ScanRing({ active }: { active: boolean }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(withSequence(
        withTiming(1.3, { duration: 900, easing: Easing.out(Easing.ease) }),
        withTiming(1.0, { duration: 600, easing: Easing.in(Easing.ease) }),
      ), -1, false);
      opacity.value = withRepeat(withSequence(
        withTiming(0.2, { duration: 900 }),
        withTiming(0.6, { duration: 600 }),
      ), -1, false);
    } else {
      scale.value = withTiming(1);
      opacity.value = withTiming(0.6);
    }
  }, [active, scale, opacity]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{
      width: 80, height: 80, borderRadius: 40,
      borderWidth: 2, borderColor: active ? DS.colors.error : DS.colors.primary,
      position: 'absolute',
    }, ringStyle]} />
  );
}

export function ARScanMode() {
  return (
    <TierGate feature="arScansPerMonth" featureLabel="Room Scan">
      <ARScanModeContent />
    </TierGate>
  );
}

function ARScanModeContent() {
  const [isScanning, setIsScanning] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [detectedLabels, setDetectedLabels] = useState<string[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progressWidth = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%` as any,
  }));

  const startScan = () => {
    setIsScanning(true);
    setFrameCount(0);
    setScanComplete(false);
    setDetectedLabels([]);
    progressWidth.value = withTiming(0);

    intervalRef.current = setInterval(() => {
      setFrameCount(prev => {
        const next = prev + 1;
        progressWidth.value = withTiming((next / TOTAL_FRAMES) * 100, { duration: 1800 });
        if (next >= TOTAL_FRAMES) {
          stopScan();
        }
        return next;
      });
    }, 2000);
  };

  const stopScan = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsScanning(false);
    setScanComplete(true);
    // Roboflow integration point — these would be returned by ar-reconstruct edge function
    setDetectedLabels(['Sofa', 'Coffee Table', 'Armchair', 'Window', 'Door', 'Bookshelf']);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Instruction pill */}
      {!scanComplete && (
        <View style={{
          position: 'absolute', top: 160, left: 24, right: 24,
          backgroundColor: 'rgba(34,34,34,0.9)', borderRadius: 50,
          paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center',
          borderWidth: 1, borderColor: DS.colors.border,
        }}>
          <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primary, textAlign: 'center' }}>
            {isScanning
              ? `Scanning… ${frameCount}/${TOTAL_FRAMES} frames captured`
              : 'Walk slowly around the room to scan it'}
          </ArchText>
        </View>
      )}

      {/* Progress bar (scanning) */}
      {isScanning && (
        <View style={{
          position: 'absolute', top: 212, left: 24, right: 24,
          height: 3, backgroundColor: DS.colors.border, borderRadius: 2,
        }}>
          <Animated.View style={[{ height: 3, backgroundColor: DS.colors.primary, borderRadius: 2 }, progressStyle]} />
        </View>
      )}

      {/* Detected label badges */}
      {detectedLabels.map((label, i) => (
        <View key={label} style={{
          position: 'absolute',
          top: 220 + Math.floor(i / 2) * 52,
          left: i % 2 === 0 ? 24 : undefined,
          right: i % 2 === 1 ? 24 : undefined,
          backgroundColor: 'rgba(34,34,34,0.88)',
          borderRadius: 50, paddingHorizontal: 14, paddingVertical: 7,
          borderWidth: 1, borderColor: DS.colors.border,
          flexDirection: 'row', alignItems: 'center', gap: 6,
        }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: DS.colors.success }} />
          <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.primary }}>
            {label}
          </ArchText>
        </View>
      ))}

      {/* Scan button */}
      {!scanComplete && (
        <View style={{ position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' }}>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <ScanRing active={isScanning} />
            <Pressable
              onPress={isScanning ? stopScan : startScan}
              style={{
                width: 72, height: 72, borderRadius: 36,
                backgroundColor: isScanning ? DS.colors.error : DS.colors.primary,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ArchText variant="body" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: DS.colors.background }}>
                {isScanning ? 'Stop' : 'Scan'}
              </ArchText>
            </Pressable>
          </View>
        </View>
      )}

      {/* Completion actions */}
      {scanComplete && (
        <View style={{ position: 'absolute', bottom: 48, left: 20, right: 20, gap: 12 }}>
          <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryDim, textAlign: 'center', marginBottom: 4 }}>
            {detectedLabels.length} objects detected
          </ArchText>
          <Pressable style={{ backgroundColor: DS.colors.primary, borderRadius: 50, paddingVertical: 16, alignItems: 'center' }}>
            <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 16, color: DS.colors.background }}>
              Import to Studio
            </ArchText>
          </Pressable>
          <Pressable style={{ backgroundColor: DS.colors.surface, borderRadius: 50, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: DS.colors.border }}>
            <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: DS.colors.primary }}>
              Save Scan to Project
            </ArchText>
          </Pressable>
          <Pressable
            onPress={() => { setScanComplete(false); setFrameCount(0); setDetectedLabels([]); }}
            style={{ paddingVertical: 12, alignItems: 'center' }}
          >
            <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primaryGhost }}>
              Scan Again
            </ArchText>
          </Pressable>
        </View>
      )}
    </View>
  );
}
