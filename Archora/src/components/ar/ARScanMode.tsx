import React, { useState, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { BASE_COLORS } from '../../theme/colors';

export function ARScanMode() {
  const [isScanning, setIsScanning] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [detectedLabels, setDetectedLabels] = useState<string[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startScan = () => {
    setIsScanning(true);
    setFrames([]);
    setScanComplete(false);
    // Simulate frame capture every 2s (camera photo capture would be wired here)
    intervalRef.current = setInterval(() => {
      setFrames(prev => {
        const next = [...prev, `frame_${prev.length}`];
        if (next.length >= 10) {
          stopScan(next);
        }
        return next;
      });
    }, 2000);
  };

  const stopScan = (capturedFrames?: string[]) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsScanning(false);
    setScanComplete(true);
    // Placeholder — Roboflow would populate this in production
    setDetectedLabels(['Sofa', 'Table', 'Chair', 'Window']);
    // capturedFrames param is available for future use
    void capturedFrames;
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Instruction */}
      {!scanComplete && (
        <View style={{
          position: 'absolute', top: 120, left: 20, right: 20,
          backgroundColor: 'rgba(34,34,34,0.85)', borderRadius: 50,
          paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center',
        }}>
          <Text style={{ color: BASE_COLORS.textPrimary, fontSize: 14 }}>
            {isScanning ? `Scanning... ${frames.length}/10 frames captured` : 'Walk slowly around the room to scan it'}
          </Text>
        </View>
      )}

      {/* Detected labels overlay */}
      {detectedLabels.map((label, i) => (
        <View
          key={label}
          style={{
            position: 'absolute',
            top: 200 + i * 60,
            left: 40 + (i % 2) * 120,
            backgroundColor: 'rgba(34,34,34,0.8)',
            borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6,
            borderWidth: 1, borderColor: BASE_COLORS.border,
          }}
        >
          <Text style={{ color: BASE_COLORS.textPrimary, fontSize: 12 }}>{label}</Text>
        </View>
      ))}

      {/* Scan button */}
      {!scanComplete && (
        <View style={{ position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center' }}>
          <Pressable
            onPress={isScanning ? () => stopScan() : startScan}
            style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: isScanning ? BASE_COLORS.error : BASE_COLORS.textPrimary,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
            }}
          >
            <Text style={{ color: BASE_COLORS.background, fontSize: 13, fontWeight: '600' }}>
              {isScanning ? 'Stop' : 'Scan'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Completion actions */}
      {scanComplete && (
        <View style={{ position: 'absolute', bottom: 60, left: 20, right: 20, gap: 12 }}>
          <Pressable style={{
            backgroundColor: BASE_COLORS.textPrimary, borderRadius: 50,
            paddingVertical: 14, alignItems: 'center',
          }}>
            <Text style={{ color: BASE_COLORS.background, fontWeight: '600', fontSize: 16 }}>Import to Studio</Text>
          </Pressable>
          <Pressable
            onPress={() => { setScanComplete(false); setFrames([]); setDetectedLabels([]); }}
            style={{
              backgroundColor: 'transparent', borderRadius: 50,
              paddingVertical: 14, alignItems: 'center',
              borderWidth: 1, borderColor: BASE_COLORS.border,
            }}
          >
            <Text style={{ color: BASE_COLORS.textPrimary, fontSize: 16 }}>Scan Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
