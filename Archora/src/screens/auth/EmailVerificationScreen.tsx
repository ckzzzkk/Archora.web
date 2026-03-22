import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { supabase } from '../../utils/supabaseClient';
import { BASE_COLORS } from '../../theme/colors';
import { LogoLoader } from '../../components/common/LogoLoader';
import type { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'EmailVerification'>;
type Route = RouteProp<AuthStackParamList, 'EmailVerification'>;

const RESEND_COOLDOWN = 60;

// Animated envelope with letter sliding out
function EnvelopeAnimation() {
  const letterY = useSharedValue(0);
  const envelopeScale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    envelopeScale.value = withSpring(1, { damping: 14, stiffness: 200 });
    letterY.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(-12, { duration: 600, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: envelopeScale.value }],
    alignItems: 'center' as const,
    marginBottom: 32,
  }));

  const letterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: letterY.value }],
    position: 'absolute' as const,
    top: -12,
  }));

  return (
    <Animated.View style={containerStyle}>
      {/* Letter peeking out */}
      <Animated.View style={letterStyle}>
        <Svg width={48} height={32} viewBox="0 0 48 32">
          <Rect x={4} y={4} width={40} height={28} rx={2} fill={BASE_COLORS.surface} stroke="#C8C8C8" strokeWidth={1.5} />
          <Path d="M4 8 L24 20 L44 8" stroke="#C8C8C8" strokeWidth={1.5} fill="none" strokeLinecap="round" />
        </Svg>
      </Animated.View>
      {/* Envelope body */}
      <Svg width={80} height={60} viewBox="0 0 80 60">
        {/* Envelope body */}
        <Rect x={2} y={18} width={76} height={40} rx={4} fill={BASE_COLORS.surfaceHigh} stroke="#C8C8C8" strokeWidth={1.5} />
        {/* Flap */}
        <Path d="M2 18 L40 44 L78 18" stroke="#C8C8C8" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Bottom seam */}
        <Path d="M2 58 L30 38 M78 58 L50 38" stroke="#5A5550" strokeWidth={1} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

export function EmailVerificationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { email } = route.params;

  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Entry animations
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const bodyOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    titleY.value = withDelay(100, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
    bodyOpacity.value = withDelay(350, withTiming(1, { duration: 500 }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: bodyOpacity.value,
  }));

  // Listen for auth state change — if user confirms email, auth flow picks up automatically
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // authStore.isAuthenticated will become true → RootNavigator handles routing
        // No explicit navigation needed here
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setResendError('');
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    if (error) {
      setResendError(error.message);
    } else {
      startCooldown();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1, padding: 32, paddingTop: 80, alignItems: 'center', justifyContent: 'center' }}>
          <EnvelopeAnimation />

          <Animated.View style={[titleStyle, { alignItems: 'center', width: '100%' }]}>
            <Text style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 32,
              color: BASE_COLORS.textPrimary,
              textAlign: 'center',
              marginBottom: 12,
            }}>
              Check your inbox
            </Text>
            <Text style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              color: BASE_COLORS.textSecondary,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 40,
            }}>
              We sent a verification link to{'\n'}
              <Text style={{ color: BASE_COLORS.textPrimary }}>{email}</Text>
            </Text>
          </Animated.View>

          <Animated.View style={[bodyStyle, { width: '100%', gap: 12 }]}>
            {/* Resend button */}
            <Pressable
              onPress={() => { void handleResend(); }}
              disabled={cooldown > 0 || resending}
              style={{
                backgroundColor: cooldown > 0 || resending ? BASE_COLORS.border : '#C8C8C8',
                borderRadius: 16,
                height: 52,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {resending ? (
                <LogoLoader size="small" />
              ) : (
                <Text style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: 15,
                  color: cooldown > 0 ? BASE_COLORS.textDim : BASE_COLORS.background,
                }}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
                </Text>
              )}
            </Pressable>

            {resendError ? (
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.error, textAlign: 'center' }}>
                {resendError}
              </Text>
            ) : null}

            {/* Already verified link */}
            <Pressable
              onPress={() => navigation.navigate('Login')}
              style={{ alignItems: 'center', marginTop: 8 }}
            >
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textSecondary }}>
                Already verified?{' '}
                <Text style={{ color: BASE_COLORS.textPrimary, textDecorationLine: 'underline' }}>Sign in</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
