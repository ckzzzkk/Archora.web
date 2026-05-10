import { randomUUID } from 'expo-crypto';
import type { LayoutRoom, LayoutConfig, Rectangle } from './types';
import { GROUND_FLOOR_ONLY } from './types';

/**
 * Architectural zones for ground floor.
 * Each zone covers a fraction of the plot (0–1 in both axes).
 * Rooms are assigned to zones by type, then packed inside zone rectangles.
 */
export interface Zone {
  name: 'entry' | 'social' | 'kitchen' | 'private' | 'garage' | 'corridor' | 'staircase';
  /** 0–1 fraction of plotWidth */
  xStart: number;
  xEnd: number;
  /** 0–1 fraction of plotDepth (0 = front of plot, 1 = back) */
  yStart: number;
  yEnd: number;
  /** Rooms that belong in this zone */
  allowedTypes: string[];
}

const GROUND_ZONES: Zone[] = [
  // Garage: right side, front of plot (approachable from street)
  {
    name: 'garage',
    xStart: 0.72,
    xEnd: 1.0,
    yStart: 0.0,
    yEnd: 0.35,
    allowedTypes: ['garage'],
  },
  // Entry: front, left of garage — covers the area where the entry hall lives
  {
    name: 'entry',
    xStart: 0.0,
    xEnd: 0.72,
    yStart: 0.0,
    yEnd: 0.18,
    allowedTypes: ['hallway'],
  },
  // Social: middle band — living + dining
  {
    name: 'social',
    xStart: 0.0,
    xEnd: 1.0,
    yStart: 0.12,
    yEnd: 0.52,
    allowedTypes: ['living_room', 'dining_room'],
  },
  // Kitchen/service: right-middle strip
  {
    name: 'kitchen',
    xStart: 0.62,
    xEnd: 1.0,
    yStart: 0.35,
    yEnd: 0.60,
    allowedTypes: ['kitchen', 'laundry', 'storage'],
  },
  // Corridor spine: horizontal strip between social and private zones
  {
    name: 'corridor',
    xStart: 0.0,
    xEnd: 1.0,
    yStart: 0.48,
    yEnd: 0.60,
    allowedTypes: ['hallway'],
  },
  // Staircase shaft: where the stairs connect ground floor to upper floors
  // Sits at the front-right corner of the private zone, near the entry
  {
    name: 'staircase',
    xStart: 0.78,
    xEnd: 0.92,
    yStart: 0.48,
    yEnd: 0.60,
    allowedTypes: ['staircase'],
  },
  // Private: rear 40% — all bedrooms and bathrooms
  {
    name: 'private',
    xStart: 0.0,
    xEnd: 0.78,
    yStart: 0.55,
    yEnd: 1.0,
    allowedTypes: ['bedroom', 'bathroom', 'office', 'balcony'],
  },
];

/**
 * Build upper floor zones with reasoning.
 *
 * Key decisions:
 * - Staircase shaft must align with ground floor corridor + staircase zone
 * - All rooms are private zone (upper floors = bedrooms/bathrooms only)
 * - Wet rooms (bathrooms) stacked over wet rooms below for shared plumbing
 * - Master bedroom always at rear (maximum privacy, furthest from street noise)
 * - Children's bedrooms grouped together near family bathroom
 * - Corridor runs front-to-back so every room opens onto it
 */
function buildUpperFloorZones(plotWidth: number, plotDepth: number): Zone[] {
  // Staircase zone — must align with ground floor staircase shaft
  // Positioned at the same xStart as ground floor staircase (0.78)
  const stairX = 0.78;
  const stairW = 0.14;

  return [
    // Corridor: vertical spine running front-to-back through the center
    // Connects staircase to all bedrooms
    {
      name: 'corridor',
      xStart: 0.30,
      xEnd: 0.46,
      yStart: 0.0,
      yEnd: 1.0,
      allowedTypes: ['hallway'],
    },
    // Staircase shaft at front-right, connecting down to ground floor corridor
    {
      name: 'staircase',
      xStart: stairX,
      xEnd: stairX + stairW,
      yStart: 0.0,
      yEnd: 0.35,
      allowedTypes: ['staircase'],
    },
    // Master suite: REAR of upper floor (maximum privacy, best light)
    {
      name: 'private',
      xStart: 0.0,
      xEnd: 0.72,
      yStart: 0.70,
      yEnd: 1.0,
      allowedTypes: ['bedroom'],
    },
    // Children's bedrooms: mid-section, grouped together near family bathroom
    {
      name: 'private',
      xStart: 0.0,
      xEnd: 0.72,
      yStart: 0.30,
      yEnd: 0.72,
      allowedTypes: ['bedroom'],
    },
    // Bathrooms: front-middle, vertically above kitchen/service zone for shared plumbing
    {
      name: 'private',
      xStart: 0.60,
      xEnd: 1.0,
      yStart: 0.30,
      yEnd: 0.70,
      allowedTypes: ['bathroom'],
    },
    // Office/study: front-left corner
    {
      name: 'private',
      xStart: 0.0,
      xEnd: 0.55,
      yStart: 0.0,
      yEnd: 0.35,
      allowedTypes: ['office'],
    },
  ];
}

