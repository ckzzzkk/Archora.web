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
          backgroundColor: active ? colors.primary + '22' : BASE_COLORS.surfaceHigh,
          borderWidth: 1,
          borderColor: active ? colors.primary : BASE_COLORS.border,
        }}
      >
        <Text
          style={{ fontSize: 18, color: active ? colors.primary : BASE_COLORS.textSecondary }}
        >
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
          backgroundColor: BASE_COLORS.surfaceHigh,
          borderWidth: 1,
          borderColor: BASE_COLORS.border,
        }}
      >
        <Text style={{ fontSize: 16, color: disabled ? BASE_COLORS.textDim : BASE_COLORS.textSecondary }}>
          {icon}
        </Text>
        <Text
          style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 7,
            color: BASE_COLORS.textDim,
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
    status === 'saved' ? BASE_COLORS.success : status === 'saving' ? BASE_COLORS.warning : BASE_COLORS.error;
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
          color: BASE_COLORS.textDim,
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
        backgroundColor: BASE_COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: BASE_COLORS.border,
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
                borderColor: viewMode === mode ? colors.primary : BASE_COLORS.border,
              }}
            >
              <Text
                style={{
                  fontFamily: 'JetBrainsMono_400Regular',
                  fontSize: 11,
                  color:
                    viewMode === mode ? BASE_COLORS.background : BASE_COLORS.textSecondary,
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
                borderColor: BASE_COLORS.border,
                marginRight: 6,
                backgroundColor: BASE_COLORS.surfaceHigh,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 11,
                  color: BASE_COLORS.textSecondary,
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
