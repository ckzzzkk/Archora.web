import React from 'react';
import { View } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { DS } from '../../theme/designSystem';

type Kind = 'house' | 'apartment' | 'office' | 'villa' | 'studio' | 'commercial';

const PATHS: Record<Kind, string> = {
  house:
    'M20 70 L20 40 L50 18 L80 40 L80 70 Z M40 70 L40 50 L60 50 L60 70 M52 30 L52 22 L60 22 L60 36',
  apartment:
    'M18 75 L18 22 L82 22 L82 75 Z M30 32 H42 M58 32 H70 M30 48 H42 M58 48 H70 M30 64 H42 M58 64 H70 M50 22 V75',
  office:
    'M14 75 L14 35 L50 22 L86 35 L86 75 Z M26 45 H40 V60 H26 Z M44 45 H56 V60 H44 Z M60 45 H74 V60 H74 Z',
  villa:
    'M10 70 L10 45 L50 22 L90 45 L90 70 Z M22 70 V52 H38 V70 M62 70 V52 H78 V70 M44 70 V58 H56 V70',
  studio:
    'M22 75 L22 30 L78 30 L78 75 Z M22 48 H78 M40 30 V48 M50 50 L50 70 M58 50 L58 70',
  commercial:
    'M10 75 L10 20 L90 20 L90 75 Z M30 20 V75 M50 20 V75 M70 20 V75 M15 35 H25 V45 H15 Z M35 35 H45 V45 H35 Z M55 35 H65 V45 H55 Z M35 55 H45 V65 H35 Z M55 55 H65 V65 H55 Z',
};

interface BlueprintThumbnailProps {
  kind?: Kind;
  animate?: boolean;
  color?: string;
  size?: number;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function BlueprintThumbnail({
  kind = 'house',
  animate = true,
  color = DS.colors.ink,
  size = 100,
}: BlueprintThumbnailProps) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    if (animate) {
      progress.value = withDelay(
        100,
        withTiming(1, { duration: 1200 })
      );
    } else {
      progress.value = 1;
    }
  }, [animate, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: 600 * (1 - progress.value),
  }));

  return (
    <View style={{ height: size * 0.9, width: size }}>
      <Svg
        viewBox="0 0 100 90"
        width="100%"
        height="100%"
      >
        <G
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <AnimatedPath
            d={PATHS[kind]}
            strokeDasharray="600"
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
    </View>
  );
}
