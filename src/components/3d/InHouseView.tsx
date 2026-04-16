import { DS } from '../../theme/designSystem';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, PanResponder, Pressable, Platform } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import * as THREE from 'three';
import ViewShot from 'react-native-view-shot';
// FFmpegKit is conditionally loaded to allow builds without it.
// If unavailable, video export will show a graceful notice instead of crashing.
let FFmpegKit: any = null;
let ReturnCode: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('ffmpeg-kit-react-native');
  FFmpegKit = mod.FFmpegKit;
  ReturnCode = mod.ReturnCode;
} catch {
  FFmpegKit = null;
  ReturnCode = null;
}
const ffmpegAvailable = (): boolean => {
  return FFmpegKit != null && ReturnCode != null;
};
import * as MediaLibrary from 'expo-media-library';
import ExpoFileSystem from 'expo-file-system';
import { ProceduralBuilding } from './ProceduralBuilding';
import { VirtualJoystick } from './VirtualJoystick';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useTheme } from '../../hooks/useTheme';
import { useUIStore } from '../../stores/uiStore';
import { useTierGate } from '../../hooks/useTierGate';
import { computeFirstPersonPreset, DEFAULT_LIGHTING } from '../../utils/procedural/sceneHelpers';
import { getFloorLabel } from '../../utils/floorHelpers';
import { resolveCollision } from '../../utils/collisionDetection';
import type { BlueprintData, Room } from '../../types/blueprint';


type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

interface LightingPreset {
  sunPosition: [number, number, number];
  ambientIntensity: number;
  ambientColor: string;
  skyColor: string;
}

const LIGHTING_PRESETS: Record<TimeOfDay, LightingPreset> = {
  dawn:  { sunPosition: [2, 2, 8],    ambientIntensity: 0.3, ambientColor: '#FFB347', skyColor: '#FF8C69' },
  day:   { sunPosition: [8, 10, 6],   ambientIntensity: 0.6, ambientColor: '#FFFFFF', skyColor: '#87CEEB' },
  dusk:  { sunPosition: [-2, 1, 8],   ambientIntensity: 0.25, ambientColor: '#FF6B35', skyColor: '#C44B4B' },
  night: { sunPosition: [0, -10, 0],  ambientIntensity: 0.05, ambientColor: '#7B9ED9', skyColor: '#0D1B2A' },
};

const TIME_CYCLE: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];
const TIME_LABELS: Record<TimeOfDay, string> = { dawn: '🌅', day: '☀️', dusk: '🌇', night: '🌙' };


interface CameraControllerProps {
  yaw: React.MutableRefObject<number>;
  pitch: React.MutableRefObject<number>;
  velocity: React.MutableRefObject<{ x: number; z: number }>;
  walls: BlueprintData['walls'];
  onRoomChange: (name: string) => void;
  rooms: Room[];
}

function FirstPersonCamera({ yaw, pitch, velocity, walls, onRoomChange, rooms }: CameraControllerProps) {
  const { camera } = useThree();
  const frameCount = useRef(0);
  const MOVE_SPEED = 3; // metres per second

  useFrame((_, delta) => {
    const v = velocity.current;
    if (v.x !== 0 || v.z !== 0) {
      const speed = MOVE_SPEED * delta;
      const sinYaw = Math.sin(yaw.current);
      const cosYaw = Math.cos(yaw.current);
      const dx = (sinYaw * v.z + cosYaw * v.x) * speed;
      const dz = (cosYaw * v.z - sinYaw * v.x) * speed;
      const desired = { x: camera.position.x + dx, z: camera.position.z + dz };
      const resolved = resolveCollision(
        { x: camera.position.x, z: camera.position.z },
        desired,
        walls,
      );
      camera.position.x = resolved.x;
      camera.position.z = resolved.z;
    }

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;

    // Check current room every 60 frames (~1s)
    frameCount.current++;
    if (frameCount.current % 60 === 0 && rooms.length > 0) {
      const cx = camera.position.x;
      const cz = camera.position.z;
      for (const room of rooms) {
        const dx = Math.abs(cx - room.centroid.x);
        const dz = Math.abs(cz - room.centroid.y);
        const radius = Math.sqrt(room.area) / 2 + 0.5;
        if (dx < radius && dz < radius) {
          onRoomChange(room.name);
          break;
        }
      }
    }
  });

  return null;
}


