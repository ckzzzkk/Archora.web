# Generation Chat Hybrid — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build the Lovable-style AI chat interface for home design generation — architect chips, style chips, voice input, inline review card, and 6 new design styles.

**Architecture:** `mode: 'chat' | 'wizard'` state machine in GenerationScreen. Chat mode: full conversational UI with always-visible architect/style chip rows, voice-to-text input, and inline review card. Wizard mode: existing 7-step fallback. New `ai-chat-generate` Edge Function handles turn-by-turn AI with architect/style injection and structured data extraction.

**Tech Stack:** TypeScript, React Native, Reanimated 3, NativeWind (no StyleSheet.create), Supabase Edge Functions (Deno), expo-av (voice)

---

## File Map

### New files
| File | Purpose |
|------|---------|
| `src/components/generation/ArchitectChipRow.tsx` | Horizontal scrollable architect chips with locked/selected states |
| `src/components/generation/StyleChipRow.tsx` | Horizontal scrollable style chips (22 styles) with locked/selected states |
| `src/components/generation/ChatBubble.tsx` | Animated user/AI chat bubble with spring entrance |
| `src/components/generation/VoiceInputBar.tsx` | Record → transcribe → edit → send voice input bar |
| `src/components/generation/ReviewCard.tsx` | Inline editable generation summary card |
| `src/types/chat.ts` | `ChatMessage` type, `GenerationChatState` interface |
| `src/services/generationChatService.ts` | `sendChatMessage()`, `transcribeAudio()` service layer |
| `supabase/functions/ai-chat-generate/index.ts` | Edge Function for chat-turn AI with architect/style injection |

### Modify files
| File | Change |
|------|--------|
| `src/data/designStyles.ts` | Add 6 new styles (Italian, Brutalist, Alien, Art Nouveau, Biophilic, Parametric) |
| `src/screens/generation/GenerationScreen.tsx` | Add `mode: 'chat'\|'wizard'` state machine, integrate all new components |
| `src/hooks/useGenerationPreferences.ts` | Add chat state: `chatHistory`, `selectedArchitectId`, `selectedStyleId`, `generationData` |
| `src/services/aiService.ts` | Add `sendChatMessage()` and `transcribeAudio()` methods |
| `src/theme/designSystem.ts` | Add glass morphism tokens: `surfaceGlass`, `blurHeavy` |
| `supabase/functions/ai-generate/index.ts` | Already handles `architectId` — confirm injection works |

---

## Task 1: Add 6 New Design Styles

**Files:**
- Modify: `src/data/designStyles.ts`

Add 6 new styles to `DESIGN_STYLES` array (before the closing bracket). Each style follows the existing `DesignStyle` interface:

