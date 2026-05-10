/**
 * Architecture Drawing Conventions
 *
 * All visual constants for the 2D architectural blueprint renderer.
 * Inspired by standard architectural drawing conventions:
 * - Line weight hierarchy (thick exterior vs thin interior)
 * - Standard door arc / window parallel-line symbols
 * - UK/NZBC room area thresholds
 */

// ── Colour palette ──────────────────────────────────────────────────────────
export const ARCH_COLORS = {
  // Classic architect navy paper
  background:       '#0B1E3D',
  backgroundAlt:    '#0D2240',

  // Ink
  ink:              '#F0EDE8',
  inkDim:           '#9A9590',
  inkGhost:         '#5A5550',

  // Opening accents
  doorAccent:       '#D4A84B',  // amber — door arc
  windowAccent:     '#7AB87A',  // green — window parallel lines

  // Dimension annotation
  dimensionLine:    '#9A9590',
  dimensionText:    '#F0EDE8',

  // Grid
  gridMinor:        'rgba(240, 237, 232, 0.07)',
  gridMajor:        'rgba(240, 237, 232, 0.15)',

  // Scale bar
  scaleBarInk:      '#F0EDE8',
  scaleBarBg:       'rgba(11, 30, 61, 0.9)',
} as const;

// ── Line weight table (px at 40px/m scale) ────────────────────────────────
export const LINE_WEIGHT = {
  // Walls
  outerWall:        6,   // exterior/perimeter walls
  innerWall:        2,   // interior partition walls
  selectedWall:     4,   // selected wall (any type)
  wallDash:         1.5, // dashed preview during wall draw

  // Openings
  doorArc:          1.5, // door swing arc
  doorSwing:        2,   // door leaf line
  windowLine:       2,   // each parallel window line

  // Grid
  gridMinor:        0.4,
  gridMajor:        0.8,

  // Dimension annotation
  extensionLine:    0.5,
  tickMark:         1.2,

  // Furniture
  furnitureEdge:     1.2,
  furnitureSelected: 1.8,
} as const;

// ── Grid intervals ─────────────────────────────────────────────────────────
export const GRID = {
  minorInterval:  0.5,   // metres — minor grid lines
  majorInterval:  2.0,   // metres — major grid lines (structural)
} as const;

// ── Architectural symbol dimensions ────────────────────────────────────────
export const SYMBOLS = {
  // Door
  doorArcAngle:    Math.PI / 2,   // 90° swing
  doorArcRadius:    0.90,          // metres — default door width

  // Window
  windowLineCount:  3,            // parallel lines in window symbol
  windowLineGap:    0.08,          // metres — gap between parallel lines
  windowLineOffset: 0.10,          // metres — offset from wall centreline

  // Dimension ticks
  tickLength:       0.12,          // metres — tick mark size

  // North arrow
  northArrowSize:   36,            // px — compass rose diameter

  // Room label offset from bounding box lower-right
  roomLabelOffsetX: 0.35,          // metres — shift right
  roomLabelOffsetY: 0.25,          // metres — shift down
} as const;

// ── Room area thresholds ───────────────────────────────────────────────────
export const ROOM_THRESHOLDS = {
  minBedroom:   7.5,   // m² — UK minimum
  minBathroom:  2.5,   // m² — UK minimum
  small:        4.0,   // m² — universal small-room threshold
} as const;

// ── Font sizes for blueprint labels ────────────────────────────────────────
export const ARCH_FONTS = {
  roomName:     14,    // Architects Daughter — room name
  roomArea:      11,    // Architects Daughter — area in parentheses
  wallLength:    10,    // JetBrains Mono — wall length annotation
  dimText:       10,    // JetBrains Mono — dimension measurement text
  northLabel:    12,    // JetBrains Mono — north arrow "N" label
} as const;