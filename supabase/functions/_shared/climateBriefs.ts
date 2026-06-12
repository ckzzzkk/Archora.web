// Pure climate-design knowledge shared by edge functions AND the app/vitest
// suite (src/utils/environment/climateData.ts re-exports this for the client
// environment engine; src/__tests__/edge/climateBriefs.test.ts tests it).
//
// CONSTRAINT: no imports, no Deno globals — this file must typecheck under the
// app tsconfig and run in Node. (Same contract as tierConstants.ts.)
//
// Values are synthesized from common international residential design practice
// (passive-solar orientation, roof pitch for rain/snow shedding, eave depth
// for seasonal shading, glazing ratios per facade, thermal mass strategy).
// They drive: (1) the AI generation prompts, (2) the deterministic environment
// simulation engine, (3) the environment quality dimension.

export type Hemisphere = 'north' | 'south';
export type ClimateZoneId =
  | 'tropical'
  | 'subtropical'
  | 'temperate'
  | 'arid'
  | 'cold'
  | 'alpine';

/** Facade direction relative to the equator, resolved per hemisphere. */
export type RelativeFacing = 'equator' | 'pole' | 'east' | 'west';

export interface ClimateBrief {
  zone: ClimateZoneId;
  label: string;
  /** Representative latitude band (degrees, absolute) for sun-path approximation. */
  latitudeBand: { min: number; max: number };
  /** Approximate noon sun altitude (degrees) at the band midpoint. */
  summerSunAltitude: number;
  winterSunAltitude: number;
  /** Roof pitch in degrees — min acceptable and climate ideal. */
  roofPitchDeg: { min: number; ideal: number };
  /** Eave/overhang depth in metres — min acceptable and climate ideal. */
  eaveDepthM: { min: number; ideal: number };
  /** Window-to-wall ratio bands per facade orientation (relative to equator). */
  glazingRatioByOrientation: Record<RelativeFacing, { min: number; max: number }>;
  /** Construction thermal-mass strategy for the zone. */
  thermalMass: 'high' | 'medium' | 'low';
  crossVentilationPriority: 'critical' | 'recommended' | 'optional';
  /** Typical foundation approach for the zone (prompt guidance, not a rule). */
  foundationGuidance: string;
  /** Concrete numeric design rules injected into generation prompts. */
  promptRules: string[];
}

