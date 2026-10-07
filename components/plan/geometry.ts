/**
 * One small house, drawn at 40 px per metre in a 600 x 440 viewBox: 12.0 m x 8.0 m = 96.0 m2.
 * Room areas below add up to the footprint, so the numbers on the drawing are true.
 */
export const PLAN = {
  viewBox: '0 0 600 440',
  x0: 60,
  y0: 50,
  x1: 540,
  y1: 370,
  pxPerM: 40,
} as const;

export interface Room {
  id: string;
  label: string;
  /** top-left and size in px */
  x: number;
  y: number;
  w: number;
  h: number;
}

export const ROOMS: Room[] = [
  { id: 'living', label: 'Living', x: 60, y: 50, w: 260, h: 200 },
  { id: 'kitchen', label: 'Kitchen', x: 320, y: 50, w: 220, h: 200 },
  { id: 'bedroom', label: 'Bedroom', x: 60, y: 250, w: 180, h: 120 },
  { id: 'bath', label: 'Bath', x: 240, y: 250, w: 100, h: 120 },
  { id: 'study', label: 'Study', x: 340, y: 250, w: 200, h: 120 },
];

export const areaM2 = (r: Room) => ((r.w / PLAN.pxPerM) * (r.h / PLAN.pxPerM)).toFixed(1);

/** Outer walls (heavy) and partitions (lighter). */
export const OUTER_WALL = 'M60 50 H540 V370 H60 Z';
export const PARTITIONS = [
  'M320 50 V132 M320 176 V250', // living | kitchen, with a 1.1 m opening
  'M60 250 H132 M168 250 H540', // front rooms | back rooms, opening into the bedroom hall
  'M240 250 V322 M240 346 V370', // bedroom | bath
  'M340 250 V370', // bath | study
];

/** Wall junction points, used to raise the plan into 3D. */
export const CORNERS: Array<[number, number]> = [
  [60, 50], [540, 50], [540, 370], [60, 370],
  [320, 50], [320, 250], [60, 250], [540, 250], [240, 250], [240, 370], [340, 250], [340, 370],
];

/** Door swings (quarter arcs) and window marks on the outer wall. */
export const DOORS = [
  'M320 132 A44 44 0 0 1 276 132',
  'M132 250 A36 36 0 0 0 132 286',
  'M240 322 A24 24 0 0 1 264 322',
];
export const WINDOWS = [
  'M110 50 H250', 'M360 50 H500', 'M540 90 V210', 'M90 370 H210', 'M380 370 H500',
];

/** Furniture, as simple plan symbols. */
export const FURNITURE = [
  // living: sofa, coffee table, rug edge
  'M96 190 H216 V226 H96 Z', 'M126 148 H186 V172 H126 Z',
  // kitchen: counter run + island
  'M344 66 H524 V92 H344 Z', 'M380 150 H490 V190 H380 Z',
  // bedroom: bed + night stand
  'M80 284 H170 V354 H80 Z', 'M176 296 H196 V316 H176 Z',
  // bath: tub + basin
  'M254 334 H328 V362 H254 Z', 'M288 268 A10 10 0 1 0 308 268 A10 10 0 1 0 288 268',
  // study: desk + chair
  'M470 268 H530 V292 H470 Z', 'M486 304 A9 9 0 1 0 504 304 A9 9 0 1 0 486 304',
];
