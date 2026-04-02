import { DS } from '../../theme/designSystem';
import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from './Button';
import { useTheme } from '../../hooks/useTheme';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({ title, subtitle, icon = '◻', actionLabel, onAction, compact = false }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={{
        flex: compact ? 0 : 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: compact ? 24 : 40,
      }}
    >
      <Text
        style={{
          fontSize: compact ? 32 : 48,
          marginBottom: 16,
          color: colors.primaryDim,
          fontFamily: 'ArchitectsDaughter_400Regular',
        }}
      >
        {icon}
      </Text>

      <Text
        style={{
          fontFamily: 'ArchitectsDaughter_400Regular',
          fontSize: compact ? 16 : 20,
          color: DS.colors.primary,
          textAlign: 'center',
          marginBottom: subtitle ? 8 : 0,
        }}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 14,
            color: DS.colors.primaryDim,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: actionLabel ? 24 : 0,
          }}
        >
          {subtitle}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </Animated.View>
  );
}
