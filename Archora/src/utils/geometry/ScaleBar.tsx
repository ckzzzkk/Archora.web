/**
 * ScaleBar.tsx — Real-to-digital scale indicator for the 2D canvas.
 *
 * Shows a ruler-style bar with metre markings so users understand
 * the actual dimensions of what they're looking at.
 */

import React from 'react';
import {
  Group,
  Line,
  Path,
  Skia,
  Text as SkiaText,
  useFont,
} from '@shopify/react-native-skia';
import { PIXELS_PER_METRE } from '../canvasHelpers';

interface ScaleBarProps {
  /** Current zoom scale of the canvas. */
  scale: number;
  /** X position on screen (bottom-left). */
  x: number;
  /** Y position on screen. */
  y: number;
  /** Color for the bar and text. */
  color?: string;
  /** Background color for readability. */
  bgColor?: string;
}

/**
 * Picks a "nice" scale bar length in metres based on current zoom.
 * Returns a length that maps to roughly 80–200 pixels on screen.
 */
function niceScaleLength(scale: number): number {
  const targetPixels = 120;
  const rawMetres = targetPixels / (PIXELS_PER_METRE * scale);

  const niceValues = [0.25, 0.5, 1, 2, 3, 5, 10, 15, 20, 25, 50, 100];
  let best = niceValues[0];
  let bestDiff = Infinity;
  for (const v of niceValues) {
    const diff = Math.abs(v - rawMetres);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = v;
    }
  }
  return best;
}

/** Helper to create a filled rectangle path (Skia Rect may not be available). */
function makeRectPath(rx: number, ry: number, rw: number, rh: number) {
  const p = Skia.Path.Make();
  p.addRect({ x: rx, y: ry, width: rw, height: rh });
  return p;
}

export function ScaleBar({ scale, x, y, color = '#C9FFFD', bgColor = '#061A1A' }: ScaleBarProps) {
  // Font loaded at app level via expo-google-fonts; pass null to use system font
  const font = useFont(null, 11);

  const metres = niceScaleLength(scale);
  const barPixels = metres * PIXELS_PER_METRE * scale;
  const barHeight = 6;
  const tickHeight = 10;
  const padding = 8;

  const label = metres >= 1
    ? `${metres}m`
    : `${Math.round(metres * 100)}cm`;

  const subdivisions = metres <= 1 ? 2 : metres <= 5 ? metres : Math.min(5, metres);

  const bgPath = makeRectPath(
    x - padding, y - tickHeight - 18,
    barPixels + padding * 2, tickHeight + barHeight + 24,
  );
  const barPath = makeRectPath(x, y, barPixels, barHeight);

  return (
    <Group>
      {/* Background */}
      <Path path={bgPath} color={bgColor} opacity={0.85} />

      {/* Scale label */}
      {font && (
        <SkiaText
          x={x + barPixels / 2 - (label.length * 3.5)}
          y={y - tickHeight - 4}
          text={label}
          font={font}
          color={color}
        />
      )}

      {/* Main bar */}
      <Path path={barPath} color={color} />

      {/* Start tick */}
      <Line
        p1={{ x, y: y - tickHeight }}
        p2={{ x, y: y + barHeight }}
        color={color}
        strokeWidth={1.5}
      />

      {/* End tick */}
      <Line
        p1={{ x: x + barPixels, y: y - tickHeight }}
        p2={{ x: x + barPixels, y: y + barHeight }}
        color={color}
        strokeWidth={1.5}
      />

      {/* Subdivision ticks */}
      {Array.from({ length: subdivisions - 1 }, (_, i) => {
        const tickX = x + ((i + 1) / subdivisions) * barPixels;
        return (
          <Line
            key={i}
            p1={{ x: tickX, y: y - tickHeight / 2 }}
            p2={{ x: tickX, y: y + barHeight }}
            color={color}
            strokeWidth={0.8}
          />
        );
      })}

      {/* "0" label at start */}
      {font && (
        <SkiaText
          x={x - 2}
          y={y + barHeight + 13}
          text="0"
          font={font}
          color={color}
        />
      )}

      {/* End label */}
      {font && (
        <SkiaText
          x={x + barPixels - (label.length * 3)}
          y={y + barHeight + 13}
          text={label}
          font={font}
          color={color}
        />
      )}
    </Group>
  );
}
