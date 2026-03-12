import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import type { SubscriptionTier } from '../../types';

interface Props {
  requiredTier: SubscriptionTier;
  feature: string;
  onDismiss?: () => void;
}

const TIER_LABELS: Record<SubscriptionTier, string> = {
  starter: 'Starter',
  creator: 'Creator',
  architect: 'Architect',
};

export function UpgradePrompt({ requiredTier, feature, onDismiss }: Props) {
  const { colors } = useTheme();

  return (
    <View
      className="flex-1 items-center justify-center p-6"
      style={{ backgroundColor: colors.surfaceHigh }}
    >
      <Text className="text-4xl mb-4">🔒</Text>
      <Text
        className="text-xl mb-2 text-center font-heading"
        style={{ color: colors.textPrimary, fontFamily: 'ArchitectsDaughter_400Regular' }}
      >
        {TIER_LABELS[requiredTier]} Feature
      </Text>
      <Text
        className="text-sm text-center mb-6"
        style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular' }}
      >
        {feature} requires a {TIER_LABELS[requiredTier]} subscription.
      </Text>
      <Pressable
        className="px-6 py-3 rounded-full"
        style={{ backgroundColor: colors.primary }}
      >
        <Text style={{ color: colors.background, fontFamily: 'Inter_700Bold', fontSize: 15 }}>
          Upgrade to {TIER_LABELS[requiredTier]}
        </Text>
      </Pressable>
      {onDismiss && (
        <Pressable onPress={onDismiss} className="mt-4">
          <Text style={{ color: colors.textDim, fontFamily: 'Inter_400Regular', fontSize: 13 }}>
            Not now
          </Text>
        </Pressable>
      )}
    </View>
  );
}
