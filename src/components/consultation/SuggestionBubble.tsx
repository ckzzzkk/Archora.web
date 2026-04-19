import React from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Circle, Path, G, Rect } from 'react-native-svg';
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

const TYPE_ICONS: Record<SuggestionItem['type'], React.FC<{ size?: number; color?: string }>> = {
  nudge: ({ size = 18, color = DS.colors.primary }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  measurement: ({ size = 18, color = DS.colors.primary }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="4" rx="1" stroke={color} strokeWidth="1.5" />
      <Path d="M6 10v8M18 10v8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M8 10v4M16 10v4M10 10v6M14 10v6" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </Svg>
  ),
  cost: ({ size = 18, color = DS.colors.primary }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <Path d="M12 7v10M9.5 9.5c0-1.1.9-2 2-2h1c1.1 0 2 .9 2 2 0 .7-.4 1.3-1 1.7-.6.4-1 1-1 1.8 0 1.4 1.3 2.3 2.5 2.5.6.1 1.2.4 1.2 1 0 .7-.6 1.2-1.5 1.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  ),
  philosophy: ({ size = 18, color = DS.colors.primary }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21V10M4 10l8-6 8 6M8 21V14M16 21V14M12 10v11" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 10h16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  ),
};

const PRIORITY_COLORS: Record<SuggestionItem['priority'], string> = {
  high: DS.colors.error,
  medium: DS.colors.warning,
  low: DS.colors.success,
};

export function SuggestionBubble({ suggestion, onAccept, onDismiss }: SuggestionBubbleProps) {
  const priorityColor = PRIORITY_COLORS[suggestion.priority];
  const IconComponent = TYPE_ICONS[suggestion.type];

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
        <View style={{ marginRight: DS.spacing.xs }}><IconComponent size={16} color={DS.colors.primary} /></View>
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
