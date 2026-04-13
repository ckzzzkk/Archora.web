import React, { useState, useCallback, useRef } from 'react';
import { View, Pressable, Image, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';
import { ArchText } from '../common/ArchText';
import { OvalButton } from '../common/OvalButton';
import { CompassRoseLoader } from '../common/CompassRoseLoader';
import { TierGate } from '../common/TierGate';
import { DS } from '../../theme/designSystem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { arService } from '../../services/arService';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { buildBlueprintFromAR } from '../../utils/ar/arToBlueprintConverter';
import { photoAnalysisToBlueprint } from '../../utils/ar/arToBlueprintConverter';
import type { PhotoAnalysisResult } from '../../utils/ar/arToBlueprintConverter';
import { ARResultScreen } from './ARResultScreen';

const WALL_DIRECTIONS = ['front', 'left', 'back', 'right'] as const;
type WallDirection = typeof WALL_DIRECTIONS[number];

interface PhotoCapture {
  direction: WallDirection;
  uri: string;
  base64: string;
  analyzed?: PhotoAnalysisResult;
}

export function ARPhotoMode() {
  return (
    <TierGate feature="arScansPerMonth" featureLabel="Photo Room Scan">
      <ARPhotoModeContent />
    </TierGate>
  );
}

function ARPhotoModeContent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef<Camera>(null);

  const [captures, setCaptures] = useState<PhotoCapture[]>([]);
  const [currentDirection, setCurrentDirection] = useState<WallDirection>('front');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const directionIndex = WALL_DIRECTIONS.indexOf(currentDirection);
  const photosTaken = captures.length;
  const allPhotosTaken = photosTaken === 4;

  const takePhoto = useCallback(async () => {
    if (!camera.current) return;

    try {
      const photo = await camera.current.takePhoto({
        enableShutterSound: false,
        enableAutoRedEyeReduction: false,
      });

      // Convert to base64 (simplified - in production, use FileSystem)
      const response = await fetch(`file://${photo.path}`);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        const newCapture: PhotoCapture = {
          direction: currentDirection,
          uri: photo.path,
          base64,
        };

        setCaptures((prev) => [...prev, newCapture]);

        // Move to next direction
        const nextIndex = directionIndex + 1;
        if (nextIndex < WALL_DIRECTIONS.length) {
          setCurrentDirection(WALL_DIRECTIONS[nextIndex]);
        }
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Photo capture error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  }, [currentDirection, directionIndex]);

  const analyzePhotos = useCallback(async () => {
    if (captures.length < 4) return;

    setIsAnalyzing(true);

    try {
      const results: PhotoAnalysisResult[] = [];

      for (const capture of captures) {
        const result = await arService.analysePhoto(capture.base64, capture.direction);
        results.push(result);
      }

      // Convert to blueprint
      const { walls, rooms, openings } = photoAnalysisToBlueprint(
        results as [PhotoAnalysisResult, PhotoAnalysisResult, PhotoAnalysisResult, PhotoAnalysisResult],
        WALL_DIRECTIONS as unknown as ['front', 'left', 'back', 'right']
      );

      const blueprint = buildBlueprintFromAR(walls, rooms, [], openings);

      // Calculate dimensions from walls
      const xs = walls.flatMap((w) => [w.start.x, w.end.x]);
      const ys = walls.flatMap((w) => [w.start.y, w.end.y]);
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);
      const area = width * height;

      const avgConfidence =
        results.reduce((sum, r) => sum + (r.confidence ?? 0.5), 0) / results.length;

      setScanResult({
        blueprint,
        dimensions: { width, height, area },
        roomType: rooms[0]?.type || 'living_room',
        pointCount: walls.length,
        confidence: avgConfidence,
      });

      setShowResult(true);
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Error', 'Failed to analyze photos. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [captures]);

  const handleReset = useCallback(() => {
    setCaptures([]);
    setCurrentDirection('front');
    setShowResult(false);
    setScanResult(null);
  }, []);

  const handleOpenInStudio = useCallback(() => {
    if (scanResult?.blueprint) {
      useBlueprintStore.getState().actions.loadBlueprint(scanResult.blueprint);
      navigation.navigate('Workspace', { fromAR: true });
    }
  }, [scanResult, navigation]);

  if (showResult && scanResult) {
    return (
      <ARResultScreen
        result={scanResult}
        onOpenInStudio={handleOpenInStudio}
        onScanAgain={handleReset}
        onBack={() => navigation.goBack()}
      />
    );
  }

  if (!hasPermission) {
    return (
      <View style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <ArchText variant="body" style={{ fontFamily: DS.font.medium, fontSize: 16, color: DS.colors.primary, textAlign: 'center', marginBottom: 16 }}>
          Camera permission is required for photo scanning
        </ArchText>
        <OvalButton label="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ArchText variant="body" style={{ fontFamily: DS.font.medium, fontSize: 16, color: DS.colors.primary }}>
          No camera found
        </ArchText>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Camera View */}
      <Camera
        ref={camera}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* Overlay UI */}
      <View style={{ flex: 1, pointerEvents: 'box-none' }}>
        {/* Header */}
        <View style={{ position: 'absolute', top: insets.top + 16, left: 20 }}>
          <OvalButton label="← Back" onPress={() => navigation.goBack()} variant="outline" size="small" />
        </View>

        {/* Progress indicator */}
        <View style={{ position: 'absolute', top: insets.top + 16, right: 20 }}>
          <View style={{ backgroundColor: 'rgba(26,26,26,0.92)', borderRadius: 50, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: DS.colors.border }}>
            <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 12, color: DS.colors.primary }}>
              {photosTaken}/4
            </ArchText>
          </View>
        </View>

        {/* Instruction */}
        <View style={{ position: 'absolute', top: insets.top + 64, left: 24, right: 24, alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(34,34,34,0.92)', borderRadius: 50, paddingHorizontal: 24, paddingVertical: 14, borderWidth: 1, borderColor: DS.colors.primary }}>
            <ArchText variant="body" style={{ fontFamily: DS.font.heading, fontSize: 18, color: DS.colors.primary, textTransform: 'capitalize' }}>
              {currentDirection} Wall
            </ArchText>
            <ArchText variant="body" style={{ fontFamily: DS.font.regular, fontSize: 13, color: DS.colors.primaryDim, textAlign: 'center', marginTop: 4 }}>
              Take a photo of this wall
            </ArchText>
          </View>
        </View>

        {/* Wall direction guide */}
        <WallDirectionGuide current={currentDirection} captures={captures} />

        {/* Photo preview strip */}
        {captures.length > 0 && (
          <View style={{ position: 'absolute', top: insets.top + 160, right: 16 }}>
            {captures.map((capture, index) => (
              <PhotoThumbnail key={index} uri={capture.uri} direction={capture.direction} />
            ))}
          </View>
        )}

        {/* Capture button or Analyze button */}
        <View style={{ position: 'absolute', bottom: insets.bottom + 24, left: 0, right: 0, alignItems: 'center' }}>
          {allPhotosTaken ? (
            <OvalButton
              label={isAnalyzing ? 'Analyzing...' : 'Analyze Room'}
              onPress={analyzePhotos}
              variant="success"
              loading={isAnalyzing}
            />
          ) : (
            <CaptureButton onPress={takePhoto} />
          )}
        </View>

        {/* Reset button */}
        {captures.length > 0 && (
          <View style={{ position: 'absolute', bottom: insets.bottom + 96, left: 0, right: 0, alignItems: 'center' }}>
            <OvalButton label="Start Over" onPress={handleReset} variant="ghost" />
          </View>
        )}
      </View>
    </View>
  );
}


interface CaptureButtonProps {
  onPress: () => void;
}

function CaptureButton({ onPress }: CaptureButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 100, easing: Easing.out(Easing.quad) })
    );
    onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          animatedStyle,
          {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: DS.colors.primary,
            borderWidth: 4,
            borderColor: DS.colors.background,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: DS.colors.primary,
            borderWidth: 2,
            borderColor: DS.colors.background,
          }}
        />
      </Animated.View>
    </Pressable>
  );
}


