import { DS } from '../../theme/designSystem';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { supabase } from '../../utils/supabaseClient';
import { useAuthStore } from '../../stores/authStore';

interface RatingStarsProps {
  rating: number;
  count?: number;
  readonly?: boolean;
  size?: number;
  templateId?: string;
  userRating?: number | null;
  onRate?: (rating: number) => void;
}

function Star({
  filled,
  partial,
  size,
  onPress,
}: {
  filled: boolean;
  partial?: number;
  size: number;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(1.3, { damping: 10 }, () => { scale.value = withSpring(1); });
    onPress?.();
  };

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity disabled={!onPress} onPress={handlePress} activeOpacity={0.7}>
        <Text style={{ fontSize: size, color: filled || (partial ?? 0) > 0 ? colors.primary : DS.colors.border }}>
          {filled ? '★' : partial && partial > 0 ? '½' : '☆'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function RatingStars({
  rating,
  count,
  readonly = false,
  size = 16,
  templateId,
  userRating,
  onRate,
}: RatingStarsProps) {
  const { colors } = useTheme();
  const { light } = useHaptics();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [localRating, setLocalRating] = useState<number | null>(userRating ?? null);

  const displayRating = localRating ?? rating;

  const handleRate = async (stars: number) => {
    if (!isAuthenticated || !templateId) return;
    light();
    setLocalRating(stars);
    onRate?.(stars);

    await supabase.from('template_ratings').upsert({
      template_id: templateId,
      rating: stars,
    }, { onConflict: 'user_id,template_id' });
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = displayRating >= star;
        const partial = !filled && displayRating > star - 1 ? displayRating - (star - 1) : 0;
        return (
          <Star
            key={star}
            filled={filled}
            partial={partial}
            size={size}
            onPress={readonly ? undefined : () => handleRate(star)}
          />
        );
      })}
      {count !== undefined ? (
        <Text
          style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: size * 0.7,
            color: DS.colors.primaryGhost,
            marginLeft: 4,
          }}
        >
          ({count})
        </Text>
      ) : null}
    </View>
  );
}
