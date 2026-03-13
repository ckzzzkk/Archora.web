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

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Password strength ────────────────────────────────────────────────────────

function getPasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['', 'Weak', 'Fair', 'Strong', 'Strong', 'Architect-grade'];
  return { score, label: labels[score] ?? '' };
}

// ─── Floor plan silhouette paths ──────────────────────────────────────────────

const FALLINGWATER_PATH =
  'M0,60 L0,0 L80,0 L80,20 L30,20 L30,40 L60,40 L60,60 Z';

const VILLA_SAVOYE_PATH =
  'M0,0 L100,0 L100,70 L0,70 Z M10,10 L10,30 L20,30 L20,10 Z M40,10 L40,30 L50,30 L50,10 Z M70,10 L70,30 L80,30 L80,10 Z';

const FARNSWORTH_PATH =
  'M0,20 L120,20 L120,50 L0,50 Z M20,0 L100,0 L100,10 L20,10 Z M20,60 L100,60 L100,70 L20,70 Z';

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

// ─── Sketch input ─────────────────────────────────────────────────────────────

interface SketchInputProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  keyboardType?: 'email-address' | 'default';
  accentColor: string;
}

function SketchInput({ label, value, onChangeText, secureTextEntry, autoCapitalize = 'none', keyboardType = 'default', accentColor }: SketchInputProps) {
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
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: BASE_COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
        <PencilUnderline focused={focused} accentColor={accentColor} />
      </Animated.View>
    </View>
  );
}

// ─── Compass rose button icon ─────────────────────────────────────────────────

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
        <Path
          d={`M ${c} ${c - r * 0.3} L ${c - r * 0.15} ${c - r * 0.9} L ${c} ${c - r * 1.0} L ${c + r * 0.15} ${c - r * 0.9} Z`}
          fill={color}
        />
        <Path
          d={`M ${c} ${c + r * 0.3} L ${c - r * 0.15} ${c + r * 0.9} L ${c} ${c + r * 1.0} L ${c + r * 0.15} ${c + r * 0.9} Z`}
          fill={color} opacity={0.5}
        />
        <Path
          d={`M ${c + r * 0.3} ${c} L ${c + r * 0.9} ${c - r * 0.15} L ${c + r * 1.0} ${c} L ${c + r * 0.9} ${c + r * 0.15} Z`}
          fill={color} opacity={0.5}
        />
        <Path
          d={`M ${c - r * 0.3} ${c} L ${c - r * 0.9} ${c - r * 0.15} L ${c - r * 1.0} ${c} L ${c - r * 0.9} ${c + r * 0.15} Z`}
          fill={color} opacity={0.5}
        />
      </Svg>
    </Animated.View>
  );
}

// ─── Confetti particle ────────────────────────────────────────────────────────

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

  const sz = 14 + (angle % 4) * 5;
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

// ─── SignUpScreen ─────────────────────────────────────────────────────────────

export function SignUpScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { success } = useHaptics();
  const signUp = useAuthStore((s) => s.actions.signUp);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [buttonSpinning, setButtonSpinning] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);

  const strength = getPasswordStrength(password);
  const strengthColors = ['#333', BASE_COLORS.error, BASE_COLORS.warning, BASE_COLORS.success, BASE_COLORS.success, colors.primary];

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

  const handleSignUp = async () => {
    setButtonSpinning(false);
    if (!displayName || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUp(email, password, displayName);
      success();
      setConfettiTriggered(true);
      // Navigation happens automatically via RootNavigator watching isAuthenticated
      // If email confirmation is required, session won't be set — show message
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sign up failed. Please try again.';
      setError(msg.includes('already registered') ? 'Email already in use. Try signing in.' : msg);
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
      {/* Drifting background floor plan silhouettes */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
        <DriftingPlan
          planPath={FARNSWORTH_PATH}
          scale={1.3}
          startX={SCREEN_W * 0.2}
          startY={SCREEN_H * 0.05}
          duration={20000}
          delay={0}
          driftX={-45}
          driftY={25}
        />
        <DriftingPlan
          planPath={FALLINGWATER_PATH}
          scale={1.5}
          startX={SCREEN_W * 0.55}
          startY={SCREEN_H * 0.45}
          duration={24000}
          delay={4000}
          driftX={35}
          driftY={-30}
        />
        <DriftingPlan
          planPath={VILLA_SAVOYE_PATH}
          scale={1.0}
          startX={-20}
          startY={SCREEN_H * 0.7}
          duration={19000}
          delay={8000}
          driftX={55}
          driftY={20}
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
            <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 36, color: BASE_COLORS.textPrimary, marginBottom: 8 }}>
              Create Account
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: BASE_COLORS.textSecondary, marginBottom: 48 }}>
              Start designing with AI
            </Text>
          </Animated.View>

          <Animated.View style={formStyle}>
            <SketchInput label="Display Name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" accentColor={colors.primary} />
            <SketchInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" accentColor={colors.primary} />
            <SketchInput label="Password" value={password} onChangeText={setPassword} secureTextEntry accentColor={colors.primary} />

            {/* Password strength bar */}
            {password.length > 0 && (
              <View style={{ marginBottom: 24, marginTop: -8 }}>
                <View style={{ height: 3, backgroundColor: BASE_COLORS.border, borderRadius: 2, marginBottom: 6 }}>
                  <View
                    style={{
                      height: 3,
                      width: `${(strength.score / 5) * 100}%`,
                      backgroundColor: strengthColors[strength.score],
                      borderRadius: 2,
                    }}
                  />
                </View>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: strengthColors[strength.score] }}>
                  {strength.label}
                </Text>
              </View>
            )}

            {error ? (
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.error, marginBottom: 16 }}>
                {error}
              </Text>
            ) : null}

            <Pressable
              onPressIn={handlePressIn}
              onPress={() => { void handleSignUp(); }}
              disabled={loading}
              style={{
                backgroundColor: loading ? BASE_COLORS.border : colors.primary,
                borderRadius: 24,
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                marginTop: 8,
              }}
            >
              {loading ? (
                <LogoLoader size="small" />
              ) : (
                <>
                  <ButtonCompassRose spinning={buttonSpinning} color={BASE_COLORS.background} />
                  <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 17, color: BASE_COLORS.background }}>
                    Create Account
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center', marginTop: 24 }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textSecondary }}>
                Already have an account? <Text style={{ color: colors.primary }}>Sign in</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
