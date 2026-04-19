import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { randomUUID } from 'expo-crypto';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { DS } from '../../theme/designSystem';
import { aiService } from '../../services/aiService';
import { ArchText } from '../common/ArchText';
import { CompassRoseLoader } from '../common/CompassRoseLoader';
import type { ChatMessage } from '../../types/blueprint';
import type { ConsultationSummary, QuestionCategory } from '../../types/generation';
import type { GenerationPayload } from '../../types/generation';
import type { Tier } from '../../utils/tierLimits';

// ─── Phase transition messages ─────────────────────────────────────────────
const PHASE_DIVIDERS: Partial<Record<QuestionCategory, string>> = {
  lifestyle: "Now let's talk about how you actually live...",
  future: 'A few questions about the future...',
  sustainability: 'How do you feel about sustainability?',
  measurement: "Let's get precise...",
  budget: 'And finally, the practical side...',
  architect_philosophy: 'One last thing...',
};

const QUESTION_CATEGORIES: QuestionCategory[] = [
  'qualification',
  'lifestyle',
  'future',
  'sustainability',
  'measurement',
  'budget',
  'architect_philosophy',
];

// ─── Tier badge colour ───────────────────────────────────────────────────────
const TIER_COLORS: Record<Tier, string> = {
  starter: '#9A9590',
  creator: '#7AB87A',
  pro: '#D4A84B',
  architect: '#C8C8C8',
};

const TIER_LABELS: Record<Tier, string> = {
  starter: 'Starter',
  creator: 'Creator',
  pro: 'Pro',
  architect: 'Architect',
};

// ─── Typing dots ─────────────────────────────────────────────────────────────
function TypingIndicator() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const common = { duration: 400, easing: Easing.inOut(Easing.ease) };
    dot1.value = withRepeat(withTiming(1, { ...common, duration: 300 }), -1, true);
    dot2.value = withRepeat(withTiming(1, { ...common, duration: 300 }), -1, true);
    dot3.value = withRepeat(withTiming(1, { ...common, duration: 300 }), -1, true);
  }, [dot1, dot2, dot3]);

  const style1 = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const style2 = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const style3 = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: DS.spacing.sm }}>
      <View
        style={{
          backgroundColor: DS.colors.surface,
          borderRadius: DS.radius.card,
          paddingHorizontal: DS.spacing.md,
          paddingVertical: DS.spacing.sm,
          borderWidth: 1,
          borderColor: 'rgba(240, 237, 232, 0.08)',
        }}
      >
        <View style={{ flexDirection: 'row', gap: 5 }}>
          <Animated.View style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: DS.colors.primaryDim }, style1]} />
          <Animated.View style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: DS.colors.primaryDim }, style2]} />
          <Animated.View style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: DS.colors.primaryDim }, style3]} />
        </View>
      </View>
    </View>
  );
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────
interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === 'user';
  return (
    <View style={{ alignItems: isUser ? 'flex-end' : 'flex-start', marginBottom: DS.spacing.sm }}>
      <View
        style={{
          backgroundColor: isUser ? DS.colors.surfaceHigh : DS.colors.surface,
          borderRadius: DS.radius.card,
          paddingHorizontal: DS.spacing.md,
          paddingVertical: DS.spacing.sm + 2,
          maxWidth: '78%',
          borderWidth: isUser ? 0 : 1,
          borderColor: isUser ? 'transparent' : 'rgba(200, 200, 200, 0.10)',
          ...(isUser ? {} : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 3,
          }),
        }}
      >
        <ArchText
          variant="body"
          style={{ fontSize: DS.fontSize.sm, lineHeight: DS.fontSize.sm * 1.6, color: DS.colors.primary }}
        >
          {content}
        </ArchText>
      </View>
    </View>
  );
}

// ─── Suggested reply chip ────────────────────────────────────────────────────
interface SuggestedRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
}

function SuggestedReplies({ replies, onSelect }: SuggestedRepliesProps) {
  if (!replies.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.xs, marginBottom: DS.spacing.sm, paddingLeft: DS.spacing.xs }}>
      {replies.map((reply, i) => (
        <Pressable
          key={i}
          onPress={() => onSelect(reply)}
          style={{
            backgroundColor: 'rgba(240, 237, 232, 0.05)',
            borderRadius: DS.radius.chip,
            paddingHorizontal: DS.spacing.md,
            paddingVertical: DS.spacing.xs + 2,
            borderWidth: 1,
            borderColor: 'rgba(240, 237, 232, 0.10)',
          }}
        >
          <ArchText variant="label" style={{ fontSize: DS.fontSize.xs, color: DS.colors.primary }}>
            {reply}
          </ArchText>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Phase divider ───────────────────────────────────────────────────────────
interface PhaseDividerProps {
  message: string;
}

function PhaseDivider({ message }: PhaseDividerProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: DS.spacing.md,
        paddingHorizontal: DS.spacing.xs,
      }}
    >
      <View style={{ flex: 1, height: 1, backgroundColor: DS.colors.border }} />
      <ArchText
        variant="caption"
        style={{
          flex: 2.5,
          textAlign: 'center',
          fontFamily: DS.font.regular,
          fontSize: DS.fontSize.xs,
          color: DS.colors.primaryGhost,
          paddingHorizontal: DS.spacing.sm,
        }}
      >
        {message}
      </ArchText>
      <View style={{ flex: 1, height: 1, backgroundColor: DS.colors.border }} />
    </View>
  );
}

