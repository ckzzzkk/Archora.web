/**
 * ProgressiveImage — image with blur-up loading effect.
 *
 * Uses expo-image for blurhash/progressive loading.
 * Shows a placeholder (blurred version or solid color) while loading,
 * then cross-fades to the full resolution image.
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { DS } from '../../theme/designSystem';

interface Props {
  /** URL of the image to load */
  uri?: string | null;
  /** Override placeholder color (defaults to surfaceHigh) */
  placeholderColor?: string;
  /** Style for the image container */
  style?: object;
  /** Content fit for the image */
  contentFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  /** Transition duration in ms (default 300) */
  transitionDuration?: number;
}

export function ProgressiveImage({
  uri,
  placeholderColor = DS.colors.surfaceHigh,
  style,
  contentFit = 'cover',
  transitionDuration = 300,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const opacity = useSharedValue(0);

  const handleLoad = () => {
    setLoaded(true);
    opacity.value = withTiming(1, { duration: transitionDuration });
  };

  const imageStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: placeholderColor }, style]}>
      {uri && (
        <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit={contentFit}
            transition={transitionDuration}
            onLoad={handleLoad}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
