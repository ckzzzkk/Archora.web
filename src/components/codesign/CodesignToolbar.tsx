import React from 'react';
import { View, Text, TouchableOpacity, Alert, Share, Platform } from 'react-native';
import { DS } from '../../theme/designSystem';

interface CodesignToolbarProps {
  onEndSession: () => void;
  onShowParticipants: () => void;
  onInvite: () => void;
  sessionId?: string;
}

/**
 * Floating oval pill toolbar — bottom-right corner.
 * Buttons: [End Session] [Participants] [Invite]
 */
export function CodesignToolbar({ onEndSession, onShowParticipants, onInvite, sessionId }: CodesignToolbarProps) {
  const handleEndSession = () => {
    Alert.alert(
      'End Session',
      'Leave this codesign session? Other participants will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: onEndSession,
        },
      ],
    );
  };

  const handleInvite = async () => {
    // If we have a sessionId, build a deep link
    const message = sessionId
      ? `Join my Asoria codesign session: asoria://codesign/${sessionId}`
      : 'Join my Asoria codesign session';

    try {
      await Share.share({
        message,
        title: 'Join Codesign Session',
      });
    } catch {
      // Silently fail — share sheet may not be available in all environments
    }
  };

  const buttonBase = {
    backgroundColor: DS.colors.surfaceHigh,
    borderRadius: DS.radius.button,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: DS.colors.border,
  };

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 32,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: DS.colors.surface + 'F5',
        borderRadius: DS.radius.oval,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: DS.colors.border,
        ...DS.shadow.medium,
      }}
    >
      {/* End Session */}
      <TouchableOpacity
        onPress={handleEndSession}
        style={{ ...buttonBase, backgroundColor: DS.colors.error + '20' }}
      >
        <Text style={{ fontFamily: DS.font.mono, fontSize: DS.fontSize.xs, color: DS.colors.error }}>
          End
        </Text>
      </TouchableOpacity>

      {/* Participants */}
      <TouchableOpacity onPress={onShowParticipants} style={buttonBase}>
        <Text style={{ fontFamily: DS.font.mono, fontSize: DS.fontSize.xs, color: DS.colors.primary }}>
          Participants
        </Text>
      </TouchableOpacity>

      {/* Invite */}
      <TouchableOpacity onPress={handleInvite} style={buttonBase}>
        <Text style={{ fontFamily: DS.font.mono, fontSize: DS.fontSize.xs, color: DS.colors.primary }}>
          Invite
        </Text>
      </TouchableOpacity>
    </View>
  );
}