import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTierGate } from '../../hooks/useTierGate';
import { useTheme } from '../../hooks/useTheme';
import type { TierLimits } from '../../utils/tierLimits';
import type { SubscriptionTier } from '../../types';
import type { RootStackParamList } from '../../navigation/types';
import { supabase } from '../../utils/supabaseClient';

const TIER_LABELS: Record<SubscriptionTier, string> = {
  starter: 'Starter',
  creator: 'Creator',
  architect: 'Architect',
};

const TIER_DESCRIPTIONS: Record<SubscriptionTier, string> = {
  starter: 'Get started for free',
  creator: 'Unlock full creative suite — $14.99/mo',
  architect: 'Professional tools, unlimited everything — $39.99/mo',
};

interface Props {
  feature: keyof TierLimits;
  featureLabel?: string;
  children: React.ReactNode;
}

export function TierGate({ feature, featureLabel, children }: Props) {
  const { allowed, requiredTier } = useTierGate(feature);
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const overlayOpacity = useSharedValue(0);
  const overlayScale = useSharedValue(0.95);

  useEffect(() => {
    if (!allowed) {
      overlayOpacity.value = withTiming(1, { duration: 200 });
      overlayScale.value = withSpring(1, { damping: 18, stiffness: 200 });

      // Fire-and-forget analytics
      trackAttempt(feature).catch(() => null);
    }
  }, [allowed, feature]); // eslint-disable-line react-hooks/exhaustive-deps

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [{ scale: overlayScale.value }],
  }));

  if (allowed) return <>{children}</>;

  const tier = requiredTier ?? 'creator';
  const label = featureLabel ?? String(feature).replace(/_/g, ' ');

  return (
    <View className="flex-1">
      {/* Dimmed children preview */}
      <View style={{ opacity: 0.15 }} pointerEvents="none">
        {children}
      </View>

      {/* Overlay */}
      <Animated.View
        style={[
          overlayStyle,
          {
            position: 'absolute',
            inset: 0,
            backgroundColor: colors.surface + 'F0',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            borderRadius: 16,
          },
        ]}
      >
        <Text className="text-5xl mb-4">🔒</Text>

        <Text
          className="text-xl mb-2 text-center"
          style={{ color: colors.textPrimary, fontFamily: 'ArchitectsDaughter_400Regular' }}
        >
          {TIER_LABELS[tier]} Feature
        </Text>

        <Text
          className="text-sm text-center mb-2"
          style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular' }}
        >
          {label} is available on {TIER_LABELS[tier]} and above.
        </Text>

        <Text
          className="text-xs text-center mb-8"
          style={{ color: colors.textDim, fontFamily: 'Inter_400Regular' }}
        >
          {TIER_DESCRIPTIONS[tier]}
        </Text>

        <Pressable
          className="px-8 py-3 rounded-full mb-3"
          style={{ backgroundColor: colors.primary }}
          onPress={() => navigation.navigate('Subscription', { feature: label })}
        >
          <Text
            style={{ color: colors.background, fontFamily: 'Inter_700Bold', fontSize: 15 }}
          >
            Upgrade to {TIER_LABELS[tier]}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
        >
          <Text
            style={{ color: colors.textDim, fontFamily: 'Inter_400Regular', fontSize: 13 }}
          >
            Maybe Later
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

async function trackAttempt(feature: keyof TierLimits): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('tier_gate_attempts').insert({
      user_id: user.id,
      feature: String(feature),
      attempted_at: new Date().toISOString(),
    });
  } catch {
    // fire-and-forget, ignore all errors
  }
}