```typescript
{
  id: 'italian',
  name: 'Italian',
  description: 'Arched colonnades, warm terracotta tones, indoor-outdoor flow',
  emoji: '🇮🇹',
  primaryColor: '#C0714F',
  secondaryColor: '#A85C3C',
  accentColor: '#D4A574',
  wallColors: ['#C0714F', '#D4A574', '#F5E6D3', '#8B5A3C'],
  floorColors: ['#D4A574', '#C4A484', '#8B7355', '#A0896C'],
  furnitureVariant: 'classic' as FurnitureVariantPreset,
  furnitureModelVariant: 'classic' as FurnitureModelVariant,
  availableTiers: ['starter', 'creator', 'pro', 'architect'],
},
{
  id: 'brutalist',
  name: 'Brutalist',
  description: 'Raw concrete, bold masses, honest materials',
  emoji: '🔨',
  primaryColor: '#6A6A6A',
  secondaryColor: '#4A4A4A',
  accentColor: '#8A8A8A',
  wallColors: ['#6A6A6A', '#5A5A5A', '#7A7A7A', '#4A4A4A'],
  floorColors: ['#5A5A5A', '#4A4A4A', '#6A6A6A', '#3A3A3A'],
  furnitureVariant: 'industrial' as FurnitureVariantPreset,
  furnitureModelVariant: 'minimal' as FurnitureModelVariant,
  availableTiers: ['starter', 'creator', 'pro', 'architect'],
},
{
  id: 'alien',
  name: 'Alien',
  description: 'Organic curved pods, glowing surfaces, sci-fi aesthetics',
  emoji: '👽',
  primaryColor: '#4A8A6A',
  secondaryColor: '#3A7A5A',
  accentColor: '#6AAA8A',
  wallColors: ['#4A8A6A', '#3A7A5A', '#5A9A7A', '#2A6A4A'],
  floorColors: ['#3A7A5A', '#2A6A4A', '#4A8A6A', '#1A5A3A'],
  furnitureVariant: 'organic' as FurnitureVariantPreset,
  furnitureModelVariant: 'organic' as FurnitureModelVariant,
  availableTiers: ['starter', 'creator', 'pro', 'architect'],
},
{
  id: 'art_nouveau',
  name: 'Art Nouveau',
  description: 'Flowing organic curves, wrought iron, stained glass',
  emoji: '🌿',
  primaryColor: '#7A5A3A',
  secondaryColor: '#6A4A2A',
  accentColor: '#9A7A5A',
  wallColors: ['#7A5A3A', '#D4C4A8', '#8B7355', '#C9B896'],
  floorColors: ['#8B7355', '#6A5A4A', '#7A6A5A', '#5A4A3A'],
  furnitureVariant: 'classic' as FurnitureVariantPreset,
  furnitureModelVariant: 'ornate' as FurnitureModelVariant,
  availableTiers: ['starter', 'creator', 'pro', 'architect'],
},
{
  id: 'biophilic',
  name: 'Biophilic',
  description: 'Living walls, natural light, indoor trees and planters',
  emoji: '🌳',
  primaryColor: '#4A7A3A',
  secondaryColor: '#3A6A2A',
  accentColor: '#6A9A5A',
  wallColors: ['#4A7A3A', '#6A9A5A', '#D4E8C4', '#2A5A1A'],
  floorColors: ['#6A9A5A', '#4A8A4A', '#8AAA6A', '#5A7A4A'],
  furnitureVariant: 'natural' as FurnitureVariantPreset,
  furnitureModelVariant: 'natural' as FurnitureModelVariant,
  availableTiers: ['starter', 'creator', 'pro', 'architect'],
},
{
  id: 'parametric',
  name: 'Parametric',
  description: 'Algorithmic curves, dynamic surfaces, futuristic forms',
  emoji: '⚡',
  primaryColor: '#3A5A7A',
  secondaryColor: '#2A4A6A',
  accentColor: '#5A7A9A',
  wallColors: ['#3A5A7A', '#5A7A9A', '#2A3A5A', '#4A6A8A'],
  floorColors: ['#4A6A8A', '#3A5A7A', '#2A4A6A', '#5A7A9A'],
  furnitureVariant: 'minimal' as FurnitureVariantPreset,
  furnitureModelVariant: 'geometric' as FurnitureModelVariant,
  availableTiers: ['starter', 'creator', 'pro', 'architect'],
},
```

Also update `STARTER_STYLES` to remain `['minimalist', 'modern', 'rustic']` — no change needed since new styles are for all tiers but selection-locked (Starter can view all but picks from only their 3 starter styles).

Verify TypeScript: run `npx tsc --noEmit` — no errors.

---

## Task 2: Create `src/types/chat.ts`

**Files:**
- Create: `src/types/chat.ts`

```typescript
export type ChatRole = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  suggestions?: string[]; // optional tappable suggestions
}

export interface GenerationChatState {
  mode: 'chat' | 'wizard';
  chatHistory: ChatMessage[];
  selectedArchitectId: string | null;
  selectedStyleId: string | null;
  generationData: Partial<GenerationPayload>;
  isTranscribing: boolean;
  transcriptText: string | null;
  isReviewVisible: boolean;
}

export interface ChatResponse {
  message: string;
  extractedData: Partial<GenerationPayload>;
  shouldShowReview: boolean;
  isComplete: boolean;
}
```

---

## Task 3: Create `src/services/generationChatService.ts`

**Files:**
- Create: `src/services/generationChatService.ts`

