/**
 * SketchLoader — animated line-drawing effect.
 * 12 white line segments animate their width/height from 0 to target length,
 * staggered in sequence, collectively sketching a simple floor-plan outline.
 * After the last line appears, the whole composition fades out and restarts.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface LineSpec {
  top?:   number;
  left?:  number;
  right?: number;
  bottom?: number;
  w:      number | null;   // null = 1px (vertical)
  h:      number | null;   // null = 1px (horizontal)
  delay:  number;
}

// A simple floor-plan sketch: outer rectangle + 3 internal dividers
// All values are relative to a 180×140 bounding box
const LINES: LineSpec[] = [
  // Outer rectangle
  { top: 10,  left: 20, w: 140, h: null, delay: 0    }, // top wall →
  { top: 10,  left: 160, w: null, h: 120, delay: 400  }, // right wall ↓
  { top: 130, left: 20, w: 140, h: null, delay: 800   }, // bottom wall →
  { top: 10,  left: 20, w: null, h: 120, delay: 1200  }, // left wall ↓
  // Internal vertical divider (living / bedroom split)
  { top: 10,  left: 90, w: null, h: 80, delay: 1600   }, // mid-vertical ↓
  // Internal horizontal (bathroom / bedroom split)
  { top: 90,  left: 90, w: 70,  h: null, delay: 2000  }, // mid-horizontal →
  // Door openings (short thin marks)
  { top: 10,  left: 55, w: 20, h: null, delay: 2300   }, // door gap top-left room
  { top: 130, left: 110, w: 20, h: null, delay: 2500  }, // door gap bottom
  // Window marks (double-line suggest — one line offset 3px)
  { top: 10,  left: 30, w: 18, h: null, delay: 2700   },
  { top: 13,  left: 30, w: 18, h: null, delay: 2750   },
  // Dimension tick marks
  { top: 7,   left: 20, w: null, h: 6, delay: 2900    },
  { top: 7,   left: 160, w: null, h: 6, delay: 2950   },
];

const STROKE = 'rgba(240,237,232,0.25)';
const DURATION = 350;
const TOTAL_CYCLE = 3800; // ms before fade-out + restart

function AnimatedLine({ spec }: { spec: LineSpec }) {
  const progress = useSharedValue(0);

  const isHorizontal = spec.w !== null;
  const targetSize = isHorizontal ? (spec.w as number) : (spec.h as number);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withDelay(
          spec.delay,
          withTiming(1, {
            duration: DURATION,
            easing: Easing.out(Easing.quad),
          }),
        ),
        withTiming(1, { duration: TOTAL_CYCLE - spec.delay - DURATION }), // hold
        withTiming(0, { duration: 200 }), // snap off
        withTiming(0, { duration: 200 }), // dead time for stagger reset
      ),
      -1,
      false,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => {
    const size = progress.value * targetSize;
    return isHorizontal ? { width: size } : { height: size };
  });

  return (
    <Animated.View
      style={[
        {
          position:        'absolute',
          top:             spec.top,
          left:            spec.left,
          backgroundColor: STROKE,
          width:           isHorizontal ? 0 : 1,
          height:          isHorizontal ? 1 : 0,
        },
        animStyle,
      ]}
    />
  );
}

interface Props {
  /** Container size. Defaults to 180×140 (the sketch bounding box). */
  width?:  number;
  height?: number;
}

export function SketchLoader({ width = 180, height = 140 }: Props) {
  return (
    <View
      pointerEvents="none"
      style={{ width, height, position: 'relative' }}
    >
      {LINES.map((spec, i) => (
        <AnimatedLine key={i} spec={spec} />
      ))}
    </View>
  );
}
