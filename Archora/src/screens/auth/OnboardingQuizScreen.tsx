import React, { useRef, useState, useCallback } from 'react';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../../components/common/ArchText';
import {
  View,
  Pressable,
  Dimensions,
  FlatList,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

import { useHaptics } from '../../hooks/useHaptics';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { aiService } from '../../services/aiService';
import { Storage } from '../../utils/storage';
import { supabase } from '../../utils/supabaseClient';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';


const { width } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Question definitions ────────────────────────────────────────────────────

type QuizAnswers = {
  buildingType: string;
  styles: string[];
  budget: number;
  household: string;
  priority: string;
};

const BUILDING_TYPE_OPTIONS = [
  { key: 'residential', label: 'Residential Home', icon: (c: string) => (
    <Svg width={36} height={36} viewBox="0 0 36 36">
      <Path d="M18 4 L32 16 V32 H24 V22 H12 V32 H4 V16 Z" stroke={c} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <Rect x="14" y="22" width="8" height="10" stroke={c} strokeWidth="1" fill="none" />
    </Svg>
  )},
  { key: 'apartment', label: 'Apartment', icon: (c: string) => (
    <Svg width={36} height={36} viewBox="0 0 36 36">
      <Rect x="6" y="6" width="24" height="26" rx="1" stroke={c} strokeWidth="1.5" fill="none" />
      <Rect x="10" y="10" width="5" height="4" rx="0.5" stroke={c} strokeWidth="1" fill="none" />
      <Rect x="21" y="10" width="5" height="4" rx="0.5" stroke={c} strokeWidth="1" fill="none" />
      <Rect x="10" y="19" width="5" height="4" rx="0.5" stroke={c} strokeWidth="1" fill="none" />
      <Rect x="21" y="19" width="5" height="4" rx="0.5" stroke={c} strokeWidth="1" fill="none" />
      <Rect x="14" y="28" width="8" height="4" stroke={c} strokeWidth="1" fill="none" />
    </Svg>
  )},
  { key: 'commercial', label: 'Commercial Space', icon: (c: string) => (
    <Svg width={36} height={36} viewBox="0 0 36 36">
      <Rect x="4" y="10" width="28" height="22" rx="1" stroke={c} strokeWidth="1.5" fill="none" />
      <Path d="M4 10 L18 4 L32 10" stroke={c} strokeWidth="1.5" fill="none" />
      <Rect x="8" y="16" width="8" height="6" rx="0.5" stroke={c} strokeWidth="1" fill="none" />
      <Rect x="20" y="16" width="8" height="6" rx="0.5" stroke={c} strokeWidth="1" fill="none" />
      <Rect x="14" y="26" width="8" height="6" stroke={c} strokeWidth="1" fill="none" />
    </Svg>
  )},
  { key: 'dream', label: 'Dream Project', icon: (c: string) => (
    <Svg width={36} height={36} viewBox="0 0 36 36">
      <Path d="M18 6 L20.5 13 H28 L22 17.5 L24.5 25 L18 20.5 L11.5 25 L14 17.5 L8 13 H15.5 Z" stroke={c} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
    </Svg>
  )},
];

const STYLE_OPTIONS = [
  { key: 'modern', label: 'Modern' },
  { key: 'traditional', label: 'Traditional' },
  { key: 'scandinavian', label: 'Scandinavian' },
  { key: 'industrial', label: 'Industrial' },
  { key: 'minimalist', label: 'Minimalist' },
  { key: 'mediterranean', label: 'Mediterranean' },
  { key: 'maximalist', label: 'Maximalist' },
  { key: 'japandi', label: 'Japandi' },
];

const HOUSEHOLD_OPTIONS = [
  { key: 'solo', label: 'Just me' },
  { key: 'couple', label: 'Couple' },
  { key: 'family', label: 'Family with kids' },
  { key: 'multigenerational', label: 'Multigenerational' },
  { key: 'housemates', label: 'Housemates' },
];

const PRIORITY_OPTIONS = [
  { key: 'light', label: 'Light & Space' },
  { key: 'functionality', label: 'Functionality' },
  { key: 'aesthetics', label: 'Aesthetics' },
  { key: 'sustainability', label: 'Sustainability' },
  { key: 'smart', label: 'Smart Home' },
];

const LOADING_LINES = [
  'Analysing your style...',
  'Generating floor plan...',
  'Furnishing your space...',
];

const BUDGET_MIN = 0;
const BUDGET_MAX = 500000;
const BUDGET_STEP = 10000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBudget(val: number): string {
  if (val >= 500000) return '£500k+';
  if (val >= 1000) return `£${Math.round(val / 1000)}k`;
  return `£${val}`;
}

function buildQuizPrompt(answers: QuizAnswers): string {
  const styles = answers.styles.length > 0
    ? answers.styles.join(', ')
    : 'contemporary';
  const budget = answers.budget >= 500000
    ? 'a generous budget (£500k+)'
    : answers.budget >= 250000
    ? 'a large budget (£250k–£500k)'
    : answers.budget >= 100000
    ? 'a moderate budget (£100k–£250k)'
    : 'a modest budget (under £100k)';
  const household = {
    solo: 'a single occupant',
    couple: 'a couple',
    family: 'a family with children',
    multigenerational: 'a multigenerational family',
    housemates: 'housemates sharing a space',
  }[answers.household] ?? 'occupants';
  const priority = {
    light: 'light and open space',
    functionality: 'practical functionality',
    aesthetics: 'striking aesthetics',
    sustainability: 'sustainable materials and efficiency',
    smart: 'smart home technology integration',
  }[answers.priority] ?? 'comfort';
  const type = {
    residential: 'residential home',
    apartment: 'apartment',
    commercial: 'commercial space',
    dream: 'bespoke architectural project',
  }[answers.buildingType] ?? 'property';

  return `A ${styles} ${type} for ${household} with ${budget}, prioritising ${priority}. Create a complete floor plan that reflects this vision.`;
}

// ─── SelectionCard ────────────────────────────────────────────────────────────

function SelectionCard({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: (c: string) => React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(1.04, { damping: 10, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 14, stiffness: 300 });
    });
    onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          animStyle,
          {
            width: 86,
            height: 86,
            borderRadius: 50,
            borderWidth: selected ? 2 : 1,
            borderColor: selected ? DS.colors.primary : DS.colors.border,
            backgroundColor: selected ? `${DS.colors.primary}18` : DS.colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          },
        ]}
      >
        {icon && icon(selected ? DS.colors.primary : DS.colors.primaryGhost)}
        <ArchText variant="body"
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 11,
            color: selected ? DS.colors.primary : DS.colors.primaryDim,
            textAlign: 'center',
            paddingHorizontal: 4,
          }}
          numberOfLines={2}
        >
          {label}
        </ArchText>
      </Animated.View>
    </Pressable>
  );
}

