import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, G } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { LogoLoader } from '../../components/common/LogoLoader';
import { BASE_COLORS } from '../../theme/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Floor plan silhouette paths (simplified outlines of famous buildings) ───

// Fallingwater-inspired L-shaped floor plan silhouette
const FALLINGWATER_PATH =
  'M0,60 L0,0 L80,0 L80,20 L30,20 L30,40 L60,40 L60,60 Z';

// Villa Savoye-inspired rectangular with piloti cutouts
const VILLA_SAVOYE_PATH =
  'M0,0 L100,0 L100,70 L0,70 Z M10,10 L10,30 L20,30 L20,10 Z M40,10 L40,30 L50,30 L50,10 Z M70,10 L70,30 L80,30 L80,10 Z';

// Farnsworth House-inspired open plan
const FARNSWORTH_PATH =
  'M0,20 L120,20 L120,50 L0,50 Z M20,0 L100,0 L100,10 L20,10 Z M20,60 L100,60 L100,70 L20,70 Z';

const FLOOR_PLANS = [
  { path: FALLINGWATER_PATH, scale: 1.4, startX: -60, startY: SCREEN_H * 0.1 },
  { path: VILLA_SAVOYE_PATH, scale: 1.8, startX: SCREEN_W * 0.4, startY: SCREEN_H * 0.55 },
  { path: FARNSWORTH_PATH, scale: 1.2, startX: SCREEN_W * 0.15, startY: SCREEN_H * 0.75 },
];

// ─── Drifting background silhouette ──────────────────────────────────────────

interface DriftingPlanProps {
  planPath: string;
  scale: number;
  startX: number;
  startY: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
}

function DriftingPlan({ planPath, scale, startX, startY, duration, delay, driftX, driftY }: DriftingPlanProps) {
  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);

  useEffect(() => {
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(startX + driftX, { duration, easing: Easing.inOut(Easing.quad) }),
          withTiming(startX, { duration, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(startY + driftY, { duration: duration * 1.3, easing: Easing.inOut(Easing.quad) }),
          withTiming(startY, { duration: duration * 1.3, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animStyle} pointerEvents="none">
      <Svg
        width={200 * scale}
        height={120 * scale}
        viewBox="0 0 200 120"
        opacity={0.04}
      >
        <G transform={`scale(${scale})`}>
          <Path d={planPath} fill="none" stroke="#C8C8C8" strokeWidth={1.5} />
        </G>
      </Svg>
    </Animated.View>
  );
}

// ─── Animated underline + pencil icon ────────────────────────────────────────

function PencilUnderline({ focused, accentColor }: { focused: boolean; accentColor: string }) {
  const dashOffset = useSharedValue(120);
  const pencilOpacity = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      pencilOpacity.value = withTiming(1, { duration: 150 });
      dashOffset.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) });
    } else {
      pencilOpacity.value = withTiming(0, { duration: 150 });
      dashOffset.value = withTiming(120, { duration: 150 });
    }
  }, [focused]);

  const pencilStyle = useAnimatedStyle(() => ({ opacity: pencilOpacity.value }));

  // SVG strokeDashoffset isn't animatable via Reanimated directly,
  // so we drive it through a shared value and interpolate width instead
  const underlineStyle = useAnimatedStyle(() => ({
    width: `${((120 - dashOffset.value) / 120) * 100}%` as `${number}%`,
    height: 1.5,
    backgroundColor: accentColor,
    borderRadius: 1,
  }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
      <Animated.View style={pencilStyle}>
        <Svg width={14} height={14} viewBox="0 0 24 24" style={{ marginRight: 4 }}>
          <Path
            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
            fill={accentColor}
          />
        </Svg>
      </Animated.View>
      <Animated.View style={underlineStyle} />
    </View>
  );
}

// ─── Sketch input with pencil animation ──────────────────────────────────────

interface SketchInputProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences';
  keyboardType?: 'email-address' | 'default';
  error?: string;
  accentColor: string;
}