```typescript
import { supabase } from '../utils/supabaseClient';
import type { ChatMessage, ChatResponse, GenerationPayload } from '../types/chat';

export const generationChatService = {
  async sendMessage(
    messages: ChatMessage[],
    architectId?: string,
    styleId?: string,
    currentData?: Partial<GenerationPayload>
  ): Promise<ChatResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({ messages, architectId, styleId, currentData })
    });

    if (!response.ok) throw new Error('Chat generation failed');
    return response.json();
  },

  async transcribeAudio(audioUri: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a'
    } as any);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: formData
    });

    if (!response.ok) throw new Error('Transcription failed');
    const result = await response.json();
    return result.text;
  }
};
```

---

## Task 4: Create `src/components/generation/ArchitectChipRow.tsx`

**Files:**
- Create: `src/components/generation/ArchitectChipRow.tsx`

Component: horizontal ScrollView of 12 architect chips with locked/selected states.

```typescript
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTierGate } from '../../hooks/useTierGate';
import { getArchitectById } from '../../data/architectProfiles';
import { DS } from '../../theme/designSystem';

interface ArchitectChipRowProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ARCHITECT_CHIPS = [
  { id: 'frank-lloyd-wright', emoji: '🏠', name: 'Wright' },
  { id: 'zaha-hadid', emoji: '⚡', name: 'Hadid' },
  { id: 'tadao-ando', emoji: '🧱', name: 'Ando' },
  { id: 'norman-foster', emoji: '🔧', name: 'Foster' },
  { id: 'le-corbusier', emoji: '⚙️', name: 'Corbusier' },
  { id: 'peter-zumthor', emoji: '🌿', name: 'Zumthor' },
  { id: 'bjarke-ingels', emoji: '🏗️', name: 'Ingels' },
  { id: 'kengo-kuma', emoji: '🎋', name: 'Kuma' },
  { id: 'alain-carle', emoji: '🔺', name: 'Carle' },
  { id: 'louis-kahn', emoji: '🏛️', name: 'Kahn' },
  { id: 'santiago-calatrava', emoji: '🦅', name: 'Calatrava' },
  { id: 'rem-koolhaas', emoji: '📐', name: 'Koolhaas' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ChipProps {
  id: string;
  emoji: string;
  name: string;
  selected: boolean;
  locked: boolean;
  onPress: () => void;
}

function ArchitectChip({ id, emoji, name, selected, locked, onPress }: ChipProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? 1.05 : 1, { damping: 20, stiffness: 200 }) }],
    opacity: locked ? 0.5 : 1,
  }));

  return (
    <AnimatedPressable
      style={[
        styles.chip,
        selected && styles.chipSelected,
        locked && styles.chipLocked,
        animatedStyle
      ]}
      onPress={onPress}
      disabled={locked}
    >
      <Text style={styles.chipEmoji}>{emoji}</Text>
      <Text style={[styles.chipName, selected && styles.chipNameSelected]}>
        {name}
        {locked && ' 🔒'}
      </Text>
      {selected && <Text style={styles.checkmark}>✓</Text>}
    </AnimatedPressable>
  );
}

export function ArchitectChipRow({ selectedId, onSelect }: ArchitectChipRowProps) {
  const { userTier } = useTierGate();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {ARCHITECT_CHIPS.map((chip) => {
        const architect = getArchitectById(chip.id);
        const tierRequired = architect?.tierRequired ?? 'starter';
        const tierOrder = ['starter', 'creator', 'pro', 'architect'];
        const locked = tierOrder.indexOf(userTier) < tierOrder.indexOf(tierRequired);

        return (
          <ArchitectChip
            key={chip.id}
            id={chip.id}
            emoji={chip.emoji}
            name={chip.name}
            selected={selectedId === chip.id}
            locked={locked}
            onPress={() => onSelect(chip.id)}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.sm,
    borderRadius: DS.radius.pill,
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.border,
    gap: DS.spacing.xxs,
  },
  chipSelected: {
    borderColor: DS.colors.primary,
    backgroundColor: DS.colors.elevated,
  },
  chipLocked: {
    opacity: 0.5,
  },
  chipEmoji: {
    fontSize: DS.fontSize.md,
  },
  chipName: {
    fontFamily: DS.font.medium,
    fontSize: DS.fontSize.sm,
    color: DS.colors.primaryGhost,
  },
  chipNameSelected: {
    color: DS.colors.primary,
  },
  checkmark: {
    fontSize: DS.fontSize.sm,
    color: DS.colors.success,
    marginLeft: DS.spacing.xxs,
  },
});
```

