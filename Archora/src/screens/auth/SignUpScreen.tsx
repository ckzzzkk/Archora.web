import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolateColor,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { BASE_COLORS } from '../../theme/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

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
  const borderOpacity = useSharedValue(0);
  const borderStyle = useAnimatedStyle(() => ({
    borderWidth: focused ? 1.5 : 0,
    borderColor: accentColor,
    borderRadius: 8,
  }));

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: BASE_COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
      <Animated.View style={borderStyle}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 16,
            color: BASE_COLORS.textPrimary,
            paddingVertical: 12,
            paddingHorizontal: focused ? 12 : 0,
            borderBottomWidth: focused ? 0 : 1,
            borderBottomColor: BASE_COLORS.border,
          }}
          placeholderTextColor={BASE_COLORS.textDim}
        />
      </Animated.View>
    </View>
  );
}

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

  const strength = getPasswordStrength(password);

  const strengthColors = ['#333', BASE_COLORS.error, BASE_COLORS.warning, BASE_COLORS.success, BASE_COLORS.success, colors.primary];

  const handleSignUp = async () => {
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
    } catch (e) {
      setError('Sign up failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BASE_COLORS.background }}
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

        <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 36, color: BASE_COLORS.textPrimary, marginBottom: 8 }}>
          Create Account
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: BASE_COLORS.textSecondary, marginBottom: 48 }}>
          Start designing with AI
        </Text>

        <SketchInput label="Display Name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" accentColor={colors.primary} />
        <SketchInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" accentColor={colors.primary} />
        <SketchInput label="Password" value={password} onChangeText={setPassword} secureTextEntry accentColor={colors.primary} />

        {/* Password strength bar */}
        {password.length > 0 && (
          <View style={{ marginBottom: 24, marginTop: -16 }}>
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
          onPress={() => { void handleSignUp(); }}
          disabled={loading}
          style={{
            backgroundColor: loading ? BASE_COLORS.border : colors.primary,
            borderRadius: 24,
            paddingVertical: 16,
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          {loading ? (
            <CompassRoseLoader size="small" />
          ) : (
            <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 17, color: BASE_COLORS.background }}>
              Create Account
            </Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center', marginTop: 24 }}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textSecondary }}>
            Already have an account? <Text style={{ color: colors.primary }}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
