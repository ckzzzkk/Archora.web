import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Keyboard, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { BASE_COLORS } from '../../theme/colors';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { LogoLoader } from '../common/LogoLoader';
import { useTierGate } from '../../hooks/useTierGate';
import { TierGate } from '../common/TierGate';

interface PromptInputProps {
  onGenerate: (prompt: string) => Promise<void>;
  onVoiceInput?: () => void;
  isGenerating?: boolean;
}

export function PromptInput({ onGenerate, onVoiceInput, isGenerating = false }: PromptInputProps) {
  const { colors } = useTheme();
  const { medium } = useHaptics();
  const [prompt, setPrompt] = useState('');
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const audioGate = useTierGate('audioInput');

  const heightAnim = useSharedValue(52);
  const containerStyle = useAnimatedStyle(() => ({ height: heightAnim.value }));

  const handleExpand = () => {
    setExpanded(true);
    heightAnim.value = withSpring(120, { damping: 20 });
    inputRef.current?.focus();
  };

  const handleCollapse = () => {
    setExpanded(false);
    heightAnim.value = withSpring(52, { damping: 20 });
    Keyboard.dismiss();
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    medium();
    handleCollapse();
    await onGenerate(prompt.trim());
    setPrompt('');
  };

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          backgroundColor: BASE_COLORS.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: expanded ? colors.primary : BASE_COLORS.border,
          overflow: 'hidden',
          marginHorizontal: 16,
          marginBottom: 8,
        },
      ]}
    >
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', padding: 8 }}>
        <TextInput
          ref={inputRef}
          value={prompt}
          onChangeText={setPrompt}
          placeholder={expanded ? 'Describe your building in detail…' : 'Generate with AI…'}
          placeholderTextColor={BASE_COLORS.textDim}
          multiline={expanded}
          onFocus={handleExpand}
          style={{
            flex: 1,
            color: BASE_COLORS.textPrimary,
            fontFamily: 'Inter_400Regular',
            fontSize: 14,
            paddingHorizontal: 8,
            paddingVertical: 4,
            textAlignVertical: expanded ? 'top' : 'center',
            alignSelf: expanded ? 'flex-start' : 'center',
            maxHeight: 80,
          }}
          returnKeyType="done"
          onSubmitEditing={handleGenerate}
        />

        {/* Voice input */}
        {onVoiceInput ? (
          <TierGate feature="audioInput">
            <TouchableOpacity
              onPress={() => { medium(); onVoiceInput(); }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: BASE_COLORS.surfaceHigh,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 6,
              }}
            >
              <Text style={{ fontSize: 16, color: audioGate.allowed ? colors.primary : BASE_COLORS.textDim }}>
                ♪
              </Text>
            </TouchableOpacity>
          </TierGate>
        ) : null}

        {/* Generate / collapse button */}
        <TouchableOpacity
          onPress={expanded ? handleGenerate : handleExpand}
          disabled={isGenerating}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isGenerating ? (
            <LogoLoader size="small" />
          ) : (
            <Text style={{ fontSize: expanded ? 14 : 16, color: BASE_COLORS.background }}>
              {expanded ? '↑' : '✦'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {expanded ? (
        <TouchableOpacity
          onPress={handleCollapse}
          style={{ position: 'absolute', top: 8, right: 8 }}
        >
          <Text style={{ color: BASE_COLORS.textDim, fontSize: 12 }}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
}
