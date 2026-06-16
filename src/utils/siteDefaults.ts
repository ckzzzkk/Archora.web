import type { ClimateZone } from '../types/blueprint';

export interface SiteDefaults {
  hemisphere: 'north' | 'south';
  climateZone: ClimateZone;
}

/** Timezone prefixes/areas that sit in the southern hemisphere. */
const SOUTHERN_MARKERS = [
  'Australia/',
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Port_Moresby',
  'Africa/Johannesburg',
  'Africa/Maputo',
  'Africa/Harare',
  'Africa/Lusaka',
  'Africa/Gaborone',
  'Africa/Windhoek',
  'America/Sao_Paulo',
  'America/Argentina',
  'America/Santiago',
  'America/Montevideo',
  'America/Asuncion',
  'America/La_Paz',
  'America/Lima',
  'Indian/Mauritius',
  'Indian/Antananarivo',
];

/** Rough climate hints for common timezones; anything unmatched → temperate. */
const CLIMATE_HINTS: { match: string; zone: ClimateZone }[] = [
  // Tropical belt
  { match: 'Asia/Singapore', zone: 'tropical' },
  { match: 'Asia/Jakarta', zone: 'tropical' },
  { match: 'Asia/Bangkok', zone: 'tropical' },
  { match: 'Asia/Manila', zone: 'tropical' },
  { match: 'Asia/Kuala_Lumpur', zone: 'tropical' },
  { match: 'Africa/Lagos', zone: 'tropical' },
  { match: 'Africa/Nairobi', zone: 'tropical' },
  { match: 'Africa/Kinshasa', zone: 'tropical' },
  { match: 'Africa/Lusaka', zone: 'subtropical' },
  { match: 'America/Bogota', zone: 'tropical' },
  { match: 'America/Panama', zone: 'tropical' },
  { match: 'America/Sao_Paulo', zone: 'subtropical' },
  { match: 'Australia/Darwin', zone: 'tropical' },
  { match: 'Australia/Brisbane', zone: 'subtropical' },
  // Arid
  { match: 'Asia/Riyadh', zone: 'arid' },
  { match: 'Asia/Dubai', zone: 'arid' },
  { match: 'Africa/Cairo', zone: 'arid' },
  { match: 'America/Phoenix', zone: 'arid' },
  { match: 'Australia/Perth', zone: 'subtropical' },
  { match: 'Australia/Adelaide', zone: 'temperate' },
  // Cold / high latitude
  { match: 'Europe/Helsinki', zone: 'cold' },
  { match: 'Europe/Stockholm', zone: 'cold' },
  { match: 'Europe/Oslo', zone: 'cold' },
  { match: 'Europe/Moscow', zone: 'cold' },
  { match: 'America/Anchorage', zone: 'cold' },
  { match: 'America/Winnipeg', zone: 'cold' },
  { match: 'America/Edmonton', zone: 'cold' },
  // Subtropical extras
  { match: 'America/Miami', zone: 'subtropical' },
  { match: 'Asia/Hong_Kong', zone: 'subtropical' },
  { match: 'Asia/Taipei', zone: 'subtropical' },
];

/**
 * Suggest hemisphere + climate zone from the device timezone. Pure heuristic —
 * the user can always override in the Site section. Falls back to
 * north/temperate when Intl is unavailable (older Hermes) or unmatched.
 */
export function suggestSiteDefaults(timeZoneOverride?: string): SiteDefaults {
  let tz = timeZoneOverride ?? '';
  if (!tz) {
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    } catch {
      tz = '';
    }
  }

  const hemisphere: 'north' | 'south' = SOUTHERN_MARKERS.some((m) => tz.startsWith(m))
    ? 'south'
    : 'north';

  const hint = CLIMATE_HINTS.find((h) => tz.startsWith(h.match));
  return { hemisphere, climateZone: hint?.zone ?? 'temperate' };
}
