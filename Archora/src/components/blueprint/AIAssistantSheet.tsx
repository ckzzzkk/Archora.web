import { DS } from '../../theme/designSystem';
import React, { useState, useRef } from 'react';
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

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistantSheet({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const loadBlueprint = useBlueprintStore((s) => s.actions.loadBlueprint);
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    try {
      let response = 'I understand your request. Blueprint editing via AI chat is being set up.';
      const result = await aiService.editBlueprint({ prompt: userMessage, blueprint: blueprint! });
      if (result?.blueprint) {
        loadBlueprint(result.blueprint);
        response = result.message ?? 'Blueprint updated successfully.';
      } else if (result?.message) {
        response = result.message;
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
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
          AI Design Assistant
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
        {messages.length === 0 && (
          <Text
            style={{
              color: DS.colors.primaryGhost,
              fontSize: 14,
              textAlign: 'center',
              marginTop: 24,
            }}
          >
            Ask me to change anything about your design...
          </Text>
        )}
        {messages.map((msg, i) => (
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
          <Text style={{ color: DS.colors.primaryGhost, fontSize: 13, marginBottom: 8 }}>
            Thinking...
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
            placeholder="Add a pool to the garden..."
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
