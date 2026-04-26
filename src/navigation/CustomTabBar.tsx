import React, { useEffect, useRef } from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHaptics } from '../hooks/useHaptics';
import { DS } from '../theme/designSystem';
import type { RootStackParamList } from './types';
import { useTabDirection } from './TabDirectionContext';
import { CompassRose } from '../components/common/CompassRose';
import { ScribbleCircle } from '../components/common/ScribbleCircle';
import { useDeviceType } from '../hooks/useDeviceType';
import { getResponsiveTokens } from '../theme/responsive';

// Hand-drawn SVG icons (all stroke-only, sketchy style)
const ICONS: Record<string, (color: string, size?: number, strokeWidth?: number) => React.ReactElement> = {
  Home: (color, size = 18, sw = 2.2) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 11 L12 3 L21 11" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 9.5 V21 H19 V9.5" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21 V15 H15 V21" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Create: (color, size = 18, sw = 2.2) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 5 V19 M5 12 H19" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  ),
  Inspo: (color, size = 18, sw = 2.2) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 3 H10 V10 H3 Z M14 3 H21 V10 H14 Z M14 14 H21 V21 H14 Z M3 14 H10 V21 H3 Z" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  AR: (color, size = 18, sw = 2.2) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M2 8 V4 H6" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" />
      <Path d="M18 4 H22 V8" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" />
      <Path d="M2 16 V20 H6" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" />
      <Path d="M18 20 H22 V16" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" />
      <Path d="M12 8 V16 M8 12 H16" stroke={color} strokeWidth={sw * 0.9} fill="none" strokeLinecap="round" />
    </Svg>
  ),
  Account: (color, size = 18, sw = 2.2) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 8 C14.2 8 16 6.2 16 4 C16 1.8 14.2 0 12 0 C9.8 0 8 1.8 8 4 C8 6.2 9.8 8 12 8 Z" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 20 C4 16.7 7.6 14 12 14 C16.4 14 20 16.7 20 20" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" />
    </Svg>
  ),
};

interface TabItemProps {
  routeName: string;
  label: string;
  isFocused: boolean;
  onPress: () => void;
  touchTarget: number;
  iconSize: number;
}

const ROUTE_LABELS: Record<string, string> = {
  Home: 'Home',
  Create: 'Create',
  Inspo: 'Inspiration',
  AR: 'AR',
  Account: 'Account',
};

function TabItem({ routeName, label, isFocused, onPress, touchTarget, iconSize }: TabItemProps) {
  const pressScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.88, { damping: 12, stiffness: 400 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 14, stiffness: 380 });
  };

  const iconColor = isFocused ? DS.colors.ink : DS.colors.mutedForeground;
  const iconRenderer = ICONS[routeName];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={`${label} tab`}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={{
        width: touchTarget,
        height: touchTarget,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 2,
            left: 2,
            right: 2,
            bottom: 2,
            borderRadius: 22,
            backgroundColor: isFocused ? 'rgba(212, 168, 75, 0.30)' : 'transparent',
          },
          animatedStyle,
        ]}
      >
        {isFocused && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <ScribbleCircle size={40} color={DS.colors.ink} />
          </View>
        )}
      </Animated.View>

      <View style={{ position: 'relative', zIndex: 10 }}>
        {iconRenderer ? iconRenderer(iconColor, iconSize) : null}
      </View>
    </Pressable>
  );
}

function FABButton({ onPress, fabSize }: { onPress?: () => void; fabSize: number }) {
  const { light } = useHaptics();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.82, { damping: 8, stiffness: 600 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 400 });
  };

  const handlePress = () => {
    light();
    rotation.value = withSequence(
      withSpring(90, { damping: 8, stiffness: 300 }),
      withSpring(0, { damping: 12, stiffness: 200 }),
    );
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel="Create new design"
      accessibilityRole="button"
      accessibilityHint="Opens the 7-step AI design generator"
    >
      <Animated.View style={fabStyle}>
        <View
          style={{
            width: fabSize,
            height: fabSize,
            borderRadius: fabSize / 2,
            backgroundColor: DS.colors.amber,
            alignItems: 'center',
            justifyContent: 'center',
            // Sketch shadow: 3px 4px 0 0 ink
            shadowColor: DS.colors.ink,
            shadowOffset: { width: 3, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 0,
            borderWidth: 2,
            borderColor: DS.colors.ink,
          }}
        >
          <CompassRose size={Math.round(fabSize * 0.58)} color={DS.colors.paper} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { medium } = useHaptics();
  const insets = useSafeAreaInsets();
  const { setDirection } = useTabDirection();
  const prevIndexRef = useRef(state.index);
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const device = useDeviceType();
  const tokens = getResponsiveTokens(device.layout);

  useEffect(() => {
    prevIndexRef.current = state.index;
  }, [state.index]);

  const focusedRoute = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute.key].options;
  if ((focusedOptions.tabBarStyle as { display?: string } | undefined)?.display === 'none') {
    return null;
  }

  // Route order: Home, Create, Inspo, AR, Account
  // FAB is between Create and Inspo
  const tabs = [
    { name: 'Home', routeIndex: 0 },
    { name: 'Create', routeIndex: 1 },
    // FAB inserted here
    { name: 'Inspo', routeIndex: 2 },
    { name: 'AR', routeIndex: 3 },
    { name: 'Account', routeIndex: 4 },
  ];

  return (
    <View
      accessibilityRole="tablist"
      style={{
        position: 'absolute',
        bottom: device.isTablet
          ? Math.max(insets.bottom, 16) + 12
          : Math.max(insets.bottom, 12) + 8,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 50,
      }}
    >
      {/* Floating oval pill */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: device.isTablet ? 12 : 8,
          paddingVertical: 6,
          borderRadius: 50,
          borderWidth: 2,
          borderColor: DS.colors.ink,
          backgroundColor: DS.colors.card,
          // Sketch shadow: 2px 2px 0 0 ink
          shadowColor: DS.colors.ink,
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 0,
          gap: 0,
          maxWidth: device.isTablet ? 420 : 280,
          width: '100%',
        }}
      >
        {tabs.slice(0, 2).map((tab) => {
          const route = state.routes[tab.routeIndex];
          const isFocused = state.index === tab.routeIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              medium();
              setDirection(tab.routeIndex > prevIndexRef.current ? 'right' : 'left');
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TabItem
              key={route.key}
              routeName={tab.name}
              label={ROUTE_LABELS[tab.name]}
              isFocused={isFocused}
              onPress={onPress}
              touchTarget={device.touchTarget}
              iconSize={device.iconSize}
            />
          );
        })}

        {/* FAB compass — raised above the bar */}
        <View style={{ marginTop: -(device.fabSize / 2) - 4, marginHorizontal: 2 }}>
          <FABButton onPress={() => rootNav.navigate('Generation')} fabSize={device.fabSize} />
        </View>

        {tabs.slice(2).map((tab) => {
          const route = state.routes[tab.routeIndex];
          const isFocused = state.index === tab.routeIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              medium();
              setDirection(tab.routeIndex > prevIndexRef.current ? 'right' : 'left');
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TabItem
              key={route.key}
              routeName={tab.name}
              label={ROUTE_LABELS[tab.name]}
              isFocused={isFocused}
              onPress={onPress}
              touchTarget={device.touchTarget}
              iconSize={device.iconSize}
            />
          );
        })}
      </View>
    </View>
  );
}
