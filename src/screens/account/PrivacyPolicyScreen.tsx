import React from 'react';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../../components/common/ArchText';
import { View, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../stores/authStore';
import { Storage } from '../../utils/storage';
import type { RootStackParamList } from '../../navigation/types';

const PRIVACY_POLICY_SECTIONS = [
  {
    id: 'summary',
    title: 'SUMMARY OF KEY POINTS',
    content: `This Privacy Notice describes how Crokora ("we", "us", or "our") processes personal information when you use ASORIA. We collect information you provide directly, data from room scans and AI interactions, and certain technical information automatically. Sensitive information such as financial data, biometric data, photos, spatial data, and AI prompt history may be collected when necessary with consent. We share data with AI providers (Anthropic), payment processors (Stripe), authentication providers (Google), and AR technology providers (Google ARCore). We retain personal information for 3 months after account termination, unless a longer period is required by law. You have rights to access, correct, delete, and port your data depending on your location. Contact: crokora.official@gmail.com`,
  },
  {
    id: 'infocollect',
    title: '1. WHAT INFORMATION DO WE COLLECT?',
    content: `Personal Information You Disclose to Us:
- Debit/credit card numbers, billing addresses
- Passwords, usernames, email addresses, phone numbers, names
- Payment information, device info, crash logs, analytics
- Account info, room scan data, spatial/depth maps
- Photos uploaded for AI analysis

Sensitive Information (with consent):
- Financial data, biometric data, photos, spatial data
- AI interactive history, device identifiers
- Crash logs/diagnostics, AI prompt history

Payment Data: All payment data is handled securely by Stripe in accordance with PCI DSS compliance standards. ASORIA does not directly collect, store, or process payment card information. Stripe receives only payment status, subscription tier, and transaction history necessary to manage your account access.

Mobile Device Access: We may request access to camera, sensors, storage, microphone, and other features. You may change permissions in your device settings.

Mobile Device Data: We automatically collect device ID, model, manufacturer, operating system, IP address, and information about your mobile network.

Push Notifications: We may send push notifications for account-related updates. You may opt out in your device settings.`,
  },
  {
    id: 'infouse',
    title: '2. HOW DO WE PROCESS YOUR INFORMATION?',
    content: `We process personal information for:
- Account creation and authentication
- Delivering and facilitating services to users
- Responding to inquiries and providing support
- Sending administrative information
- Fulfilling and managing orders and payments
- Requesting feedback
- Protecting services from fraud and abuse
- Identifying usage trends
- Saving or protecting vital interests

AI Architectural Design Processing: We process user-submitted room scans and photos through an AI system to generate personalised architectural blueprints and design recommendations.

Third-Party Authentication: We use Google OAuth to verify user identity and provide secure access to the app.

Blueprint and Design History Storage: We store user-generated blueprints, room scans, and design history so users can access, edit, and retrieve their work across sessions.

AR Device Compatibility Verification: We collect device information to verify compatibility with augmented reality features powered by ARCore before enabling room scanning functionality.

We collect crash logs and diagnostic data to identify and resolve technical issues.

We analyse how users interact with room scanning modes and AI generation features.

We monitor and rate limit AI generation requests using session and device data.`,
  },
  {
    id: 'legalbases',
    title: '3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?',
    content: `For users in the EU/UK (GDPR): We process personal information based on:
- Consent: When you give us permission for a specific purpose
- Performance of Contract: When necessary to fulfil our contractual obligations
- Legitimate Interests: When reasonably necessary for our business interests, provided they do not outweigh your rights (e.g., analysing service usage, diagnosing fraud, improving user experience, maintaining app stability, protecting AI infrastructure from abuse)
- Legal Obligations: When necessary to comply with laws
- Vital Interests: When necessary to protect your safety

For users in Canada: We process with express or implied consent, or without consent in exceptional circumstances (e.g., fraud detection, business transactions, legal compliance).`,
  },
  {
    id: 'whoshare',
    title: '4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?',
    content: `We share personal information with:
- AI Service Providers: Anthropic (AI design generation)
- Invoice and Billing: Stripe (payment processing)
- User Authentication: Google Sign-In
- Web and Mobile Analytics: Expo
- Website Performance Monitoring: Expo and EAS
- Website Testing: Google Play Console and TestFlight
- Augmented Reality Processing: Google ARCore

We may also share information in connection with business transfers, mergers, or acquisitions.`,
  },
  {
    id: 'ai',
    title: '5. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?',
    content: `Yes. ASORIA offers AI-powered features including image analysis, personalisation, and content generation. These are powered by Anthropic's Claude AI platform. Your input, output, and personal information will be shared with and processed by these AI service providers. To opt out, you can update your account settings, contact us, or delete your account.`,
  },
  {
    id: 'sociallogins',
    title: '6. HOW DO WE HANDLE YOUR SOCIAL LOGINS?',
    content: `If you register using a social media account (e.g., Google), we receive profile information including name, email, friends list, and profile picture. We use this only for purposes described in this Privacy Notice. Please review the social media provider's privacy policy for how they handle your data.`,
  },
  {
    id: 'inforetain',
    title: '7. HOW LONG DO WE KEEP YOUR INFORMATION?',
    content: `We retain personal information for 3 months past the termination of your account, unless a longer retention period is required by law. When we have no ongoing legitimate business need, we will delete or anonymise your information. If deletion is not possible, we will securely store and isolate it until deletion is possible.`,
  },
  {
    id: 'infosafe',
    title: '8. HOW DO WE KEEP YOUR INFORMATION SAFE?',
    content: `We implement appropriate technical and organisational security measures to protect your information. However, no electronic transmission over the Internet or information storage technology can be guaranteed 100% secure. We cannot guarantee that hackers or cybercriminals will not defeat our security measures. You access our services within a secure environment at your own risk.`,
  },
  {
    id: 'privacyrights',
    title: '9. WHAT ARE YOUR PRIVACY RIGHTS?',
    content: `Depending on your location, you may have rights to:
- Access and obtain a copy of your personal information
- Request rectification or erasure
- Restrict processing
- Data portability
- Object to automated decision-making
- Withdraw consent at any time

To exercise these rights, contact us at crokora.official@gmail.com or submit a data subject access request.

Users in the EEA/UK may also complain to their data protection authority.
Users in Switzerland may contact the Federal Data Protection Commissioner.`,
  },
  {
    id: 'DNT',
    title: '10. CONTROLS FOR DO-NOT-TRACK FEATURES',
    content: `Most web browsers include a Do-Not-Track (DNT) feature. We do not currently respond to DNT signals. If a standard for online tracking is adopted that we must follow, we will inform you in a revised Privacy Notice. California law requires us to disclose our response to web browser DNT signals.`,
  },
  {
    id: 'uslaws',
    title: '11. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?',
    content: `If you are a resident of California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Maryland, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Rhode Island, Tennessee, Texas, Utah, or Virginia, you may have rights to request access to and receive details about the personal information we maintain about you. You may also have the right to correct inaccuracies, get a copy of, or delete your personal information. These rights may be limited in some circumstances. Contact: crokora.official@gmail.com`,
  },
  {
    id: 'otherlaws',
    title: '12. DO OTHER REGIONS HAVE SPECIFIC PRIVACY RIGHTS?',
    content: `Australia and New Zealand: We collect and process personal information under Australia's Privacy Act 1988 and New Zealand's Privacy Act 2020. You have the right to request access to or correction of your personal information.

Republic of South Africa: You have the right to request access to or correction of your personal information. Complaints may be submitted to the Information Regulator at enquiries@inforegulator.org.za.`,
  },
  {
    id: 'clausea',
    title: '13. AUGMENTED REALITY AND SPATIAL DATA',
    content: `When you use ASORIA's room scanning features, your device's camera and depth sensors capture spatial data including room dimensions, layout, and physical characteristics of your private space. This spatial data is processed locally on your device via Google ARCore and may be transmitted to our secure servers for blueprint generation. Raw spatial data is not shared with third parties except as necessary to deliver our AI design services. You may delete your room scans at any time through your account settings.`,
  },
  {
    id: 'clauseb',
    title: '14. ARTIFICIAL INTELLIGENCE PROCESSING',
    content: `ASORIA uses Anthropic's Claude AI platform to analyse room photos and generate architectural designs. When you submit photos or descriptions for AI processing, this content is transmitted to Anthropic's servers for analysis. Anthropic processes this data in accordance with their privacy policy. AI-generated outputs are stored in your account and can be deleted at any time. ASORIA does not use your content to train AI models.`,
  },
  {
    id: 'clausec',
    title: "15. CHILDREN'S PRIVACY",
    content: `ASORIA is not directed at or intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us at privacy@asoria.app and we will delete it immediately.`,
  },
  {
    id: 'policyupdates',
    title: '16. DO WE MAKE UPDATES TO THIS NOTICE?',
    content: `Yes, we may update this Privacy Notice from time to time. The updated version will be indicated by a revised date. If we make material changes, we may notify you by posting a notice or sending a notification. We encourage you to review this Privacy Notice frequently.`,
  },
  {
    id: 'contact',
    title: '17. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?',
    content: `Email: crokora.official@gmail.com

Registered Address:
Crokora
Cairo
Lusaka, 10110
Zambia`,
  },
  {
    id: 'request',
    title: '18. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?',
    content: `You have the right to access the personal information we collect from you, correct inaccuracies, or delete your personal information. You may also withdraw consent to our processing. These rights may be limited in some circumstances by applicable law.

To request to review, update, or delete your personal information, please submit a data subject access request at: https://app.termly.io/dsar/f41bfd0e-100d-48ed-89d5-ca88c0d7b43e`,
  },
];

export function PrivacyPolicyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleAccept = () => {
    Storage.set('privacyPolicyAccepted', new Date().toISOString());
    if (isAuthenticated) {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    }
  };

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
        <ArchText
          variant="body"
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <ArchText
          variant="body"
          style={{
            color: DS.colors.primaryGhost,
            fontSize: 12,
            fontFamily: 'JetBrainsMono_400Regular',
            marginBottom: 24,
          }}
        >
          Last updated: April 13, 2026
        </ArchText>

        {PRIVACY_POLICY_SECTIONS.map((section) => (
          <View key={section.id} style={{ marginBottom: 28 }}>
            <ArchText
              variant="body"
              style={{
                color: DS.colors.primary,
                fontSize: 16,
                fontFamily: 'ArchitectsDaughter_400Regular',
                marginBottom: 8,
              }}
            >
              {section.title}
            </ArchText>
            <ArchText
              variant="body"
              style={{
                color: DS.colors.primary,
                fontSize: 14,
                lineHeight: 22,
              }}
            >
              {section.content}
            </ArchText>
          </View>
        ))}

        <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: DS.colors.border }}>
          <Pressable
            onPress={handleAccept}
            style={{
              backgroundColor: DS.colors.primary,
              borderRadius: 50,
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <ArchText variant="label" style={{ fontSize: 15, color: DS.colors.background, fontFamily: 'Inter_600SemiBold' }}>
              Accept & Continue
            </ArchText>
          </Pressable>
        </View>

        <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: DS.colors.border }}>
          <ArchText
            variant="body"
            style={{
              color: DS.colors.primaryGhost,
              fontSize: 12,
              fontFamily: 'JetBrainsMono_400Regular',
              textAlign: 'center',
            }}
          >
            This Privacy Policy was generated using Termly's Privacy Policy Generator.
          </ArchText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
