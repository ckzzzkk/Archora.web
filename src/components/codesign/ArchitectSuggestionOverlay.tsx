import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { DS } from '../../theme/designSystem';
import type { ArchitectSuggestion } from '../../services/architectModeratorService';

const TYPE_COLORS: Record<ArchitectSuggestion['type'], string> = {
  design_tip:        '#4A90D9',
  structural_warning: '#D4A84B',
  conflict_alert:    '#C0604A',
  improvement_idea:  '#7AB87A',
};

const TYPE_LABELS: Record<ArchitectSuggestion['type'], string> = {
  design_tip:        'Design Tip',
  structural_warning: 'Structural',
  conflict_alert:    'Conflict',
  improvement_idea:  'Idea',
};

const AUTO_DISMISS_DELAY_MS = 10_000;

interface ArchitectSuggestionOverlayProps {
  suggestions: ArchitectSuggestion[];
  onDismiss?: (id: string) => void;
  onViewHistory?: () => void;
}

/** Floating card — bottom-left — shows most recent Architect suggestion */
export function ArchitectSuggestionOverlay({ suggestions, onDismiss, onViewHistory }: ArchitectSuggestionOverlayProps) {
  const [expanded, setExpanded] = useState(false);
  const dismissedIds = useRef<Set<string>>(new Set());
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Auto-dismiss non-critical suggestions after 10s
  useEffect(() => {
    if (suggestions.length === 0) return;

    const latest = suggestions[suggestions.length - 1];
    if (latest.severity === 'critical') return; // Critical must be acknowledged

    const timer = setTimeout(() => {
      dismissedIds.current.add(latest.id);
      onDismiss?.(latest.id);
    }, AUTO_DISMISS_DELAY_MS);

    timersRef.current[latest.id] = timer;

    return () => {
      clearTimeout(timer);
      delete timersRef.current[latest.id];
    };
  }, [suggestions, onDismiss]);

  // Latest suggestion for main card
  const visibleSuggestions = suggestions.filter((s) => !dismissedIds.current.has(s.id));
  const current = visibleSuggestions[visibleSuggestions.length - 1];

  const handleDismiss = (id: string) => {
    dismissedIds.current.add(id);
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    onDismiss?.(id);
  };

  if (!current) return null;

  const color = TYPE_COLORS[current.type];
  const isCritical = current.severity === 'critical';

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 120, // leave room for toolbar on the right
        zIndex: 90,
      }}
    >
      {/* Main suggestion card */}
      <Pressable
        onPress={() => !isCritical && handleDismiss(current.id)}
        style={{
          backgroundColor: DS.colors.surfaceHigh,
          borderRadius: DS.radius.card,
          paddingHorizontal: DS.spacing.md,
          paddingVertical: DS.spacing.md,
          borderWidth: 1,
          borderColor: color + '60',
          ...DS.shadow.medium,
        }}
      >
        {/* Type badge + label */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <View
            style={{
              backgroundColor: color + '25',
              borderRadius: DS.radius.chip,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderWidth: 1,
              borderColor: color + '50',
              marginRight: 8,
            }}
          >
            <Text style={{ fontFamily: DS.font.mono, fontSize: 9, color: color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {TYPE_LABELS[current.type]}
            </Text>
          </View>
          <Text style={{ fontFamily: DS.font.heading, fontSize: 11, color: DS.colors.primaryGhost }}>
            Architect Agent
          </Text>
          {isCritical && (
            <View style={{ marginLeft: 6, backgroundColor: DS.colors.error + '40', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
              <Text style={{ fontFamily: DS.font.mono, fontSize: 9, color: DS.colors.error }}>
                CRITICAL
              </Text>
            </View>
          )}
        </View>

        {/* Message */}
        <Text
          style={{
            fontFamily: DS.font.regular,
            fontSize: DS.fontSize.sm,
            color: DS.colors.primary,
            lineHeight: 20,
          }}
          numberOfLines={4}
        >
          {current.message}
        </Text>

        {/* Actions row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
          {!isCritical && (
            <TouchableOpacity
              onPress={() => handleDismiss(current.id)}
              style={{ flex: 1, backgroundColor: 'transparent', borderRadius: DS.radius.button, paddingVertical: 5, alignItems: 'center', borderWidth: 1, borderColor: DS.colors.border }}
            >
              <Text style={{ fontFamily: DS.font.mono, fontSize: 10, color: DS.colors.primaryGhost }}>Dismiss</Text>
            </TouchableOpacity>
          )}
          {isCritical && (
            <TouchableOpacity
              onPress={() => handleDismiss(current.id)}
              style={{ flex: 1, backgroundColor: color + '20', borderRadius: DS.radius.button, paddingVertical: 5, alignItems: 'center', borderWidth: 1, borderColor: color + '60' }}
            >
              <Text style={{ fontFamily: DS.font.mono, fontSize: 10, color: color }}>Acknowledge</Text>
            </TouchableOpacity>
          )}
          {onViewHistory && (
            <TouchableOpacity
              onPress={() => setExpanded((v) => !v)}
              style={{ flex: 1, backgroundColor: DS.colors.surface, borderRadius: DS.radius.button, paddingVertical: 5, alignItems: 'center', borderWidth: 1, borderColor: DS.colors.border }}
            >
              <Text style={{ fontFamily: DS.font.mono, fontSize: 10, color: DS.colors.primaryDim }}>
                {expanded ? 'Hide' : 'History'} ({visibleSuggestions.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>

      {/* History panel */}
      {expanded && visibleSuggestions.length > 1 && (
        <View
          style={{
            marginTop: 8,
            backgroundColor: DS.colors.surface,
            borderRadius: DS.radius.card,
            borderWidth: 1,
            borderColor: DS.colors.border,
            maxHeight: 180,
          }}
        >
          <ScrollView contentContainerStyle={{ padding: DS.spacing.sm }}>
            {visibleSuggestions.slice(0, -1).reverse().map((s, i) => {
              const c = TYPE_COLORS[s.type];
              return (
                <View
                  key={s.id}
                  style={{
                    backgroundColor: DS.colors.surfaceHigh,
                    borderRadius: DS.radius.small,
                    padding: DS.spacing.sm,
                    marginBottom: i < visibleSuggestions.length - 2 ? 6 : 0,
                    borderLeftWidth: 3,
                    borderLeftColor: c,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                    <Text style={{ fontFamily: DS.font.mono, fontSize: 9, color: c, marginRight: 6 }}>{TYPE_LABELS[s.type]}</Text>
                    <Text style={{ fontFamily: DS.font.regular, fontSize: 9, color: DS.colors.primaryGhost }}>
                      {new Date(s.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: DS.font.regular, fontSize: 11, color: DS.colors.primaryDim }} numberOfLines={2}>
                    {s.message}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}