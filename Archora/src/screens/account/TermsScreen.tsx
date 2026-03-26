import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BASE_COLORS } from '../../theme/colors';

const TERMS_SECTIONS = [
  {
    title: 'Acceptable Use',
    body: "ASORIA may only be used for lawful purposes. You may not use the platform to generate designs that violate building regulations in ways intended to deceive, to infringe on others' intellectual property, or for any commercial activity that misrepresents ASORIA as a licensed architectural service.",
  },
  {
    title: 'Subscriptions',
    body: 'Subscription fees are billed in advance on a monthly or annual basis. Cancellation takes effect at the end of the current billing period. Refunds are available within 7 days of annual plan purchase. Monthly plans are non-refundable.',
  },
  {
    title: 'Intellectual Property',
    body: 'You own the designs you create. By publishing to the community, you grant ASORIA a non-exclusive licence to display your designs. AI-generated designs are your property — ASORIA claims no ownership over your creative output.',
  },
  {
    title: 'Limitation of Liability',
    body: 'ASORIA is provided "as is". We are not liable for decisions made based on generated designs. To the maximum extent permitted by law, our total liability is limited to the subscription fees you paid in the 12 months prior to any claim.',
  },
];

export function TermsScreen() {
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
          Terms of Service
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Sticky disclaimer */}
        <View
          style={{
            // dark red tint — no BASE_COLORS token for this specific use
            backgroundColor: '#3A1A1A',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: BASE_COLORS.error,
            padding: 16,
            margin: 16,
            marginBottom: 0,
          }}
        >
          <Text
            style={{
              color: BASE_COLORS.error,
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 14,
            }}
          >
            IMPORTANT NOTICE
          </Text>
          <Text
            style={{ color: BASE_COLORS.textPrimary, fontSize: 13, lineHeight: 20, marginTop: 8 }}
          >
            ASORIA is a creative design tool for exploration and inspiration only. Designs generated
            are NOT suitable for actual construction without review by a qualified architect or
            structural engineer. ASORIA does not provide professional architectural advice or
            services.
          </Text>
        </View>
        <View style={{ padding: 20 }}>
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
          {TERMS_SECTIONS.map((section) => (
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
