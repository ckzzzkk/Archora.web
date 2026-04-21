import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DS } from '../../theme/designSystem';
import { useCodesignStore } from '../../stores/codesignStore';
import { useSession } from '../../auth/useSession';
import { CompassRoseLoader } from '../common/CompassRoseLoader';
import type { Participant } from '../../stores/codesignStore';

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

interface AvatarProps {
  participant: Participant;
  size?: number;
}

function Avatar({ participant, size = 32 }: AvatarProps) {
  const initials = participant.displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: participant.color,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: DS.colors.border,
      }}
    >
      {participant.avatarUrl ? (
        <View style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2, backgroundColor: DS.colors.surfaceHigh }} />
      ) : (
        <Text
          style={{
            fontFamily: DS.font.regular,
            fontSize: size * 0.38,
            color: DS.colors.background,
            fontWeight: '600',
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

interface ParticipantBarProps {
  connectionState: ConnectionState;
  onInvite?: () => void;
}

export function CodesignParticipantBar({ connectionState, onInvite }: ParticipantBarProps) {
  const insets = useSafeAreaInsets();
  const session = useCodesignStore((s) => s.session);
  const { user } = useSession();

  const participants = session?.participants ?? [];

  // Most recently active non-local user
  const mostRecent = useMemo(() => {
    return participants
      .filter((p) => p.userId !== user?.id)
      .sort((a, b) => b.lastSeen - a.lastSeen)[0];
  }, [participants, user?.id]);

  const visible = participants.slice(0, 4);
  const extra = Math.max(0, participants.length - 4);

  const statusDot = useMemo(() => {
    switch (connectionState) {
      case 'connected':
        return { color: DS.colors.success, label: null };
      case 'connecting':
        return { color: DS.colors.accent, label: 'Connecting…' };
      case 'reconnecting':
        return { color: DS.colors.warning, label: 'Reconnecting…' };
      case 'disconnected':
        return { color: DS.colors.error, label: 'Connection lost' };
    }
  }, [connectionState]);

  return (
    <View
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: DS.colors.surface + 'CC',
        borderRadius: DS.radius.card,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: DS.colors.border,
        zIndex: 100,
      }}
    >
      {/* Connection status dot */}
      <View style={{ marginRight: 10 }}>
        {connectionState === 'connecting' ? (
          <CompassRoseLoader size="small" />
        ) : (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: statusDot.color,
            }}
          />
        )}
      </View>

      {/* Avatar stack */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {visible.map((p, i) => (
          <View key={p.userId} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: visible.length - i }}>
            <Avatar participant={p} size={28} />
          </View>
        ))}
        {extra > 0 && (
          <View
            style={{
              marginLeft: -8,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: DS.colors.surfaceHigh,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: DS.colors.border,
            }}
          >
            <Text style={{ fontFamily: DS.font.mono, fontSize: 10, color: DS.colors.primaryDim }}>
              +{extra}
            </Text>
          </View>
        )}
      </View>

      {/* Active editing label */}
      {mostRecent && connectionState === 'connected' && (
        <Text
          style={{
            flex: 1,
            marginLeft: 10,
            fontFamily: DS.font.regular,
            fontSize: DS.fontSize.xs,
            color: DS.colors.primaryDim,
          }}
          numberOfLines={1}
        >
          {mostRecent.displayName.split(' ')[0]} is editing…
        </Text>
      )}

      {/* Reconnecting / disconnected text */}
      {statusDot.label && (
        <Text
          style={{
            flex: 1,
            marginLeft: 10,
            fontFamily: DS.font.regular,
            fontSize: DS.fontSize.xs,
            color: statusDot.color,
          }}
          numberOfLines={1}
        >
          {statusDot.label}
        </Text>
      )}

      {/* Invite button */}
      {onInvite && (
        <TouchableOpacity
          onPress={onInvite}
          style={{
            backgroundColor: DS.colors.surfaceHigh,
            borderRadius: DS.radius.chip,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: DS.colors.border,
            marginLeft: 8,
          }}
        >
          <Text style={{ fontFamily: DS.font.mono, fontSize: DS.fontSize.xs, color: DS.colors.primary }}>
            Invite
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}