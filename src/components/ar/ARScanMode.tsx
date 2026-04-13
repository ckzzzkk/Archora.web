import React, { useState, useRef, useEffect } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect, Line, Text as SvgText } from 'react-native-svg';
import { ArchText } from '../common/ArchText';
import { TierGate } from '../common/TierGate';
import { DS } from '../../theme/designSystem';


const WALL_PHASES = ['Front', 'Left', 'Back', 'Right'] as const;
type WallPhase = typeof WALL_PHASES[number];

const WALL_SCAN_SECONDS = 5;
const OBJECT_SCAN_FRAMES = 10;

// Simulated object detections with W×D×H estimates (metres)
const DETECTED_OBJECTS: DetectedObject[] = [
  { id: 'sofa',         label: 'Sofa',         w: 2.2, d: 0.9, h: 0.85 },
  { id: 'coffee_table', label: 'Coffee Table', w: 1.1, d: 0.6, h: 0.45 },
  { id: 'armchair',     label: 'Armchair',     w: 0.85, d: 0.85, h: 0.9 },
  { id: 'window',       label: 'Window',       w: 1.2, d: 0.1, h: 1.4 },
  { id: 'door',         label: 'Door',         w: 0.9, d: 0.1, h: 2.1 },
  { id: 'bookshelf',    label: 'Bookshelf',    w: 0.8, d: 0.3, h: 1.8 },
];

interface DetectedObject {
  id: string;
  label: string;
  w: number; // width metres
  d: number; // depth metres
  h: number; // height metres
}


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


function FloorPlanMiniMap({ completedWalls, activeWall }: {
  completedWalls: WallPhase[];
  activeWall: WallPhase | null;
}) {
  const SIZE = 88;
  const PAD = 12;
  const inner = SIZE - PAD * 2;

  // Wall segments as fractions of inner box
  const WALL_COORDS: Record<WallPhase, { x1: number; y1: number; x2: number; y2: number }> = {
    Front: { x1: PAD, y1: PAD, x2: PAD + inner, y2: PAD },
    Right: { x1: PAD + inner, y1: PAD, x2: PAD + inner, y2: PAD + inner },
    Back:  { x1: PAD + inner, y1: PAD + inner, x2: PAD, y2: PAD + inner },
    Left:  { x1: PAD, y1: PAD + inner, x2: PAD, y2: PAD },
  };

  const colorFor = (w: WallPhase) => {
    if (completedWalls.includes(w)) return DS.colors.success;
    if (activeWall === w) return DS.colors.primary;
    return DS.colors.border;
  };

  return (
    <View style={{
      position: 'absolute', top: 160, right: 16,
      width: SIZE + 8, height: SIZE + 8,
      backgroundColor: 'rgba(26,26,26,0.94)',
      borderRadius: 16, borderWidth: 1, borderColor: DS.colors.border,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Svg width={SIZE} height={SIZE}>
        {/* Background floor */}
        <Rect x={PAD} y={PAD} width={inner} height={inner}
          fill={`${DS.colors.primary}08`} />
        {/* Walls */}
        {WALL_PHASES.map(w => {
          const c = WALL_COORDS[w];
          return (
            <Line key={w}
              x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
              stroke={colorFor(w)}
              strokeWidth={activeWall === w ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          );
        })}
        {/* Compass N label */}
        <SvgText x={SIZE / 2} y={PAD - 2} textAnchor="middle"
          fontSize="8" fill={DS.colors.primaryGhost} fontFamily="JetBrainsMono_400Regular">
          N
        </SvgText>
      </Svg>
      <ArchText variant="body" style={{
        position: 'absolute', bottom: 5,
        fontFamily: 'JetBrainsMono_400Regular', fontSize: 8, color: DS.colors.primaryGhost,
      }}>
        {completedWalls.length}/4 walls
      </ArchText>
    </View>
  );
}


function ObjectFootprint({ obj }: { obj: DetectedObject }) {
  // Normalise to a 40×40 box
  const MAX_DIM = 40;
  const scale = MAX_DIM / Math.max(obj.w, obj.d, 1);
  const rw = Math.max(obj.w * scale, 4);
  const rd = Math.max(obj.d * scale, 4);
  const ox = (MAX_DIM - rw) / 2 + 4;
  const oy = (MAX_DIM - rd) / 2 + 4;

  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Rect x={ox} y={oy} width={rw} height={rd}
        stroke={DS.colors.primary} strokeWidth="1.5" fill={`${DS.colors.primary}22`} rx="2" />
      {/* Direction tick */}
      <Line x1={24} y1={oy} x2={24} y2={oy - 4}
        stroke={DS.colors.primary} strokeWidth="1" strokeLinecap="round" />
    </Svg>
  );
}


function ObjectCard({ obj, index }: { obj: DetectedObject; index: number }) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[{
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: 'rgba(34,34,34,0.92)',
      borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
      borderWidth: 1, borderColor: DS.colors.border,
      marginBottom: 8,
    }, style]}>
      {/* Overhead footprint */}
      <ObjectFootprint obj={obj} />
      {/* Label + dimensions */}
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: DS.colors.success }} />
          <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: DS.colors.primary }}>
            {obj.label}
          </ArchText>
        </View>
        <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: DS.colors.primaryGhost }}>
          {obj.w}m × {obj.d}m × {obj.h}m
        </ArchText>
      </View>
    </Animated.View>
  );
}


