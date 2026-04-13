import { DS } from '../../theme/designSystem';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { aiService } from '../../services/aiService';

interface Props {
  onClose: () => void;
}

export function AIAssistantSheet({ onClose }: Props) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const chatHistory = useBlueprintStore((s) => s.blueprint?.chatHistory ?? []);
  const loadBlueprint = useBlueprintStore((s) => s.actions.loadBlueprint);
  const addChatMessage = useBlueprintStore((s) => s.actions.addChatMessage);
  const scrollRef = useRef<ScrollView>(null);

  // Scroll to bottom when chat history grows
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [chatHistory.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    addChatMessage({ id: `user-${Date.now()}`, role: 'user', content: userMessage, timestamp: new Date().toISOString() });
    setIsLoading(true);
    try {
      let response = '';
      const result = await aiService.editBlueprint({ prompt: userMessage, blueprint: blueprint! });
      if (result?.blueprint) {
        loadBlueprint(result.blueprint);
        response = result.message ?? 'Blueprint updated successfully.';
      } else if (result?.message) {
        response = result.message;
      }
      addChatMessage({ id: `assistant-${Date.now()}`, role: 'assistant', content: response, timestamp: new Date().toISOString() });
    } catch {
      addChatMessage({ id: `assistant-${Date.now()}`, role: 'assistant', content: 'I had a moment there — let\'s try that again. Sometimes a different wording helps.', timestamp: new Date().toISOString() });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: DS.colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: DS.colors.border,
        maxHeight: '60%',
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: DS.colors.border,
        }}
      >
        <Text
          style={{
            color: DS.colors.primary,
            fontSize: 16,
            fontFamily: 'ArchitectsDaughter_400Regular',
          }}
        >
          ARIA — Your Architect
        </Text>
        <Pressable onPress={onClose} style={{ padding: 8 }}>
          <Text style={{ color: DS.colors.primary, fontSize: 18 }}>✕</Text>
        </Pressable>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, padding: 16 }}
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        {chatHistory.length === 0 && (
          <Text
            style={{
              color: DS.colors.primaryGhost,
              fontSize: 14,
              textAlign: 'center',
              marginTop: 24,
              fontStyle: 'italic',
            }}
          >
            Hi, I'm ARIA. I've been designing homes for 20 years. Tell me what you'd like to change — maybe it's a room that feels too small, a kitchen you'd like to open up, or a corner of the house that's never quite worked. I'm here to help it feel right.
          </Text>
        )}
        {chatHistory.map((msg: { role: string; content: string }, i: number) => (
          <View
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.role === 'user' ? DS.colors.border : DS.colors.surfaceHigh,
              borderRadius: 16,
              padding: 12,
              marginBottom: 8,
              maxWidth: '80%',
            }}
          >
            <Text style={{ color: DS.colors.primary, fontSize: 14 }}>{msg.content}</Text>
          </View>
        ))}
        {isLoading && (
          <Text style={{ color: DS.colors.primaryGhost, fontSize: 13, marginBottom: 8, fontStyle: 'italic' }}>
            Let me think about that...
          </Text>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingTop: 12,
            paddingBottom: Math.max(12, insets.bottom + 8),
            gap: 8,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              backgroundColor: DS.colors.border,
              borderRadius: 50,
              paddingHorizontal: 16,
              paddingVertical: 10,
              color: DS.colors.primary,
              fontSize: 14,
            }}
            placeholder="Open up the kitchen, add a window seat..."
            placeholderTextColor={DS.colors.primaryGhost}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Pressable
            onPress={handleSend}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: input.trim() ? DS.colors.primary : DS.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: input.trim() ? DS.colors.background : DS.colors.primaryGhost,
                fontSize: 16,
              }}
            >
              ↑
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
