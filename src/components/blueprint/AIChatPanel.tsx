import { DS } from '../../theme/designSystem';
import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, Pressable, TextInput, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArchText } from '../common/ArchText';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { AIProcessingIndicator } from '../common/AIProcessingIndicator';
import { CompassRoseLoader } from '../common/CompassRoseLoader';
import { ConfirmationCard } from './ConfirmationCard';
import { SuggestionBubble } from '../consultation/SuggestionBubble';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { aiService } from '../../services/aiService';
import { buildSelectedContext, sanitizePrompt } from '../../utils/promptSanitizer';
import { validateChatMessage } from '../../utils/blueprintValidation';
import type { ChatMessage, BlueprintData } from '../../types/blueprint';
import { Audio } from 'expo-av';
import { useTierGate } from '../../hooks/useTierGate';
import type { SubscriptionTier } from '../../types';

function ChatBubbleIcon({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 28 28">
      <Path d="M4 6 C4 4 6 3 8 3 L20 3 C22 3 24 4 24 6 L24 17 C24 19 22 20 20 20 L12 20 L7 25 L8 20 C6 20 4 19 4 17 Z"
        stroke={color} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
      <Circle cx="10" cy="12" r="1.2" fill={color} opacity={0.8} />
      <Circle cx="14" cy="12" r="1.2" fill={color} opacity={0.8} />
      <Circle cx="18" cy="12" r="1.2" fill={color} opacity={0.8} />
    </Svg>
  );
}

function SendButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  const rotation = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  const handlePress = () => {
    rotation.value = withSpring(360, { damping: 8, stiffness: 200 }, () => { rotation.value = 0; });
    onPress();
  };

  if (loading) return <CompassRoseLoader size="small" />;

  return (
    <Pressable onPress={handlePress} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: DS.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={animStyle}>
        <Svg width={18} height={18} viewBox="0 0 20 20">
          <Path d="M10 2 L11.5 7 L17 7 L12.5 10.5 L14 16 L10 13 L6 16 L7.5 10.5 L3 7 L8.5 7 Z" fill={DS.colors.background} />
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <View style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '80%', marginBottom: 8 }}>
      <View style={{ backgroundColor: isUser ? DS.colors.surfaceHigh : DS.colors.surfaceHigh, borderRadius: 16, borderBottomRightRadius: isUser ? 4 : 16, borderBottomLeftRadius: isUser ? 16 : 4, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: isUser ? DS.colors.primary + '30' : 'rgba(240, 237, 232, 0.12)' }}>
        <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primary, lineHeight: 18 }}>{msg.content}</ArchText>
      </View>
      <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 9, color: DS.colors.primaryGhost, marginTop: 2, alignSelf: isUser ? 'flex-end' : 'flex-start', paddingHorizontal: 4 }}>
        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </ArchText>
    </View>
  );
}

interface AIChatPanelProps {
  visible: boolean;
  onToggle: () => void;
  selectedArchitectId?: string | null;
  architectName?: string;
}

type Tab = 'chat' | 'suggestions';

