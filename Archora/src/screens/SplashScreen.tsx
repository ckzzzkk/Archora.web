import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LogoLoader } from '../components/common/LogoLoader';
import { BASE_COLORS } from '../theme/colors';

const ARCHORA = 'ARCHORA'.split('');

interface Props {
  appReady: boolean;
  onComplete: () => void;
}

export function SplashScreen({ appReady, onComplete }: Props) {
  const [letterCount, setLetterCount] = useState(0);
  const [animDone, setAnimDone] = useState(false);

  const taglineOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));
  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  useEffect(() => {
    // Type letters: start at 350ms (logo mid-draw), one per 80ms
    const timers: ReturnType<typeof setTimeout>[] = [];
    ARCHORA.forEach((_, i) => {
      timers.push(
        setTimeout(() => setLetterCount(i + 1), 350 + i * 80),
      );
    });

    // Tagline fades in at 1100ms
    taglineOpacity.value = withDelay(1100, withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }));

    // Mark animation sequence done at 2100ms (letters+tagline+600ms hold)
    const doneTimer = setTimeout(() => setAnimDone(true), 2100);
    timers.push(doneTimer);

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once both animDone AND appReady, fade out and call onComplete
  useEffect(() => {
    if (!animDone || !appReady) return;
    screenOpacity.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) }, (finished) => {
      if (finished) runOnJS(onComplete)();
    });
  }, [animDone, appReady, screenOpacity, onComplete]);

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          backgroundColor: BASE_COLORS.background,
          alignItems: 'center',
          justifyContent: 'center',
        },
        screenStyle,
      ]}
    >
      {/* Logo draw-in animation */}
      <LogoLoader size="large" />

      {/* ARCHORA letter-by-letter */}
      <View style={{ flexDirection: 'row', marginTop: 28 }}>
        {ARCHORA.map((letter, i) => (
          <Text
            key={i}
            style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 36,
              letterSpacing: 8,
              color: i < letterCount ? BASE_COLORS.textPrimary : 'transparent',
            }}
          >
            {letter}
          </Text>
        ))}
      </View>

      {/* Tagline */}
      <Animated.Text
        style={[
          {
            fontFamily: 'Inter_400Regular',
            fontSize: 14,
            color: BASE_COLORS.textSecondary,
            letterSpacing: 2,
            marginTop: 12,
            textTransform: 'uppercase',
          },
          taglineStyle,
        ]}
      >
        Design Without Limits
      </Animated.Text>
    </Animated.View>
  );
}
