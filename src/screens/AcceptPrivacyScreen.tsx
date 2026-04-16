import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { DS } from '../theme/designSystem';
import { ArchText } from '../components/common/ArchText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSession } from '../auth/useSession';
import { Storage } from '../utils/storage';
import type { RootStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function AcceptPrivacyScreen() {
  const navigation = useNavigation<NavProp>();
  const { isAuthenticated } = useSession();

  const handleAccept = () => {
    Storage.set('privacyPolicyAccepted', new Date().toISOString());
    if (isAuthenticated) {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    }
  };

  const handleViewPolicy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DS.colors.background }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 28 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <ArchText
            variant="heading"
            style={{
              fontSize: 28,
              fontFamily: 'ArchitectsDaughter_400Regular',
              color: DS.colors.primary,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            Privacy Policy
          </ArchText>

          <ArchText
            variant="body"
            style={{
              fontSize: 14,
              color: DS.colors.primaryGhost,
              marginBottom: 24,
              lineHeight: 22,
              textAlign: 'center',
            }}
          >
            Before you continue, please review how ASORIA handles your data.
          </ArchText>

          <View style={{ marginBottom: 24, gap: 14 }}>
            {[
              'We collect your email, room scans, and design data.',
              'AI processing is done by Anthropic (Claude).',
              'Payments are handled securely by Stripe.',
              'You can delete your data at any time.',
            ].map((item) => (
              <View key={item} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: DS.colors.success, marginTop: 7, flexShrink: 0 }} />
                <ArchText variant="body" style={{ fontSize: 14, color: DS.colors.primary, lineHeight: 20, flex: 1 }}>
                  {item}
                </ArchText>
              </View>
            ))}
          </View>

          <ArchText
            variant="caption"
            style={{
              fontSize: 12,
              color: DS.colors.primaryGhost,
              marginBottom: 28,
              lineHeight: 18,
              textAlign: 'center',
            }}
          >
            By tapping "Accept & Continue", you agree to our Privacy Policy and Terms of Service.
          </ArchText>

          <Pressable
            onPress={handleViewPolicy}
            style={{
              backgroundColor: DS.colors.surfaceHigh,
              borderRadius: 50,
              paddingVertical: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: DS.colors.border,
              marginBottom: 12,
            }}
          >
            <ArchText variant="label" style={{ fontSize: 15, color: DS.colors.primary, fontFamily: 'Inter_500Medium' }}>
              View Full Privacy Policy
            </ArchText>
          </Pressable>

          <Pressable
            onPress={handleAccept}
            style={{
              backgroundColor: DS.colors.primary,
              borderRadius: 50,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <ArchText variant="label" style={{ fontSize: 15, color: DS.colors.background, fontFamily: 'Inter_600SemiBold' }}>
              Accept & Continue
            </ArchText>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