export function AIChatPanel({ visible, onToggle, selectedArchitectId, architectName }: AIChatPanelProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingBlueprint, setPendingBlueprint] = useState<BlueprintData | null>(null);
  const [pendingMessage, setPendingMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [measurementMode, setMeasurementMode] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const insets = useSafeAreaInsets();
  const panelY = useSharedValue(400);
  const pulseScale = useSharedValue(1);

  const blueprint = useBlueprintStore((s) => s.blueprint);
  const selectedId = useBlueprintStore((s) => s.selectedId);
  const currentFloorIndex = useBlueprintStore((s) => s.currentFloorIndex);
  const suggestions = useBlueprintStore((s) => s.suggestions);
  const unreadSuggestionCount = useBlueprintStore((s) => s.unreadSuggestionCount);
  const addChatMessage = useBlueprintStore((s) => s.actions.addChatMessage);
  const loadBlueprint = useBlueprintStore((s) => s.actions.loadBlueprint);
  const markSuggestionRead = useBlueprintStore((s) => s.actions.markSuggestionRead);
  const setSuggestions = useBlueprintStore((s) => s.actions.setSuggestions);

  // Tier gates
  const suggestionsGate = useTierGate('walkthrough');   // proxy for suggestion nudges (Pro+)
  const measurementGate = useTierGate('arMeasure');       // Architect only
  const costGate = useTierGate('costEstimator');          // Architect only

  const tier = suggestionsGate.tier;
  const isProPlus = tier === 'pro' || tier === 'architect';
  const isArchitect = tier === 'architect';

  // Badge pulse animation for unread suggestions
  const badgePulse = useSharedValue(1);
  React.useEffect(() => {
    if (unreadSuggestionCount > 0) {
      badgePulse.value = withRepeat(
        withTiming(1.2, { duration: 500 }),
        -1,
        true,
      );
    } else {
      badgePulse.value = withTiming(1, { duration: 200 });
    }
  }, [unreadSuggestionCount, badgePulse]);

  const badgePulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: badgePulse.value }] }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  // Build selected-object context for AI (uses sanitized values)
  const selectedContext = buildSelectedContext({
    selectedId,
    walls: blueprint?.walls,
    rooms: blueprint?.rooms,
    furniture: blueprint?.furniture,
  });

  // Contextual example prompts based on blueprint state
  const examplePrompts = useMemo(() => {
    if (!blueprint) return ['"Add a window to the north wall"', '"Make the living room bigger"'];
    const hasFurniture = (blueprint.furniture?.length ?? 0) > 0;
    const hasMultiFloor = (blueprint.floors?.length ?? 0) > 1;
    const selectedRoom = blueprint.rooms?.find(r => r.id === selectedId);
    const prompts = [];
    if (selectedRoom) {
      prompts.push(`"Resize the ${selectedRoom.name}"`);
      prompts.push(`"Add furniture to ${selectedRoom.name}"`);
    }
    if (!hasFurniture) prompts.push('"Suggest furniture for each room"');
    if (!hasMultiFloor) prompts.push('"Add a second floor"');
    prompts.push('"Add a window to the north wall"');
    return prompts.slice(0, 5);
  }, [blueprint, selectedId]);

  // Voice recording
  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
      pulseScale.value = withRepeat(
        // eslint-disable-next-line no-undefined
        withTiming(1.15, { duration: 600 }),
        -1,
        true,
      );
    } catch {
      // silently fail
    }
  }, [pulseScale]);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    pulseScale.value = withTiming(1, { duration: 150 });
    setIsRecording(false);
    setIsTranscribing(true);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) return;
      const text = await aiService.transcribeAudio(uri);
      if (text) setInput((prev) => (prev ? `${prev}\n${text}` : text).slice(0, 500));
    } catch {
      // silently fail
    } finally {
      setIsTranscribing(false);
    }
  }, [pulseScale]);

  const toggleRecording = useCallback(() => {
    if (isRecording) void stopRecording();
    else void startRecording();
  }, [isRecording, startRecording, stopRecording]);

  // Quick action chips pre-fill input
  const quickActions = [
    { label: 'Resize Room', template: 'Make the [room] 20% larger' },
    { label: 'Add Floor', template: 'Add a second floor with 2 bedrooms' },
    { label: 'Change Style', template: 'Apply modern style to the whole house' },
    { label: 'Add Window', template: 'Add a window to the north wall' },
    { label: 'Suggest Furniture', template: 'Suggest furniture for each room' },
  ];

  React.useEffect(() => {
    panelY.value = visible
      ? withSpring(0, { damping: 22, stiffness: 280 })
      : withTiming(400, { duration: 220 });
  }, [visible, panelY]);

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: panelY.value }] }));

  const recentMessages = (blueprint?.chatHistory ?? []).slice(-5);

  const sendMessage = useCallback(async () => {
    const rawText = input.trim();
    if (!rawText || isLoading || !blueprint) return;

    // Sanitize user input to prevent prompt injection
    const text = sanitizePrompt(rawText);
    if (!text) return;

    // Validate and sanitize chat message content
    const sanitizedContent = validateChatMessage(text);
    if (!sanitizedContent) return;

    setInput('');
    setIsLoading(true);

    // Inject measurement mode context if active (Architect tier)
    const measurementContext = measurementMode
      ? '\n\n[MEASUREMENT MODE] Please provide precise metric measurements for any changes. Check room-area proportionality.'
      : '';

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: sanitizedContent,
      timestamp: new Date().toISOString()
    };
    addChatMessage(userMsg);

    try {
      // Sanitize context and combine with prompt
      const safeContext = selectedContext;
      const enrichedPrompt = safeContext ? `${text}\n\n${safeContext}${measurementContext}` : `${text}${measurementContext}`;
      const currentBlueprint = useBlueprintStore.getState().blueprint;
    if (!currentBlueprint) return;
    const data = await aiService.editBlueprint({ prompt: enrichedPrompt, blueprint: currentBlueprint });

      if (data.blueprint) {
        setPendingBlueprint(data.blueprint);
        setPendingMessage(data.message ?? 'Blueprint updated.');
        const responseContent = validateChatMessage(data.message ?? 'Done! Review the changes below.');
        if (responseContent) {
          addChatMessage({ id: `msg_${Date.now()}_r`, role: 'assistant', content: responseContent, timestamp: new Date().toISOString() });
        }
      } else {
        const responseContent = validateChatMessage(data.message ?? "Couldn't apply that change.");
        if (responseContent) {
          addChatMessage({ id: `msg_${Date.now()}_r`, role: 'assistant', content: responseContent, timestamp: new Date().toISOString() });
        }
      }
    } catch {
      const errorContent = validateChatMessage("Sorry, I couldn't process that. Please try again.");
      if (errorContent) {
        addChatMessage({ id: `msg_${Date.now()}_e`, role: 'assistant', content: errorContent, timestamp: new Date().toISOString() });
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, isLoading, blueprint, addChatMessage, selectedContext, measurementMode, setMeasurementMode]);

  const handleSuggestionAccept = useCallback((suggestionId: string) => {
    markSuggestionRead(suggestionId);
    // Apply suggestion action here (future: call AI service with suggestion context)
  }, [markSuggestionRead]);

  const handleSuggestionDismiss = useCallback((suggestionId: string) => {
    markSuggestionRead(suggestionId);
  }, [markSuggestionRead]);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'suggestions') {
      // Mark all as read when switching to suggestions tab
      suggestions.forEach(s => {
        if (!s.read) markSuggestionRead(s.id);
      });
    }
  }, [suggestions, markSuggestionRead]);

  // ——— Render ———

  return (
    <>
      {/* Floating bubble */}
      {!visible && (
        <Pressable onPress={onToggle} style={{ position: 'absolute', bottom: 110, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: DS.colors.surface, borderWidth: 1, borderColor: DS.colors.primary + '60', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
          <ChatBubbleIcon color={DS.colors.primary} />
        </Pressable>
      )}

      {/* Panel */}
      {visible && (
        <Animated.View style={[panelStyle, { position: 'absolute', bottom: 0, left: 0, right: 0, height: 380, backgroundColor: 'rgba(240, 237, 232, 0.10)', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderTopColor: DS.colors.border }]}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(240, 237, 232, 0.08)' }}>
            <ChatBubbleIcon color={DS.colors.primary} />
            <ArchText variant="heading" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 16, color: DS.colors.primary, marginLeft: 8, flex: 1 }}>
              AI Blueprint Editor
            </ArchText>
            {/* Architect philosophy label */}
            {isArchitect && architectName && (
              <View style={{ backgroundColor: DS.colors.accent + '20', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginRight: 6, borderWidth: 1, borderColor: DS.colors.accent + '40' }}>
                <ArchText variant="caption" style={{ fontFamily: DS.font.mono, fontSize: 9, color: DS.colors.accent }}>{architectName}</ArchText>
              </View>
            )}
            {/* Measurement mode indicator */}
            {isArchitect && measurementMode && (
              <View style={{ backgroundColor: DS.colors.success + '20', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginRight: 6, borderWidth: 1, borderColor: DS.colors.success + '40' }}>
                <ArchText variant="caption" style={{ fontFamily: DS.font.mono, fontSize: 9, color: DS.colors.success }}>📐 MEASURE</ArchText>
              </View>
            )}
            {/* Cost estimation indicator */}
            {isArchitect && costGate.allowed && (
              <View style={{ backgroundColor: DS.colors.warning + '20', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginRight: 6, borderWidth: 1, borderColor: DS.colors.warning + '40' }}>
                <ArchText variant="caption" style={{ fontFamily: DS.font.mono, fontSize: 9, color: DS.colors.warning }}>💰 COST</ArchText>
              </View>
            )}
            <Pressable onPress={onToggle} style={{ padding: 8 }}><ArchText variant="body" style={{ color: DS.colors.primaryDim, fontSize: 18 }}>✕</ArchText></Pressable>
          </View>

          {/* Tab bar */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, gap: 8 }}>
            <Pressable
              onPress={() => handleTabChange('chat')}
              style={{
                flex: 1,
                backgroundColor: activeTab === 'chat' ? DS.colors.primary + '20' : 'transparent',
                borderRadius: DS.radius.chip,
                paddingVertical: 6,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: activeTab === 'chat' ? DS.colors.primary + '50' : DS.colors.border,
              }}
            >
              <ArchText variant="label" style={{ fontFamily: DS.font.medium, fontSize: 12, color: activeTab === 'chat' ? DS.colors.primary : DS.colors.primaryGhost }}>
                Chat
              </ArchText>
            </Pressable>

            {isProPlus && (
              <Pressable
                onPress={() => handleTabChange('suggestions')}
                style={{
                  flex: 1,
                  backgroundColor: activeTab === 'suggestions' ? DS.colors.primary + '20' : 'transparent',
                  borderRadius: DS.radius.chip,
                  paddingVertical: 6,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: activeTab === 'suggestions' ? DS.colors.primary + '50' : DS.colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ArchText variant="label" style={{ fontFamily: DS.font.medium, fontSize: 12, color: activeTab === 'suggestions' ? DS.colors.primary : DS.colors.primaryGhost }}>
                    Suggestions
                  </ArchText>
                  {unreadSuggestionCount > 0 && (
                    <Animated.View style={[
                      badgePulseStyle,
                      {
                        backgroundColor: DS.colors.error,
                        borderRadius: 8,
                        minWidth: 16,
                        height: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                      },
                    ]}>
                      <ArchText variant="caption" style={{ fontFamily: DS.font.mono, fontSize: 9, color: '#fff', fontWeight: '700' }}>
                        {unreadSuggestionCount > 9 ? '9+' : unreadSuggestionCount}
                      </ArchText>
                    </Animated.View>
                  )}
                </View>
              </Pressable>
            )}
          </View>

          {/* Content */}
          {activeTab === 'chat' ? (
            <>
              <ScrollView ref={scrollRef} style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }} showsVerticalScrollIndicator={false} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
                {recentMessages.length === 0 && (
                  <View style={{ marginTop: 16, marginBottom: 8 }}>
                    <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost, textAlign: 'center' }}>
                      Ask me to edit your blueprint
                    </ArchText>
                    <View style={{ marginTop: 12, gap: 6 }}>
                      {examplePrompts.map((example) => (
                        <Pressable
                          key={example}
                          onPress={() => setInput(example.replace(/^"|"$/g, ''))}
                          style={{ backgroundColor: DS.colors.surfaceHigh, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'center', borderWidth: 1, borderColor: DS.colors.border + '60' }}
                        >
                          <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: DS.colors.primaryGhost }}>{example}</ArchText>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
                {recentMessages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
                {isLoading && (
                  <View style={{ alignSelf: 'flex-start', marginBottom: 8, marginTop: 4 }}>
                    <AIProcessingIndicator size="small" />
                  </View>
                )}
              </ScrollView>

              {/* Confirmation preview */}
              {pendingBlueprint && blueprint && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                  <ConfirmationCard
                    original={blueprint}
                    proposed={pendingBlueprint}
                    currentFloorIndex={currentFloorIndex}
                    aiMessage={pendingMessage}
                    onAccept={() => {
                      loadBlueprint(pendingBlueprint!);
                      setPendingBlueprint(null);
                      setPendingMessage('');
                    }}
                    onReject={() => {
                      setPendingBlueprint(null);
                      setPendingMessage('');
                    }}
                  />
                </View>
              )}

              {/* Quick action chips */}
              <View style={{ paddingHorizontal: 16, paddingTop: 10, flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {quickActions.map(({ label }) => (
                  <Pressable
                    key={label}
                    onPress={() => {
                      const qa = quickActions.find((a) => a.label === label);
                      if (qa) setInput(qa.template);
                    }}
                    style={{ backgroundColor: `${DS.colors.primary}15`, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: `${DS.colors.primary}30` }}
                  >
                    <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 10, color: DS.colors.primary }}>{label}</ArchText>
                  </Pressable>
                ))}
              </View>

              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: Math.max(12, insets.bottom + 8), borderTopWidth: 1, borderTopColor: 'rgba(240, 237, 232, 0.08)', backgroundColor: 'rgba(240, 237, 232, 0.03)', gap: 10 }}>
                  {/* Measurement mode toggle for Architect */}
                  {isArchitect && (
                    <Pressable
                      onPress={() => setMeasurementMode(m => !m)}
                      style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: measurementMode ? DS.colors.success + '25' : DS.colors.surface,
                        borderWidth: 1.5,
                        borderColor: measurementMode ? DS.colors.success : DS.colors.border,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Svg width={16} height={16} viewBox="0 0 24 24">
                        <Path d="M21 6H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z" stroke={measurementMode ? DS.colors.success : DS.colors.primary} strokeWidth="1.8" fill="none" />
                        <Path d="M3 10h18M8 6v14M16 6v14" stroke={measurementMode ? DS.colors.success : DS.colors.primary} strokeWidth="1.8" fill="none" />
                      </Svg>
                    </Pressable>
                  )}
                  <TextInput
                    value={input} onChangeText={setInput}
                    placeholder="Describe your edit..." placeholderTextColor={DS.colors.primaryGhost}
                    multiline
                    style={{ flex: 1, backgroundColor: DS.colors.surfaceHigh, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primary, maxHeight: 80, borderWidth: 1, borderColor: DS.colors.border }}
                  />
                  {/* Mic button for voice input */}
                  <Animated.View style={pulseStyle}>
                    <Pressable
                      onPress={toggleRecording}
                      disabled={isTranscribing}
                      style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: isRecording ? DS.colors.error : DS.colors.surface,
                        borderWidth: 1.5,
                        borderColor: isRecording ? DS.colors.error : DS.colors.border,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {isTranscribing ? (
                        <CompassRoseLoader size="small" />
                      ) : (
                        <Svg width={16} height={16} viewBox="0 0 24 24">
                          <Path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" fill={DS.colors.primary} />
                          <Path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" fill={DS.colors.primary} />
                        </Svg>
                      )}
                    </Pressable>
                  </Animated.View>
                  <SendButton onPress={() => { void sendMessage(); }} loading={isLoading} />
                </View>
              </KeyboardAvoidingView>
            </>
          ) : (
            /* Suggestions tab */
            <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }} showsVerticalScrollIndicator={false}>
              {suggestions.length === 0 ? (
                <View style={{ marginTop: 24, alignItems: 'center' }}>
                  <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost, textAlign: 'center' }}>
                    No suggestions yet
                  </ArchText>
                  <ArchText variant="caption" style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: DS.colors.primaryGhost, textAlign: 'center', marginTop: 4 }}>
                    Suggestions will appear as the AI analyses your blueprint
                  </ArchText>
                </View>
              ) : (
                suggestions.map((s) => (
                  <SuggestionBubble
                    key={s.id}
                    suggestion={s}
                    onAccept={s.actionable ? () => handleSuggestionAccept(s.id) : undefined}
                    onDismiss={s.actionable ? () => handleSuggestionDismiss(s.id) : undefined}
                  />
                ))
              )}
              <View style={{ height: insets.bottom + 16 }} />
            </ScrollView>
          )}
        </Animated.View>
      )}
    </>
  );
}
