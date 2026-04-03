import { SUNRISE } from '../theme/sunrise';
import React, { useEffect, useRef } from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../hooks/useTheme';
import { useHaptics } from '../hooks/useHaptics';
import type { RootStackParamList } from './types';
import { useTabDirection } from './TabDirectionContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Wobbly imperfect circle path (baked vertex noise) — 48x48 viewBox
const WOBBLY_PATH = 'M 24 3 C 30 2.5 43 8 44 24 C 45 37 37 45 24 45 C 10 45.5 3 37 3 24 C 2.5 10 10 3.5 24 3 Z';
const CIRCUMFERENCE = 135;

// Hand-drawn SVG icons
const ICONS: Record<string, (color: string) => React.ReactElement> = {
  Dashboard: (color) => (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M3 11 L12 3 L21 11" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 9.5 V21 H19 V9.5" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21 V15 H15 V21" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Feed: (color) => (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Rect x="3" y="3" width="8" height="11" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      <Rect x="13" y="3" width="8" height="7" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      <Rect x="13" y="13" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      <Rect x="3" y="17" width="8" height="4" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
    </Svg>
  ),
  AR: (color) => (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M2 8 V4 H6" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Path d="M18 4 H22 V8" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Path d="M2 16 V20 H6" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Path d="M18 20 H22 V16" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" fill="none" />
    </Svg>
  ),
  Sketch: (color) => (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Rect x="3" y="14" width="14" height="7" rx="1" stroke={color} strokeWidth="1.8" fill="none"/>
      <Path d="M14 14 L19 9 L21 11 L16 16" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <Path d="M19 9 L21 7 L23 9 L21 11 Z" fill={color} opacity={0.7}/>
      <Path d="M6 17 H11" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity={0.5}/>
    </Svg>
  ),
  Account: (color) => (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" fill="none" />
      <Path d="M4 20 C4 16.686 7.582 14 12 14 C16.418 14 20 16.686 20 20"
        stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </Svg>
  ),
};

interface TabItemProps {
  route: BottomTabBarProps['state']['routes'][0];
  index: number;
  isFocused: boolean;
  onPress: () => void;
}

function TabItem({ route, isFocused, onPress }: TabItemProps) {
  const circleProgress = useSharedValue(isFocused ? 1 : 0);
  const pillOpacity = useSharedValue(isFocused ? 1 : 0);
  const pillScale = useSharedValue(isFocused ? 1 : 0.7);

  useEffect(() => {
    if (isFocused) {
      circleProgress.value = withSequence(
        withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) }),
        withSpring(0.95, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 300 }),
      );
      pillOpacity.value = withTiming(1, { duration: 150 });
      pillScale.value = withSpring(1, { damping: 14, stiffness: 280 });
    } else {
      circleProgress.value = withTiming(0, { duration: 120 });
      pillOpacity.value = withTiming(0, { duration: 100 });
      pillScale.value = withSpring(0.7, { damping: 14, stiffness: 280 });
    }
  }, [isFocused, circleProgress, pillOpacity, pillScale]);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - circleProgress.value),
    opacity: circleProgress.value,
  }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [{ scaleX: pillScale.value }],
  }));

  const iconColor = isFocused ? SUNRISE.gold : SUNRISE.inactiveTint;
  const iconRenderer = ICONS[route.name];

  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }}
    >
      {/* Active pill background */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0, left: 4, right: 4, bottom: 0,
            backgroundColor: 'rgba(232,184,109,0.10)',
            borderRadius: 20,
          },
          pillStyle,
        ]}
      />

      {/* Scratchy circle — drawn via strokeDashoffset */}
      <View style={{ position: 'absolute', width: 48, height: 48, top: -2 }}>
        <Svg width={48} height={48} viewBox="0 0 48 48">
          <AnimatedPath
            d={WOBBLY_PATH}
            stroke={SUNRISE.gold}
            strokeWidth={1.5}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedCircleProps}
          />
        </Svg>
      </View>

      {/* Icon */}
      <View>
        {iconRenderer ? iconRenderer(iconColor) : null}
      </View>
    </Pressable>
  );
}

function FABButton() {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { light } = useHaptics();
  const rotation = useSharedValue(0);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handlePress = () => {
    light();
    rotation.value = withSequence(
      withSpring(90, { damping: 8, stiffness: 300 }),
      withSpring(0, { damping: 12, stiffness: 200 }),
    );
    rootNav.navigate('Generation');
  };

  return (
    <Pressable onPress={handlePress}>
      <LinearGradient
        colors={[SUNRISE.gold, SUNRISE.amber]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: SUNRISE.gold,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 16,
        }}
      >
        <Animated.View style={fabStyle}>
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path d="M12 5v14M5 12h14" stroke={SUNRISE.background} strokeWidth="2" strokeLinecap="round" />
          </Svg>
        </Animated.View>
      </LinearGradient>
    </Pressable>
  );
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { medium } = useHaptics();
  const insets = useSafeAreaInsets();
  const { setDirection } = useTabDirection();
  const prevIndexRef = useRef(state.index);

  useEffect(() => {
    prevIndexRef.current = state.index;
  }, [state.index]);

  const focusedRoute = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute.key].options;
  if ((focusedOptions.tabBarStyle as { display?: string } | undefined)?.display === 'none') {
    return null;
  }

  return (
    <View
      style={{
        position: 'absolute',
        bottom: Math.max(insets.bottom, 16) + 8,
        left: 24,
        right: 24,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: SUNRISE.glass.navBorder,
        shadowColor: SUNRISE.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 16,
      }}
    >
      <BlurView
        intensity={40}
        tint="dark"
        style={{
          flex: 1,
          backgroundColor: SUNRISE.glass.navBg,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 8,
        }}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              medium();
              setDirection(index > prevIndexRef.current ? 'right' : 'left');
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              index={index}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}

        {/* FAB — gradient button on the right */}
        <FABButton />
      </BlurView>
    </View>
  );
}