// ─── BudgetSlider ─────────────────────────────────────────────────────────────

function BudgetSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const TRACK_W = width - 80;
  const thumbX = useSharedValue(((value - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * TRACK_W);
  const savedX = useSharedValue(thumbX.value);

  const setVal = useCallback(
    (x: number) => {
      const clamped = Math.max(0, Math.min(TRACK_W, x));
      const raw = (clamped / TRACK_W) * (BUDGET_MAX - BUDGET_MIN) + BUDGET_MIN;
      const stepped = Math.round(raw / BUDGET_STEP) * BUDGET_STEP;
      onChange(stepped);
    },
    [TRACK_W, onChange],
  );

  const panGesture = Gesture.Pan()
    .onStart(() => { savedX.value = thumbX.value; })
    .onUpdate((e) => {
      const next = Math.max(0, Math.min(TRACK_W, savedX.value + e.translationX));
      thumbX.value = next;
      runOnJS(setVal)(next);
    });

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: thumbX.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: thumbX.value }));

  const percentage = (value - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN);

  return (
    <View style={{ alignItems: 'center', gap: 16 }}>
      <ArchText variant="body"
        style={{
          fontFamily: 'ArchitectsDaughter_400Regular',
          fontSize: 28,
          color: DS.colors.primary,
        }}
      >
        {formatBudget(value)}
      </ArchText>

      <View style={{ width: TRACK_W, height: 28, justifyContent: 'center' }}>
        {/* Track background */}
        <View
          style={{
            height: 4,
            backgroundColor: DS.colors.border,
            borderRadius: 2,
            overflow: 'visible',
          }}
        >
          {/* Fill */}
          <Animated.View
            style={[
              fillStyle,
              {
                height: 4,
                backgroundColor: DS.colors.primary,
                borderRadius: 2,
              },
            ]}
          />
        </View>

        {/* Thumb */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              thumbStyle,
              {
                position: 'absolute',
                left: -12,
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: DS.colors.primary,
                borderWidth: 3,
                borderColor: DS.colors.background,
                shadowColor: DS.colors.primary,
                shadowOpacity: 0.4,
                shadowRadius: 6,
                elevation: 4,
              },
            ]}
          />
        </GestureDetector>
      </View>

      {/* Labels */}
      <View style={{ flexDirection: 'row', width: TRACK_W, justifyContent: 'space-between' }}>
        {['£0', '£100k', '£250k', '£500k+'].map((lbl) => (
          <ArchText variant="body"
            key={lbl}
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 11,
              color: DS.colors.primaryGhost,
            }}
          >
            {lbl}
          </ArchText>
        ))}
      </View>
    </View>
  );
}

