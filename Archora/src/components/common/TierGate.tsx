import React from 'react';
import { View, Text } from 'react-native';
import { useTierGate } from '../../hooks/useTierGate';
import type { TierLimits } from '../../utils/tierLimits';
import { UpgradePrompt } from './UpgradePrompt';

interface Props {
  feature: keyof TierLimits;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function TierGate({ feature, children, fallback }: Props) {
  const { allowed, requiredTier } = useTierGate(feature);

  if (allowed) return <>{children}</>;
  if (fallback) return <>{fallback}</>;
  return <UpgradePrompt requiredTier={requiredTier ?? 'creator'} feature={String(feature)} />;
}
