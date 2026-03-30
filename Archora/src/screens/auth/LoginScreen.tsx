import React, { useState, useEffect, useRef } from 'react';
import {
  View, Pressable, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { OvalInput } from '../../components/common/OvalInput';
import { OvalButton } from '../../components/common/OvalButton';
import { ArchText } from '../../components/common/ArchText';
import { DS } from '../../theme/designSystem';
import { useAuthStore } from '../../stores/authStore';
import type { AuthStackParamList } from '../../navigation/types';

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC04" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

function EnvelopeIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={DS.colors.primaryDim} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 6l-10 7L2 6" stroke={DS.colors.primaryDim} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z" stroke={DS.colors.primaryDim} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 11V7a5 5 0 0110 0v4" stroke={DS.colors.primaryDim} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={DS.colors.primaryDim} strokeWidth="1.5" fill="none" />
      <Path d="M12 9a3 3 0 100 6 3 3 0 000-6z" stroke={DS.colors.primaryDim} strokeWidth="1.5" fill="none" />
    </Svg>
  ) : (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke={DS.colors.primaryDim} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// ─── LoginScreen ──────────────────────────────────────────────────────────────

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const insets = useSafeAreaInsets();
  const { signIn, signInWithGoogle } = useAuthStore((s) => s.actions);

  // Form state
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Rate limiting — preserved from existing implementation
  const [attempts, setAttempts]       = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown]     = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (lockedUntil) {
      countdownRef.current = setInterval(() => {
        const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockedUntil(null);
          setAttempts(0);
          setCountdown(0);
          if (countdownRef.current) clearInterval(countdownRef.current);
        } else {
          setCountdown(remaining);
        }
      }, 1000);
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [lockedUntil]);

  // Entry animations
  const headerOp = useSharedValue(0);
  const formOp   = useSharedValue(0);
  const formY    = useSharedValue(16);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    headerOp.value = withTiming(1, { duration: 400, easing: ease });
    formOp.value   = withDelay(200, withTiming(1, { duration: 400, easing: ease }));
    formY.value    = withDelay(200, withTiming(0, { duration: 400, easing: ease }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOp.value }));
  const formStyle   = useAnimatedStyle(() => ({
    opacity: formOp.value,
    transform: [{ translateY: formY.value }],
  }));

  const handleSignIn = async () => {
    if (lockedUntil && Date.now() < lockedUntil) return;
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // Navigation handled by RootNavigator auth state change
    } catch (e) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        const lockTime = Date.now() + 30_000;
        setLockedUntil(lockTime);
        setError('Too many attempts. Wait 30 seconds.');
      } else {
        setError(e instanceof Error ? e.message : 'Sign in failed. Check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch {
      setError('Google sign in failed. Please try again.');
    }
  };

  const isLocked = !!(lockedUntil && Date.now() < lockedUntil);

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
      <Animated.View style={headerStyle}>
        <ScreenHeader title="Welcome back" onBack={() => navigation.goBack()} />
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: DS.spacing.lg,
            paddingTop: DS.spacing.sm,
            paddingBottom: Math.max(insets.bottom, DS.spacing.lg) + DS.spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ArchText
            variant="body"
            style={{ color: DS.colors.primaryDim, fontSize: DS.fontSize.md, marginBottom: DS.spacing.lg }}
          >
            Sign in to your account
          </ArchText>

          <Animated.View style={[{ gap: DS.spacing.md }, formStyle]}>
            {/* Error card */}
            {error !== '' && (
              <View style={{
                backgroundColor: '#C0604A20',
                borderWidth: 1,
                borderColor: '#C0604A50',
                borderRadius: DS.spacing.md,
                padding: DS.spacing.md,
              }}>
                <ArchText variant="body" style={{ color: DS.colors.error, fontSize: DS.fontSize.sm }}>
                  {isLocked ? `Too many attempts. Wait ${countdown}s.` : error}
                </ArchText>
              </View>
            )}

            <OvalInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<EnvelopeIcon />}
              returnKeyType="next"
            />

            <OvalInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry={!showPw}
              leftIcon={<LockIcon />}
              rightIcon={<EyeIcon visible={showPw} />}
              onRightIconPress={() => setShowPw((v) => !v)}
              returnKeyType="done"
              onSubmitEditing={() => { void handleSignIn(); }}
            />

            {/* Forgot password */}
            <View style={{ alignItems: 'flex-end' }}>
              <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
                <ArchText variant="body" style={{ color: DS.colors.primaryDim, fontSize: DS.fontSize.sm }}>
                  Forgot password?
                </ArchText>
              </Pressable>
            </View>

            <OvalButton
              label={isLocked ? `Wait ${countdown}s` : 'Sign In'}
              variant="filled"
              fullWidth
              loading={loading}
              disabled={isLocked || loading}
              onPress={() => { void handleSignIn(); }}
            />

            {/* OR divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#2A2A2A' }} />
              <ArchText variant="caption" style={{ color: DS.colors.primaryGhost, fontSize: 13 }}>or</ArchText>
              <View style={{ flex: 1, height: 1, backgroundColor: '#2A2A2A' }} />
            </View>

            {/* Google sign-in */}
            <Pressable
              onPress={() => { void handleGoogleSignIn(); }}
              style={{
                height: 52,
                borderRadius: 50,
                backgroundColor: DS.colors.surface,
                borderWidth: 1,
                borderColor: DS.colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: DS.spacing.sm,
              }}
            >
              <GoogleIcon />
              <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: DS.fontSize.md, color: DS.colors.primary }}>
                Continue with Google
              </ArchText>
            </Pressable>

            {/* Sign up link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: DS.spacing.sm }}>
              <ArchText variant="body" style={{ color: DS.colors.primaryDim, fontSize: DS.fontSize.sm }}>
                Don't have an account?
              </ArchText>
              <Pressable onPress={() => navigation.navigate('SignUp')} hitSlop={8}>
                <ArchText variant="body" style={{ color: DS.colors.primary, fontSize: DS.fontSize.sm, textDecorationLine: 'underline' }}>
                  Create one
                </ArchText>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
