import { DS } from '../../theme/designSystem';
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
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { CompassRoseLoader } from '../common/CompassRoseLoader';
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
          backgroundColor: DS.colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: expanded ? colors.primary : DS.colors.border,
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
          placeholderTextColor={DS.colors.primaryGhost}
          multiline={expanded}
          onFocus={handleExpand}
          style={{
            flex: 1,
            color: DS.colors.primary,
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
                backgroundColor: DS.colors.surfaceHigh,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 6,
              }}
            >
              <Text style={{ fontSize: 16, color: audioGate.allowed ? colors.primary : DS.colors.primaryGhost }}>
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
            <CompassRoseLoader size="small" />
          ) : (
            <Text style={{ fontSize: expanded ? 14 : 16, color: DS.colors.background }}>
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
          <Text style={{ color: DS.colors.primaryGhost, fontSize: 12 }}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
}
