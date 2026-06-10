import React from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUIStore } from '../../stores/uiStore';
import { CompassRoseLoader } from '../common/CompassRoseLoader';
import { ArchText } from '../common/ArchText';
import { DS } from '../../theme/designSystem';
import type { RootStackParamList } from '../../navigation/types';

export function EditLimitModal() {
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.actions.closeModal);

  if (activeModal !== 'edit_limit_reached') return null;

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const secondsToMidnight = Math.floor((midnight.getTime() - now.getTime()) / 1000);
  const hours = Math.floor(secondsToMidnight / 3600);
  const mins = Math.floor((secondsToMidnight % 3600) / 60);

  return (
    <View style={{
      position: 'absolute', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      zIndex: 999,
    }}>
      <CompassRoseLoader size="large" />
      <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 24, color: DS.colors.primary, textAlign: 'center', marginTop: 24, marginBottom: 12 }}>
        Daily Editing Time Reached
      </ArchText>
      <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primaryDim, textAlign: 'center', marginBottom: 8 }}>
        Starter plan includes 45 minutes of editing per day.
      </ArchText>
      <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 13, color: DS.colors.primaryGhost, textAlign: 'center', marginBottom: 32 }}>
        Resets in {hours}h {mins}m
      </ArchText>
      <Pressable
        onPress={() => {
          closeModal();
          navigation.navigate('Subscription', { feature: 'Daily Edit Time' });
        }}
        style={{ backgroundColor: DS.colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 50, marginBottom: 16, width: '100%', alignItems: 'center' }}
      >
        <ArchText variant="body" style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: DS.colors.background }}>Upgrade Now</ArchText>
      </Pressable>
      <Pressable
        onPress={() => { closeModal(); }}
        style={{ paddingVertical: 12 }}
      >
        <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost }}>Save and Exit</ArchText>
      </Pressable>
    </View>
  );
}