---

## Task 5: Create `src/components/generation/StyleChipRow.tsx`

**Files:**
- Create: `src/components/generation/StyleChipRow.tsx`

Horizontal scroll of 22 style chips (16 existing + 6 new). Same pattern as ArchitectChipRow.

```typescript
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { DESIGN_STYLES } from '../../data/designStyles';
import { DS } from '../../theme/designSystem';
import { useAuthStore } from '../../stores/authStore';

interface StyleChipRowProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ChipProps {
  id: string;
  emoji: string;
  name: string;
  color: string;
  selected: boolean;
  locked: boolean;
  onPress: () => void;
}

function StyleChip({ id, emoji, name, color, selected, locked, onPress }: ChipProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? 1.05 : 1, { damping: 20, stiffness: 200 }) }],
    opacity: locked ? 0.5 : 1,
  }));

  return (
    <AnimatedPressable
      style={[
        styles.chip,
        selected && { borderColor: color },
        animatedStyle
      ]}
      onPress={onPress}
      disabled={locked}
    >
      <Text style={styles.chipEmoji}>{emoji}</Text>
      <Text style={[styles.chipName, selected && { color }]}>
        {name}
        {locked && ' 🔒'}
      </Text>
      {selected && <View style={[styles.dot, { backgroundColor: color }]} />}
    </AnimatedPressable>
  );
}

export function StyleChipRow({ selectedId, onSelect }: StyleChipRowProps) {
  const userTier = useAuthStore((s) => s.user?.tier ?? 'starter');
  const tierOrder = ['starter', 'creator', 'pro', 'architect'];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {DESIGN_STYLES.map((style) => {
        const tierIdx = style.availableTiers.indexOf(userTier);
        const locked = tierIdx === -1; // not in available tiers

        return (
          <StyleChip
            key={style.id}
            id={style.id}
            emoji={style.emoji}
            name={style.name}
            color={style.primaryColor}
            selected={selectedId === style.id}
            locked={locked}
            onPress={() => onSelect(style.id)}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.sm,
    borderRadius: DS.radius.pill,
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.border,
    gap: DS.spacing.xxs,
  },
  chipName: {
    fontFamily: DS.font.medium,
    fontSize: DS.fontSize.sm,
    color: DS.colors.primaryGhost,
  },
  chipEmoji: {
    fontSize: DS.fontSize.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: DS.spacing.xxs,
  },
});
```

---

## Task 6: Create `src/components/generation/ChatBubble.tsx`

**Files:**
- Create: `src/components/generation/ChatBubble.tsx`

```typescript
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { DS } from '../../theme/designSystem';
import type { ChatMessage } from '../../types/chat';

interface ChatBubbleProps {
  message: ChatMessage;
  showTimestamp?: boolean;
}

export function ChatBubble({ message, showTimestamp = false }: ChatBubbleProps) {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const isUser = message.role === 'user';

  return (
    <Animated.View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer, animatedStyle]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.content, isUser && styles.userContent]}>
          {message.content}
        </Text>
      </View>
      {showTimestamp && (
        <Text style={styles.timestamp}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
      {message.suggestions && (
        <View style={styles.suggestions}>
          {message.suggestions.map((s, i) => (
            <Text key={i} style={styles.suggestion}>{s}</Text>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: DS.spacing.xxs,
    paddingHorizontal: DS.spacing.md,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.sm,
    borderRadius: DS.radius.card,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: DS.colors.elevated,
    borderLeftWidth: 3,
    borderLeftColor: DS.colors.accent,
  },
  aiBubble: {
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  content: {
    fontFamily: DS.font.regular,
    fontSize: DS.fontSize.md,
    color: DS.colors.primary,
    lineHeight: 22,
  },
  userContent: {
    color: DS.colors.primary,
  },
  timestamp: {
    fontFamily: DS.font.mono,
    fontSize: DS.fontSize.xs,
    color: DS.colors.primaryDim,
    marginTop: DS.spacing.xxs,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DS.spacing.xs,
    marginTop: DS.spacing.sm,
  },
  suggestion: {
    fontFamily: DS.font.medium,
    fontSize: DS.fontSize.sm,
    color: DS.colors.primaryGhost,
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.border,
    borderRadius: DS.radius.pill,
    paddingHorizontal: DS.spacing.sm,
    paddingVertical: DS.spacing.xxs,
  },
});
```

