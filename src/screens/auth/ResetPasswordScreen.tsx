import React, { useState, useEffect } from 'react';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../../components/common/ArchText';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import {
  View, TextInput, Pressable, KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  withSpring,
  withDelay,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../utils/supabaseClient';


import type { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;

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

function PasswordInput({
  value, onChange, placeholder, error,
}: {
  value: string;
  onChange: (t: string) => void;
  placeholder: string;
  error?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
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
    <View style={{ marginBottom: 16 }}>
      <Animated.View style={animatedStyle}>
        <Svg width={18} height={18} viewBox="0 0 24 24" style={{ marginRight: 12 }}>
          <Path
            d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
            fill="#5A5550"
          />
        </Svg>
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => { borderProgress.value = withTiming(1, { duration: 200 }); }}
          onBlur={() => { borderProgress.value = withTiming(0, { duration: 150 }); }}
          placeholder={placeholder}
          placeholderTextColor="#4A4A4A"
          secureTextEntry={!showPassword}
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
        <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
          <Svg width={18} height={18} viewBox="0 0 24 24" style={{ marginLeft: 8 }}>
            {showPassword ? (
              <Path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#5A5550" />
            ) : (
              <Path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="#5A5550" />
            )}
          </Svg>
        </Pressable>
      </Animated.View>
      {error ? (
        <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.error, marginTop: 6, marginLeft: 4 }}>
          {error}
        </ArchText>
      ) : null}
    </View>
  );
}

export function ResetPasswordScreen() {
  const navigation = useNavigation<Nav>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenReady, setTokenReady] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const strength = getPasswordStrength(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const strengthWidth = useSharedValue(0);
  useEffect(() => {
    strengthWidth.value = withTiming((strength.score / 5) * 100, { duration: 300 });
  }, [strength.score, strengthWidth]);

  const strengthBarStyle = useAnimatedStyle(() => ({
    height: 3,
    width: `${strengthWidth.value}%` as `${number}%`,
    backgroundColor: STRENGTH_COLORS[strength.score],
    borderRadius: 2,
  }));

  // Entry animations
  const formOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
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

  // Extract token_hash from the deep link and verify it
  useEffect(() => {
    const processUrl = async (url: string | null) => {
      if (!url) return;
      try {
        const params = new URL(url);
        const tokenHash = params.searchParams.get('token_hash');
        const type = params.searchParams.get('type') as 'recovery' | null;
        if (tokenHash && type === 'recovery') {
          const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
          if (otpError) {
            setTokenError('Reset link is invalid or has expired. Please request a new one.');
          } else {
            setTokenReady(true);
          }
        } else {
          // If no token in URL, check if we already have a session (user tapped link and app was open)
          const { data: { session } } = await supabase.auth.getSession();
          if (session) setTokenReady(true);
          else setTokenError('No reset token found. Please request a new link.');
        }
      } catch {
        setTokenError('Could not process reset link. Please try again.');
      }
    };

    void Linking.getInitialURL().then(processUrl);

    const sub = Linking.addEventListener('url', ({ url }) => { void processUrl(url); });
    return () => sub.remove();
  }, []);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      // Sign out so user signs in fresh with new password
      await supabase.auth.signOut();
      navigation.navigate('Login');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1, padding: 32, paddingTop: 80 }}>
          <Animated.View style={titleStyle}>
            <ArchText variant="body" style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 32,
              color: DS.colors.primary,
              marginBottom: 10,
            }}>
              New Password
            </ArchText>
            <ArchText variant="body" style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              color: DS.colors.primaryDim,
              marginBottom: 40,
            }}>
              Choose a strong password for your account
            </ArchText>
          </Animated.View>

          <Animated.View style={formStyle}>
            {tokenError ? (
              <View style={{ alignItems: 'center', paddingTop: 24 }}>
                <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.error, textAlign: 'center', marginBottom: 24 }}>
                  {tokenError}
                </ArchText>
                <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
                  <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primaryDim }}>
                    Request a new link
                  </ArchText>
                </Pressable>
              </View>
            ) : !tokenReady ? (
              <View style={{ alignItems: 'center', paddingTop: 48 }}>
                <CompassRoseLoader size="medium" />
                <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost, marginTop: 16 }}>
                  Verifying reset link...
                </ArchText>
              </View>
            ) : (
              <View style={{ backgroundColor: '#222222', borderRadius: 24, padding: 24, marginHorizontal: 4 }}>
                <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="New password" />

                {/* Password strength bar */}
                {newPassword.length > 0 && (
                  <View style={{ marginTop: -8, marginBottom: 16 }}>
                    <View style={{ height: 3, backgroundColor: DS.colors.border, borderRadius: 2, marginBottom: 6 }}>
                      <Animated.View style={strengthBarStyle} />
                    </View>
                    <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: STRENGTH_COLORS[strength.score] }}>
                      {strength.label}
                    </ArchText>
                  </View>
                )}

                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirm password"
                  error={passwordMismatch ? 'Passwords do not match' : error || undefined}
                />

                {/* Confirm valid tick */}
                {passwordsMatch && (
                  <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#7AB87A', marginTop: -8, marginBottom: 12, marginLeft: 4 }}>
                    ✓ Passwords match
                  </ArchText>
                )}

                <Animated.View style={[btnStyle, { marginTop: 8 }]}>
                  <Pressable
                    onPressIn={() => { btnScale.value = withSpring(0.97, { damping: 12 }); }}
                    onPressOut={() => { btnScale.value = withSpring(1, { damping: 14 }); }}
                    onPress={() => { void handleUpdatePassword(); }}
                    disabled={loading || !passwordsMatch}
                    style={{
                      backgroundColor: loading || !passwordsMatch ? DS.colors.border : '#C8C8C8',
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
                        Update Password
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
