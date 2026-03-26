import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BASE_COLORS } from '../../theme/colors';

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
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: BASE_COLORS.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: BASE_COLORS.border,
          }}
        >
          <Text style={{ color: BASE_COLORS.textPrimary, fontSize: 18 }}>←</Text>
        </Pressable>
        <Text
          style={{
            color: BASE_COLORS.textPrimary,
            fontSize: 24,
            fontFamily: 'ArchitectsDaughter_400Regular',
            flex: 1,
          }}
        >
          Privacy Policy
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text
          style={{
            color: BASE_COLORS.textDim,
            fontSize: 12,
            fontFamily: 'JetBrainsMono_400Regular',
            marginBottom: 24,
          }}
        >
          Last updated: 26 March 2026
        </Text>
        {SECTIONS.map((section) => (
          <View key={section.title} style={{ marginBottom: 28 }}>
            <Text
              style={{
                color: BASE_COLORS.textPrimary,
                fontSize: 18,
                fontFamily: 'ArchitectsDaughter_400Regular',
                marginBottom: 8,
              }}
            >
              {section.title}
            </Text>
            <Text style={{ color: BASE_COLORS.textPrimary, fontSize: 15, lineHeight: 24 }}>
              {section.body}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
