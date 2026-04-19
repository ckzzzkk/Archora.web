import React from 'react';
import { View, Pressable } from 'react-native';
import { DS } from '../../theme/designSystem';
import { ArchText } from '../common/ArchText';

export interface SuggestionItem {
  id: string;
  type: 'nudge' | 'measurement' | 'cost' | 'philosophy';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  read?: boolean;
}

interface SuggestionBubbleProps {
  suggestion: SuggestionItem;
  onAccept?: () => void;
  onDismiss?: () => void;
}

const TYPE_ICONS: Record<SuggestionItem['type'], string> = {
  nudge: '💡',
  measurement: '📐',
  cost: '💰',
  philosophy: '🏛️',
};

const PRIORITY_COLORS: Record<SuggestionItem['priority'], string> = {
  high: DS.colors.error,
  medium: DS.colors.warning,
  low: DS.colors.success,
};

export function SuggestionBubble({ suggestion, onAccept, onDismiss }: SuggestionBubbleProps) {
  const priorityColor = PRIORITY_COLORS[suggestion.priority];
  const icon = TYPE_ICONS[suggestion.type];

  return (
    <View
      style={{
        backgroundColor: DS.colors.surfaceHigh,
        borderRadius: DS.radius.card,
        paddingHorizontal: DS.spacing.md,
        paddingVertical: DS.spacing.md,
        marginBottom: DS.spacing.sm,
        borderWidth: 1,
        borderColor: DS.colors.border,
      }}
    >
      {/* Header row: icon + title + priority badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: DS.spacing.xs }}>
        <ArchText variant="body" style={{ fontSize: 16, marginRight: DS.spacing.xs }}>{icon}</ArchText>
        <ArchText
          variant="heading"
          style={{
            fontFamily: DS.font.heading,
            fontSize: 15,
            color: DS.colors.primary,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {suggestion.title}
        </ArchText>
        <View
          style={{
            backgroundColor: priorityColor + '25',
            borderRadius: DS.radius.chip,
            paddingHorizontal: DS.spacing.sm,
            paddingVertical: 2,
            borderWidth: 1,
            borderColor: priorityColor + '60',
          }}
        >
          <ArchText
            variant="caption"
            style={{
              fontFamily: DS.font.mono,
              fontSize: 9,
              color: priorityColor,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {suggestion.priority}
          </ArchText>
        </View>
      </View>

      {/* Description */}
      <ArchText
        variant="body"
        style={{
          fontFamily: DS.font.regular,
          fontSize: 12,
          color: DS.colors.primaryDim,
          lineHeight: 17,
          marginBottom: suggestion.actionable ? DS.spacing.sm : 0,
        }}
        numberOfLines={3}
      >
        {suggestion.description}
      </ArchText>

      {/* Action buttons — only for actionable suggestions */}
      {suggestion.actionable && (
        <View style={{ flexDirection: 'row', gap: DS.spacing.sm }}>
          {onAccept && (
            <Pressable
              onPress={onAccept}
              style={{
                flex: 1,
                backgroundColor: DS.colors.primary + '20',
                borderRadius: DS.radius.button,
                paddingVertical: DS.spacing.xs + 2,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: DS.colors.primary + '50',
              }}
            >
              <ArchText
                variant="label"
                style={{ fontFamily: DS.font.medium, fontSize: 11, color: DS.colors.primary }}
              >
                Accept
              </ArchText>
            </Pressable>
          )}
          {onDismiss && (
            <Pressable
              onPress={onDismiss}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                borderRadius: DS.radius.button,
                paddingVertical: DS.spacing.xs + 2,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: DS.colors.border,
              }}
            >
              <ArchText
                variant="label"
                style={{ fontFamily: DS.font.medium, fontSize: 11, color: DS.colors.primaryGhost }}
              >
                Dismiss
              </ArchText>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
