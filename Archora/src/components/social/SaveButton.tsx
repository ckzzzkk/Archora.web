import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useHaptics } from '../../hooks/useHaptics';
import { useAuthStore } from '../../stores/authStore';
import { inspoService } from '../../services/inspoService';
import { BASE_COLORS } from '../../theme/colors';
import { useTheme } from '../../hooks/useTheme';

interface SaveButtonProps {
  templateId: string;
  saveCount: number;
  isSaved: boolean;
  onToggle?: (saved: boolean) => void;
}

export function SaveButton({ templateId, saveCount: initialCount, isSaved: initialSaved, onToggle }: SaveButtonProps) {
  const { colors } = useTheme();
  const { medium } = useHaptics();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);

  const [saved, setSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const toggle = async () => {
    if (!isAuthenticated || loading) return;
    medium();
    scale.value = withSequence(withTiming(1.2, { duration: 100 }), withTiming(1, { duration: 100 }));

    const next = !saved;
    setSaved(next);
    setCount((c) => c + (next ? 1 : -1));
    onToggle?.(next);
    setLoading(true);

    try {
      if (!userId) return;
      if (next) {
        await inspoService.saveTemplate(templateId, userId);
      } else {
        await inspoService.unsaveTemplate(templateId, userId);
      }
    } catch {
      setSaved(!next);
      setCount((c) => c + (next ? -1 : 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable onPress={toggle} style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Animated.View style={animStyle}>
        <Text style={{ fontSize: 16, color: saved ? colors.primary : BASE_COLORS.textDim }}>
          {saved ? '⊸' : '⊹'}
        </Text>
      </Animated.View>
      <Text
        style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 12,
          color: saved ? colors.primary : BASE_COLORS.textDim,
          marginLeft: 4,
        }}
      >
        {count}
      </Text>
    </Pressable>
  );
}
