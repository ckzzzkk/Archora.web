import React, { useEffect } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { BASE_COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

// Simplified famous floor plan silhouette paths (Fallingwater-inspired)
function FloorPlanSilhouette({ x, y, opacity }: { x: number; y: number; opacity: number }) {
  return (
    <Svg width={120} height={80} style={{ position: 'absolute', left: x, top: y, opacity }}>
      <Path
        d="M5 40 H50 V20 H90 V40 H115 V60 H5 Z M50 20 V5 H75 V20"
        stroke={BASE_COLORS.textPrimary}
        strokeWidth="0.8"
        fill="none"
      />
      <Path d="M20 40 V60 M35 40 V60 M65 40 V60 M80 20 V40" stroke={BASE_COLORS.textPrimary} strokeWidth="0.5" fill="none" />
    </Svg>
  );
}

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { light } = useHaptics();

  const bgOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const buttonsY = useSharedValue(60);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    bgOpacity.value = withTiming(1, { duration: 600 });
    logoOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    logoY.value = withDelay(400, withSpring(0, { damping: 18 }));
    taglineOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));
    buttonsY.value = withDelay(1100, withSpring(0, { damping: 16, stiffness: 120 }));
    buttonsOpacity.value = withDelay(1100, withTiming(1, { duration: 400 }));
  }, []);

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsY.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
      {/* Floor plan silhouettes at 0.04 opacity */}
      <Animated.View style={[{ position: 'absolute', inset: 0 }, bgStyle]}>
        {[
          { x: -10, y: 80 }, { x: 140, y: 40 }, { x: -20, y: 200 },
          { x: 200, y: 160 }, { x: 60, y: 320 }, { x: -30, y: 420 },
          { x: 220, y: 380 }, { x: 100, y: 500 }, { x: -15, y: 580 },
          { x: 200, y: 540 }, { x: 50, y: 680 },
        ].map((pos, i) => (
          <FloorPlanSilhouette key={i} x={pos.x} y={pos.y} opacity={0.04} />
        ))}
      </Animated.View>

      {/* Compass rose decoration top-right */}
      <View style={{ position: 'absolute', top: 60, right: 20, opacity: 0.3 }}>
        <Svg width={40} height={40} viewBox="0 0 40 40">
          <Circle cx={20} cy={20} r={18} stroke={colors.primary} strokeWidth={1} fill="none" />
          <Path d="M20 2 L22 16 L20 20 L18 16 Z" fill={colors.primary} />
          <Path d="M20 38 L22 24 L20 20 L18 24 Z" fill={colors.primary} opacity={0.5} />
          <Path d="M2 20 L16 18 L20 20 L16 22 Z" fill={colors.primary} opacity={0.5} />
          <Path d="M38 20 L24 18 L20 20 L24 22 Z" fill={colors.primary} opacity={0.5} />
        </Svg>
      </View>

      {/* Center content */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Animated.View style={logoStyle}>
          <Text
            style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 52,
              color: BASE_COLORS.textPrimary,
              letterSpacing: 6,
              textAlign: 'center',
            }}
          >
            ASORIA
          </Text>
          {/* Underline */}
          <View style={{ height: 1.5, backgroundColor: colors.primary, marginTop: 6, opacity: 0.6 }} />
        </Animated.View>

        <Animated.View style={[taglineStyle, { marginTop: 20 }]}>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              color: BASE_COLORS.textSecondary,
              textAlign: 'center',
              letterSpacing: 0.5,
            }}
          >
            Describe it. Build it. Walk through it.
          </Text>
        </Animated.View>
      </View>

      {/* Bottom buttons */}
      <Animated.View style={[buttonsStyle, { paddingHorizontal: 32, paddingBottom: 60, gap: 16 }]}>
        <Pressable
          onPress={() => { light(); navigation.navigate('Onboarding'); }}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 24,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 17,
            color: BASE_COLORS.background,
            letterSpacing: 0.5,
          }}>
            Start Building
          </Text>
        </Pressable>

        <Pressable
          onPress={() => { light(); navigation.navigate('Login'); }}
          style={{ alignItems: 'center', paddingVertical: 12 }}
        >
          <Text style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 15,
            color: BASE_COLORS.textSecondary,
            textDecorationLine: 'underline',
          }}>
            I Have an Account
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
