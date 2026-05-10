/**
 * NorthArrow — 8-point compass rose for architectural blueprint
 *
 * Renders in the bottom-right corner of the canvas. Cardinal arms (N/E/S/W)
 * are longer and thicker than diagonal arms. "N" label above north point.
 */
import { Group, Path, Line, Text as SkiaText, Skia } from '@shopify/react-native-skia';
import { ARCH_COLORS, SYMBOLS } from '../../../utils/architecture/drawingConventions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface NorthArrowProps {
  x: number;
  y: number;
  size?: number;
  font?: any;
}

// Draw a circle using line segments
function makeCircle(cx: number, cy: number, r: number, segments = 16) {
  const p = Skia.Path.Make();
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    if (i === 0) p.moveTo(px, py);
    else p.lineTo(px, py);
  }
  p.close();
  return p;
}

export function NorthArrow({ x, y, size = SYMBOLS.northArrowSize, font }: NorthArrowProps) {
  const S = size / 2;
  const D = S * 0.68;

  const outerCircle = makeCircle(x, y, S * 0.9);
  const innerCircle = makeCircle(x, y, S * 0.25);

  return (
    <Group>
      <Path path={outerCircle} color={ARCH_COLORS.inkDim} strokeWidth={0.8} style="stroke" />
      <Path path={innerCircle} color={ARCH_COLORS.inkDim} style="fill" />
      <Line p1={{ x, y: y - S }} p2={{ x, y: y + S }} color={ARCH_COLORS.ink} strokeWidth={1.5} />
      <Line p1={{ x: x - S, y }} p2={{ x: x + S, y }} color={ARCH_COLORS.ink} strokeWidth={1.5} />
      <Line p1={{ x: x - D, y: y - D }} p2={{ x: x + D, y: y + D }} color={ARCH_COLORS.inkDim} strokeWidth={1} />
      <Line p1={{ x: x + D, y: y - D }} p2={{ x: x - D, y: y + D }} color={ARCH_COLORS.inkDim} strokeWidth={1} />
      {font && (
        <SkiaText x={x - 5} y={y - S - 7} text="N" font={font} color={ARCH_COLORS.ink} />
      )}
    </Group>
  );
}