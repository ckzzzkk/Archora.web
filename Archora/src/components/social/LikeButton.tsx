import React, { useState } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useHaptics } from '../../hooks/useHaptics';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../utils/supabaseClient';
import { BASE_COLORS } from '../../theme/colors';
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

  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const toggle = async () => {
    if (!isAuthenticated || loading) return;
    medium();
    scale.value = withSequence(withSpring(1.4, { damping: 10 }), withSpring(1, { damping: 15 }));

    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    onToggle?.(next);
    setLoading(true);

    try {
      if (next) {
        await supabase.from('template_likes').insert({ template_id: templateId });
      } else {
        await supabase.from('template_likes').delete().eq('template_id', templateId);
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
    <TouchableOpacity onPress={toggle} style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Animated.View style={animStyle}>
        <Text style={{ fontSize: 16, color: liked ? BASE_COLORS.error : BASE_COLORS.textDim }}>
          {liked ? '♥' : '♡'}
        </Text>
      </Animated.View>
      <Text
        style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 12,
          color: liked ? BASE_COLORS.error : BASE_COLORS.textDim,
          marginLeft: 4,
        }}
      >
        {count}
      </Text>
    </TouchableOpacity>
  );
}
