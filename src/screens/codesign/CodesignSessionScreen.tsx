import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Modal, Pressable, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DS } from '../../theme/designSystem';
import { useCodesignStore } from '../../stores/codesignStore';
import { useCursorBroadcast } from '../../hooks/useCursorBroadcast';
import { useCursorReceive } from '../../hooks/useCursorReceive';
import { CodesignParticipantBar } from '../../components/codesign/CodesignParticipantBar';
import { CodesignToolbar } from '../../components/codesign/CodesignToolbar';
import { ArchitectSuggestionOverlay } from '../../components/codesign/ArchitectSuggestionOverlay';
import { InHouseView } from '../../components/3d/InHouseView';
import { useBlueprintStore } from '../../stores/blueprintStore';
import type { RootStackParamList } from '../../navigation/types';
import type { Participant } from '../../stores/codesignStore';
import type { ArchitectSuggestion } from '../../services/architectModeratorService';
import { getSessionSuggestions } from '../../services/architectModeratorService';

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

type CodesignSessionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CodesignSessionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CodesignSessionScreenNavigationProp>();
  const route = useRoute();

  // sessionId from route params
  const sessionId = (route.params as { sessionId?: string })?.sessionId;

  const session = useCodesignStore((s) => s.session);
  const isConnecting = useCodesignStore((s) => s.isConnecting);
  const connectionError = useCodesignStore((s) => s.connectionError);
  const leaveSession = useCodesignStore((s) => s.actions.leaveSession);
  const blueprint = useBlueprintStore((s) => s.blueprint);

  const [participantsModal, setParticipantsModal] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [suggestions, setSuggestions] = useState<ArchitectSuggestion[]>([]);

  // Activate cursor broadcast + receive
  useCursorBroadcast();
  useCursorReceive(sessionId ?? '');

  // Sync connection state from store
  useEffect(() => {
    if (isConnecting) {
      setConnectionState('connecting');
    } else if (connectionError) {
      setConnectionState('disconnected');
    } else if (session) {
      setConnectionState('connected');
    }
  }, [isConnecting, connectionError, session]);

  // Load architect suggestions
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(() => {
      setSuggestions(getSessionSuggestions(sessionId));
    }, 2000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleEndSession = useCallback(async () => {
    await leaveSession();
    navigation.goBack();
  }, [leaveSession, navigation]);

  const handleDismissSuggestion = useCallback((_id: string) => {
    // Could call architectModeratorService to dismiss if needed
  }, []);

  const participants = session?.participants ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
      {/* 3D Viewer — full screen */}
      <View style={{ flex: 1 }}>
        <InHouseView />
      </View>

      {/* Participant bar — top, fixed */}
      <CodesignParticipantBar
        connectionState={connectionState}
        onInvite={() => {
          // Share sheet triggered inside toolbar — participant bar's invite is same action
        }}
      />

      {/* Toolbar — bottom-right floating pill */}
      <CodesignToolbar
        sessionId={sessionId}
        onEndSession={handleEndSession}
        onShowParticipants={() => setParticipantsModal(true)}
        onInvite={() => {}}
      />

      {/* Architect suggestion overlay — bottom-left */}
      <ArchitectSuggestionOverlay
        suggestions={suggestions}
        onDismiss={handleDismissSuggestion}
        onViewHistory={() => setSuggestions((prev) => prev)} // history toggle handled in overlay
      />

      {/* Participants bottom sheet (Modal) */}
      <Modal
        visible={participantsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setParticipantsModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: DS.colors.overlay }}
          onPress={() => setParticipantsModal(false)}
        >
          <Pressable
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: DS.colors.surface,
              borderTopLeftRadius: DS.radius.modal,
              borderTopRightRadius: DS.radius.modal,
              paddingBottom: insets.bottom + 16,
              maxHeight: '60%',
            }}
            onPress={() => {}} // prevent tap-through
          >
            {/* Drag handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: DS.colors.border }} />
            </View>

            <Text style={{ fontFamily: DS.font.heading, fontSize: DS.fontSize.lg, color: DS.colors.primary, textAlign: 'center', marginBottom: 16 }}>
              Participants ({participants.length})
            </Text>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
              {participants.map((p) => (
                <ParticipantRow key={p.userId} participant={p} isLocal={p.userId === session?.hostUserId} />
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Retry button for disconnected state */}
      {connectionState === 'disconnected' && (
        <Pressable
          onPress={() => setConnectionState('reconnecting')}
          style={{
            position: 'absolute',
            top: insets.top + 80,
            alignSelf: 'center',
            backgroundColor: DS.colors.error + '20',
            borderRadius: DS.radius.button,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: DS.colors.error + '50',
          }}
        >
          <Text style={{ fontFamily: DS.font.mono, fontSize: DS.fontSize.sm, color: DS.colors.error }}>
            Retry Connection
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function ParticipantRow({ participant, isLocal }: { participant: Participant; isLocal: boolean }) {
  const initials = participant.displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: DS.colors.surfaceHigh,
        borderRadius: DS.radius.card,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: DS.colors.border,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: participant.color,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Text style={{ fontFamily: DS.font.regular, fontSize: 14, color: DS.colors.background, fontWeight: '600' }}>
          {initials}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: DS.font.regular, fontSize: DS.fontSize.sm, color: DS.colors.primary }}>
          {participant.displayName}
          {isLocal && (
            <Text style={{ color: DS.colors.primaryGhost }}> (you)</Text>
          )}
        </Text>
        <Text style={{ fontFamily: DS.font.mono, fontSize: DS.fontSize.xs, color: DS.colors.primaryDim, marginTop: 2 }}>
          Last seen: {new Date(participant.lastSeen).toLocaleTimeString()}
        </Text>
      </View>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: DS.colors.success,
        }}
      />
    </View>
  );
}