import React, { useRef } from 'react';
import { View, Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../hooks/useTheme';
import { useHaptics } from '../hooks/useHaptics';
import { BASE_COLORS } from '../theme/colors';

// Hand-illustrated SVG icon paths for each tab
const TAB_ICONS: Record<string, (color: string, size: number) => React.ReactElement> = {
  Dashboard: (color, size) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="3" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      <Rect x="13" y="3" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      <Rect x="3" y="13" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      <Rect x="13" y="13" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
    </Svg>
  ),
  Workspace: (color, size) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="2" y="2" width="20" height="20" rx="1" stroke={color} strokeWidth="1.8" fill="none" />
      <Path d="M2 8 H22" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
      <Path d="M8 8 V22" stroke={color} strokeWidth="1" />
      <Path d="M14 2 V8" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
    </Svg>
  ),
  Generate: (color, size) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2 L14 9 L21 9 L15.5 13.5 L17.5 21 L12 17 L6.5 21 L8.5 13.5 L3 9 L10 9 Z"
        stroke={color} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
    </Svg>
  ),
  AR: (color, size) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M2 8 V4 H6" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Path d="M18 4 H22 V8" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Path d="M2 16 V20 H6" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Path d="M18 20 H22 V16" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" fill="none" />
    </Svg>
  ),
  Feed: (color, size) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="3" width="8" height="11" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      <Rect x="13" y="3" width="8" height="7" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      <Rect x="13" y="13" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      <Rect x="3" y="17" width="8" height="4" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
    </Svg>
  ),
  Account: (color, size) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" fill="none" />
      <Path d="M4 20 C4 16.686 7.582 14 12 14 C16.418 14 20 16.686 20 20"
        stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </Svg>
  ),
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { medium } = useHaptics();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: BASE_COLORS.surfaceHigh,
        borderTopWidth: 1,
        borderTopColor: BASE_COLORS.border,
        paddingBottom: 24,
        paddingTop: 12,
        paddingHorizontal: 8,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const iconScale = useSharedValue(1);

        const animatedIconStyle = useAnimatedStyle(() => ({
          transform: [{ scale: iconScale.value }],
        }));

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            iconScale.value = withSpring(0.85, {}, () => {
              iconScale.value = withSpring(1, { damping: 10, stiffness: 300 });
            });
            medium();
            navigation.navigate(route.name);
          }
        };

        const iconColor = isFocused ? colors.primary : BASE_COLORS.textDim;
        const iconRenderer = TAB_ICONS[route.name];

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={{ flex: 1, alignItems: 'center', gap: 4 }}
          >
            <Animated.View style={animatedIconStyle}>
              {iconRenderer ? iconRenderer(iconColor, 22) : null}
            </Animated.View>
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Inter_500Medium',
                color: iconColor,
                letterSpacing: 0.3,
              }}
            >
              {route.name}
            </Text>
            {isFocused && (
              <View
                style={{
                  position: 'absolute',
                  bottom: -8,
                  width: 20,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: colors.primary,
                }}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
