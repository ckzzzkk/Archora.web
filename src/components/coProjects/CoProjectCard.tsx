import React from 'react';
import { View, Pressable, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { useThemeColors } from '../../hooks/useThemeColors';
import { DS } from '../../theme/designSystem';
import type { CoProject } from '../../services/coProjectService';

interface Props {
  project: CoProject;
  index: number;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function RoleBadge({ role }: { role: string }) {
  const color = role === 'owner' ? DS.colors.accent : role === 'editor' ? '#7AB87A' : '#9A9590';
  return (
    <View style={{
      backgroundColor: `${color}20`,
      borderWidth: 1, borderColor: `${color}40`,
      borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3,
    }}>
      <Text style={{ fontFamily: DS.font.mono, fontSize: 10, color: color, textTransform: 'uppercase' }}>
        {role}
      </Text>
    </View>
  );
}

export function CoProjectCard({ project, index, onPress }: Props) {
  const C = useThemeColors();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  React.useEffect(() => {
    const delay = index * 60;
    const ease = Easing.out(Easing.cubic);
    opacity.value = withDelay(delay, withTiming(1, { duration: 340, easing: ease }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 340, easing: ease }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));

  const formattedDate = new Date(project.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <Animated.View style={animStyle}>
      <AnimatedPressable
        onPress={onPress}
        accessibilityLabel={`${project.name}, ${project.yourRole ?? 'member'}, ${project.memberCount ?? 0} members`}
        accessibilityRole="button"
        style={{
          backgroundColor: C.surface,
          borderRadius: DS.radius.card,
          marginHorizontal: DS.spacing.lg,
          marginBottom: DS.spacing.sm,
          borderWidth: 1, borderColor: C.border,
          overflow: 'hidden',
        }}
      >
        {/* Header strip */}
        <View style={{
          height: 4,
          backgroundColor: project.yourRole === 'owner' ? DS.colors.accent : C.border,
        }} />

        <View style={{ padding: DS.spacing.md }}>
          {/* Title row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: DS.spacing.sm }}>
            <Text style={{ fontFamily: DS.font.heading, fontSize: 18, color: C.primary, flex: 1 }}
              numberOfLines={1}>
              {project.name}
            </Text>
            <Text style={{ fontFamily: DS.font.mono, fontSize: 11, color: C.primaryGhost, marginLeft: DS.spacing.sm }}>
              {formattedDate}
            </Text>
          </View>

          {/* Description */}
          {project.description ? (
            <Text style={{ fontFamily: DS.font.regular, fontSize: DS.fontSize.sm, color: C.primaryDim, marginBottom: DS.spacing.md, lineHeight: 20 }}
              numberOfLines={2}>
              {project.description}
            </Text>
          ) : null}

          {/* Footer */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm }}>
              {project.yourRole && <RoleBadge role={project.yourRole} />}
              <View style={{
                backgroundColor: `${C.primaryGhost}15`,
                borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
              }}>
                <Text style={{ fontFamily: DS.font.mono, fontSize: 10, color: C.primaryDim }}>
                  {project.memberCount ?? 0} member{(project.memberCount ?? 0) !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
            }}>
              <Text style={{ fontFamily: DS.font.mono, fontSize: 11, color: C.primaryGhost }}>Open</Text>
              <Text style={{ fontSize: 14, color: C.primaryGhost }}>→</Text>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}