function WallScanPhase({
  phase,
  completedWalls,
  wallProgress,
  onWallComplete,
}: {
  phase: WallPhase;
  completedWalls: WallPhase[];
  wallProgress: number; // 0–100
  onWallComplete: () => void;
}) {
  const progressWidth = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%` as any,
  }));

  useEffect(() => {
    progressWidth.value = withTiming(wallProgress, { duration: 400 });
  }, [wallProgress, progressWidth]);

  return (
    <>
      {/* Phase instruction */}
      <View style={{
        position: 'absolute', top: 160, left: 24, right: 112, alignItems: 'flex-start',
      }}>
        <View style={{
          backgroundColor: 'rgba(34,34,34,0.9)', borderRadius: 50,
          paddingHorizontal: 20, paddingVertical: 10,
          borderWidth: 1, borderColor: DS.colors.primary,
        }}>
          <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primary }}>
            Face the <ArchText variant="body" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: DS.colors.primary }}>{phase}</ArchText> wall — hold steady
          </ArchText>
        </View>
      </View>

      {/* Wall progress bar */}
      <View style={{
        position: 'absolute', top: 212, left: 24, right: 24,
        height: 3, backgroundColor: DS.colors.border, borderRadius: 2,
      }}>
        <Animated.View style={[{
          height: 3, backgroundColor: DS.colors.primary, borderRadius: 2,
        }, progressStyle]} />
      </View>

      {/* Completed wall chips */}
      {completedWalls.length > 0 && (
        <View style={{
          position: 'absolute', top: 224, left: 24,
          flexDirection: 'row', gap: 6,
        }}>
          {completedWalls.map(w => (
            <View key={w} style={{
              backgroundColor: 'rgba(34,34,34,0.88)', borderRadius: 50,
              paddingHorizontal: 12, paddingVertical: 5,
              borderWidth: 1, borderColor: DS.colors.success,
              flexDirection: 'row', alignItems: 'center', gap: 5,
            }}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: DS.colors.success }} />
              <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: DS.colors.success }}>
                {w}
              </ArchText>
            </View>
          ))}
        </View>
      )}

      {/* Floor-plan mini map */}
      <FloorPlanMiniMap completedWalls={completedWalls} activeWall={phase} />
    </>
  );
}


export function ARScanMode() {
  return (
    <TierGate feature="arScansPerMonth" featureLabel="Room Scan">
      <ARScanModeContent />
    </TierGate>
  );
}


type ScanStage = 'idle' | 'wall_scan' | 'object_scan' | 'complete';

function ARScanModeContent() {
  const [stage, setStage] = useState<ScanStage>('idle');
  const [wallIndex, setWallIndex] = useState(0);
  const [wallProgress, setWallProgress] = useState(0);
  const [completedWalls, setCompletedWalls] = useState<WallPhase[]>([]);
  const [objectFrame, setObjectFrame] = useState(0);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const wallTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const objTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const objectProgress = useSharedValue(0);
  const objectProgressStyle = useAnimatedStyle(() => ({
    width: `${objectProgress.value}%` as any,
  }));

  const startWallTimer = (idx: number) => {
    setWallProgress(0);
    const tickMs = (WALL_SCAN_SECONDS * 1000) / 100;
    let ticks = 0;
    wallTimerRef.current = setInterval(() => {
      ticks++;
      setWallProgress(ticks);
      if (ticks >= 100) {
        clearInterval(wallTimerRef.current!);
        wallTimerRef.current = null;
        const completedWall = WALL_PHASES[idx];
        setCompletedWalls(prev => [...prev, completedWall]);
        if (idx + 1 < WALL_PHASES.length) {
          setWallIndex(idx + 1);
          startWallTimer(idx + 1);
        } else {
          // All walls done → start object scan
          beginObjectScan();
        }
      }
    }, tickMs);
  };

  const beginObjectScan = () => {
    setStage('object_scan');
    setObjectFrame(0);
    setDetectedObjects([]);
    objectProgress.value = withTiming(0);

    let frame = 0;
    objTimerRef.current = setInterval(() => {
      frame++;
      setObjectFrame(frame);
      objectProgress.value = withTiming((frame / OBJECT_SCAN_FRAMES) * 100, { duration: 1800 });
      if (frame >= OBJECT_SCAN_FRAMES) {
        clearInterval(objTimerRef.current!);
        objTimerRef.current = null;
        setDetectedObjects(DETECTED_OBJECTS);
        setStage('complete');
      }
    }, 1500);
  };

  const handleStart = () => {
    setStage('wall_scan');
    setWallIndex(0);
    setCompletedWalls([]);
    setDetectedObjects([]);
    setObjectFrame(0);
    startWallTimer(0);
  };

  const handleStop = () => {
    if (wallTimerRef.current) { clearInterval(wallTimerRef.current); wallTimerRef.current = null; }
    if (objTimerRef.current) { clearInterval(objTimerRef.current); objTimerRef.current = null; }
    setStage('idle');
    setWallIndex(0);
    setWallProgress(0);
    setCompletedWalls([]);
    setObjectFrame(0);
    setDetectedObjects([]);
    objectProgress.value = 0;
  };

  const handleReset = () => {
    handleStop();
  };

  useEffect(() => {
    return () => {
      if (wallTimerRef.current) clearInterval(wallTimerRef.current);
      if (objTimerRef.current) clearInterval(objTimerRef.current);
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>

      {/* ── IDLE: start button ── */}
      {stage === 'idle' && (
        <>
          <View style={{
            position: 'absolute', top: 160, left: 24, right: 24,
            backgroundColor: 'rgba(34,34,34,0.9)', borderRadius: 50,
            paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center',
            borderWidth: 1, borderColor: DS.colors.border,
          }}>
            <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primary, textAlign: 'center' }}>
              Walk the room to scan walls + detect objects
            </ArchText>
          </View>
          <View style={{ position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' }}>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <ScanRing active={false} />
              <Pressable
                onPress={handleStart}
                style={{
                  width: 72, height: 72, borderRadius: 36,
                  backgroundColor: DS.colors.primary,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ArchText variant="body" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: DS.colors.background }}>
                  Scan
                </ArchText>
              </Pressable>
            </View>
          </View>
        </>
      )}

      {/* ── WALL SCAN: guided per-wall ── */}
      {stage === 'wall_scan' && (
        <>
          <WallScanPhase
            phase={WALL_PHASES[wallIndex]}
            completedWalls={completedWalls}
            wallProgress={wallProgress}
            onWallComplete={() => {}}
          />
          <View style={{ position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' }}>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <ScanRing active />
              <Pressable
                onPress={handleStop}
                style={{
                  width: 72, height: 72, borderRadius: 36,
                  backgroundColor: DS.colors.error,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ArchText variant="body" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: DS.colors.background }}>
                  Stop
                </ArchText>
              </Pressable>
            </View>
          </View>
        </>
      )}

      {/* ── OBJECT SCAN: frame counter + progress ── */}
      {stage === 'object_scan' && (
        <>
          <View style={{
            position: 'absolute', top: 160, left: 24, right: 24,
            backgroundColor: 'rgba(34,34,34,0.9)', borderRadius: 50,
            paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center',
            borderWidth: 1, borderColor: DS.colors.border,
          }}>
            <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primary, textAlign: 'center' }}>
              Detecting objects… {objectFrame}/{OBJECT_SCAN_FRAMES} frames
            </ArchText>
          </View>
          <View style={{
            position: 'absolute', top: 212, left: 24, right: 24,
            height: 3, backgroundColor: DS.colors.border, borderRadius: 2,
          }}>
            <Animated.View style={[{ height: 3, backgroundColor: DS.colors.primary, borderRadius: 2 }, objectProgressStyle]} />
          </View>
          {/* Completed walls summary */}
          <FloorPlanMiniMap completedWalls={completedWalls} activeWall={null} />

          <View style={{ position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' }}>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <ScanRing active />
              <Pressable
                onPress={handleStop}
                style={{
                  width: 72, height: 72, borderRadius: 36,
                  backgroundColor: DS.colors.error,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ArchText variant="body" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: DS.colors.background }}>
                  Stop
                </ArchText>
              </Pressable>
            </View>
          </View>
        </>
      )}

      {/* ── COMPLETE: results ── */}
      {stage === 'complete' && (
        <>
          {/* Header summary */}
          <View style={{
            position: 'absolute', top: 160, left: 24, right: 24,
            backgroundColor: 'rgba(34,34,34,0.9)', borderRadius: 20,
            paddingHorizontal: 20, paddingVertical: 14,
            borderWidth: 1, borderColor: DS.colors.success,
          }}>
            <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 18, color: DS.colors.success, textAlign: 'center' }}>
              Scan Complete
            </ArchText>
            <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryDim, textAlign: 'center', marginTop: 4 }}>
              4 walls · {detectedObjects.length} objects detected
            </ArchText>
          </View>

          {/* Scrollable object list */}
          <View style={{ position: 'absolute', top: 258, left: 16, right: 16, bottom: 220 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              {detectedObjects.map((obj, i) => (
                <ObjectCard key={obj.id} obj={obj} index={i} />
              ))}
            </ScrollView>
          </View>

          {/* Action buttons */}
          <View style={{ position: 'absolute', bottom: 48, left: 20, right: 20, gap: 10 }}>
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
              onPress={handleReset}
              style={{ paddingVertical: 12, alignItems: 'center' }}
            >
              <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primaryGhost }}>
                Scan Again
              </ArchText>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
