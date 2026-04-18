import { DS } from '../../theme/designSystem';
import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useHaptics } from '../../hooks/useHaptics';
import { useSession } from '../../auth/useSession';
import { inspoService } from '../../services/inspoService';
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
  const { isAuthenticated, user } = useSession();
  const userId = user?.id;

  const [saved, setSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const iconAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));

  const toggle = async () => {
    if (!isAuthenticated || loading) return;
    medium();
    scale.value = withSpring(1.3, { damping: 8, stiffness: 500 });
    iconScale.value = withSpring(saved ? 1.4 : 1.4, { damping: 8, stiffness: 400 }, () => {
      iconScale.value = withSpring(1, { damping: 10, stiffness: 300 });
    });

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
    <Pressable
      onPress={toggle}
      accessibilityLabel={saved ? `Unsave, ${count} saves` : `Save, ${count} saves`}
      accessibilityRole="button"
      accessibilityHint="Double tap to toggle save"
      style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}
    >
      <Animated.View style={animStyle}>
        <Animated.Text style={{ fontSize: 16, color: saved ? colors.primary : DS.colors.primaryGhost, transform: [{ scale: iconScale.value }] }}>
          {saved ? '⊸' : '⊹'}
        </Animated.Text>
      </Animated.View>
      <Text
        style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 12,
          color: saved ? colors.primary : DS.colors.primaryGhost,
          marginLeft: 4,
        }}
      >
        {count}
      </Text>
    </Pressable>
  );
}