---

## Task 7: Create `src/components/generation/VoiceInputBar.tsx`

**Files:**
- Create: `src/components/generation/VoiceInputBar.tsx`

States: idle, recording, transcribing, transcript-ready.

```typescript
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { DS } from '../../theme/designSystem';
import { CompassRoseLoader } from '../common/CompassRoseLoader';

interface VoiceInputBarProps {
  onSend: (text: string) => void;
  onTranscribe: (uri: string) => Promise<string>;
  disabled?: boolean;
}

type State = 'idle' | 'recording' | 'transcribing' | 'transcript-ready';

export function VoiceInputBar({ onSend, onTranscribe, disabled = false }: VoiceInputBarProps) {
  const [state, setState] = useState<State>('idle');
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const recordingRef = useRef<Audio.Recording | null>(null);

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.8);

  const startRecording = async () => {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) return;

    await Audio.setAudioModeAsync({ allowsRecording: true });
    const recording = new Audio.Recording();
    await recording.startAsync();
    recordingRef.current = recording;

    setState('recording');
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.3, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1
    );
    pulseOpacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 500 }), withTiming(0.4, { duration: 500 })),
      -1
    );
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    cancelAnimation(pulseScale);
    cancelAnimation(pulseOpacity);

    const uri = recordingRef.current.getURI();
    await recordingRef.current.stopAsync();
    recordingRef.current = null;

    if (!uri) return;

    setState('transcribing');
    try {
      const text = await onTranscribe(uri);
      setTranscript(text);
      setInputText(text);
      setState('transcript-ready');
    } catch {
      setState('idle');
    }
  };

  const cancelTranscript = () => {
    setTranscript('');
    setInputText('');
    setState('idle');
  };

  const handleSend = () => {
    if (inputText.trim()) {
      onSend(inputText.trim());
      setInputText('');
      setTranscript('');
      setState('idle');
    }
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Recording indicator */}
      {state === 'recording' && (
        <View style={styles.recordingIndicator}>
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
          <Text style={styles.recordingText}>Recording...</Text>
        </View>
      )}

      {/* Transcribing indicator */}
      {state === 'transcribing' && (
        <View style={styles.transcribingRow}>
          <CompassRoseLoader size={24} />
          <Text style={styles.transcribingText}>Transcribing...</Text>
        </View>
      )}

      {/* Transcript ready — editable */}
      {(state === 'transcript-ready' || state === 'idle') && (
        <View style={styles.inputRow}>
          {/* Mic button */}
          <Pressable
            style={[styles.micButton, state === 'recording' && styles.micButtonRecording]}
            onPress={state === 'recording' ? stopRecording : startRecording}
            disabled={disabled || state === 'transcribing'}
          >
            {state === 'recording' ? (
              <View style={styles.stopIcon} />
            ) : (
              <Text style={styles.micIcon}>🎙️</Text>
            )}
          </Pressable>

          {/* Text input */}
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={state === 'transcript-ready' ? 'Edit your transcript...' : 'Describe your dream home...'}
            placeholderTextColor={DS.colors.primaryDim}
            multiline
            maxLength={500}
            editable={state !== 'transcribing'}
          />

          {/* Cancel transcript */}
          {state === 'transcript-ready' && (
            <Pressable onPress={cancelTranscript} style={styles.cancelButton}>
              <Text style={styles.cancelText}>✕</Text>
            </Pressable>
          )}

          {/* Send button */}
          {inputText.trim().length > 0 && (
            <Pressable onPress={handleSend} style={styles.sendButton}>
              <Text style={styles.sendIcon}>✨</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(40, 38, 36, 0.85)',
    backdropFilter: 'blur(20)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(240, 237, 232, 0.12)',
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.sm,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    paddingVertical: DS.spacing.sm,
  },
  pulseRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C0604A',
  },
  recordingText: {
    fontFamily: DS.font.medium,
    fontSize: DS.fontSize.sm,
    color: '#C0604A',
  },
  transcribingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    paddingVertical: DS.spacing.sm,
  },
  transcribingText: {
    fontFamily: DS.font.regular,
    fontSize: DS.fontSize.sm,
    color: DS.colors.primaryGhost,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: DS.spacing.sm,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonRecording: {
    backgroundColor: 'rgba(192, 96, 74, 0.2)',
    borderColor: '#C0604A',
  },
  micIcon: {
    fontSize: 20,
  },
  stopIcon: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#C0604A',
  },
  input: {
    flex: 1,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.card,
    borderWidth: 1,
    borderColor: DS.colors.border,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.sm,
    fontFamily: DS.font.regular,
    fontSize: DS.fontSize.md,
    color: DS.colors.primary,
    maxHeight: 88,
    minHeight: 44,
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DS.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: DS.colors.primaryGhost,
    fontSize: DS.fontSize.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DS.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 20,
  },
});
```

