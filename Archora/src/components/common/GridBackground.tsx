import React from 'react';
import { Dimensions } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { DS } from '../../theme/designSystem';

const { width: W, height: H } = Dimensions.get('window');
const STEP = 32;

const hLines = Math.ceil(H / STEP) + 1;
const vLines = Math.ceil(W / STEP) + 1;

/**
 * Subtle architectural graph-paper grid.
 * Position: absolute, fills screen, non-interactive.
 * Render once — no props — memoized for zero re-render cost.
 */
export const GridBackground = React.memo(function GridBackground() {
  return (
    <Svg
      width={W}
      height={H}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {Array.from({ length: hLines }).map((_, i) => (
        <Line
          key={`h${i}`}
          x1={0}
          y1={i * STEP}
          x2={W}
          y2={i * STEP}
          stroke={DS.colors.gridLine}
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: vLines }).map((_, i) => (
        <Line
          key={`v${i}`}
          x1={i * STEP}
          y1={0}
          x2={i * STEP}
          y2={H}
          stroke={DS.colors.gridLine}
          strokeWidth={1}
        />
      ))}
    </Svg>
  );
});
