import React from 'react';
import { View, Dimensions } from 'react-native';
import { DS } from '../../theme/designSystem';

const { width: W, height: H } = Dimensions.get('window');

/**
 * Paper-grid dot pattern background — hand-drawn sketch aesthetic.
 * Uses radial-gradient dots instead of grid lines.
 * Position: absolute, fills screen, non-interactive.
 */
export const GridBackground = React.memo(function GridBackground({
  fine = false,
}: {
  fine?: boolean;
}) {
  // Paper-grid: 22px spacing, 1.2px dots at 18% opacity
  // Paper-grid-fine: 14px spacing, 0.8px dots at 14% opacity
  const gridSize = fine ? 14 : 22;
  const dotSize = fine ? 0.8 : 1.2;
  const opacity = fine ? 0.14 : 0.18;

  const hCount = Math.ceil(H / gridSize) + 1;
  const vCount = Math.ceil(W / gridSize) + 1;

  return (
    <View
      pointerEvents="none"
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: W,
        height: H,
        backgroundColor: DS.colors.background,
        opacity: 0.7,
      }}
    >
      {Array.from({ length: hCount }).map((_, row) => (
        <View
          key={`row-${row}`}
          style={{
            position: 'absolute',
            top: row * gridSize,
            left: 0,
            right: 0,
            height: gridSize,
            flexDirection: 'row',
          }}
        >
          {Array.from({ length: vCount }).map((__, col) => (
            <View
              key={`col-${col}`}
              style={{
                width: gridSize,
                height: gridSize,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor: DS.colors.ink,
                  opacity,
                }}
              />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
});