---

## Task 8: Create `src/components/generation/ReviewCard.tsx`

**Files:**
- Create: `src/components/generation/ReviewCard.tsx`

```typescript
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { DS } from '../../theme/designSystem';
import type { GenerationPayload } from '../../types/generation';

interface ReviewCardProps {
  generationData: Partial<GenerationPayload>;
  architectName?: string;
  styleName?: string;
  styleColor?: string;
  onGenerate: () => void;
  onEditField: (field: string) => void;
}

export function ReviewCard({ generationData, architectName, styleName, styleColor, onGenerate, onEditField }: ReviewCardProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(0, { damping: 20, stiffness: 200 }) }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.title}>Review Your Design</Text>

      <View style={styles.grid}>
        <Pressable onPress={() => onEditField('buildingType')} style={styles.field}>
          <Text style={styles.fieldLabel}>Type</Text>
          <Text style={styles.fieldValue}>{generationData.buildingType ?? '—'}</Text>
        </Pressable>

        <Pressable onPress={() => onEditField('plotSize')} style={styles.field}>
          <Text style={styles.fieldLabel}>Size</Text>
          <Text style={styles.fieldValue}>
            {generationData.plotSize ? `${generationData.plotSize} ${generationData.plotUnit ?? 'm²'}` : '—'}
          </Text>
        </Pressable>

        <Pressable onPress={() => onEditField('rooms')} style={styles.field}>
          <Text style={styles.fieldLabel}>Rooms</Text>
          <Text style={styles.fieldValue}>
            {generationData.bedrooms && generationData.bathrooms
              ? `${generationData.bedrooms}BR / ${generationData.bathrooms}BA`
              : '—'}
          </Text>
        </Pressable>

        {architectName && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Architect</Text>
            <Text style={styles.fieldValue}>{architectName}</Text>
          </View>
        )}

        {styleName && (
          <View style={[styles.field, { borderLeftColor: styleColor }]}>
            <Text style={styles.fieldLabel}>Style</Text>
            <Text style={[styles.fieldValue, { color: styleColor }]}>{styleName}</Text>
          </View>
        )}
      </View>

      <Pressable style={styles.generateButton} onPress={onGenerate}>
        <Text style={styles.generateButtonText}>Generate Blueprint →</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: DS.spacing.md,
    padding: DS.spacing.lg,
    backgroundColor: 'rgba(40, 38, 36, 0.85)',
    backdropFilter: 'blur(20)',
    borderRadius: DS.radius.card,
    borderWidth: 1,
    borderColor: 'rgba(240, 237, 232, 0.12)',
  },
  title: {
    fontFamily: DS.font.heading,
    fontSize: DS.fontSize.lg,
    color: DS.colors.primary,
    marginBottom: DS.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DS.spacing.sm,
    marginBottom: DS.spacing.lg,
  },
  field: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.sm,
    borderWidth: 1,
    borderColor: DS.colors.border,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.sm,
    minWidth: '45%',
  },
  fieldLabel: {
    fontFamily: DS.font.medium,
    fontSize: DS.fontSize.xs,
    color: DS.colors.primaryGhost,
    marginBottom: DS.spacing.xxs,
  },
  fieldValue: {
    fontFamily: DS.font.regular,
    fontSize: DS.fontSize.md,
    color: DS.colors.primary,
  },
  generateButton: {
    backgroundColor: DS.colors.primary,
    borderRadius: DS.radius.pill,
    paddingVertical: DS.spacing.md,
    alignItems: 'center',
  },
  generateButtonText: {
    fontFamily: DS.font.medium,
    fontSize: DS.fontSize.md,
    color: DS.colors.background,
  },
});
```