export const CLIMATE_BRIEFS: Record<ClimateZoneId, ClimateBrief> = {
  tropical: {
    zone: 'tropical',
    label: 'Tropical (hot–humid)',
    latitudeBand: { min: 0, max: 15 },
    summerSunAltitude: 82,
    winterSunAltitude: 58,
    roofPitchDeg: { min: 30, ideal: 45 },
    eaveDepthM: { min: 0.9, ideal: 1.2 },
    glazingRatioByOrientation: {
      equator: { min: 0.2, max: 0.4 },
      pole: { min: 0.2, max: 0.4 },
      east: { min: 0.15, max: 0.3 },
      west: { min: 0.05, max: 0.15 },
    },
    thermalMass: 'low',
    crossVentilationPriority: 'critical',
    foundationGuidance: 'raised piers or pad — lift floor off damp ground, termite barrier',
    promptRules: [
      'Roof pitch 45° (30° minimum) to shed monsoon rain; ventilated roof cavity.',
      'Eaves/overhangs at least 1.2m deep on every facade — shade is the primary cooling strategy.',
      'Every habitable room MUST have openings on two opposing or adjacent facades for cross-ventilation.',
      'Avoid west-facing glazing (max 15% of facade); it causes severe afternoon overheating.',
      'Lightweight, low-thermal-mass walls that cool quickly at night; raised floor on piers preferred.',
      'Outdoor-living transition spaces (verandas, covered terraces) are expected in this climate.',
    ],
  },
  subtropical: {
    zone: 'subtropical',
    label: 'Subtropical (warm–humid summers, mild winters)',
    latitudeBand: { min: 15, max: 35 },
    summerSunAltitude: 88,
    winterSunAltitude: 42,
    roofPitchDeg: { min: 20, ideal: 30 },
    eaveDepthM: { min: 0.6, ideal: 0.9 },
    glazingRatioByOrientation: {
      equator: { min: 0.25, max: 0.45 },
      pole: { min: 0.15, max: 0.3 },
      east: { min: 0.15, max: 0.3 },
      west: { min: 0.05, max: 0.2 },
    },
    thermalMass: 'medium',
    crossVentilationPriority: 'critical',
    foundationGuidance: 'slab-on-grade or low stumps; damp-proofing for humid season',
    promptRules: [
      'Eaves about 0.9m: sized so high summer sun is blocked while low winter sun penetrates.',
      'Equator-facing living glazing 25–45% of facade for winter sun; shade it with eaves in summer.',
      'Cross-ventilation paths through all habitable rooms; ceiling height 2.7m+ helps stratification.',
      'Limit west glazing to 20% of facade and shade it externally.',
      'Medium thermal mass (slab floor) to flatten the day–night temperature swing.',
    ],
  },
  temperate: {
    zone: 'temperate',
    label: 'Temperate (four seasons)',
    latitudeBand: { min: 35, max: 55 },
    summerSunAltitude: 68,
    winterSunAltitude: 22,
    roofPitchDeg: { min: 25, ideal: 35 },
    eaveDepthM: { min: 0.45, ideal: 0.6 },
    glazingRatioByOrientation: {
      equator: { min: 0.35, max: 0.6 },
      pole: { min: 0.1, max: 0.2 },
      east: { min: 0.15, max: 0.3 },
      west: { min: 0.1, max: 0.25 },
    },
    thermalMass: 'medium',
    crossVentilationPriority: 'recommended',
    foundationGuidance: 'strip footings or slab-on-grade with perimeter insulation',
    promptRules: [
      'Passive solar: equator-facing living/dining/kitchen glazing 35–60% of facade captures low winter sun.',
      'Pole-facing glazing under 20% of facade — it is a net heat loser all winter.',
      'Eaves about 0.6m: block 68° summer noon sun, admit 22° winter sun.',
      'Roof pitch 35° (25° minimum) for rain and occasional snow.',
      'Medium thermal mass (exposed slab or masonry feature wall) stores winter solar gain.',
      'Bedrooms toward the east for morning sun; service rooms (bath/laundry/storage) buffer the pole side.',
    ],
  },
  arid: {
    zone: 'arid',
    label: 'Arid (hot–dry, large diurnal swing)',
    latitudeBand: { min: 15, max: 35 },
    summerSunAltitude: 88,
    winterSunAltitude: 42,
    roofPitchDeg: { min: 2, ideal: 10 },
    eaveDepthM: { min: 0.6, ideal: 0.9 },
    glazingRatioByOrientation: {
      equator: { min: 0.15, max: 0.3 },
      pole: { min: 0.15, max: 0.3 },
      east: { min: 0.1, max: 0.2 },
      west: { min: 0.05, max: 0.1 },
    },
    thermalMass: 'high',
    crossVentilationPriority: 'recommended',
    foundationGuidance: 'slab-on-grade; ground-coupling moderates temperature',
    promptRules: [
      'High thermal mass (thick masonry/adobe/rammed-earth walls) — the day–night swing is the free energy source.',
      'Small openings overall; west glazing at most 10% of facade.',
      'Flat or low-pitch roof (≤10°) is appropriate; rain is rare. Light/reflective roof colour.',
      'Compact plan with minimal exterior surface; courtyards provide shaded private outdoor space.',
      'Night-flush ventilation paths: high openings that purge stored heat after sunset.',
    ],
  },
  cold: {
    zone: 'cold',
    label: 'Cold (long heating season, snow)',
    latitudeBand: { min: 50, max: 65 },
    summerSunAltitude: 56,
    winterSunAltitude: 9,
    roofPitchDeg: { min: 35, ideal: 45 },
    eaveDepthM: { min: 0.3, ideal: 0.45 },
    glazingRatioByOrientation: {
      equator: { min: 0.3, max: 0.5 },
      pole: { min: 0.05, max: 0.15 },
      east: { min: 0.1, max: 0.25 },
      west: { min: 0.1, max: 0.2 },
    },
    thermalMass: 'high',
    crossVentilationPriority: 'optional',
    foundationGuidance: 'frost-protected footings below frost line, or insulated raft',
    promptRules: [
      'Compact, near-square plan — minimise exterior wall area per floor area.',
      'Roof pitch 45° (35° minimum) to shed snow; design for snow load.',
      'Equator-facing glazing 30–50% (triple glazed) for winter gain; pole-facing under 15%.',
      'Short eaves (~0.45m) so the very low winter sun (under 10° at noon) is never blocked.',
      'Entry through an airlock/vestibule — never directly into living space.',
      'High insulation and high interior thermal mass; wet rooms clustered on shared plumbing walls.',
    ],
  },
  alpine: {
    zone: 'alpine',
    label: 'Alpine (mountain — snow, wind, intense sun)',
    latitudeBand: { min: 40, max: 60 },
    summerSunAltitude: 66,
    winterSunAltitude: 20,
    roofPitchDeg: { min: 35, ideal: 50 },
    eaveDepthM: { min: 0.4, ideal: 0.6 },
    glazingRatioByOrientation: {
      equator: { min: 0.3, max: 0.5 },
      pole: { min: 0.05, max: 0.12 },
      east: { min: 0.1, max: 0.2 },
      west: { min: 0.1, max: 0.2 },
    },
    thermalMass: 'high',
    crossVentilationPriority: 'optional',
    foundationGuidance: 'deep frost-protected footings; anchor against wind uplift',
    promptRules: [
      'Steep roof, 50° ideal (35° minimum), with snow guards; structure sized for heavy snow load.',
      'Orient the long axis and main glazing toward the equator and the valley view; pole side nearly closed (max 12% glazing).',
      'Compact massing braced against mountain wind; entry via vestibule with snow/boot room.',
      'High thermal mass interior plus heavy insulation; small openings on weather-exposed facades.',
    ],
  },
};

