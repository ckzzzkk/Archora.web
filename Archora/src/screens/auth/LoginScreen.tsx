import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, G } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { useHaptics } from '../../hooks/useHaptics';
import { LogoLoader } from '../../components/common/LogoLoader';
import { Particles } from '../../components/effects/Particles';
import { BASE_COLORS } from '../../theme/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

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

// ─── Rounded input with animated border ──────────────────────────────────────

type InputIcon = 'email' | 'lock' | 'person';

const ICON_PATHS: Record<InputIcon, string> = {
  email:
    'M3 5h18v14H3V5zm9 7L3 6v1l9 6 9-6V6l-9 6zm0 0',
  lock:
    'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
  person:
    'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
};

interface RoundedInputProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  keyboardType?: 'email-address' | 'default';
  error?: string;
  icon: InputIcon;
  showEyeToggle?: boolean;
  isValid?: boolean;
}

function RoundedInput({
  value, onChangeText, placeholder, secureTextEntry, autoCapitalize = 'none',
  keyboardType = 'default', error, icon, showEyeToggle, isValid,
}: RoundedInputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderProgress = useSharedValue(0);
  const containerScale = useSharedValue(1);

  const borderColor = useDerivedValue(() =>
    interpolateColor(borderProgress.value, [0, 1], ['#333333', '#C8C8C8'])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: error ? '#C0604A' : isValid ? '#7AB87A' : borderColor.value,
    transform: [{ scale: containerScale.value }],
    borderRadius: 16,
    backgroundColor: '#2C2C2C',
    borderWidth: 1.5,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  }));

  const handleFocus = () => {
    setFocused(true);
    borderProgress.value = withTiming(1, { duration: 200 });
    containerScale.value = withTiming(1.01, { duration: 200 });
  };

  const handleBlur = () => {
    setFocused(false);
    borderProgress.value = withTiming(0, { duration: 150 });
    containerScale.value = withTiming(1, { duration: 150 });
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Animated.View style={animatedStyle}>
        {/* Left icon */}
        <Svg width={18} height={18} viewBox="0 0 24 24" style={{ marginRight: 12 }}>
          <Path d={ICON_PATHS[icon]} fill="#5A5550" />
        </Svg>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry && !showPassword}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          style={{
            flex: 1,
            fontFamily: 'Inter_400Regular',
            fontSize: 15,
            color: BASE_COLORS.textPrimary,
            padding: 0,
          }}
          placeholderTextColor="#4A4A4A"
          autoCorrect={false}
        />

        {/* Right: valid tick or eye toggle */}
        {isValid && !showEyeToggle && (
          <Svg width={16} height={16} viewBox="0 0 24 24" style={{ marginLeft: 8 }}>
            <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#7AB87A" />
          </Svg>
        )}
        {showEyeToggle && (
          <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
            <Svg width={18} height={18} viewBox="0 0 24 24" style={{ marginLeft: 8 }}>
              {showPassword ? (
                <Path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#5A5550" />
              ) : (
                <Path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="#5A5550" />
              )}
            </Svg>
          </Pressable>
        )}
      </Animated.View>
      {error ? (
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#C0604A', marginTop: 6, marginLeft: 4 }}>
          {error}
        </Text>
      ) : null}
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

// ─── LoginScreen ─────────────────────────────────────────────────────────────

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { error: errorHaptic, success } = useHaptics();
  const signIn = useAuthStore((s) => s.actions.signIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [buttonSpinning, setButtonSpinning] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);

  // Entry animations
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const formOpacity = useSharedValue(0);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    titleOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    titleTranslateY.value = withDelay(100, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
    formOpacity.value = withDelay(350, withTiming(1, { duration: 500 }));
  }, []);

  useEffect(() => {
    if (lockedUntil === 0) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setCountdown(0);
        setLockedUntil(0);
        clearInterval(interval);
      } else {
        setCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }));

  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handlePressIn = () => {
    if (!loading) {
      setButtonSpinning(true);
      btnScale.value = withSpring(0.97, { damping: 12 });
    }
  };

  const handlePressOut = () => {
    btnScale.value = withSpring(1, { damping: 14 });
  };

  const handleSignIn = async () => {
    setButtonSpinning(false);
    if (countdown > 0) return;
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
    } catch (e: unknown) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 4) errorHaptic();
      if (newAttempts >= 5) {
        const until = Date.now() + 30_000;
        setLockedUntil(until);
        setCountdown(30);
      }
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
      <Particles triggered={confettiTriggered} count={12} radius={120} shapes={['floor_plan', 'compass', 'ruler']} />

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
              marginBottom: 40,
            }}>
              Sign in to your Asoria account
            </Text>
          </Animated.View>

          <Animated.View style={formStyle}>
            {/* Card container */}
            <View style={{
              backgroundColor: '#222222',
              borderRadius: 24,
              padding: 24,
              marginHorizontal: 4,
            }}>
              <RoundedInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                keyboardType="email-address"
                icon="email"
                isValid={isEmailValid && email.length > 0}
              />
              <RoundedInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
                icon="lock"
                showEyeToggle
                error={error}
              />

              {/* Forgot password */}
              <Pressable
                onPress={() => navigation.navigate('ForgotPassword')}
                style={{ alignSelf: 'flex-end', marginTop: -4, marginBottom: 24 }}
              >
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.textSecondary, textDecorationLine: 'underline' }}>
                  Forgot password?
                </Text>
              </Pressable>

              <Animated.View style={btnAnimStyle}>
                <Pressable
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={() => { void handleSignIn(); }}
                  disabled={loading || countdown > 0}
                  style={{
                    backgroundColor: (loading || countdown > 0) ? BASE_COLORS.border : '#C8C8C8',
                    borderRadius: 16,
                    height: 56,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}
                >
                  {loading ? (
                    <LogoLoader size="small" />
                  ) : countdown > 0 ? (
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: BASE_COLORS.textDim }}>
                      Too many attempts — wait {countdown}s
                    </Text>
                  ) : (
                    <>
                      <ButtonCompassRose spinning={buttonSpinning} color="#1A1A1A" />
                      <Text style={{
                        fontFamily: 'Inter_700Bold',
                        fontSize: 16,
                        color: '#1A1A1A',
                      }}>
                        Sign In
                      </Text>
                    </>
                  )}
                </Pressable>
              </Animated.View>
            </View>

            <Pressable
              onPress={() => navigation.navigate('SignUp')}
              style={{ alignItems: 'center', marginTop: 24 }}
            >
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textSecondary }}>
                Don't have an account?{' '}
                <Text style={{ color: BASE_COLORS.textPrimary }}>Sign up</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
