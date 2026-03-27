import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { DS } from '../../theme/designSystem';

interface Props {
  active: boolean;
  color?: string;
}

// 5 bars with distinct timing so they look organic, never in sync
const BAR_CONFIG = [
  { minH: 8, maxH: 30, upMs: 200, downMs: 180 },
  { minH: 6, maxH: 26, upMs: 280, downMs: 220 },
  { minH: 10, maxH: 32, upMs: 160, downMs: 200 },
  { minH: 8, maxH: 28, upMs: 240, downMs: 180 },
  { minH: 6, maxH: 24, upMs: 180, downMs: 260 },
];

function Bar({ cfg, active, color }: {
  cfg: typeof BAR_CONFIG[number];
  active: boolean;
  color: string;
}) {
  const height = useSharedValue(cfg.minH);

  const animStyle = useAnimatedStyle(() => ({ height: height.value }));

  useEffect(() => {
    if (active) {
      height.value = withRepeat(
        withSequence(
          withTiming(cfg.maxH, { duration: cfg.upMs }),
          withTiming(cfg.minH, { duration: cfg.downMs }),
        ),
        -1,
        false,
      );
    } else {
      height.value = withTiming(cfg.minH, { duration: DS.animation.normal });
    }
  }, [active, cfg, height]);

  return (
    <Animated.View
      style={[
        {
          width:        4,
          borderRadius: 4,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

export function WaveformVisualizer({ active, color = DS.colors.primary }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 40, gap: 4 }}>
      {BAR_CONFIG.map((cfg, i) => (
        <Bar key={i} cfg={cfg} active={active} color={color} />
      ))}
    </View>
  );
}