---

## Task 9: Create `supabase/functions/ai-chat-generate/index.ts`

**Files:**
- Create: `supabase/functions/ai-chat-generate/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getArchitectById, buildArchitectPromptSection } from '../_shared/architects.ts';
import { getStyleById } from '../_shared/styles.ts';

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401 });
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) return new Response('Unauthorized', { status: 401 });

    const { messages, architectId, styleId, currentData } = await req.json();

    // Build system prompt
    let systemPrompt = `You are ARIA, an expert architect AI assistant helping users design their dream homes.

GUIDELINES:
- Be warm, conversational, and knowledgeable — like a professional architect who listens
- Ask clarifying questions naturally to fill in missing details
- Reference the selected architect's philosophy when architect is chosen
- Reference the selected style's aesthetic when style is chosen
- Extract structured data from the conversation: building type, plot size (m²), bedrooms, bathrooms
- When you have at least building type + bedrooms, signal that a review card should appear
- Keep responses concise (2-4 sentences for most responses)
- Never be robotic or overly formal`;

    // Inject architect if selected
    if (architectId) {
      const architect = getArchitectById(architectId);
      if (architect) {
        systemPrompt += `\n\nARCHITECT INFLUENCE:\n${buildArchitectPromptSection(architect)}`;
      }
    }

    // Inject style if selected
    if (styleId) {
      const style = getStyleById(styleId);
      if (style) {
        systemPrompt += `\n\nSTYLE: ${style.name}\n${style.description}`;
      }
    }

    // Build conversation for Claude
    const claudeMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content
      }))
    ];

    // Call Claude
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: claudeMessages
      })
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      return new Response(JSON.stringify({ error: 'Claude error', details: err }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const claudeData = await claudeRes.json();
    const aiMessage = claudeData.content[0].text;

    // Extract structured data from conversation
    // Simple pattern matching — in production this would be more sophisticated
    const extractedData: Record<string, unknown> = {};
    
    const buildingTypes = ['villa', 'house', 'apartment', 'office', 'studio', 'commercial', 'cabin', 'cottage', 'bungalow'];
    for (const type of buildingTypes) {
      if (aiMessage.toLowerCase().includes(type) || messages.some((m: { content: string }) => m.content.toLowerCase().includes(type))) {
        extractedData.buildingType = type;
        break;
      }
    }
    extractedData.buildingType = currentData?.buildingType ?? extractedData.buildingType;

    const sizeMatch = (messages[messages.length - 1]?.content ?? '').match(/(\d+)\s*(sqm|m2|m²|sqm|meg?|square\s*(meter|metre)s?)/i);
    if (sizeMatch) extractedData.plotSize = parseInt(sizeMatch[1]);
    if (currentData?.plotSize) extractedData.plotSize = currentData.plotSize;

    const bedroomMatch = (messages[messages.length - 1]?.content ?? '').match(/(\d+)\s*(bedroom|br|bed)/i);
    if (bedroomMatch) extractedData.bedrooms = parseInt(bedroomMatch[1]);
    if (currentData?.bedrooms) extractedData.bedrooms = currentData.bedrooms;

    const bathroomMatch = (messages[messages.length - 1]?.content ?? '').match(/(\d+)\s*(bathroom|ba|bath)/i);
    if (bathroomMatch) extractedData.bathrooms = parseInt(bathroomMatch[1]);
    if (currentData?.bathrooms) extractedData.bathrooms = currentData.bathrooms;

    const shouldShowReview = !!(extractedData.buildingType && extractedData.bedrooms);
    const isComplete = !!(extractedData.buildingType && extractedData.plotSize && extractedData.bedrooms);

    return new Response(JSON.stringify({
      message: aiMessage,
      extractedData,
      shouldShowReview,
      isComplete
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('ai-chat-generate error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
```

