import React from 'react';
import { View, Dimensions } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');
const STEP = 32;

/**
 * Subtle architectural graph-paper grid.
 * Position: absolute, fills screen, non-interactive.
 * Uses Views instead of SVG to avoid Android compositing tint.
 */
export const GridBackground = React.memo(function GridBackground() {
  const hLines = Math.ceil(H / STEP) + 1;
  const vLines = Math.ceil(W / STEP) + 1;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: W, height: H,
        backgroundColor: 'transparent',
      }}
    >
      {Array.from({ length: hLines }).map((_, i) => (
        <View
          key={`h${i}`}
          style={{
            position: 'absolute',
            top: i * STEP,
            left: 0, right: 0,
            height: 1,
            backgroundColor: '#2A2A2A',
          }}
        />
      ))}
      {Array.from({ length: vLines }).map((_, i) => (
        <View
          key={`v${i}`}
          style={{
            position: 'absolute',
            left: i * STEP,
            top: 0, bottom: 0,
            width: 1,
            backgroundColor: '#2A2A2A',
          }}
        />
      ))}
    </View>
  );
});
