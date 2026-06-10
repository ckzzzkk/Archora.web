import React from 'react';
import { Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ArchText } from '../../components/common/ArchText';
import { DS } from '../../theme/designSystem';

export const TOOLS = [
  { id: 'select',    label: 'Select',    icon: '<' },
  { id: 'wall',      label: 'Wall',      icon: '-' },
  { id: 'door',      label: 'Door',      icon: 'D' },
  { id: 'window',    label: 'Window',    icon: 'W' },
  { id: 'furniture', label: 'Furniture', icon: '+' },
  { id: 'surfaces',  label: 'Surfaces',  icon: 'S' },
  { id: 'measure',   label: 'Measure',   icon: '=' },
] as const;

export type ToolId = typeof TOOLS[number]['id'];

export function ToolButton({ tool, active, onPress }: { tool: typeof TOOLS[number]; active: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable onPress={() => {
      scale.value = withSpring(0.88, { damping: 10 }, () => { scale.value = withSpring(1, { damping: 14 }); });
      onPress();
    }}>
      <Animated.View style={[animStyle, { width: 52, height: 52, borderRadius: 20, backgroundColor: active ? DS.colors.primary + '18' : DS.colors.surfaceHigh, borderWidth: 1, borderColor: active ? DS.colors.primary : DS.colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 8 }]}>
        <ArchText variant="body" style={{ fontSize: 18, color: active ? DS.colors.primary : DS.colors.primaryGhost }}>{tool.icon}</ArchText>
        <ArchText variant="body" style={{ fontSize: 8, fontFamily: 'Inter_400Regular', color: active ? DS.colors.primary : DS.colors.primaryGhost, marginTop: 2 }}>{tool.label}</ArchText>
      </Animated.View>
    </Pressable>
  );
}