/** Convert a 0–1 zone fraction to an absolute plot coordinate */
function zoneToAbs(zone: Zone, plotWidth: number, plotDepth: number): Rectangle {
  return {
    x: zone.xStart * plotWidth,
    y: zone.yStart * plotDepth,
    width: (zone.xEnd - zone.xStart) * plotWidth,
    height: (zone.yEnd - zone.yStart) * plotDepth,
  };
}

/** Assign a room type to a zone name */
function assignZone(type: LayoutRoom['type']): Zone['name'] {
  if (type === 'garage') return 'garage';
  if (type === 'staircase') return 'staircase';
  if (type === 'hallway') return 'corridor';
  if (['bedroom', 'bathroom', 'office', 'balcony'].includes(type)) return 'private';
  if (['kitchen', 'laundry', 'storage'].includes(type)) return 'kitchen';
  if (['living_room', 'dining_room'].includes(type)) return 'social';
  return 'entry';
}

/** BSP-style packing within a zone rectangle */
function packZone(
  zoneRect: Rectangle,
  rooms: Array<{ type: LayoutRoom['type']; name: string; minW: number; minH: number; aspect: number }>,
): LayoutRoom[] {
  if (rooms.length === 0) return [];

  function split(rect: Rectangle, reqs: typeof rooms): LayoutRoom[] {
    if (reqs.length === 0) return [];
    const [r, ...rest] = reqs;
    const w = Math.max(r.minW, rect.width);
    const h = Math.max(r.minH, rect.height);
    if (w > rect.width && h > rect.height) return split(rect, rest);

    const horiz = rect.width > rect.height;
    const splitFrac = 0.55;
    const splitAt = horiz
      ? Math.max(r.minH, rect.height * splitFrac)
      : Math.max(r.minW, rect.width * splitFrac);

    let mainRect: Rectangle;
    let otherRect: Rectangle;
    if (horiz) {
      mainRect = { x: rect.x, y: rect.y, width: rect.width, height: splitAt };
      otherRect = { x: rect.x, y: rect.y + splitAt, width: rect.width, height: rect.height - splitAt };
    } else {
      mainRect = { x: rect.x, y: rect.y, width: splitAt, height: rect.height };
      otherRect = { x: rect.x + splitAt, y: rect.y, width: rect.width - splitAt, height: rect.height };
    }

    const placed: LayoutRoom = {
      id: randomUUID(),
      type: r.type,
      name: r.name,
      x: mainRect.x,
      y: mainRect.y,
      width: mainRect.width,
      height: mainRect.height,
      floorIndex: 0,
    };

    return [placed, ...split(otherRect, rest)];
  }

  return split(zoneRect, rooms);
}

/**
 * Place all rooms into architecturally correct zones using corridor-first placement.
 *
 * Algorithm:
 * 1. For ground floor: use fixed GROUND_ZONES
 * 2. For upper floors: build zones dynamically — staircase aligned to ground floor,
 *    corridor spine runs front-to-back, wet rooms stacked for plumbing alignment
 * 3. Assign each room requirement to its zone by type
 * 4. Collect staircase+corridor rooms first (structural spine)
 * 5. Pack remaining rooms into their zone rectangles
 * 6. Return all rooms
 */
export function placeRoomsInZones(
  config: LayoutConfig,
  floorIndex: number,
): LayoutRoom[] {
  const { plotWidth, plotDepth } = config;
  const zones = floorIndex === 0 ? GROUND_ZONES : buildUpperFloorZones(plotWidth, plotDepth);

  // Group room requirements by zone
  const zoneRooms: Record<string, Array<{ type: LayoutRoom['type']; name: string; minW: number; minH: number; aspect: number }>> = {};
  for (const room of config.rooms) {
    // Skip ground-floor-only rooms on upper floors
    if (floorIndex > 0 && (GROUND_FLOOR_ONLY as string[]).includes(room.type)) continue;
    const count = room.count ?? 1;
    const zoneName = assignZone(room.type);
    if (!zoneRooms[zoneName]) zoneRooms[zoneName] = [];
    for (let i = 0; i < count; i++) {
      zoneRooms[zoneName].push({
        type: room.type,
        name: room.name,
        minW: room.minWidth,
        minH: room.minHeight,
        aspect: room.preferredAspect,
      });
    }
  }

  const allRooms: LayoutRoom[] = [];

  // Phase 1: Place structural spine first (staircase + corridor)
  // These must be placed before other rooms so rooms pack around them
  for (const zone of zones) {
    if (zone.name !== 'corridor' && zone.name !== 'staircase') continue;
    const reqs = zoneRooms[zone.name];
    if (!reqs || reqs.length === 0) continue;
    const rect = zoneToAbs(zone, plotWidth, plotDepth);
    const placed = packZone(rect, reqs);
    allRooms.push(...placed.map(r => ({ ...r, floorIndex })));
  }

  // Phase 2: Pack remaining rooms into their zones
  for (const zone of zones) {
    if (zone.name === 'corridor' || zone.name === 'staircase') continue;
    const reqs = zoneRooms[zone.name];
    if (!reqs || reqs.length === 0) continue;
    const rect = zoneToAbs(zone, plotWidth, plotDepth);
    const placed = packZone(rect, reqs);
    allRooms.push(...placed.map(r => ({ ...r, floorIndex })));
  }

  return allRooms;
}