---

## Task 10: Wire Chat Mode into GenerationScreen

**Files:**
- Modify: `src/screens/generation/GenerationScreen.tsx`

Add state machine with `mode: 'chat' | 'wizard'`. Default to `'chat'`.

Key changes:
1. Add `mode` state: `const [mode, setMode] = useState<'chat' | 'wizard'>('chat')`
2. When `mode === 'chat'`, render chat UI instead of wizard steps
3. Add "Switch to wizard →" text link at bottom (sets `mode` to `'wizard'`)
4. Add "Switch to chat →" in wizard mode to return to chat
5. Pass `selectedArchitectId` and `selectedStyleId` through all steps to generation payload

The chat mode layout (top to bottom):
- Header (back arrow, "Generation", close button)
- AI greeting bubble
- ArchitectChipRow (always visible)
- StyleChipRow (always visible)
- ScrollView of ChatBubbles (flex-grow)
- ReviewCard (appears when `isReviewVisible`)
- VoiceInputBar (fixed at bottom)

Wire up `onSend` → `generationChatService.sendMessage()` → append AI response → update `generationData` → show ReviewCard when `shouldShowReview`.

Add `useGenerationPreferences` extension fields:
- `chatHistory: ChatMessage[]`
- `setChatHistory`
- `selectedArchitectId`, `setSelectedArchitectId`
- `selectedStyleId`, `setSelectedStyleId`
- `isReviewVisible`

---

## Task 11: Add Style Display Colors to Edge Function

**Files:**
- Create: `supabase/functions/_shared/styles.ts`

Mirror `architects.ts` pattern but for style data. Only contains `getStyleById()` helper for the Edge Function.

```typescript
import { DESIGN_STYLES } from '../../../src/data/designStyles'; // imported as static data

export interface StyleProfile {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
}

export function getStyleById(id: string): StyleProfile | null {
  const style = DESIGN_STYLES.find((s) => s.id === id);
  if (!style) return null;
  return { id: style.id, name: style.name, description: style.description, primaryColor: style.primaryColor };
}
```

Note: Edge Functions can't import from `src/` directly. Copy the style data as a static array in the Deno file.

---

## Verification

1. `npx tsc --noEmit` — no TypeScript errors across all new files
2. 22 styles visible in StyleChipRow (16 original + 6 new)
3. ArchitectChipRow shows 12 architects with correct locked states per tier
4. VoiceInputBar: tap mic → records → stops → shows transcript in input → edit → send
5. ReviewCard appears when AI has extracted building type + bedrooms
6. Chat bubbles animate in with spring (translateY + opacity)
7. "Switch to wizard" link visible at bottom of chat mode
8. `mode` state persists during session (doesn't reset on back navigation)
9. Edge Function `ai-chat-generate` responds with message + extractedData + shouldShowReview
10. Architect and style are injected into AI system prompt when selected

---

## Execution Order

1. Task 1 (styles) — independent, no dependencies
2. Task 2 (chat types) — independent
3. Task 3 (chat service) — independent
4. Task 4 (ArchitectChipRow) — depends on Task 2
5. Task 5 (StyleChipRow) — depends on Task 1, 2
6. Task 6 (ChatBubble) — depends on Task 2
7. Task 7 (VoiceInputBar) — depends on Task 2
8. Task 8 (ReviewCard) — depends on Task 2
9. Task 9 (Edge Function) — independent
10. Task 10 (Wire GenerationScreen) — depends on Tasks 4-8, 11
11. Task 11 (styles Deno) — independent, depends on Task 1