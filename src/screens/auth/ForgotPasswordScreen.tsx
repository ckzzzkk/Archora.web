import React, { useState, useEffect } from 'react';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../../components/common/ArchText';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import {
  View, TextInput, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';


import type { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

function SentEnvelope() {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    translateX.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(-8, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
    marginBottom: 24,
  }));

  return (
    <Animated.View style={style}>
      <Svg width={72} height={56} viewBox="0 0 72 56">
        <Rect x={2} y={2} width={68} height={52} rx={4} fill={DS.colors.surfaceHigh} stroke="#C8C8C8" strokeWidth={1.5} />
        <Path d="M2 8 L36 32 L70 8" stroke="#C8C8C8" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M2 54 L26 36 M70 54 L46 36" stroke="#5A5550" strokeWidth={1} strokeLinecap="round" />
        {/* Checkmark */}
        <Path d="M28 28 L33 34 L44 22" stroke="#7AB87A" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

function EmailInput({ value, onChange, error }: { value: string; onChange: (t: string) => void; error?: string }) {
  const borderProgress = useSharedValue(0);
  const borderColor = useDerivedValue(() =>
    interpolateColor(borderProgress.value, [0, 1], ['#333333', '#C8C8C8'])
  );
  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: error ? DS.colors.error : borderColor.value,
    borderRadius: 50,
    backgroundColor: '#2C2C2C',
    borderWidth: 1.5,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  }));

  return (
    <View style={{ marginBottom: 8 }}>
      <Animated.View style={animatedStyle}>
        <Svg width={18} height={18} viewBox="0 0 24 24" style={{ marginRight: 12 }}>
          <Path d="M3 5h18v14H3V5zm9 7L3 6v1l9 6 9-6V6l-9 6zm0 0" fill="#5A5550" />
        </Svg>
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => { borderProgress.value = withTiming(1, { duration: 200 }); }}
          onBlur={() => { borderProgress.value = withTiming(0, { duration: 150 }); }}
          placeholder="Email address"
          placeholderTextColor="#4A4A4A"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            flex: 1,
            fontFamily: 'Inter_400Regular',
            fontSize: 15,
            color: DS.colors.primary,
            padding: 0,
          }}
        />
      </Animated.View>
      {error ? (
        <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.error, marginTop: 6, marginLeft: 4 }}>
          {error}
        </ArchText>
      ) : null}
    </View>
  );
}

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  // Entry animations
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const formOpacity = useSharedValue(0);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    titleOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    titleY.value = withDelay(100, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
    formOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({ opacity: formOpacity.value }));
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handleSend = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: supaError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'asoria://reset-password',
    });
    setLoading(false);
    if (supaError) {
      setError(supaError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1, padding: 32, paddingTop: 80 }}>
          <Pressable onPress={() => navigation.goBack()} style={{ marginBottom: 40 }}>
            <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primaryGhost }}>
              ← Back
            </ArchText>
          </Pressable>

          <Animated.View style={titleStyle}>
            <ArchText variant="body" style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 32,
              color: DS.colors.primary,
              marginBottom: 10,
            }}>
              Reset Password
            </ArchText>
            <ArchText variant="body" style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              color: DS.colors.primaryDim,
              marginBottom: 40,
              lineHeight: 22,
            }}>
              Enter your email and we{'\u2019'}ll send you a reset link
            </ArchText>
          </Animated.View>

          <Animated.View style={formStyle}>
            {sent ? (
              <View style={{ alignItems: 'center', paddingTop: 16 }}>
                <SentEnvelope />
                <ArchText variant="body" style={{
                  fontFamily: 'ArchitectsDaughter_400Regular',
                  fontSize: 22,
                  color: DS.colors.primary,
                  textAlign: 'center',
                  marginBottom: 12,
                }}>
                  Check your inbox
                </ArchText>
                <ArchText variant="body" style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 14,
                  color: DS.colors.primaryDim,
                  textAlign: 'center',
                  marginBottom: 8,
                  lineHeight: 21,
                }}>
                  Reset instructions sent to{'\n'}
                  <ArchText variant="body" style={{ color: DS.colors.primary }}>{email}</ArchText>
                </ArchText>
                <ArchText variant="body" style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 12,
                  color: DS.colors.primaryGhost,
                  textAlign: 'center',
                  marginBottom: 32,
                  lineHeight: 18,
                }}>
                  Reset link expires in 1 hour.{'\n'}Check your spam folder if you don{'\u2019'}t see it.
                </ArchText>
                <Pressable onPress={() => navigation.navigate('Login')}>
                  <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primaryDim }}>
                    Back to{' '}
                    <ArchText variant="body" style={{ color: DS.colors.primary, textDecorationLine: 'underline' }}>Sign in</ArchText>
                  </ArchText>
                </Pressable>
              </View>
            ) : (
              <View style={{ backgroundColor: '#222222', borderRadius: 24, padding: 24, marginHorizontal: 4 }}>
                <EmailInput value={email} onChange={setEmail} error={error} />

                <Animated.View style={[btnStyle, { marginTop: 16 }]}>
                  <Pressable
                    onPressIn={() => { btnScale.value = withSpring(0.97, { damping: 12 }); }}
                    onPressOut={() => { btnScale.value = withSpring(1, { damping: 14 }); }}
                    onPress={() => { void handleSend(); }}
                    disabled={loading}
                    style={{
                      backgroundColor: loading ? DS.colors.border : '#C8C8C8',
                      borderRadius: 50,
                      height: 56,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {loading ? (
                      <CompassRoseLoader size="small" />
                    ) : (
                      <ArchText variant="body" style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: DS.colors.background }}>
                        Send Reset Link
                      </ArchText>
                    )}
                  </Pressable>
                </Animated.View>
              </View>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
