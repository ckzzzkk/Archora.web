import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';
import { DS } from '../../theme/designSystem';
import type { CoProjectMember } from '../../services/coProjectService';

interface Props {
  members: CoProjectMember[];
  showRemove?: boolean;
  onRemove?: (projectId: string, userId: string) => void;
  canRemove?: boolean;
}

function AvatarCircle({ name, size = 40 }: { name: string; size?: number }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: DS.colors.accent + '20',
      borderWidth: 1, borderColor: DS.colors.accent + '40',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontFamily: DS.font.semibold, fontSize: size * 0.38, color: DS.colors.accent }}>
        {initial}
      </Text>
    </View>
  );
}

function RoleChip({ role }: { role: string }) {
  const color = role === 'owner' ? DS.colors.accent : role === 'editor' ? '#7AB87A' : '#9A9590';
  return (
    <View style={{
      backgroundColor: `${color}15`,
      borderRadius: 50, paddingHorizontal: 8, paddingVertical: 2,
      borderWidth: 1, borderColor: `${color}30`,
    }}>
      <Text style={{ fontFamily: DS.font.mono, fontSize: 10, color: color, textTransform: 'uppercase' }}>
        {role}
      </Text>
    </View>
  );
}

function MemberRow({ member, onRemove, canRemove }: {
  member: CoProjectMember;
  onRemove?: () => void;
  canRemove?: boolean;
}) {
  const C = useThemeColors();
  const { light } = useHaptics();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => { scale.value = withSpring(0.97, { damping: 20, stiffness: 300 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 20, stiffness: 300 }); };

  return (
    <Animated.View style={[animStyle, {
      flexDirection: 'row', alignItems: 'center', gap: DS.spacing.md,
      paddingVertical: DS.spacing.sm, borderBottomWidth: 1, borderBottomColor: C.border,
    }]}>
      <AvatarCircle name={member.displayName} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: DS.font.semibold, fontSize: DS.fontSize.sm, color: C.primary }}>
          {member.displayName}
        </Text>
        <RoleChip role={member.role} />
      </View>
      {canRemove && onRemove && (
        <Pressable
          onPress={() => { light(); onRemove(); }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          hitSlop={8}
          style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: `${DS.colors.error}15`,
            borderWidth: 1, borderColor: `${DS.colors.error}30`,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 14, color: DS.colors.error }}>×</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

export function MemberList({ members, showRemove, onRemove, canRemove: canRemoveProp }: Props) {
  const C = useThemeColors();
  // If canRemove is not explicitly passed, we default to false (parent controls removal via onRemove prop)
  const canRemove = canRemoveProp ?? false;

  return (
    <View style={{
      backgroundColor: C.surface,
      borderRadius: DS.radius.card,
      borderWidth: 1, borderColor: C.border,
      padding: DS.spacing.md,
    }}>
      {members.map((member) => (
        <MemberRow
          key={member.id}
          member={member}
          canRemove={canRemove}
          onRemove={onRemove ? () => { onRemove(member.projectId, member.userId); } : undefined}
        />
      ))}
      {members.length === 0 && (
        <Text style={{ fontFamily: DS.font.regular, fontSize: DS.fontSize.sm, color: C.primaryGhost, textAlign: 'center', paddingVertical: DS.spacing.md }}>
          No members yet
        </Text>
      )}
    </View>
  );
}