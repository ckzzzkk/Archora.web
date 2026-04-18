import { DS } from '../../theme/designSystem';
import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { useGyroscope } from '../../hooks/useGyroscope';
import type { Project } from '../../types';

interface Props {
  project: Project;
  onPress: () => void;
  onDelete: () => void;
  onRename: () => void;
  index: number;
}

const BUILDING_TYPE_LABELS: Record<string, string> = {
  house: 'House',
  apartment: 'Apartment',
  office: 'Office',
  studio: 'Studio',
  villa: 'Villa',
};

function DrawingPin({ color }: { color: string }) {
  return (
    <Svg width={18} height={22} viewBox="0 0 18 22">
      <Circle cx={9} cy={7} r={5} fill={color} opacity={0.9} />
      <Path d="M9 12 L9 22" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={0.7} />
      <Circle cx={9} cy={7} r={2} fill="#fff" opacity={0.4} />
    </Svg>
  );
}

function BlueprintThumbnail({ projectId, colors }: { projectId: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  // Deterministic grid lines based on project ID
  const seed = projectId.charCodeAt(0) + projectId.charCodeAt(1);
  const roomCount = (seed % 3) + 2;

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#1A2535',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Svg width="100%" height="100%" viewBox="0 0 140 100">
        {/* Grid */}
        {[20, 40, 60, 80, 100, 120].map((x) => (
          <Path key={`v${x}`} d={`M${x} 0 V100`} stroke={colors.primary} strokeWidth="0.3" opacity={0.15} />
        ))}
        {[20, 40, 60, 80].map((y) => (
          <Path key={`h${y}`} d={`M0 ${y} H140`} stroke={colors.primary} strokeWidth="0.3" opacity={0.15} />
        ))}
        {/* Simplified floor plan */}
        <Path d="M15 10 H125 V90 H15 Z" stroke={colors.primary} strokeWidth="1.5" fill="none" />
        <Path d="M15 45 H85" stroke={colors.primary} strokeWidth="1" />
        <Path d="M85 10 V90" stroke={colors.primary} strokeWidth="1" />
        <Path d="M15 65 H60" stroke={colors.primary} strokeWidth="1" />
        {/* Door arc */}
        <Path d="M60 65 Q70 65 70 55" stroke={colors.primary} strokeWidth="0.8" fill="none" strokeDasharray="2 2" />
        {/* Window breaks */}
        <Path d="M55 10 H75" stroke={DS.colors.surfaceHigh} strokeWidth="2" />
        <Path d="M55 10 H75" stroke={colors.primary} strokeWidth="0.8" strokeDasharray="3 2" />
      </Svg>
    </View>
  );
}

function ProjectCardInner({ project, onPress, onDelete, onRename, index }: Props) {
  const { colors } = useTheme();
  const { light, medium } = useHaptics();
  const [menuOpen, setMenuOpen] = useState(false);
  const { tiltX, tiltY } = useGyroscope();

  const scale = useSharedValue(1);
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);
  const rotationOffset = useRef(Math.random() * 4 - 2).current;
  const rotation = useSharedValue(rotationOffset);

  React.useEffect(() => {
    const delay = index * 80;
    setTimeout(() => {
      translateY.value = withSpring(0, { damping: 16, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 300 });
    }, delay);
    rotation.value = withDelay(delay + 100, withSpring(0, { damping: 12, stiffness: 80 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { rotateX: `${interpolate(tiltY.value, [-1, 1], [-8, 8])}deg` },
      { rotateY: `${interpolate(tiltX.value, [-1, 1], [8, -8])}deg` },
    ],
    opacity: opacity.value,
  }));

  const handleLongPress = () => {
    medium();
    scale.value = withSpring(1.03, { damping: 12 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Animated.View style={[animatedStyle, { flex: 1, margin: 6 }]}>
      <Pressable
        onPress={() => { light(); onPress(); }}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        style={{
          backgroundColor: DS.colors.surface,
          borderRadius: DS.radius.card, // 24px — oval-first design system
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: DS.colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        {/* Thumbnail */}
        <View style={{ height: 120 }}>
          <BlueprintThumbnail projectId={project.id} colors={colors} />
          {/* Drawing pin */}
          <View style={{ position: 'absolute', top: -4, left: '50%', marginLeft: -9 }}>
            <DrawingPin color={colors.primary} />
          </View>
        </View>

        {/* Info */}
        <View style={{ padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: 'ArchitectsDaughter_400Regular',
                fontSize: 15,
                color: DS.colors.primary,
                flex: 1,
              }}
            >
              {project.name}
            </Text>
            <Pressable
              onPress={() => { light(); setMenuOpen(!menuOpen); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ color: DS.colors.primaryGhost, fontSize: 18, lineHeight: 18 }}>⋯</Text>
            </Pressable>
          </View>

          {/* Building type tag */}
          <View style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 8,
            paddingVertical: 3,
            backgroundColor: DS.colors.surfaceHigh,
            borderRadius: 50,
            marginTop: 6,
          }}>
            <Text style={{
              fontFamily: 'JetBrainsMono_400Regular',
              fontSize: 10,
              color: colors.primary,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}>
              {BUILDING_TYPE_LABELS[project.buildingType] ?? project.buildingType}
            </Text>
          </View>

          <Text style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 11,
            color: DS.colors.primaryGhost,
            marginTop: 8,
          }}>
            {formatDate(project.updatedAt)}
          </Text>
        </View>

        {/* Context menu */}
        {menuOpen && (
          <View style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: DS.colors.surfaceHigh,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: DS.colors.border,
            zIndex: 10,
            minWidth: 120,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 10,
          }}>
            <Pressable
              onPress={() => { setMenuOpen(false); onRename(); }}
              style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: DS.colors.border }}
            >
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primary }}>
                Rename
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMenuOpen(false);
                Alert.alert('Delete Project', `Delete "${project.name}"? This cannot be undone.`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: onDelete },
                ]);
              }}
              style={{ padding: 12 }}
            >
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.error }}>
                Delete
              </Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export const ProjectCard = React.memo(ProjectCardInner);
