import { DS } from '../../theme/designSystem';
import { SUNRISE } from '../../theme/sunrise';
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, Pressable, TextInput, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArchText } from '../common/ArchText';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { AIProcessingIndicator } from '../common/AIProcessingIndicator';
import { CompassRoseLoader } from '../common/CompassRoseLoader';
import { ConfirmationCard } from './ConfirmationCard';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { aiService } from '../../services/aiService';
import type { ChatMessage, BlueprintData } from '../../types/blueprint';

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
      <View style={{ backgroundColor: isUser ? DS.colors.surfaceHigh : SUNRISE.elevated, borderRadius: 16, borderBottomRightRadius: isUser ? 4 : 16, borderBottomLeftRadius: isUser ? 16 : 4, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: isUser ? DS.colors.primary + '30' : SUNRISE.violetBorder }}>
        <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primary, lineHeight: 18 }}>{msg.content}</ArchText>
      </View>
      <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 9, color: DS.colors.primaryGhost, marginTop: 2, alignSelf: isUser ? 'flex-end' : 'flex-start', paddingHorizontal: 4 }}>
        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </ArchText>
    </View>
  );
}

interface Props { visible: boolean; onToggle: () => void; }

export function AIChatPanel({ visible, onToggle }: Props) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingBlueprint, setPendingBlueprint] = useState<BlueprintData | null>(null);
  const [pendingMessage, setPendingMessage] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const panelY = useSharedValue(400);

  const blueprint = useBlueprintStore((s) => s.blueprint);
  const selectedId = useBlueprintStore((s) => s.selectedId);
  const currentFloorIndex = useBlueprintStore((s) => s.currentFloorIndex);
  const addChatMessage = useBlueprintStore((s) => s.actions.addChatMessage);
  const loadBlueprint = useBlueprintStore((s) => s.actions.loadBlueprint);

  // Build selected-object context for AI
  const selectedContext = (() => {
    if (!selectedId || !blueprint) return '';
    const walls = blueprint.walls ?? [];
    const rooms = blueprint.rooms ?? [];
    const furniture = blueprint.furniture ?? [];
    const wall = walls.find((w) => w.id === selectedId);
    if (wall) return `[Selected: wall "${wall.id}" texture=${wall.texture ?? 'plain'}]`;
    const room = rooms.find((r) => r.id === selectedId);
    if (room) return `[Selected: room "${room.name}" area=${room.area}m²]`;
    const piece = furniture.find((f) => f.id === selectedId);
    if (piece) return `[Selected: ${piece.name} (${piece.category}) at position (${piece.position.x.toFixed(1)}, ${piece.position.z.toFixed(1)})]`;
    return '';
  })();

  React.useEffect(() => {
    panelY.value = visible
      ? withSpring(0, { damping: 22, stiffness: 280 })
      : withTiming(400, { duration: 220 });
  }, [visible, panelY]);

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: panelY.value }] }));

  const recentMessages = (blueprint?.chatHistory ?? []).slice(-5);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading || !blueprint) return;
    setInput('');
    setIsLoading(true);

    const userMsg: ChatMessage = { id: `msg_${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString() };
    addChatMessage(userMsg);

    try {
      const enrichedPrompt = selectedContext ? `${text}\n\n${selectedContext}` : text;
      const data = await aiService.editBlueprint({ prompt: enrichedPrompt, blueprint });

      if (data.blueprint) {
        setPendingBlueprint(data.blueprint);
        setPendingMessage(data.message ?? 'Blueprint updated.');
        addChatMessage({ id: `msg_${Date.now()}_r`, role: 'assistant', content: data.message ?? 'Done! Review the changes below.', timestamp: new Date().toISOString() });
      } else {
        addChatMessage({ id: `msg_${Date.now()}_r`, role: 'assistant', content: data.message ?? "Couldn't apply that change.", timestamp: new Date().toISOString() });
      }
    } catch {
      addChatMessage({ id: `msg_${Date.now()}_e`, role: 'assistant', content: "Sorry, I couldn't process that. Please try again.", timestamp: new Date().toISOString() });
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, isLoading, blueprint, addChatMessage, selectedContext]);

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
        <Animated.View style={[panelStyle, { position: 'absolute', bottom: 0, left: 0, right: 0, height: 380, backgroundColor: SUNRISE.glass.prominentBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderTopColor: SUNRISE.sheetTopBorder }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: SUNRISE.separatorLine }}>
            <ChatBubbleIcon color={DS.colors.primary} />
            <ArchText variant="heading" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 16, color: DS.colors.primary, marginLeft: 8, flex: 1 }}>AI Blueprint Editor</ArchText>
            <Pressable onPress={onToggle} style={{ padding: 8 }}><ArchText variant="body" style={{ color: DS.colors.primaryDim, fontSize: 18 }}>✕</ArchText></Pressable>
          </View>

          <ScrollView ref={scrollRef} style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }} showsVerticalScrollIndicator={false} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
            {recentMessages.length === 0 && (
              <View style={{ marginTop: 16, marginBottom: 8 }}>
                <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost, textAlign: 'center' }}>
                  Ask me to edit your blueprint
                </ArchText>
                <View style={{ marginTop: 12, gap: 6 }}>
                  {[
                    '"Move the sofa to the bedroom"',
                    '"Add a window on the north wall"',
                    '"Change the kitchen floor to oak"',
                    '"Make the living room bigger"',
                    '"Add a second floor with 2 bedrooms"',
                  ].map((example) => (
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

          {/* Confirmation preview — shown only when AI returned a proposed change */}
          {pendingBlueprint && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <ConfirmationCard
                original={blueprint!}
                proposed={pendingBlueprint!}
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

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(12, insets.bottom + 8), borderTopWidth: 1, borderTopColor: SUNRISE.separatorLine, backgroundColor: SUNRISE.glass.subtleBg, gap: 10 }}>
              <TextInput
                value={input} onChangeText={setInput}
                placeholder="Describe your edit..." placeholderTextColor={DS.colors.primaryGhost}
                multiline
                style={{ flex: 1, backgroundColor: DS.colors.surfaceHigh, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primary, maxHeight: 80, borderWidth: 1, borderColor: DS.colors.border }}
              />
              <SendButton onPress={() => { void sendMessage(); }} loading={isLoading} />
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </>
  );
}