/** Resolve a relative facing (equator/pole) to a compass letter for a hemisphere. */
export function resolveFacing(rel: RelativeFacing, hemisphere: Hemisphere): 'N' | 'S' | 'E' | 'W' {
  if (rel === 'east') return 'E';
  if (rel === 'west') return 'W';
  if (rel === 'equator') return hemisphere === 'north' ? 'S' : 'N';
  return hemisphere === 'north' ? 'N' : 'S';
}

/** Compass letter → relative facing for a hemisphere (inverse of resolveFacing). */
export function toRelativeFacing(compass: 'N' | 'S' | 'E' | 'W', hemisphere: Hemisphere): RelativeFacing {
  if (compass === 'E') return 'east';
  if (compass === 'W') return 'west';
  const equatorIs = hemisphere === 'north' ? 'S' : 'N';
  return compass === equatorIs ? 'equator' : 'pole';
}

/**
 * Build the climate section injected into generation prompts: concrete,
 * numeric, hemisphere-resolved. ~20 lines.
 */
export function buildClimatePromptSection(zone: string, hemisphere: Hemisphere): string {
  const brief = CLIMATE_BRIEFS[zone as ClimateZoneId] ?? CLIMATE_BRIEFS.temperate;
  const eq = resolveFacing('equator', hemisphere);
  const pole = resolveFacing('pole', hemisphere);
  const g = brief.glazingRatioByOrientation;
  const pct = (r: { min: number; max: number }) =>
    `${Math.round(r.min * 100)}–${Math.round(r.max * 100)}%`;

  const lines = [
    `CLIMATE-SPECIFIC DESIGN RULES — ${brief.label}, ${hemisphere}ern hemisphere (MANDATORY):`,
    `The sun side is ${eq}; the shade side is ${pole}. Noon sun altitude: ~${brief.summerSunAltitude}° summer, ~${brief.winterSunAltitude}° winter.`,
    ...brief.promptRules.map((r) =>
      r.replace(/equator-facing/gi, `${eq}-facing`).replace(/pole-facing/gi, `${pole}-facing`).replace(/pole side/gi, `${pole} side`),
    ),
    `Glazing ratio per facade (window area / facade area): ${eq} ${pct(g.equator)}, ${pole} ${pct(g.pole)}, E ${pct(g.east)}, W ${pct(g.west)}.`,
    `Roof pitch: ideal ${brief.roofPitchDeg.ideal}°, never below ${brief.roofPitchDeg.min}°. Eave depth: ideal ${brief.eaveDepthM.ideal}m, never below ${brief.eaveDepthM.min}m.`,
    `Thermal mass strategy: ${brief.thermalMass}. Cross-ventilation: ${brief.crossVentilationPriority}.`,
    `Foundation: ${brief.foundationGuidance}.`,
    `Record in metadata: climateZone, hemisphere, orientation (entry facade compass letter), roofPitch (degrees), eaveDepth (metres).`,
  ];
  return lines.join('\n');
}
