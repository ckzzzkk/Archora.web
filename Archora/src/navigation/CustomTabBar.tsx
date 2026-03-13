import React, { useEffect, useRef } from 'react';
import { View, Pressable, Text, Dimensions } from 'react-native';
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
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../hooks/useTheme';
import { useHaptics } from '../hooks/useHaptics';
import { BASE_COLORS } from '../theme/colors';
import type { RootStackParamList } from './types';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Wobbly imperfect circle path (baked vertex noise) — 48x48 viewBox
const WOBBLY_PATH = 'M 24 3 C 30 2.5 43 8 44 24 C 45 37 37 45 24 45 C 10 45.5 3 37 3 24 C 2.5 10 10 3.5 24 3 Z';
const CIRCUMFERENCE = 135;

// Hand-drawn SVG icons
const ICONS: Record<string, (color: string) => React.ReactElement> = {
  Dashboard: (color) => (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Rect x="3" y="3" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      <Rect x="13" y="3" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      <Rect x="3" y="13" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      <Rect x="13" y="13" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
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

function TabItem({ route, index, isFocused, onPress }: TabItemProps) {
  const { colors } = useTheme();
  const circleProgress = useSharedValue(isFocused ? 1 : 0);
  const pillOpacity = useSharedValue(isFocused ? 1 : 0);
  const pillScale = useSharedValue(isFocused ? 1 : 0.7);

  useEffect(() => {
    if (isFocused) {
      // Draw circle in 180ms then settle with overshoot
      circleProgress.value = withSequence(
        withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) }),
        withSpring(0.95, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 300 }),
      );
      pillOpacity.value = withTiming(1, { duration: 150 });
      pillScale.value = withSpring(1, { damping: 14, stiffness: 280 });
    } else {
      // Erase circle in 120ms
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

  const iconColor = isFocused ? BASE_COLORS.textPrimary : BASE_COLORS.textDim;
  const iconRenderer = ICONS[route.name];

  return (
    <Pressable
      onPress={onPress}
      style={{ width: 64, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }}
    >
      {/* Active pill background */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0, left: 4, right: 4, bottom: 0,
            backgroundColor: 'rgba(255,255,255,0.10)',
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
            stroke={BASE_COLORS.textPrimary}
            strokeWidth={1.5}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedCircleProps}
          />
        </Svg>
      </View>

      {/* Icon */}
      <View style={{ marginBottom: 3 }}>
        {iconRenderer ? iconRenderer(iconColor) : null}
      </View>

      {/* Label */}
      <Text style={{
        fontSize: 9,
        fontFamily: 'Inter_500Medium',
        color: iconColor,
        letterSpacing: 0.4,
      }}>
        {route.name}
      </Text>
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

  const c = 28;
  const r = 10;

  return (
    <Pressable
      onPress={handlePress}
      style={{
        width: 56, height: 56,
        borderRadius: 28,
        backgroundColor: BASE_COLORS.textPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <Animated.View style={fabStyle}>
        <Svg width={28} height={28} viewBox="0 0 56 56">
          {/* Compass rose in dark color on light FAB */}
          <Path
            d={`M ${c} ${c - r * 0.3} L ${c - r * 0.15} ${c - r * 0.9} L ${c} ${c - r} L ${c + r * 0.15} ${c - r * 0.9} Z`}
            fill={BASE_COLORS.background}
          />
          <Path
            d={`M ${c} ${c + r * 0.3} L ${c - r * 0.15} ${c + r * 0.9} L ${c} ${c + r} L ${c + r * 0.15} ${c + r * 0.9} Z`}
            fill={BASE_COLORS.background} opacity={0.5}
          />
          <Path
            d={`M ${c + r * 0.3} ${c} L ${c + r * 0.9} ${c - r * 0.15} L ${c + r} ${c} L ${c + r * 0.9} ${c + r * 0.15} Z`}
            fill={BASE_COLORS.background} opacity={0.5}
          />
          <Path
            d={`M ${c - r * 0.3} ${c} L ${c - r * 0.9} ${c - r * 0.15} L ${c - r} ${c} L ${c - r * 0.9} ${c + r * 0.15} Z`}
            fill={BASE_COLORS.background} opacity={0.5}
          />
          <Circle cx={c} cy={c} r={2} fill={BASE_COLORS.background} />
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { medium } = useHaptics();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: insets.bottom + 16,
        left: 0,
        right: 0,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        pointerEvents: 'box-none',
      }}
    >
      {/* Pill container */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: BASE_COLORS.surfaceHigh,
          borderRadius: 32,
          paddingHorizontal: 4,
          paddingVertical: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 12,
          borderWidth: 1,
          borderColor: BASE_COLORS.border,
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
      </View>

      {/* FAB */}
      <FABButton />
    </View>
  );
}
