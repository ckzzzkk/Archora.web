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

interface LikeButtonProps {
  templateId: string;
  likeCount: number;
  isLiked: boolean;
  onToggle?: (liked: boolean) => void;
}

export function LikeButton({ templateId, likeCount: initialCount, isLiked: initialLiked, onToggle }: LikeButtonProps) {
  const { colors } = useTheme();
  const { medium } = useHaptics();
  const { isAuthenticated, user } = useSession();
  const userId = user?.id;

  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const toggle = async () => {
    if (!isAuthenticated || loading) return;
    medium();
    // Spring bounce on press
    scale.value = withSpring(1.3, { damping: 8, stiffness: 500 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 300 });
    });
    // Heart fill animation
    heartScale.value = withSpring(liked ? 0.7 : 1.4, { damping: 8, stiffness: 400 }, () => {
      heartScale.value = withSpring(1, { damping: 10, stiffness: 300 });
    });

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
    <Pressable
      onPress={toggle}
      accessibilityLabel={liked ? `Unlike, ${count} likes` : `Like, ${count} likes`}
      accessibilityRole="button"
      accessibilityHint="Double tap to toggle like"
      style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}
    >
      <Animated.View style={animStyle}>
        <Animated.Text style={{ fontSize: 16, color: liked ? DS.colors.error : DS.colors.primaryGhost, transform: [{ scale: heartScale.value }] }}>
          {liked ? '♥' : '♡'}
        </Animated.Text>
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