function SketchInput({
  label, value, onChangeText, secureTextEntry, autoCapitalize = 'none',
  keyboardType = 'default', error, accentColor,
}: SketchInputProps) {
  const [focused, setFocused] = useState(false);
  const containerScale = useSharedValue(1);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
  }));

  const handleFocus = () => {
    setFocused(true);
    containerScale.value = withTiming(1.01, { duration: 200 });
  };

  const handleBlur = () => {
    setFocused(false);
    containerScale.value = withTiming(1, { duration: 150 });
  };

  return (
    <View style={{ marginBottom: 28 }}>
      <Text style={{
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: error ? BASE_COLORS.error : BASE_COLORS.textSecondary,
        marginBottom: 8,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
      }}>
        {label}
      </Text>
      <Animated.View style={containerStyle}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 16,
            color: BASE_COLORS.textPrimary,
            paddingVertical: 10,
            paddingHorizontal: 0,
          }}
          placeholderTextColor={BASE_COLORS.textDim}
        />
        <PencilUnderline focused={focused} accentColor={error ? BASE_COLORS.error : accentColor} />
      </Animated.View>
      {error && (
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: BASE_COLORS.error, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}

// ─── Compass rose button icon ────────────────────────────────────────────────

function ButtonCompassRose({ spinning, color }: { spinning: boolean; color: string }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (spinning) {
      rotation.value = withTiming(360, { duration: 400, easing: Easing.out(Easing.quad) });
    } else {
      rotation.value = 0;
    }
  }, [spinning]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const sz = 20;
  const c = sz / 2;
  const r = sz * 0.42;

  return (
    <Animated.View style={[animStyle, { marginRight: 8 }]}>
      <Svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
        {/* N point */}
        <Path
          d={`M ${c} ${c - r * 0.3} L ${c - r * 0.15} ${c - r * 0.9} L ${c} ${c - r * 1.0} L ${c + r * 0.15} ${c - r * 0.9} Z`}
          fill={color}
        />
        {/* S point */}
        <Path
          d={`M ${c} ${c + r * 0.3} L ${c - r * 0.15} ${c + r * 0.9} L ${c} ${c + r * 1.0} L ${c + r * 0.15} ${c + r * 0.9} Z`}
          fill={color} opacity={0.5}
        />
        {/* E point */}
        <Path
          d={`M ${c + r * 0.3} ${c} L ${c + r * 0.9} ${c - r * 0.15} L ${c + r * 1.0} ${c} L ${c + r * 0.9} ${c + r * 0.15} Z`}
          fill={color} opacity={0.5}
        />
        {/* W point */}
        <Path
          d={`M ${c - r * 0.3} ${c} L ${c - r * 0.9} ${c - r * 0.15} L ${c - r * 1.0} ${c} L ${c - r * 0.9} ${c + r * 0.15} Z`}
          fill={color} opacity={0.5}
        />
      </Svg>
    </Animated.View>
  );
}

// ─── Architectural confetti particle ────────────────────────────────────────

interface ConfettiParticleProps {
  triggered: boolean;
  angle: number;
  distance: number;
  delay: number;
}

function ConfettiParticle({ triggered, angle, distance, delay }: ConfettiParticleProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    if (triggered) {
      const rad = (angle * Math.PI) / 180;
      const tx = Math.cos(rad) * distance;
      const ty = Math.sin(rad) * distance;

      opacity.value = withDelay(delay, withSequence(
        withTiming(0.8, { duration: 150 }),
        withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }),
      ));
      translateX.value = withDelay(delay, withTiming(tx, { duration: 650, easing: Easing.out(Easing.quad) }));
      translateY.value = withDelay(delay, withTiming(ty, { duration: 650, easing: Easing.out(Easing.quad) }));
      scale.value = withDelay(delay, withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.5, { duration: 450 }),
      ));
    }
  }, [triggered]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Small floor plan outline shape
  const sz = 16 + (angle % 3) * 6;
  return (
    <Animated.View style={style} pointerEvents="none">
      <Svg width={sz} height={sz} viewBox="0 0 40 40">
        <Path
          d="M5,5 L35,5 L35,25 L20,25 L20,35 L5,35 Z"
          fill="none"
          stroke="#C8C8C8"
          strokeWidth={2.5}
        />
      </Svg>
    </Animated.View>
  );
}

// ─── Confetti burst container ────────────────────────────────────────────────

