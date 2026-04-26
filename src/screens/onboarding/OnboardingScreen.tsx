import React, { useRef, useState } from 'react';
import { View, FlatList, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line, Rect, G } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OvalButton } from '../../components/common/OvalButton';
import { ArchText } from '../../components/common/ArchText';
import { GridBackground } from '../../components/common/GridBackground';
import { DS } from '../../theme/designSystem';
import { Storage } from '../../utils/storage';
import type { RootStackParamList } from '../../navigation/types';

interface Slide {
  id: string;
  icon: 'compass' | 'ruler' | 'cube' | 'people';
  title: string;
  desc: string;
}

const SLIDES: Slide[] = [
  { id: '0', icon: 'compass', title: 'AI Architecture',  desc: 'Describe your dream space in seconds. Our AI transforms your words into detailed floor plans.' },
  { id: '1', icon: 'ruler',   title: 'Sketch & Refine', desc: 'Draw freehand, drag furniture, adjust rooms. Every detail, exactly as you envision.' },
  { id: '2', icon: 'cube',    title: 'Walk Through 3D',    desc: 'Experience your design in immersive 3D before a single brick is laid.' },
  { id: '3', icon: 'people',  title: 'Share & Earn', desc: 'Publish your templates to the community. Inspire others and earn revenue.' },
];