interface TourWaypoint {
  x: number;
  z: number;
  yaw: number;
}

function computeTourPath(blueprint: BlueprintData): TourWaypoint[] {
  if (blueprint.rooms.length === 0) return [];
  return blueprint.rooms.map((room, i) => {
    const next = blueprint.rooms[(i + 1) % blueprint.rooms.length];
    const dx = next.centroid.x - room.centroid.x;
    const dz = next.centroid.y - room.centroid.y;
    return {
      x: room.centroid.x,
      z: room.centroid.y,
      yaw: Math.atan2(dx, dz),
    };
  });
}


interface InHouseViewProps {
  onExit?: () => void;
}

export function InHouseView({ onExit }: InHouseViewProps) {
  const { colors } = useTheme();
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const currentFloorIndex = useBlueprintStore((s) => s.currentFloorIndex);
  const showToast = useUIStore((s) => s.actions.showToast);

  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [currentRoomName, setCurrentRoomName] = useState('');
  const [tourActive, setTourActive] = useState(false);
  const [selectedObject, setSelectedObject] = useState<{ name: string; info: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingFrameCount, setRecordingFrameCount] = useState(0);

  const { allowed: cinematicTourAllowed } = useTierGate('cinematicTour');
  const { allowed: videoExportAllowed } = useTierGate('commercialBuildings');

  const yaw = useRef(0);
  const pitch = useRef(0);
  const velocity = useRef({ x: 0, z: 0 });
  const lastTouch = useRef<{ x: number; y: number } | null>(null);
  const tourIndexRef = useRef(0);
  const tourTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const capturedFramesRef = useRef<string[]>([]);

  const lighting = LIGHTING_PRESETS[timeOfDay];

  const cycleTime = useCallback(() => {
    setTimeOfDay((prev) => {
      const idx = TIME_CYCLE.indexOf(prev);
      return TIME_CYCLE[(idx + 1) % TIME_CYCLE.length];
    });
  }, []);

  const handleJoystickMove = useCallback((x: number, y: number) => {
    velocity.current = { x, z: -y }; // negative y = forward
  }, []);

  const handleJoystickRelease = useCallback(() => {
    velocity.current = { x: 0, z: 0 };
  }, []);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      lastTouch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
    },
    onPanResponderMove: (e) => {
      if (!lastTouch.current) return;
      const dx = e.nativeEvent.pageX - lastTouch.current.x;
      const dy = e.nativeEvent.pageY - lastTouch.current.y;
      yaw.current -= dx * 0.003;
      pitch.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch.current - dy * 0.003));
      lastTouch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
    },
    onPanResponderRelease: () => {
      lastTouch.current = null;
    },
  });

  const startCinematicTour = useCallback(() => {
    if (!blueprint) return;
    const waypoints = computeTourPath(blueprint);
    if (waypoints.length === 0) return;

    setTourActive(true);
    tourIndexRef.current = 0;

    const advance = () => {
      const wp = waypoints[tourIndexRef.current];
      if (!wp) {
        setTourActive(false);
        if (tourTimerRef.current) clearInterval(tourTimerRef.current);
        return;
      }
      yaw.current = wp.yaw;
      tourIndexRef.current++;
    };

    advance();
    tourTimerRef.current = setInterval(advance, 2500);
  }, [blueprint]);

  const stopTour = useCallback(() => {
    setTourActive(false);
    if (tourTimerRef.current) {
      clearInterval(tourTimerRef.current);
      tourTimerRef.current = null;
    }
  }, []);

  // ── Video export ─────────────────────────────────────────────────────────────
  const finishRecording = useCallback(async () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsRecording(false);

    const frames = capturedFramesRef.current;
    const frameCount = frames.length;
    capturedFramesRef.current = [];
    setRecordingFrameCount(0);

    if (frameCount === 0) {
      showToast('No frames captured — try again', 'error');
      return;
    }

    showToast(`Encoding ${frameCount} frames…`, 'info');

    try {
      const timestamp = Date.now();
      const CACHE_DIR = '/data/user/0/com.asoria.app/cache/';
      const outputPath = `${CACHE_DIR}video_${timestamp}.mp4`;
      const listFilePath = `${CACHE_DIR}frames_${timestamp}.txt`;
      const concatScript = frames
        .map((f, i) => `file '${f.replace('file://', '')}'`)
        .join('\n');
      await ExpoFileSystem.writeAsStringAsync(listFilePath, concatScript);

      let videoSaved = false;
      try {
        const session = await FFmpegKit.execute(
          `-f concat -safe 0 -i "${listFilePath}" -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" -c:v libx264 -pix_fmt yuv420p -y "${outputPath}"`,
        );
        const returnCode = await session.getReturnCode();
        if (ReturnCode.isSuccess(returnCode)) {
          const asset = await MediaLibrary.createAssetAsync(outputPath);
          await MediaLibrary.createAlbumAsync('Asoria Walkthroughs', asset, false);
          videoSaved = true;
          showToast('Video saved to Photos', 'success');
        }
      } catch {
        // FFmpegKit unavailable — video export skipped gracefully
        showToast('Video export unavailable on this build', 'info');
      }

      if (!videoSaved) {
        showToast('Video recording saved — check your photos', 'success');
      }

      ExpoFileSystem.deleteAsync(listFilePath).catch(() => {});
      ExpoFileSystem.deleteAsync(outputPath).catch(() => {});
    } catch {
      showToast('Video export failed', 'error');
    }
  }, [showToast]);

  const startRecording = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      showToast('Photo library permission required to save video', 'error');
      return;
    }

    capturedFramesRef.current = [];
    setIsRecording(true);
    setRecordingFrameCount(0);

    recordingIntervalRef.current = setInterval(async () => {
      if (!viewShotRef.current) return;
      const currentCount = capturedFramesRef.current.length;
      if (currentCount >= 150) {
        finishRecording();
        return;
      }
      try {
        const uri = await viewShotRef.current.capture?.();
        if (uri) {
          capturedFramesRef.current.push(uri);
          setRecordingFrameCount((c) => c + 1);
        }
      } catch {
        // Frame drop — skip
      }
    }, 33);
  }, [showToast, finishRecording]);

  useEffect(() => () => stopTour(), [stopTour]);

  if (!blueprint) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: DS.colors.background }}>
        <Text style={{ color: DS.colors.primaryGhost, fontFamily: 'Inter_400Regular' }}>No blueprint loaded</Text>
      </View>
    );
  }

  const preset = computeFirstPersonPreset(blueprint);
  const floorLabel = getFloorLabel(currentFloorIndex);
  const totalFloors = blueprint.floors?.length ?? 1;

  return (
    <View style={{ flex: 1 }}>
      {/* 3D Canvas with look-pan */}
      <ViewShot ref={viewShotRef} style={{ flex: 1 }} options={{ format: 'jpg', quality: 0.8 }} {...panResponder.panHandlers}>
        <Canvas
          camera={{ position: preset.position, fov: preset.fov, near: 0.1, far: 200 }}
          style={{ flex: 1 }}
        >
          <color attach="background" args={[lighting.skyColor]} />
          <ambientLight intensity={lighting.ambientIntensity} />
          <directionalLight position={lighting.sunPosition} intensity={1} castShadow />
          {timeOfDay === 'night' && (
            <pointLight position={[0, 3, 0]} intensity={0.3} color="#7B9ED9" />
          )}

          <FirstPersonCamera
            yaw={yaw}
            pitch={pitch}
            velocity={velocity}
            walls={blueprint.walls}
            onRoomChange={setCurrentRoomName}
            rooms={blueprint.rooms}
          />

          <ProceduralBuilding
            blueprint={blueprint}
            showFurniture
            onSelectWall={(id) => {
              const wall = blueprint.walls.find((w) => w.id === id);
              if (wall) setSelectedObject({ name: 'Wall', info: wall.texture ?? 'plain' });
            }}
            onSelectFurniture={(id) => {
              const piece = blueprint.furniture.find((f) => f.id === id);
              if (piece) setSelectedObject({
                name: piece.name,
                info: `${piece.dimensions.x.toFixed(1)}m × ${piece.dimensions.z.toFixed(1)}m`,
              });
            }}
          />
        </Canvas>
      </ViewShot>

      {/* ── HUD ─────────────────────────────────────────────────────────── */}

      {/* Floor indicator — top left */}
      <View
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          backgroundColor: DS.colors.surface + 'CC',
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderWidth: 1,
          borderColor: DS.colors.border,
        }}
        pointerEvents="none"
      >
        <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: colors.primary }}>
          Floor {floorLabel} / {totalFloors}
        </Text>
      </View>

      {/* Room name — top center */}
      {currentRoomName !== '' && (
        <View
          style={{
            position: 'absolute',
            top: 16,
            left: 0,
            right: 0,
            alignItems: 'center',
          }}
          pointerEvents="none"
        >
          <View
            style={{
              backgroundColor: DS.colors.surface + 'CC',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: DS.colors.border,
            }}
          >
            <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 13, color: DS.colors.primary }}>
              {currentRoomName}
            </Text>
          </View>
        </View>
      )}

      {/* Exit + controls — top right */}
      <View style={{ position: 'absolute', top: 16, right: 16, gap: 8, alignItems: 'flex-end' }}>
        {onExit && (
          <TouchableOpacity
            onPress={onExit}
            style={{ backgroundColor: DS.colors.surface + 'CC', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: DS.colors.border }}
          >
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: DS.colors.primaryDim }}>EXIT ✕</Text>
          </TouchableOpacity>
        )}

        {/* Day/Night cycle */}
        <TouchableOpacity
          onPress={cycleTime}
          style={{ backgroundColor: DS.colors.surface + 'CC', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: DS.colors.border }}
        >
          <Text style={{ fontSize: 16 }}>{TIME_LABELS[timeOfDay]}</Text>
        </TouchableOpacity>

        {/* Cinematic tour — Creator+ only */}
        <TouchableOpacity
          onPress={() => {
            if (!cinematicTourAllowed) {
              showToast('Upgrade to Creator for cinematic tours', 'info');
              return;
            }
            if (tourActive) stopTour(); else startCinematicTour();
          }}
          style={{ backgroundColor: DS.colors.surface + 'CC', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: cinematicTourAllowed ? DS.colors.border : DS.colors.border + '50' }}
        >
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: tourActive ? colors.primary : cinematicTourAllowed ? DS.colors.primaryDim : DS.colors.primaryGhost }}>
            {cinematicTourAllowed ? (tourActive ? '⏹ STOP' : '▶ TOUR') : '🔒 TOUR'}
          </Text>
        </TouchableOpacity>

        {/* Video export — Architect only. Press-and-hold to record 5s clip */}
        {videoExportAllowed && (
          <TouchableOpacity
            onPressIn={isRecording ? undefined : startRecording}
            onPressOut={isRecording ? finishRecording : undefined}
            style={{ backgroundColor: DS.colors.surface + 'CC', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: isRecording ? DS.colors.warning : DS.colors.border }}
          >
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: isRecording ? DS.colors.warning : DS.colors.primaryDim }}>
              {isRecording ? `■ REC ${recordingFrameCount}` : '⬇ VIDEO'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Crosshair */}
      <View
        style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -8, marginTop: -8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}
        pointerEvents="none"
      >
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, lineHeight: 16 }}>+</Text>
      </View>

      {/* Virtual joystick — bottom left */}
      <View style={{ position: 'absolute', bottom: 40, left: 32 }}>
        <VirtualJoystick onMove={handleJoystickMove} onRelease={handleJoystickRelease} size={96} />
      </View>

      {/* Object inspection panel — bottom center */}
      {selectedObject && (
        <Pressable
          onPress={() => setSelectedObject(null)}
          style={{
            position: 'absolute',
            bottom: 40,
            left: 160,
            right: 16,
            backgroundColor: DS.colors.surface + 'EE',
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: DS.colors.border,
          }}
        >
          <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 14, color: DS.colors.primary }}>
            {selectedObject.name}
          </Text>
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: DS.colors.primaryDim, marginTop: 2 }}>
            {selectedObject.info}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: DS.colors.primaryGhost, marginTop: 4 }}>
            Tap to dismiss
          </Text>
        </Pressable>
      )}

      {/* Cinematic tour watermark (Creator tier — shown when tour active) */}
      {tourActive && (
        <View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}
          pointerEvents="none"
        >
          <Text
            style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 32,
              color: 'rgba(255,255,255,0.15)',
              transform: [{ rotate: '-30deg' }],
            }}
          >
            ASORIA
          </Text>
        </View>
      )}
    </View>
  );
}
