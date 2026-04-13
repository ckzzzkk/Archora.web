import { DS } from '../../theme/designSystem';
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
import { useTheme } from '../../hooks/useTheme';

interface LikeButtonProps {
  templateId: string;
  likeCount: number;
  isLiked: boolean;
  onToggle?: (liked: boolean) => void;
}

export function LikeButton({ templateId, likeCount: initialCount, isLiked: initialLiked, onToggle }: LikeButtonProps) {
  const { colors } = useTheme();
  const { medium } = useHaptics();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);

  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const toggle = async () => {
    if (!isAuthenticated || loading) return;
    medium();
    scale.value = withSequence(withTiming(1.2, { duration: 100 }), withTiming(1, { duration: 100 }));

    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    onToggle?.(next);
    setLoading(true);

    try {
      if (!userId) return;
      if (next) {
        await inspoService.likeTemplate(templateId, userId);
      } else {
        await inspoService.unlikeTemplate(templateId, userId);
      }
    } catch {
      // Revert on error
      setLiked(!next);
      setCount((c) => c + (next ? -1 : 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable onPress={toggle} style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Animated.View style={animStyle}>
        <Text style={{ fontSize: 16, color: liked ? DS.colors.error : DS.colors.primaryGhost }}>
          {liked ? '♥' : '♡'}
        </Text>
      </Animated.View>
      <Text
        style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 12,
          color: liked ? DS.colors.error : DS.colors.primaryGhost,
          marginLeft: 4,
        }}
      >
        {count}
      </Text>
    </Pressable>
  );
}
