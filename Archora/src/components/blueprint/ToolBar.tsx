import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { BASE_COLORS } from '../../theme/colors';
import type { ViewMode } from '../../types';

type Tool = 'select' | 'wall' | 'door' | 'window' | 'furniture' | 'measure';

const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: '↖' },
  { id: 'wall', label: 'Wall', icon: '▬' },
  { id: 'door', label: 'Door', icon: '⊡' },
  { id: 'window', label: 'Window', icon: '⊞' },
  { id: 'furniture', label: 'Items', icon: '⊕' },
  { id: 'measure', label: 'Measure', icon: '↔' },
];

const VIEW_MODES: { mode: ViewMode; label: string }[] = [
  { mode: '2D', label: '2D' },
  { mode: '3D', label: '3D' },
  { mode: 'FirstPerson', label: 'FP' },
];

interface ToolBarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

function ToolButton({ tool, active, onPress }: { tool: typeof TOOLS[0]; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={() => {
          scale.value = withSpring(0.9, { damping: 15 }, () => { scale.value = withSpring(1); });
          onPress();
        }}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 52,
          height: 52,
          borderRadius: 10,
          marginHorizontal: 4,
          backgroundColor: active ? colors.primary + '22' : BASE_COLORS.surfaceHigh,
          borderWidth: 1,
          borderColor: active ? colors.primary : BASE_COLORS.border,
        }}
      >
        <Text style={{ fontSize: 18, color: active ? colors.primary : BASE_COLORS.textSecondary }}>
          {tool.icon}
        </Text>
        <Text
          style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 8,
            color: active ? colors.primary : BASE_COLORS.textDim,
            marginTop: 2,
          }}
        >
          {tool.label.toUpperCase()}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToolBar({ activeTool, onToolChange }: ToolBarProps) {
  const { colors } = useTheme();
  const { light } = useHaptics();
  const viewMode = useBlueprintStore((s) => s.viewMode);
  const setViewMode = useBlueprintStore((s) => s.actions.setViewMode);

  return (
    <View
      style={{
        backgroundColor: BASE_COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: BASE_COLORS.border,
        paddingVertical: 8,
        paddingHorizontal: 4,
      }}
    >
      {/* View mode switcher */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
        {VIEW_MODES.map(({ mode, label }) => (
          <TouchableOpacity
            key={mode}
            onPress={() => { light(); setViewMode(mode); }}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 4,
              borderRadius: 12,
              marginHorizontal: 2,
              backgroundColor: viewMode === mode ? colors.primary : 'transparent',
              borderWidth: 1,
              borderColor: viewMode === mode ? colors.primary : BASE_COLORS.border,
            }}
          >
            <Text
              style={{
                fontFamily: 'JetBrainsMono_400Regular',
                fontSize: 11,
                color: viewMode === mode ? BASE_COLORS.background : BASE_COLORS.textSecondary,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tools */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8 }}>
        {TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool}
            active={activeTool === tool.id}
            onPress={() => { light(); onToolChange(tool.id); }}
          />
        ))}
      </ScrollView>
    </View>
  );
}
