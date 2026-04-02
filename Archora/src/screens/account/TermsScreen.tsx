import React from 'react';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../../components/common/ArchText';
import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';


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
          Terms of Service
        </ArchText>
      </View>
      {/* Sticky disclaimer — OUTSIDE ScrollView */}
      <View
        style={{
          // dark red tint — no BASE_COLORS token for this specific use
          backgroundColor: '#3A1A1A',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: DS.colors.error,
          padding: 16,
          margin: 16,
          marginBottom: 0,
        }}
      >
        <ArchText variant="body"
          style={{
            color: DS.colors.error,
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 14,
          }}
        >
          IMPORTANT NOTICE
        </ArchText>
        <ArchText variant="body"
          style={{ color: DS.colors.primary, fontSize: 13, lineHeight: 20, marginTop: 8 }}
        >
          ASORIA is a creative design tool for exploration and inspiration only. Designs generated
          are NOT suitable for actual construction without review by a qualified architect or
          structural engineer. ASORIA does not provide professional architectural advice or
          services.
        </ArchText>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ padding: 20 }}>
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
          {TERMS_SECTIONS.map((section) => (
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
