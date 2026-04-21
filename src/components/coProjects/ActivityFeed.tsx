import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { DS } from '../../theme/designSystem';
import type { ActivityEntry } from '../../services/coProjectService';

interface Props {
  entries: ActivityEntry[];
}

function AvatarCircle({ name, size = 32 }: { name: string; size?: number }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: DS.colors.accent + '30',
      borderWidth: 1, borderColor: DS.colors.accent + '50',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontFamily: DS.font.semibold, fontSize: size * 0.4, color: DS.colors.accent }}>
        {initial}
      </Text>
    </View>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ActionIcon({ action }: { action: string }) {
  const iconMap: Record<string, string> = {
    'joined': '👤',
    'left': '🚪',
    'edited': '✏️',
    'commented': '💬',
    'generated': '✨',
    'invited': '📧',
    'removed': '🗑️',
    'created': '🏗️',
  };
  return <Text style={{ fontSize: 14 }}>{iconMap[action.toLowerCase()] ?? '📐'}</Text>;
}

function ActivityEntryItem({ entry, isLast }: { entry: ActivityEntry; isLast: boolean }) {
  const C = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', gap: DS.spacing.md, marginBottom: DS.spacing.md }}>
      {/* Avatar + connector line */}
      <View style={{ alignItems: 'center' }}>
        <AvatarCircle name={entry.displayName} size={32} />
        {!isLast && (
          <View style={{
            width: 1, flex: 1, backgroundColor: C.border, marginTop: DS.spacing.xs,
          }} />
        )}
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingBottom: DS.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: DS.spacing.xs, marginBottom: 4 }}>
          <Text style={{ fontFamily: DS.font.semibold, fontSize: DS.fontSize.sm, color: C.primary }}>
            {entry.displayName}
          </Text>
          <ActionIcon action={entry.action} />
          <Text style={{ fontFamily: DS.font.regular, fontSize: DS.fontSize.sm, color: C.primaryDim }}>
            {entry.action}
          </Text>
          {entry.entityType && (
            <Text style={{ fontFamily: DS.font.mono, fontSize: 10, color: DS.colors.accent, textTransform: 'uppercase' }}>
              {entry.entityType}
            </Text>
          )}
        </View>

        {/* Architect insights if present */}
        {entry.architectInsights && entry.architectInsights.length > 0 && (
          <View style={{
            backgroundColor: `${DS.colors.accent}10`,
            borderRadius: DS.radius.small,
            borderWidth: 1, borderColor: `${DS.colors.accent}25`,
            padding: DS.spacing.sm,
            marginBottom: 4,
          }}>
            {entry.architectInsights.map((insight, i) => (
              <Text key={i} style={{ fontFamily: DS.font.regular, fontSize: DS.fontSize.xs, color: DS.colors.accent, lineHeight: 18 }}>
                → {insight}
              </Text>
            ))}
          </View>
        )}

        <Text style={{ fontFamily: DS.font.mono, fontSize: 10, color: C.primaryGhost }}>
          {timeAgo(entry.createdAt)}
        </Text>
      </View>
    </View>
  );
}

export function ActivityFeed({ entries }: Props) {
  const C = useThemeColors();

  if (entries.length === 0) {
    return (
      <View style={{
        backgroundColor: C.surface,
        borderRadius: DS.radius.card,
        borderWidth: 1, borderColor: C.border,
        padding: DS.spacing.lg, alignItems: 'center',
      }}>
        <Text style={{ fontFamily: DS.font.regular, fontSize: DS.fontSize.sm, color: C.primaryGhost }}>
          No activity yet
        </Text>
      </View>
    );
  }

  return (
    <View style={{
      backgroundColor: C.surface,
      borderRadius: DS.radius.card,
      borderWidth: 1, borderColor: C.border,
      padding: DS.spacing.md,
    }}>
      {entries.map((entry, i) => (
        <ActivityEntryItem key={entry.id} entry={entry} isLast={i === entries.length - 1} />
      ))}
    </View>
  );
}