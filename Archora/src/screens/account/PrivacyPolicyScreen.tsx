import React from 'react';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../../components/common/ArchText';
import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';


const SECTIONS = [
  {
    title: 'Data We Collect',
    body: 'We collect your email address, display name, and profile photo when you create an account. We collect the blueprints and designs you create, along with usage data such as which features you use and how often. We collect device information for crash reporting and performance monitoring.',
  },
  {
    title: 'How We Use It',
    body: 'Your designs are used to provide the ASORIA service and, if you choose to publish them, to display them to the community. Usage data helps us improve the app. We never sell your personal data to third parties.',
  },
  {
    title: 'Third Parties',
    body: 'We use Supabase for data storage and authentication, Stripe for payment processing, and Anthropic for AI design generation. Each has their own privacy policy. AI generation requests are not stored by our AI providers beyond the immediate request.',
  },
  {
    title: 'Your Rights',
    body: 'You can export all your data at any time from Account → Privacy → Export My Data. You can delete your account and all associated data from Account → Delete Account. Data deletion is permanent and takes effect within 30 days.',
  },
  {
    title: 'Contact',
    body: 'For privacy enquiries: privacy@asoria.app\n\nRegistered address: ASORIA Ltd, United Kingdom.',
  },
];

export function PrivacyPolicyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DS.colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: DS.colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: DS.colors.border,
          }}
        >
          <ArchText variant="body" style={{ color: DS.colors.primary, fontSize: 18 }}>←</ArchText>
        </Pressable>
        <ArchText variant="body"
          style={{
            color: DS.colors.primary,
            fontSize: 24,
            fontFamily: 'ArchitectsDaughter_400Regular',
            flex: 1,
          }}
        >
          Privacy Policy
        </ArchText>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <ArchText variant="body"
          style={{
            color: DS.colors.primaryGhost,
            fontSize: 12,
            fontFamily: 'JetBrainsMono_400Regular',
            marginBottom: 24,
          }}
        >
          Last updated: 26 March 2026
        </ArchText>
        {SECTIONS.map((section) => (
          <View key={section.title} style={{ marginBottom: 28 }}>
            <ArchText variant="body"
              style={{
                color: DS.colors.primary,
                fontSize: 18,
                fontFamily: 'ArchitectsDaughter_400Regular',
                marginBottom: 8,
              }}
            >
              {section.title}
            </ArchText>
            <ArchText variant="body" style={{ color: DS.colors.primary, fontSize: 15, lineHeight: 24 }}>
              {section.body}
            </ArchText>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