// ─── LoadingOverlay ────────────────────────────────────────────────────────────

function LoadingOverlay() {
  const [lineIndex, setLineIndex] = useState(0);
  const opacity = useSharedValue(1);
  const textOpacity = useSharedValue(1);

  React.useEffect(() => {
    const interval = setInterval(() => {
      textOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setLineIndex)((i) => (i + 1) % LOADING_LINES.length);
        textOpacity.value = withTiming(1, { duration: 300 });
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [textOpacity]);

  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  return (
    <View
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: DS.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        zIndex: 100,
      }}
    >
      <CompassRoseLoader size="large" />
      <Animated.Text
        style={[
          textStyle,
          {
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 20,
            color: DS.colors.primary,
            textAlign: 'center',
          },
        ]}
      >
        {LOADING_LINES[lineIndex]}
      </Animated.Text>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export function OnboardingQuizScreen() {
  const navigation = useNavigation<Nav>();
  
  const { light, medium } = useHaptics();
  const loadBlueprint = useBlueprintStore((s) => s.actions.loadBlueprint);

  const listRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const [answers, setAnswers] = useState<QuizAnswers>({
    buildingType: '',
    styles: [],
    budget: 150000,
    household: '',
    priority: '',
  });

  const canAdvance = useCallback(() => {
    switch (currentIndex) {
      case 0: return answers.buildingType !== '';
      case 1: return answers.styles.length > 0;
      case 2: return true; // slider always has a value
      case 3: return answers.household !== '';
      case 4: return answers.priority !== '';
      default: return false;
    }
  }, [currentIndex, answers]);

  const goNext = useCallback(() => {
    if (!canAdvance()) return;
    light();
    if (currentIndex < 4) {
      const next = currentIndex + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    } else {
      void handleComplete();
    }
  }, [currentIndex, canAdvance, light]);

  const handleComplete = async () => {
    medium();
    setIsGenerating(true);

    try {
      Storage.set('asoria_quiz_done', 'true');

      // Upsert quiz answers to Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from('user_quiz_answers').upsert({
          user_id: session.user.id,
          answers: answers as unknown as Record<string, unknown>,
          completed_at: new Date().toISOString(),
        });
      }

      const prompt = buildQuizPrompt(answers);
      const blueprint = await aiService.generateFloorPlan({
        prompt,
        buildingType: answers.buildingType as 'house' | 'apartment' | 'office' | 'studio' | 'villa' | 'commercial',
        style: answers.styles[0],
      });
      loadBlueprint(blueprint);

      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch {
      // Even if AI fails, proceed to main with empty state
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  const toggleStyle = (key: string) => {
    setAnswers((prev) => ({
      ...prev,
      styles: prev.styles.includes(key)
        ? prev.styles.filter((s) => s !== key)
        : [...prev.styles, key],
    }));
  };

  const SLIDES = [
    // Q1 — Building type
    <View key="q1" style={{ width, paddingHorizontal: 32 }}>
      <ArchText variant="body" style={styles.question}>What are you designing?</ArchText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 32 }}>
        {BUILDING_TYPE_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.key}
            label={opt.label}
            icon={opt.icon}
            selected={answers.buildingType === opt.key}
            onPress={() => setAnswers((p) => ({ ...p, buildingType: opt.key }))}
          />
        ))}
      </View>
    </View>,

    // Q2 — Style (multi-select)
    <View key="q2" style={{ width, paddingHorizontal: 32 }}>
      <ArchText variant="body" style={styles.question}>Your style?</ArchText>
      <ArchText variant="body" style={styles.sub}>Pick all that apply</ArchText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 24 }}>
        {STYLE_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.key}
            label={opt.label}
            selected={answers.styles.includes(opt.key)}
            onPress={() => toggleStyle(opt.key)}
          />
        ))}
      </View>
    </View>,

    // Q3 — Budget slider
    <View key="q3" style={{ width, paddingHorizontal: 32, alignItems: 'center' }}>
      <ArchText variant="body" style={styles.question}>Budget range?</ArchText>
      <View style={{ marginTop: 48 }}>
        <BudgetSlider
          value={answers.budget}
          onChange={(v) => setAnswers((p) => ({ ...p, budget: v }))}
        />
      </View>
    </View>,

    // Q4 — Household
    <View key="q4" style={{ width, paddingHorizontal: 32 }}>
      <ArchText variant="body" style={styles.question}>Who lives here?</ArchText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 32 }}>
        {HOUSEHOLD_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.key}
            label={opt.label}
            selected={answers.household === opt.key}
            onPress={() => setAnswers((p) => ({ ...p, household: opt.key }))}
          />
        ))}
      </View>
    </View>,

    // Q5 — Priority
    <View key="q5" style={{ width, paddingHorizontal: 32 }}>
      <ArchText variant="body" style={styles.question}>What matters most?</ArchText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 32 }}>
        {PRIORITY_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.key}
            label={opt.label}
            selected={answers.priority === opt.key}
            onPress={() => setAnswers((p) => ({ ...p, priority: opt.key }))}
          />
        ))}
      </View>
    </View>,
  ];

  const ready = canAdvance();

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
      {/* Header */}
      <View style={{ paddingTop: 60, paddingHorizontal: 32, paddingBottom: 8 }}>
        <ArchText variant="body"
          style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 14,
            color: DS.colors.primaryGhost,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}
        >
          ASORIA · Personalise
        </ArchText>
        {/* Progress bar */}
        <View style={{ height: 2, backgroundColor: DS.colors.border, borderRadius: 1, marginTop: 12, overflow: 'hidden' }}>
          <Animated.View
            style={{
              height: 2,
              backgroundColor: DS.colors.primary,
              borderRadius: 1,
              width: `${((currentIndex + 1) / 5) * 100}%`,
            }}
          />
        </View>
        <ArchText variant="body"
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 12,
            color: DS.colors.primaryGhost,
            marginTop: 6,
          }}
        >
          {currentIndex + 1} of 5
        </ArchText>
      </View>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={{ width, flex: 1, justifyContent: 'center' }}>{item}</View>
        )}
        style={{ flex: 1 }}
      />

      {/* CTA */}
      <View style={{ paddingHorizontal: 32, paddingBottom: 56 }}>
        <Pressable
          onPress={goNext}
          disabled={!ready || isGenerating}
          style={{
            backgroundColor: ready ? DS.colors.primary : DS.colors.border,
            borderRadius: 24,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: ready ? 1 : 0.5,
          }}
        >
          <ArchText variant="body"
            style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 17,
              color: ready ? DS.colors.background : DS.colors.primaryGhost,
            }}
          >
            {currentIndex === 4 ? 'Generate My Space' : 'Next'}
          </ArchText>
        </Pressable>
      </View>

      {/* Loading overlay */}
      {isGenerating && <LoadingOverlay />}
    </View>
  );
}

const styles = {
  question: {
    fontFamily: 'ArchitectsDaughter_400Regular',
    fontSize: 26,
    color: DS.colors.primary,
    textAlign: 'center' as const,
    lineHeight: 34,
  },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: DS.colors.primaryGhost,
    textAlign: 'center' as const,
    marginTop: 4,
  },
};