// ─── Progress step pill ─────────────────────────────────────────────────────
interface ProgressStepsProps {
  currentCategory: QuestionCategory;
}

function ProgressSteps({ currentCategory }: ProgressStepsProps) {
  const stepLabels = ['Qualification', 'Lifestyle', 'Future', 'Sustainability', 'Measure', 'Budget', 'Review'];
  const currentIndex = QUESTION_CATEGORIES.indexOf(currentCategory);
  const displaySteps = stepLabels.slice(0, -1);
  const isReview = currentIndex >= QUESTION_CATEGORIES.length - 1 || currentCategory === 'architect_philosophy';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: DS.spacing.xs }}>
      {isReview
        ? (
          <View
            style={{
              backgroundColor: DS.colors.success + '25',
              borderRadius: DS.radius.chip,
              paddingHorizontal: DS.spacing.md,
              paddingVertical: DS.spacing.xs,
              borderWidth: 1,
              borderColor: DS.colors.success + '60',
            }}
          >
            <ArchText
              variant="caption"
              style={{ fontFamily: DS.font.mono, fontSize: 10, color: DS.colors.success, textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              Complete
            </ArchText>
          </View>
        )
        : displaySteps.map((label, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <View
              key={label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: DS.spacing.xxs,
              }}
            >
              <View
                style={{
                  width: DS.spacing.xs,
                  height: DS.spacing.xs,
                  borderRadius: DS.spacing.xxs,
                  backgroundColor: done || active ? DS.colors.primary : DS.colors.border,
                }}
              />
            </View>
          );
        })}
    </View>
  );
}

// ─── Summary card ───────────────────────────────────────────────────────────
interface SummaryCardProps {
  summary: ConsultationSummary;
  onContinue: () => void;
}

function SummaryCard({ summary, onContinue }: SummaryCardProps) {
  const insights = [
    { label: 'Household', value: `${summary.householdSize} people — ${summary.householdDescription}` },
    { label: 'Daily Routine', value: summary.dailyRoutine },
    { label: 'Entertaining', value: summary.entertainingFrequency },
    { label: 'Key Needs', value: summary.keyFrustrations.slice(0, 2).join(', ') || '—' },
    { label: 'Future Plans', value: summary.futurePlans.slice(0, 2).join(', ') || '—' },
    { label: 'Sustainability', value: summary.sustainabilityInterest },
  ];

  return (
    <View
      style={{
        backgroundColor: DS.colors.surfaceHigh,
        borderRadius: DS.radius.card,
        padding: DS.spacing.lg,
        borderWidth: 1,
        borderColor: DS.colors.border,
        marginBottom: DS.spacing.md,
      }}
    >
      <ArchText variant="heading" style={{ fontSize: DS.fontSize.lg, marginBottom: DS.spacing.md }}>
        Consultation Complete
      </ArchText>
      <View style={{ gap: DS.spacing.sm }}>
        {insights.map(({ label, value }) => (
          <View key={label} style={{ flexDirection: 'row', gap: DS.spacing.sm }}>
            <ArchText
              variant="label"
              style={{ fontSize: DS.fontSize.xs, color: DS.colors.primaryGhost, minWidth: 80 }}
            >
              {label}
            </ArchText>
            <ArchText
              variant="body"
              style={{ fontSize: DS.fontSize.xs, color: DS.colors.primary, flex: 1 }}
            >
              {value}
            </ArchText>
          </View>
        ))}
      </View>
      <Pressable
        onPress={onContinue}
        style={{
          backgroundColor: DS.colors.primary,
          borderRadius: DS.radius.button,
          paddingVertical: DS.spacing.sm + 2,
          alignItems: 'center',
          marginTop: DS.spacing.lg,
        }}
      >
        <ArchText
          variant="label"
          style={{ fontFamily: DS.font.semibold, fontSize: DS.fontSize.sm, color: DS.colors.background }}
        >
          Continue to Review
        </ArchText>
      </Pressable>
    </View>
  );
}

