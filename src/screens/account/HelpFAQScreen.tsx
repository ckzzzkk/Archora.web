import React, { useState } from 'react';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../../components/common/ArchText';
import { View, Pressable, ScrollView, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';


const FAQ_SECTIONS = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I create my first blueprint?',
        a: 'Tap the compass rose FAB button in the tab bar, then follow the 7-step interview to describe your ideal space. Our AI will generate a complete blueprint in about 30 seconds.',
      },
      {
        q: 'What is the difference between tiers?',
        a: 'Starter is free and includes 3 projects, 10 AI generations/month, and 3 design styles. Creator unlocks 25 projects, 200 AI generations, all 12 styles, AR furniture placement, and community publishing. Pro adds AR room scanning, texture generation, and furniture from photos. Architect gives you unlimited everything plus CAD export and team collaboration.',
      },
    ],
  },
  {
    category: 'Design Studio',
    questions: [
      {
        q: 'How do I add furniture?',
        a: 'In the Design Studio, tap the furniture icon in the toolbar to open the Furniture Library. Browse by category — Living, Bedroom, Kitchen, Bathroom, Office, Outdoor, or Decor — then drag items onto the canvas.',
      },
      {
        q: 'Can I edit the AI-generated blueprint?',
        a: 'Yes! Every wall, room, door, and window can be moved, resized, or deleted. Use the AI assistant button to make changes by voice or text.',
      },
      {
        q: 'How do I export my blueprint?',
        a: 'In 2D view, tap the Export button in the toolbar. Your blueprint will be saved to your photo library as a PNG image.',
      },
    ],
  },
  {
    category: 'Subscriptions',
    questions: [
      {
        q: 'Can I cancel anytime?',
        a: 'Yes. All subscription management is on our website. Visit asoria.app/account to cancel or change your plan. Your access continues until the end of the billing period.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'We offer a 7-day refund on annual plans. Monthly plans are non-refundable but you can cancel immediately. Contact support@asoria.app.',
      },
    ],
  },
  {
    category: 'Technical',
    questions: [
      {
        q: 'Why is AI generation slow?',
        a: 'Complex designs with many rooms and detailed specifications take 20–60 seconds. Try a simpler description for faster results. Make sure you have a stable internet connection.',
      },
      {
        q: 'The 3D view is not loading',
        a: 'The 3D renderer requires a GPU-capable device. Force quit and reopen the app. If the issue persists, use 2D view which works on all devices.',
      },
    ],
  },
];

export function HelpFAQScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const filteredSections = FAQ_SECTIONS.map((section) => ({
    ...section,
    questions: section.questions.filter(
      (q) =>
        !search ||
        q.q.toLowerCase().includes(search.toLowerCase()) ||
        q.a.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((s) => s.questions.length > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DS.colors.background }}>
      {/* Header */}
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
          Help & FAQ
        </ArchText>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <TextInput
          style={{
            backgroundColor: DS.colors.surface,
            borderRadius: 50,
            paddingHorizontal: 20,
            paddingVertical: 12,
            color: DS.colors.primary,
            borderWidth: 1,
            borderColor: DS.colors.border,
          }}
          placeholder="Search questions..."
          placeholderTextColor={DS.colors.primaryGhost}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* FAQ list */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {filteredSections.map((section) => (
          <View key={section.category} style={{ marginBottom: 24 }}>
            <View
              style={{
                backgroundColor: DS.colors.surface,
                borderRadius: 50,
                alignSelf: 'flex-start',
                paddingHorizontal: 16,
                paddingVertical: 6,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: DS.colors.border,
              }}
            >
              <ArchText variant="body" style={{ color: DS.colors.primary, fontSize: 13, fontWeight: '600' }}>
                {section.category}
              </ArchText>
            </View>
            {section.questions.map((item) => (
              <Pressable
                key={item.q}
                onPress={() =>
                  setExpandedQuestion(
                    expandedQuestion === item.q
                      ? null
                      : item.q,
                  )
                }
                style={{
                  backgroundColor: DS.colors.surface,
                  borderRadius: 50,
                  padding: 16,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: DS.colors.border,
                }}
              >
                <ArchText variant="body" style={{ color: DS.colors.primary, fontSize: 15, fontWeight: '500' }}>
                  {item.q}
                </ArchText>
                {expandedQuestion === item.q && (
                  <ArchText variant="body"
                    style={{
                      color: DS.colors.primaryDim,
                      fontSize: 14,
                      lineHeight: 22,
                      marginTop: 8,
                    }}
                  >
                    {item.a}
                  </ArchText>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Contact support */}
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: DS.colors.border }}>
        <Pressable
          onPress={() => { void Linking.openURL('mailto:support@asoria.app'); }}
          style={{
            backgroundColor: DS.colors.surface,
            borderRadius: 50,
            paddingVertical: 14,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: DS.colors.border,
          }}
        >
          <ArchText variant="body" style={{ color: DS.colors.primary, fontSize: 15 }}>Contact Support</ArchText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
