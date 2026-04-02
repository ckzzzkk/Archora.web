import React, { useRef, useState } from 'react';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../../components/common/ArchText';
import { View, Pressable, Dimensions, FlatList } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';

import { useHaptics } from '../../hooks/useHaptics';


const { width, height } = Dimensions.get('window');
type Nav = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

const SLIDES = [
  {
    key: 'generate',
    title: 'Describe It',
    subtitle: 'Type or speak your vision. AI builds the entire floor plan from your words.',
    icon: (color: string) => (
      <Svg width={160} height={120} viewBox="0 0 160 120">
        <Rect x="20" y="20" width="120" height="80" rx="4" stroke={color} strokeWidth="1.5" fill="none" opacity={0.3} />
        <Path d="M20 50 H80 V20" stroke={color} strokeWidth="1.5" fill="none" />
        <Path d="M80 20 V80 H140" stroke={color} strokeWidth="1.5" fill="none" />
        <Path d="M20 80 H80" stroke={color} strokeWidth="1" strokeDasharray="3 3" fill="none" />
        <Circle cx={140} cy={20} r={12} fill={color} opacity={0.8} />
        <Path d="M135 20 H145 M140 15 V25" stroke={DS.colors.background} strokeWidth="2" />
      </Svg>
    ),
  },
  {
    key: 'explore',
    title: 'Explore It',
    subtitle: 'Switch instantly between 2D blueprints and full 3D walkthroughs.',
    icon: (color: string) => (
      <Svg width={160} height={120} viewBox="0 0 160 120">
        <Rect x="10" y="30" width="65" height="65" rx="2" stroke={color} strokeWidth="1.5" fill="none" />
        <Path d="M10 55 H75 M37.5 30 V95" stroke={color} strokeWidth="1" opacity={0.5} />
        <Path d="M85 90 L110 30 L145 60 L120 95 Z" stroke={color} strokeWidth="1.5" fill="none" />
        <Path d="M110 30 L110 60 M85 90 L120 70 M120 70 L145 60" stroke={color} strokeWidth="1" opacity={0.5} />
        <Circle cx={110} cy={30} r={4} fill={color} opacity={0.6} />
      </Svg>
    ),
  },
  {
    key: 'share',
    title: 'Share It',
    subtitle: 'Publish your designs. Inspire others. Earn as an Architect.',
    icon: (color: string) => (
      <Svg width={160} height={120} viewBox="0 0 160 120">
        <Rect x="15" y="15" width="55" height="45" rx="4" stroke={color} strokeWidth="1.5" fill="none" />
        <Rect x="90" y="15" width="55" height="35" rx="4" stroke={color} strokeWidth="1.5" fill="none" />
        <Rect x="50" y="72" width="60" height="40" rx="4" stroke={color} strokeWidth="1.5" fill="none" />
        <Path d="M38 60 L80 72" stroke={color} strokeWidth="1" opacity={0.5} />
        <Path d="M117 50 L80 72" stroke={color} strokeWidth="1" opacity={0.5} />
        <Path d="M42 32 L48 26 L54 32" stroke={color} strokeWidth="1.5" fill="none" />
        <Path d="M48 26 V44" stroke={color} strokeWidth="1.5" />
      </Svg>
    ),
  },
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<typeof SLIDES[0]>);

export function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  
  const { light } = useHaptics();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      light();
      const next = activeIndex + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    } else {
      light();
      navigation.navigate('SignUp');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
      {/* Skip */}
      <Pressable
        onPress={() => navigation.navigate('SignUp')}
        style={{ position: 'absolute', top: 60, right: 24, zIndex: 10 }}
      >
        <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primaryGhost }}>
          Skip
        </ArchText>
      </Pressable>

      <AnimatedFlatList
        ref={listRef as React.RefObject<FlatList<typeof SLIDES[0]>>}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
          <View style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
            <View style={{ marginBottom: 48 }}>
              {item.icon(DS.colors.primary)}
            </View>
            <ArchText variant="body" style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 36,
              color: DS.colors.primary,
              textAlign: 'center',
              marginBottom: 16,
            }}>
              {item.title}
            </ArchText>
            <ArchText variant="body" style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 16,
              color: DS.colors.primaryDim,
              textAlign: 'center',
              lineHeight: 24,
            }}>
              {item.subtitle}
            </ArchText>
          </View>
        )}
        keyExtractor={(item) => item.key}
      />

      {/* Dots */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === activeIndex ? 20 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === activeIndex ? DS.colors.primary : DS.colors.border,
            }}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={{ paddingHorizontal: 32, paddingBottom: 60 }}>
        <Pressable
          onPress={handleNext}
          style={{
            backgroundColor: DS.colors.primary,
            borderRadius: 24,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <ArchText variant="body" style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 17,
            color: DS.colors.background,
          }}>
            {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </ArchText>
        </Pressable>
      </View>
    </View>
  );
}
