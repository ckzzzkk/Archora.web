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

const STRENGTH_COLORS = ['#333', '#C0604A', '#B8860B', '#7AB87A', '#7AB87A', '#C8C8C8'];

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
    borderProgress.value = withTiming(1, { duration: 200 });
    containerScale.value = withTiming(1.01, { duration: 200 });
  };

  const handleBlur = () => {
    borderProgress.value = withTiming(0, { duration: 150 });
    containerScale.value = withTiming(1, { duration: 150 });
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Animated.View style={animatedStyle}>
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

// ─── SignUpScreen ─────────────────────────────────────────────────────────────

export function SignUpScreen() {
  const navigation = useNavigation<Nav>();
  const { success } = useHaptics();
  const signUp = useAuthStore((s) => s.actions.signUp);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [buttonSpinning, setButtonSpinning] = useState(false);

  const strength = getPasswordStrength(password);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  // Animated strength bar
  const strengthWidth = useSharedValue(0);

  useEffect(() => {
    strengthWidth.value = withTiming((strength.score / 5) * 100, { duration: 300 });
  }, [strength.score]);

  const strengthBarStyle = useAnimatedStyle(() => ({
    height: 3,
    width: `${strengthWidth.value}%` as `${number}%`,
    backgroundColor: STRENGTH_COLORS[strength.score],
    borderRadius: 2,
  }));

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

  const handlePressIn = () => {
    if (!loading) {
      setButtonSpinning(true);
      btnScale.value = withSpring(0.97, { damping: 12 });
    }
  };

  const handlePressOut = () => {
    btnScale.value = withSpring(1, { damping: 14 });
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
    if (confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUp(email, password, displayName);
      success();
      // Navigate to email verification — if Supabase email confirmation is disabled,
      // the user can tap "Already verified? Sign in" to proceed directly.
      navigation.navigate('EmailVerification', { email });
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

      {/* Confetti burst on success — EmailVerificationScreen handles post-signup celebration */}

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
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: BASE_COLORS.textSecondary, marginBottom: 40 }}>
              Start designing with AI
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
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Display name"
                autoCapitalize="words"
                icon="person"
                isValid={displayName.trim().length >= 2}
              />
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
              />

              {/* Password strength bar */}
              {password.length > 0 && (
                <View style={{ marginTop: -4, marginBottom: 16 }}>
                  <View style={{ height: 3, backgroundColor: BASE_COLORS.border, borderRadius: 2, marginBottom: 6 }}>
                    <Animated.View style={strengthBarStyle} />
                  </View>
                  <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: STRENGTH_COLORS[strength.score] }}>
                    {strength.label}
                  </Text>
                </View>
              )}

              <RoundedInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                secureTextEntry
                icon="lock"
                isValid={passwordsMatch}
                error={passwordMismatch ? 'Passwords do not match' : undefined}
              />

              {error ? (
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#C0604A', marginBottom: 16, marginTop: -4 }}>
                  {error}
                </Text>
              ) : null}

              <Animated.View style={btnAnimStyle}>
                <Pressable
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={() => { void handleSignUp(); }}
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? BASE_COLORS.border : '#C8C8C8',
                    borderRadius: 16,
                    height: 56,
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
                      <ButtonCompassRose spinning={buttonSpinning} color="#1A1A1A" />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#1A1A1A' }}>
                        Create Account
                      </Text>
                    </>
                  )}
                </Pressable>
              </Animated.View>
            </View>

            <Pressable onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center', marginTop: 24 }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textSecondary }}>
                Already have an account? <Text style={{ color: BASE_COLORS.textPrimary }}>Sign in</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
