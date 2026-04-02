import { DS } from '../../theme/designSystem';
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
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
  onStylePress?: () => void;
}

function ToolButton({
  tool,
  active,
  onPress,
}: {
  tool: (typeof TOOLS)[0];
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={() => {
          scale.value = withSpring(0.9, { damping: 15 }, () => {
            scale.value = withSpring(1);
          });
          onPress();
        }}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 52,
          height: 52,
          borderRadius: 10,
          marginHorizontal: 4,
          backgroundColor: active ? colors.primary + '22' : DS.colors.surfaceHigh,
          borderWidth: 1,
          borderColor: active ? colors.primary : DS.colors.border,
        }}
      >
        <Text
          style={{ fontSize: 18, color: active ? colors.primary : DS.colors.primaryDim }}
        >
          {tool.icon}
        </Text>
        <Text
          style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 8,
            color: active ? colors.primary : DS.colors.primaryGhost,
            marginTop: 2,
          }}
        >
          {tool.label.toUpperCase()}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function IconButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(disabled ? 0.3 : 1);

  React.useEffect(() => {
    opacity.value = withTiming(disabled ? 0.3 : 1, { duration: 150 });
  }, [disabled, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={() => {
          if (disabled) return;
          scale.value = withSpring(0.85, { damping: 15 }, () => {
            scale.value = withSpring(1);
          });
          onPress();
        }}
        disabled={disabled}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          borderRadius: 10,
          marginHorizontal: 3,
          backgroundColor: DS.colors.surfaceHigh,
          borderWidth: 1,
          borderColor: DS.colors.border,
        }}
      >
        <Text style={{ fontSize: 16, color: disabled ? DS.colors.primaryGhost : DS.colors.primaryDim }}>
          {icon}
        </Text>
        <Text
          style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 7,
            color: DS.colors.primaryGhost,
            marginTop: 1,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function SaveStatusDot({ status }: { status: 'saved' | 'saving' | 'unsaved' }) {
  const dotColor =
    status === 'saved' ? DS.colors.success : status === 'saving' ? DS.colors.warning : DS.colors.error;
  const label = status === 'saved' ? 'Saved' : status === 'saving' ? 'Saving…' : 'Unsaved';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: dotColor,
          marginRight: 4,
        }}
      />
      <Text
        style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 10,
          color: DS.colors.primaryGhost,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function ToolBar({ activeTool, onToolChange, onStylePress }: ToolBarProps) {
  const { colors } = useTheme();
  const { light } = useHaptics();

  const viewMode = useBlueprintStore((s) => s.viewMode);
  const setViewMode = useBlueprintStore((s) => s.actions.setViewMode);
  const undo = useBlueprintStore((s) => s.actions.undo);
  const redo = useBlueprintStore((s) => s.actions.redo);
  const manualSave = useBlueprintStore((s) => s.actions.manualSave);
  const saveStatus = useBlueprintStore((s) => s.saveStatus);
  const historyIndex = useBlueprintStore((s) => s.historyIndex);
  const historyLength = useBlueprintStore((s) => s.history.length);

  const user = useAuthStore((s) => s.user);
  const tier = user?.subscriptionTier ?? 'starter';
  const isStarter = tier === 'starter';

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;

  return (
    <View
      style={{
        backgroundColor: DS.colors.surface,
        borderTopWidth: 1,
        borderTopColor: DS.colors.border,
        paddingVertical: 8,
        paddingHorizontal: 4,
      }}
    >
      {/* Top row: view modes + save status + undo/redo */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          paddingHorizontal: 8,
        }}
      >
        {/* View mode switcher */}
        <View style={{ flexDirection: 'row' }}>
          {VIEW_MODES.map(({ mode, label }) => (
            <TouchableOpacity
              key={mode}
              onPress={() => {
                light();
                setViewMode(mode);
              }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 4,
                borderRadius: 12,
                marginHorizontal: 2,
                backgroundColor: viewMode === mode ? colors.primary : 'transparent',
                borderWidth: 1,
                borderColor: viewMode === mode ? colors.primary : DS.colors.border,
              }}
            >
              <Text
                style={{
                  fontFamily: 'JetBrainsMono_400Regular',
                  fontSize: 11,
                  color:
                    viewMode === mode ? DS.colors.background : DS.colors.primaryDim,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Right: save status + undo/redo + style */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <SaveStatusDot status={saveStatus} />

          {isStarter && (
            <TouchableOpacity
              onPress={() => {
                light();
                manualSave();
              }}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: DS.colors.border,
                marginRight: 6,
                backgroundColor: DS.colors.surfaceHigh,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 11,
                  color: DS.colors.primaryDim,
                }}
              >
                Save
              </Text>
            </TouchableOpacity>
          )}

          <IconButton
            icon="↩"
            label="UNDO"
            onPress={() => {
              light();
              undo();
            }}
            disabled={!canUndo}
          />
          <IconButton
            icon="↪"
            label="REDO"
            onPress={() => {
              light();
              redo();
            }}
            disabled={!canRedo}
          />

          {onStylePress && (
            <IconButton
              icon="◈"
              label="STYLE"
              onPress={() => {
                light();
                onStylePress();
              }}
            />
          )}
        </View>
      </View>

      {/* Tools row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        {TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool}
            active={activeTool === tool.id}
            onPress={() => {
              light();
              onToolChange(tool.id);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}