interface WallDirectionGuideProps {
  current: WallDirection;
  captures: PhotoCapture[];
}

function WallDirectionGuide({ current, captures }: WallDirectionGuideProps) {
  const SIZE = 120;
  const CENTER = SIZE / 2;
  const ROOM_SIZE = 60;
  const HALF_ROOM = ROOM_SIZE / 2;

  const isCaptured = (dir: WallDirection) => captures.some((c) => c.direction === dir);
  const isCurrent = (dir: WallDirection) => dir === current;

  return (
    <View style={{ position: 'absolute', top: '40%', left: '50%', marginLeft: -SIZE / 2 }}>
      <Svg width={SIZE} height={SIZE}>
        {/* Room outline */}
        <Rect
          x={CENTER - HALF_ROOM}
          y={CENTER - HALF_ROOM}
          width={ROOM_SIZE}
          height={ROOM_SIZE}
          fill="none"
          stroke={DS.colors.border}
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Wall indicators */}
        {WALL_DIRECTIONS.map((dir, i) => {
          const isCap = isCaptured(dir);
          const isCur = isCurrent(dir);
          const color = isCap ? DS.colors.success : isCur ? DS.colors.primary : DS.colors.border;

          let x = CENTER;
          let y = CENTER;
          let rotation = 0;

          switch (dir) {
            case 'front':
              y = CENTER - HALF_ROOM - 8;
              break;
            case 'right':
              x = CENTER + HALF_ROOM + 8;
              rotation = 90;
              break;
            case 'back':
              y = CENTER + HALF_ROOM + 8;
              rotation = 180;
              break;
            case 'left':
              x = CENTER - HALF_ROOM - 8;
              rotation = -90;
              break;
          }

          return (
            <React.Fragment key={dir}>
              {/* Arrow */}
              <Path
                d={`M${x - 4},${y - 6} L${x},${y} L${x + 4},${y - 6}`}
                stroke={color}
                strokeWidth="2"
                fill="none"
                transform={`rotate(${rotation}, ${x}, ${y})`}
              />
              {/* Status dot */}
              <Circle cx={x} cy={y} r={isCur ? 4 : 3} fill={color} />
            </React.Fragment>
          );
        })}

        {/* Camera position indicator */}
        <Circle cx={CENTER} cy={CENTER} r={6} fill={DS.colors.primary} />
        <Path
          d={`M${CENTER},${CENTER - 4} L${CENTER},${CENTER - 12}`}
          stroke={DS.colors.primary}
          strokeWidth="2"
        />
      </Svg>
    </View>
  );
}


interface PhotoThumbnailProps {
  uri: string;
  direction: WallDirection;
}

function PhotoThumbnail({ uri, direction }: PhotoThumbnailProps) {
  return (
    <View
      style={{
        width: 60,
        height: 60,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 8,
        borderWidth: 2,
        borderColor: DS.colors.success,
      }}
    >
      <Image source={{ uri: `file://${uri}` }} style={{ width: '100%', height: '100%' }} />
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          paddingVertical: 2,
        }}
      >
        <ArchText
          variant="body"
          style={{
            fontFamily: DS.font.mono,
            fontSize: 8,
            color: DS.colors.primary,
            textAlign: 'center',
            textTransform: 'capitalize',
          }}
        >
          {direction}
        </ArchText>
      </View>
    </View>
  );
}