function SlideIcon({ icon }: { icon: Slide['icon'] }) {
  const primary = DS.colors.primary;
  const dim = DS.colors.primaryDim;
  const ghost = DS.colors.primaryGhost as string;

  switch (icon) {
    case 'compass':
      // Sketchy architectural compass with measurement marks
      return (
        <Svg width={110} height={110} viewBox="0 0 110 110">
          {/* Outer ring - double line for sketchy effect */}
          <Circle cx="55" cy="55" r="48" stroke={primary} strokeWidth="1.2" fill="none" strokeDasharray="2 3" />
          <Circle cx="55" cy="55" r="44" stroke={primary} strokeWidth="0.8" fill="none" opacity={0.5} />
          {/* Cardinal tick marks */}
          <Path d="M55 7 L55 15 M55 95 L55 103 M7 55 L15 55 M95 55 L103 55" stroke={primary} strokeWidth="2" strokeLinecap="round" />
          {/* Minor tick marks */}
          <Path d="M55 20 L55 24 M55 86 L55 90 M20 55 L24 55 M86 55 L90 55" stroke={dim} strokeWidth="1.2" strokeLinecap="round" />
          {/* Compass needle - north */}
          <Path d="M55 18 L50 50 L55 45 L60 50 Z" fill={primary} opacity={0.9} />
          {/* Compass needle - south */}
          <Path d="M55 92 L50 50 L55 55 L60 50 Z" fill={dim} opacity={0.7} />
          {/* Center circle */}
          <Circle cx="55" cy="50" r="5" stroke={primary} strokeWidth="1.5" fill={DS.colors.background} />
          <Circle cx="55" cy="50" r="2" fill={primary} />
          {/* Sketchy accent lines */}
          <Path d="M20 20 Q30 25 25 35" stroke={ghost} strokeWidth="0.8" fill="none" opacity={0.4} />
          <Path d="M90 20 Q80 25 85 35" stroke={ghost} strokeWidth="0.8" fill="none" opacity={0.4} />
        </Svg>
      );
    case 'ruler':
      // Sketchy pencil and house floor plan
      return (
        <Svg width={110} height={110} viewBox="0 0 110 110">
          {/* Floor plan base */}
          <Rect x="20" y="40" width="45" height="35" stroke={ghost} strokeWidth="1.2" fill="none" strokeDasharray="3 2" rx="1" />
          <Path d="M20 57 L42.5 40 L65 57" stroke={ghost} strokeWidth="0.8" fill="none" opacity={0.5} />
          {/* Room dividers */}
          <Path d="M42.5 40 L42.5 75 M20 57 L65 57" stroke={ghost} strokeWidth="0.8" opacity={0.4} />
          {/* Pencil body */}
          <Path d="M55 85 L85 30 L95 40 L65 95 Z" stroke={primary} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
          {/* Pencil tip */}
          <Path d="M55 85 L48 100 L65 95 Z" stroke={primary} strokeWidth="1.2" fill={primary} fillOpacity={0.2} />
          {/* Pencil top */}
          <Path d="M85 30 L95 20 L100 25 L90 35 Z" stroke={dim} strokeWidth="1.2" fill="none" />
          {/* Measurement marks on ruler edge */}
          <Path d="M30 78 L30 82 M40 75 L40 82 M50 72 L50 82" stroke={dim} strokeWidth="0.8" opacity={0.6} />
        </Svg>
      );
    case 'cube':
      // Isometric 3D cube with floor plan
      return (
        <Svg width={110} height={110} viewBox="0 0 110 110">
          {/* Back vertical edge */}
          <Path d="M55 12 L55 88" stroke={dim} strokeWidth="1" strokeDasharray="5 3" opacity={0.4} />
          {/* Base rectangle */}
          <Path d="M55 88 L88 72 L88 28 L55 44 Z" stroke={primary} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
          {/* Top rectangle */}
          <Path d="M55 12 L22 28 L22 72 L55 88 Z" stroke={primary} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
          {/* Left face */}
          <Path d="M22 28 L55 44 L55 88 L22 72 Z" stroke={primary} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
          {/* Inner floor plan - sketchy overlay */}
          <Rect x="30" y="50" width="18" height="14" stroke={ghost} strokeWidth="0.8" fill="none" strokeDasharray="2 2" rx="0.5" opacity={0.5} />
          <Path d="M48 50 L48 64" stroke={ghost} strokeWidth="0.6" opacity={0.4} />
          {/* Room label dots */}
          <Circle cx="39" cy="57" r="1.5" fill={ghost} opacity={0.6} />
          <Circle cx="55" cy="57" r="1.5" fill={ghost} opacity={0.6} />
          {/* Perspective lines */}
          <Path d="M55 44 L88 28" stroke={primary} strokeWidth="1.2" opacity={0.6} />
          <Path d="M22 28 L55 12" stroke={primary} strokeWidth="1.2" opacity={0.6} />
        </Svg>
      );
    case 'people':
      // Three sketchy figures representing community
      return (
        <Svg width={110} height={110} viewBox="0 0 110 110">
          {/* Center figure - slightly larger */}
          <Circle cx="55" cy="28" r="11" stroke={primary} strokeWidth="1.5" fill="none" />
          {/* Head sketch accent */}
          <Path d="M48 22 Q55 18 62 22" stroke={primary} strokeWidth="0.8" fill="none" opacity={0.4} />
          {/* Body */}
          <Path d="M55 39 Q55 55 42 75 M55 39 Q55 55 68 75" stroke={primary} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Arms */}
          <Path d="M55 48 Q40 52 32 60 M55 48 Q70 52 78 60" stroke={primary} strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {/* Left figure */}
          <Circle cx="25" cy="38" r="8" stroke={dim} strokeWidth="1.2" fill="none" />
          <Path d="M25 46 Q25 60 15 78 M25 46 Q25 60 35 78" stroke={dim} strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <Path d="M25 54 Q12 58 6 65 M25 54 Q38 58 44 65" stroke={dim} strokeWidth="1" fill="none" strokeLinecap="round" opacity={0.7} />
          {/* Right figure */}
          <Circle cx="85" cy="38" r="8" stroke={dim} strokeWidth="1.2" fill="none" />
          <Path d="M85 46 Q85 60 75 78 M85 46 Q85 60 95 78" stroke={dim} strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <Path d="M85 54 Q72 58 66 65 M85 54 Q98 58 104 65" stroke={dim} strokeWidth="1" fill="none" strokeLinecap="round" opacity={0.7} />
          {/* Connection lines - community bonds */}
          <Path d="M36 42 Q45 38 48 35" stroke={ghost} strokeWidth="0.6" strokeDasharray="2 2" fill="none" opacity={0.3} />
          <Path d="M74 42 Q65 38 62 35" stroke={ghost} strokeWidth="0.6" strokeDasharray="2 2" fill="none" opacity={0.3} />
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
  const { width: SCREEN_WIDTH } = useWindowDimensions();
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
      <GridBackground />
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