// ─── Tier badge ─────────────────────────────────────────────────────────────
interface TierBadgeProps {
  tier: Tier;
}

function TierBadge({ tier }: TierBadgeProps) {
  const color = TIER_COLORS[tier];
  return (
    <View
      style={{
        backgroundColor: color + '20',
        borderRadius: DS.radius.chip,
        paddingHorizontal: DS.spacing.sm,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: color + '60',
      }}
    >
      <ArchText
        variant="caption"
        style={{ fontFamily: DS.font.mono, fontSize: 9, color, textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {TIER_LABELS[tier]}
      </ArchText>
    </View>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export interface ConsultationChatProps {
  tier: Tier;
  architectId: string | null;
  structuredPayload: {
    buildingType?: GenerationPayload['buildingType'];
    plotSize?: number;
    plotUnit?: 'm2' | 'ft2';
    bedrooms?: number;
    bathrooms?: number;
    livingAreas?: number;
    hasGarage?: boolean;
    hasGarden?: boolean;
    hasPool?: boolean;
    poolSize?: 'small' | 'medium' | 'large';
    hasHomeOffice?: boolean;
    hasUtilityRoom?: boolean;
    style?: string;
  };
  onComplete: (summary: ConsultationSummary, updatedPayload: GenerationPayload) => void;
  onBack: () => void;
}

interface AIResponse {
  message: string;
  suggestedReplies: string[];
  updatedPayload: Partial<GenerationPayload>;
  isComplete: boolean;
  nextCategory: QuestionCategory;
  sessionId: string;
}

export function ConsultationChat({
  tier,
  architectId,
  structuredPayload,
  onComplete,
  onBack,
}: ConsultationChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentCategory, setCurrentCategory] = useState<QuestionCategory>('qualification');
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [sessionId] = useState(() => randomUUID());
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [currentSummary, setCurrentSummary] = useState<ConsultationSummary | null>(null);
  const [updatedPayload, setUpdatedPayload] = useState<Partial<GenerationPayload>>({});
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Tracks the previous category to detect transitions
  const prevCategoryRef = useRef<QuestionCategory>('qualification');
  const scrollRef = useRef<ScrollView>(null);

  const sendToAI = useCallback(
    async (history: ChatMessage[]): Promise<AIResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await aiService.consultWithArchitect({
          tier,
          architectId,
          conversationHistory: history,
          currentPayload: structuredPayload,
          sessionId,
        });

        setMessages(prev => [
          ...prev,
          {
            id: randomUUID(),
            role: 'assistant',
            content: response.message,
            timestamp: new Date().toISOString(),
          },
        ]);
        setCurrentCategory(response.nextCategory);
        setSuggestedReplies(response.suggestedReplies);

        if (response.isComplete) {
          setIsComplete(true);
          setCurrentSummary({
            tier: tier as ConsultationSummary['tier'],
            architectId,
            projectType: 'new',
            siteStatus: 'owned',
            timeline: 'exploring',
            budgetRange: 'flexible',
            householdSize: structuredPayload.bedrooms ?? 1,
            householdDescription: '',
            dailyRoutine: '',
            entertainingFrequency: 'rarely',
            keyFrustrations: [],
            futurePlans: [],
            sustainabilityInterest: 'some',
            accessibilityNeeds: false,
            materialPreferences: [],
            measurementStatus: 'approximate',
            architectInsights: [],
            ...response.updatedPayload,
          } as ConsultationSummary);
          setUpdatedPayload(response.updatedPayload as GenerationPayload);
        }

        return response;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Consultation failed';
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [tier, architectId, sessionId, structuredPayload],
  );

  // On mount: get first question
  useEffect(() => {
    sendToAI([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, suggestedReplies]);

  const handleReply = useCallback(
    (reply: string) => {
      const userMsg: ChatMessage = {
        id: randomUUID(),
        role: 'user',
        content: reply,
        timestamp: new Date().toISOString(),
      };
      const newHistory = [...messages, userMsg];
      setMessages(newHistory);
      setQuestionsAsked(prev => prev + 1);
      setSuggestedReplies([]);
      sendToAI(newHistory);
    },
    [messages, sendToAI],
  );

  const handleContinue = useCallback(() => {
    if (currentSummary) {
      onComplete(currentSummary, updatedPayload as GenerationPayload);
    }
  }, [currentSummary, updatedPayload, onComplete]);

  // Voice recording
  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
    } catch {
      // silently fail
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    setIsRecording(false);
    setIsTranscribing(true);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) return;
      const text = await aiService.transcribeAudio(uri);
      if (text) {
        setInputText((prev) => (prev ? `${prev}\n${text}` : text).slice(0, 500));
      }
    } catch {
      // silently fail
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) void stopRecording();
    else void startRecording();
  }, [isRecording, startRecording, stopRecording]);

  // Build rendered messages with phase dividers
  const renderedItems: React.ReactNode[] = [];
  messages.forEach((msg, i) => {
    const prevCat = prevCategoryRef.current;

    // Detect category change (after assistant messages)
    if (msg.role === 'assistant' && currentCategory !== prevCat && PHASE_DIVIDERS[currentCategory]) {
      renderedItems.push(
        <PhaseDivider key={`div-${i}`} message={PHASE_DIVIDERS[currentCategory]!} />,
      );
    }

    renderedItems.push(<ChatBubble key={msg.id} role={msg.role} content={msg.content} />);

    // Show suggested replies after each assistant message (except after last if complete)
    if (msg.role === 'assistant' && i === messages.length - 1 && !isComplete) {
      renderedItems.push(
        <SuggestedReplies
          key={`replies-${i}`}
          replies={suggestedReplies}
          onSelect={handleReply}
        />,
      );
    }
  });

  // Update previous category ref after render
  useEffect(() => {
    prevCategoryRef.current = currentCategory;
  }, [currentCategory]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: DS.colors.background }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: DS.spacing.md,
          paddingVertical: DS.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: DS.colors.border,
        }}
      >
        <Pressable onPress={onBack} hitSlop={8}>
          <ArchText variant="label" style={{ color: DS.colors.primaryGhost }}>{'< Back'}</ArchText>
        </Pressable>
        <View style={{ alignItems: 'center', gap: DS.spacing.xs }}>
          <ArchText variant="heading" style={{ fontSize: DS.fontSize.lg }}>
            Architect Consultation
          </ArchText>
          <ProgressSteps currentCategory={currentCategory} />
        </View>
        <TierBadge tier={tier} />
      </View>

      {/* Error banner */}
      {error && (
        <View
          style={{
            backgroundColor: DS.colors.error + '20',
            paddingHorizontal: DS.spacing.md,
            paddingVertical: DS.spacing.xs,
            borderBottomWidth: 1,
            borderBottomColor: DS.colors.error + '40',
          }}
        >
          <ArchText variant="caption" style={{ color: DS.colors.error, textAlign: 'center' }}>
            {error}
          </ArchText>
        </View>
      )}

      {/* Chat area */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: DS.spacing.md,
          paddingTop: DS.spacing.md,
          paddingBottom: DS.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {renderedItems}

        {isLoading && <TypingIndicator />}

        {isComplete && currentSummary && (
          <SummaryCard summary={currentSummary} onContinue={handleContinue} />
        )}
      </ScrollView>

      {/* Input area */}
      {!isComplete && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: DS.spacing.md,
            paddingVertical: DS.spacing.sm,
            borderTopWidth: 1,
            borderTopColor: DS.colors.border,
            backgroundColor: DS.colors.background,
            gap: DS.spacing.sm,
          }}
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your reply..."
            placeholderTextColor={DS.colors.primaryGhost}
            multiline
            style={{
              flex: 1,
              backgroundColor: DS.colors.surfaceHigh,
              borderRadius: DS.radius.input,
              paddingHorizontal: DS.spacing.md,
              paddingVertical: DS.spacing.sm,
              fontFamily: 'Inter_400Regular',
              fontSize: DS.fontSize.sm,
              color: DS.colors.primary,
              maxHeight: 80,
              borderWidth: 1,
              borderColor: DS.colors.border,
            }}
          />
          {/* Mic button for voice input */}
          <Pressable
            onPress={toggleRecording}
            disabled={isTranscribing}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: isRecording ? DS.colors.error : DS.colors.surface,
              borderWidth: 1.5,
              borderColor: isRecording ? DS.colors.error : DS.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isTranscribing ? (
              <CompassRoseLoader size="small" />
            ) : (
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path
                  d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
                  fill={isRecording ? DS.colors.background : DS.colors.primary}
                />
                <Path
                  d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
                  fill={isRecording ? DS.colors.background : DS.colors.primary}
                />
              </Svg>
            )}
          </Pressable>
          {/* Send button */}
          <Pressable
            onPress={() => {
              const text = inputText.trim();
              if (text) {
                handleReply(text);
                setInputText('');
              }
            }}
            disabled={!inputText.trim() || isLoading}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: inputText.trim() ? DS.colors.primary : DS.colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={18} height={18} viewBox="0 0 20 20">
              <Path
                d="M10 2 L11.5 7 L17 7 L12.5 10.5 L14 16 L10 13 L6 16 L7.5 10.5 L3 7 L8.5 7 Z"
                fill={inputText.trim() ? DS.colors.background : DS.colors.primaryGhost}
              />
            </Svg>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