function ConfettiBurst({ triggered }: { triggered: boolean }) {
  const particles = [
    { angle: 0, distance: 90, delay: 0 },
    { angle: 45, distance: 110, delay: 30 },
    { angle: 90, distance: 80, delay: 10 },
    { angle: 135, distance: 100, delay: 50 },
    { angle: 180, distance: 95, delay: 20 },
    { angle: 225, distance: 115, delay: 40 },
    { angle: 270, distance: 85, delay: 0 },
    { angle: 315, distance: 105, delay: 60 },
    { angle: 22, distance: 130, delay: 70 },
    { angle: 157, distance: 120, delay: 25 },
    { angle: 247, distance: 125, delay: 55 },
    { angle: 337, distance: 115, delay: 35 },
  ];

  return (
    <View
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
      pointerEvents="none"
    >
      {particles.map((p, i) => (
        <ConfettiParticle
          key={i}
          triggered={triggered}
          angle={p.angle}
          distance={p.distance}
          delay={p.delay}
        />
      ))}
    </View>
  );
}

// ─── LoginScreen ─────────────────────────────────────────────────────────────

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { error: errorHaptic, success } = useHaptics();
  const signIn = useAuthStore((s) => s.actions.signIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [buttonSpinning, setButtonSpinning] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);

  // Entry animations
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const formOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    titleTranslateY.value = withDelay(100, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
    formOpacity.value = withDelay(350, withTiming(1, { duration: 500 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }));

  const handlePressIn = () => {
    if (!loading) setButtonSpinning(true);
  };

  const handleSignIn = async () => {
    setButtonSpinning(false);
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      success();
      setConfettiTriggered(true);
      // Navigation happens automatically via RootNavigator watching isAuthenticated
    } catch (e: unknown) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 4) errorHaptic();
      const msg = e instanceof Error ? e.message : 'Invalid email or password. Please try again.';
      setError(msg.includes('Invalid login') ? 'Invalid email or password. Please try again.' : msg);
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
      {/* Drifting background floor plan silhouettes */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
        <DriftingPlan
          planPath={FALLINGWATER_PATH}
          scale={1.4}
          startX={-30}
          startY={SCREEN_H * 0.08}
          duration={18000}
          delay={0}
          driftX={60}
          driftY={20}
        />
        <DriftingPlan
          planPath={VILLA_SAVOYE_PATH}
          scale={1.6}
          startX={SCREEN_W * 0.35}
          startY={SCREEN_H * 0.5}
          duration={22000}
          delay={3000}
          driftX={-50}
          driftY={-25}
        />
        <DriftingPlan
          planPath={FARNSWORTH_PATH}
          scale={1.1}
          startX={SCREEN_W * 0.1}
          startY={SCREEN_H * 0.72}
          duration={26000}
          delay={6000}
          driftX={40}
          driftY={-15}
        />
      </View>

      {/* Confetti burst on success */}
      <ConfettiBurst triggered={confettiTriggered} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 32, paddingTop: 80 }}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => navigation.goBack()} style={{ marginBottom: 40 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textDim }}>
              ← Back
            </Text>
          </Pressable>

          <Animated.View style={titleStyle}>
            <Text style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 36,
              color: BASE_COLORS.textPrimary,
              marginBottom: 8,
            }}>
              Welcome back
            </Text>
            <Text style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              color: BASE_COLORS.textSecondary,
              marginBottom: 48,
            }}>
              Sign in to your Archora account
            </Text>
          </Animated.View>

          <Animated.View style={formStyle}>
            <SketchInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              accentColor={colors.primary}
            />
            <SketchInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              accentColor={colors.primary}
              error={error}
            />

            <Pressable
              onPressIn={handlePressIn}
              onPress={() => { void handleSignIn(); }}
              disabled={loading}
              style={{
                backgroundColor: loading ? BASE_COLORS.border : colors.primary,
                borderRadius: 24,
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                marginTop: 16,
              }}
            >
              {loading ? (
                <LogoLoader size="small" />
              ) : (
                <>
                  <ButtonCompassRose spinning={buttonSpinning} color={BASE_COLORS.background} />
                  <Text style={{
                    fontFamily: 'ArchitectsDaughter_400Regular',
                    fontSize: 17,
                    color: BASE_COLORS.background,
                  }}>
                    Sign In
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('SignUp')}
              style={{ alignItems: 'center', marginTop: 24 }}
            >
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textSecondary }}>
                Don't have an account?{' '}
                <Text style={{ color: colors.primary }}>Sign up</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
