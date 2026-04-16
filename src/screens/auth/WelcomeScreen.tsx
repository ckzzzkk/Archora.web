import React, { useEffect } from 'react';
import { View, Pressable, Platform, Dimensions } from 'react-native';

const SCREEN_W = Dimensions.get('window').width;
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GridBackground } from '../../components/common/GridBackground';
import { OvalButton } from '../../components/common/OvalButton';
import { ArchText } from '../../components/common/ArchText';
import { DS } from '../../theme/designSystem';
import { signInWithGoogle } from '../../auth/signInWithGoogle';
import { BRAND } from '../../utils/branding';
import type { AuthStackParamList } from '../../navigation/types';

function CompassLogo() {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      {/* Outer circle */}
      <Circle cx="32" cy="32" r="28" stroke="#F0EDE8" strokeWidth="1" fill="none" />
      {/* The A letterform */}
      <Path d="M32 14 L18 50 M32 14 L46 50" stroke="#F0EDE8" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* A crossbar */}
      <Path d="M22 40 L42 40" stroke="#F0EDE8" strokeWidth="2" strokeLinecap="round" />
      {/* NSEW tick marks */}
      <Line x1="32" y1="4"  x2="32" y2="10" stroke="#F0EDE8" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="32" y1="54" x2="32" y2="60" stroke="#F0EDE8" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="4"  y1="32" x2="10" y2="32" stroke="#F0EDE8" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="54" y1="32" x2="60" y2="32" stroke="#F0EDE8" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

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

export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const insets = useSafeAreaInsets();

  // Entry animations
  const logoOp = useSharedValue(0);
  const logoY  = useSharedValue(20);
  const titleOp = useSharedValue(0);
  const titleY  = useSharedValue(16);
  const sepOp   = useSharedValue(0);
  const subOp   = useSharedValue(0);
  const subY    = useSharedValue(10);
  const btnsOp  = useSharedValue(0);
  const btnsY   = useSharedValue(16);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    logoOp.value  = withDelay(0,   withTiming(1, { duration: 500, easing: ease }));
    logoY.value   = withDelay(0,   withTiming(0, { duration: 500, easing: ease }));
    titleOp.value = withDelay(200, withTiming(1, { duration: 400, easing: ease }));
    titleY.value  = withDelay(200, withTiming(0, { duration: 400, easing: ease }));
    sepOp.value   = withDelay(350, withTiming(1, { duration: 300, easing: ease }));
    subOp.value   = withDelay(450, withTiming(1, { duration: 400, easing: ease }));
    subY.value    = withDelay(450, withTiming(0, { duration: 400, easing: ease }));
    btnsOp.value  = withDelay(600, withTiming(1, { duration: 400, easing: ease }));
    btnsY.value   = withDelay(600, withTiming(0, { duration: 400, easing: ease }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoStyle   = useAnimatedStyle(() => ({ opacity: logoOp.value, transform: [{ translateY: logoY.value }] }));
  const titleStyle  = useAnimatedStyle(() => ({ opacity: titleOp.value, transform: [{ translateY: titleY.value }] }));
  const sepStyle    = useAnimatedStyle(() => ({ opacity: sepOp.value }));
  const subStyle    = useAnimatedStyle(() => ({ opacity: subOp.value, transform: [{ translateY: subY.value }] }));
  const btnsStyle   = useAnimatedStyle(() => ({ opacity: btnsOp.value, transform: [{ translateY: btnsY.value }] }));

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch {
      // Error handled by auth store
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
      <GridBackground />

      {/* Center content */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[{ alignItems: 'center' }, logoStyle]}>
          <CompassLogo />
        </Animated.View>

        <Animated.View style={[{ alignItems: 'center', marginTop: DS.spacing.md }, titleStyle]}>
          <ArchText
            variant="heading"
            style={{ fontSize: Math.min(48, SCREEN_W * 0.125), letterSpacing: Math.min(10, SCREEN_W * 0.026), color: DS.colors.primary }}
          >
            {BRAND.displayName}
          </ArchText>
        </Animated.View>

        <Animated.View style={[{ marginVertical: DS.spacing.md }, sepStyle]}>
          <View style={{ width: 120, height: 1, backgroundColor: DS.colors.border }} />
        </Animated.View>

        <Animated.View style={[{ paddingHorizontal: DS.spacing.lg }, subStyle]}>
          <ArchText
            variant="body"
            style={{ fontSize: DS.fontSize.md, color: DS.colors.primaryDim, textAlign: 'center', lineHeight: 22 }}
          >
            {BRAND.tagline}
          </ArchText>
        </Animated.View>
      </View>

      {/* Bottom buttons */}
      <Animated.View
        style={[
          {
            paddingHorizontal: DS.spacing.lg,
            paddingBottom: Math.max(insets.bottom, DS.spacing.lg) + DS.spacing.lg,
            gap: DS.spacing.sm,
          },
          btnsStyle,
        ]}
      >
        <OvalButton
          label="Sign In"
          variant="filled"
          fullWidth
          onPress={() => navigation.navigate('Login')}
        />
        <OvalButton
          label="Create Account"
          variant="outline"
          fullWidth
          onPress={() => navigation.navigate('SignUp')}
        />

        {/* OR divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm, marginVertical: 4 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#2A2A2A' }} />
          <ArchText variant="caption" style={{ color: DS.colors.primaryGhost, fontSize: 13 }}>or</ArchText>
          <View style={{ flex: 1, height: 1, backgroundColor: '#2A2A2A' }} />
        </View>

        {/* Google button */}
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
          <ArchText
            variant="body"
            style={{ fontFamily: 'Inter_500Medium', fontSize: DS.fontSize.md, color: DS.colors.primary }}
          >
            Continue with Google
          </ArchText>
        </Pressable>

        {/* Terms */}
        <ArchText
          variant="caption"
          style={{ fontSize: 12, color: DS.colors.primaryGhost, textAlign: 'center', marginTop: 4 }}
        >
          {`By continuing you agree to our Terms of Service and Privacy Policy`}
        </ArchText>
      </Animated.View>
    </View>
  );
}
