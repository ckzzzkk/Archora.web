import React, { useRef, useState } from 'react';
import { View, FlatList, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line, Rect, G } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OvalButton } from '../../components/common/OvalButton';
import { ArchText } from '../../components/common/ArchText';
import { DS } from '../../theme/designSystem';
import { Storage } from '../../utils/storage';
import type { RootStackParamList } from '../../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: 'compass' | 'ruler' | 'cube' | 'people';
  title: string;
  desc: string;
}

const SLIDES: Slide[] = [
  { id: '0', icon: 'compass', title: 'Design with AI',  desc: 'Describe your vision and watch ARIA build it in seconds.' },
  { id: '1', icon: 'ruler',   title: 'Sketch & Refine', desc: 'Draw floor plans, drag furniture, perfect every detail.' },
  { id: '2', icon: 'cube',    title: 'See it in 3D',    desc: 'Walk through your design before the first brick is laid.' },
  { id: '3', icon: 'people',  title: 'Share & Inspire', desc: 'Publish templates and earn revenue from your designs.' },
];

function SlideIcon({ icon }: { icon: Slide['icon'] }) {
  const primary = DS.colors.primary;
  const dim = DS.colors.primaryDim;
  const ghost = DS.colors.primaryGhost as string;

  switch (icon) {
    case 'compass':
      return (
        <Svg width={100} height={100} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" stroke={primary} strokeWidth="1.5" fill="none" />
          <Path d="M50 20 L44 50 L50 46 L56 50 Z" fill={primary} />
          <Path d="M50 80 L44 50 L50 54 L56 50 Z" fill={dim} />
          <Path d="M20 50 L50 44 L46 50 L50 56 Z" fill={dim} />
          <Path d="M80 50 L50 44 L54 50 L50 56 Z" fill={dim} />
          <Circle cx="50" cy="50" r="4" fill={primary} />
        </Svg>
      );
    case 'ruler':
      return (
        <Svg width={100} height={100} viewBox="0 0 100 100">
          {/* Pencil */}
          <Path d="M30 70 L60 20 L70 30 L40 80 Z" stroke={primary} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
          <Path d="M60 20 L68 12 L78 22 L70 30 Z" stroke={primary} strokeWidth="1.5" fill={primary} fillOpacity={0.15} />
          <Path d="M30 70 L26 78 L38 80 Z" stroke={primary} strokeWidth="1.5" fill="none" />
          {/* Ruler */}
          <Rect x="55" y="55" width="30" height="14" rx="2" stroke={dim} strokeWidth="1.5" fill="none" transform="rotate(-30 55 55)" />
          <Line x1="59" y1="59" x2="59" y2="63" stroke={dim} strokeWidth="1" transform="rotate(-30 55 55)" />
          <Line x1="65" y1="59" x2="65" y2="63" stroke={dim} strokeWidth="1" transform="rotate(-30 55 55)" />
          <Line x1="71" y1="59" x2="71" y2="63" stroke={dim} strokeWidth="1" transform="rotate(-30 55 55)" />
          <Line x1="77" y1="59" x2="77" y2="63" stroke={dim} strokeWidth="1" transform="rotate(-30 55 55)" />
        </Svg>
      );
    case 'cube':
      return (
        <Svg width={100} height={100} viewBox="0 0 100 100">
          {/* 3D cube */}
          <Path d="M50 15 L80 32 L80 68 L50 85 L20 68 L20 32 Z" stroke={primary} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
          <Path d="M50 15 L50 85" stroke={dim} strokeWidth="1" strokeDasharray="4 4" />
          <Path d="M20 32 L80 32" stroke={dim} strokeWidth="1" strokeDasharray="4 4" />
          <Path d="M50 15 L80 32" stroke={primary} strokeWidth="1.5" />
          <Path d="M50 15 L20 32" stroke={primary} strokeWidth="1.5" />
          {/* Floor plan overlay */}
          <Rect x="34" y="48" width="32" height="24" stroke={ghost} strokeWidth="1" fill="none" rx="1" opacity={0.6} />
          <Line x1="50" y1="48" x2="50" y2="72" stroke={ghost} strokeWidth="1" opacity={0.6} />
        </Svg>
      );
    case 'people':
      return (
        <Svg width={100} height={100} viewBox="0 0 100 100">
          {/* Three people */}
          <Circle cx="50" cy="30" r="10" stroke={primary} strokeWidth="1.5" fill="none" />
          <Path d="M30 70 Q30 50 50 50 Q70 50 70 70" stroke={primary} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <Circle cx="25" cy="35" r="7" stroke={dim} strokeWidth="1.5" fill="none" />
          <Path d="M10 72 Q10 55 25 55 Q40 55 40 72" stroke={dim} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <Circle cx="75" cy="35" r="7" stroke={dim} strokeWidth="1.5" fill="none" />
          <Path d="M60 72 Q60 55 75 55 Q90 55 90 72" stroke={dim} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </Svg>
      );
  }
}

function Dot({ active }: { active: boolean }) {
  const width = useSharedValue(active ? 24 : 8);
  const style = useAnimatedStyle(() => ({ width: width.value }));

  React.useEffect(() => {
    width.value = withSpring(active ? 24 : 8, { damping: 20, stiffness: 300 });
  }, [active, width]);

  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 4,
          backgroundColor: active ? DS.colors.primary : DS.colors.border,
        },
        style,
      ]}
    />
  );
}

export function OnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    } else {
      Storage.set('onboarding_seen', 'true');
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  const handleSkip = () => {
    Storage.set('onboarding_seen', 'true');
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View
            style={{
              width: SCREEN_WIDTH,
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 40,
              paddingTop: insets.top + 40,
            }}
          >
            <SlideIcon icon={item.icon} />
            <ArchText
              variant="heading"
              style={{ fontSize: 28, color: DS.colors.primary, textAlign: 'center', marginTop: DS.spacing.xl }}
            >
              {item.title}
            </ArchText>
            <ArchText
              variant="body"
              style={{ fontSize: 16, color: DS.colors.primaryDim, textAlign: 'center', marginTop: DS.spacing.md, lineHeight: 24 }}
            >
              {item.desc}
            </ArchText>
          </View>
        )}
      />

      {/* Bottom controls */}
      <View
        style={{
          paddingHorizontal: DS.spacing.lg,
          paddingBottom: Math.max(insets.bottom, DS.spacing.lg) + DS.spacing.md,
          gap: DS.spacing.md,
        }}
      >
        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: DS.spacing.xs }}>
          {SLIDES.map((s, i) => (
            <Dot key={s.id} active={i === activeIndex} />
          ))}
        </View>

        {/* Buttons row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <OvalButton
            label="Skip"
            variant="ghost"
            size="small"
            onPress={handleSkip}
          />
          <OvalButton
            label={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            variant="filled"
            size="small"
            onPress={handleNext}
          />
        </View>
      </View>
    </View>
  );
}
