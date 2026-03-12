import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { BASE_COLORS } from '../../theme/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

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
  const borderWidth = useSharedValue(0);
  const borderColor = useSharedValue(accentColor);

  const borderStyle = useAnimatedStyle(() => ({
    borderWidth: borderWidth.value,
    borderColor: borderColor.value,
    borderRadius: 8,
  }));

  const handleFocus = () => {
    setFocused(true);
    borderWidth.value = withTiming(1.5, { duration: 200 });
  };

  const handleBlur = () => {
    setFocused(false);
    borderWidth.value = withTiming(0, { duration: 150 });
  };

  return (
    <View style={{ marginBottom: 24 }}>
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
      <Animated.View style={borderStyle}>
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
            paddingVertical: 12,
            paddingHorizontal: focused ? 12 : 0,
            borderBottomWidth: focused ? 0 : 1,
            borderBottomColor: error ? BASE_COLORS.error : BASE_COLORS.border,
          }}
          placeholderTextColor={BASE_COLORS.textDim}
        />
      </Animated.View>
      {error && (
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: BASE_COLORS.error, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}

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

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      success();
    } catch (e) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 4) errorHaptic();
      setError('Invalid email or password. Please try again.');
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
          onPress={() => { void handleSignIn(); }}
          disabled={loading}
          style={{
            backgroundColor: loading ? BASE_COLORS.border : colors.primary,
            borderRadius: 24,
            paddingVertical: 16,
            alignItems: 'center',
            marginTop: 16,
          }}
        >
          {loading ? (
            <CompassRoseLoader size="small" />
          ) : (
            <Text style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 17,
              color: BASE_COLORS.background,
            }}>
              Sign In
            </Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
