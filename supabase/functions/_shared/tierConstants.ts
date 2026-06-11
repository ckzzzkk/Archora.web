// Pure tier constants shared by edge functions AND the vitest consistency
// suite (src/__tests__/tiers/tierLimitsConsistency.test.ts).
//
// CONSTRAINT: no imports, no Deno globals — this file must typecheck under the
// app tsconfig and run in Node. Deno-specific helpers stay in aiLimits.ts.
//
// These values MUST match src/utils/tierLimits.ts (the canonical tier matrix
// per CLAUDE.md) and the tier_limits Postgres table (migration 061). The
// consistency test fails the build when they drift.

export type QuotaType = 'ai_generation' | 'ai_edit' | 'render' | 'ar_scan';

export const TIER_AI_LIMITS = {
  starter: { aiGenerations: 0, aiEdits: 0, renders: 0, arScans: 0 },
  creator: { aiGenerations: 40, aiEdits: 30, renders: 5, arScans: 15 },
  pro: { aiGenerations: 100, aiEdits: 80, renders: 30, arScans: -1 },
  architect: { aiGenerations: 300, aiEdits: 300, renders: 100, arScans: 100 },
} as const;

export type Tier = keyof typeof TIER_AI_LIMITS;

export const ARCHITECT_TOKEN_MULTIPLIERS = {
  'frank-lloyd-wright': 1.0,
  'zaha-hadid': 1.5,
  'tadao-ando': 1.0,
  'norman-foster': 1.5,
  'le-corbusier': 1.0,
  'peter-zumthor': 1.5,
  'bjarke-ingels': 1.5,
  'kengo-kuma': 1.5,
  'alain-carle': 1.5,
  'santiago-calatrava': 2.0,
  'louis-kahn': 1.5,
  'rem-koolhaas': 2.0,
} as const;

export const ARCHITECT_TIER_REQUIRED = {
  'frank-lloyd-wright': 'starter',
  'zaha-hadid': 'starter',
  'tadao-ando': 'starter',
  'norman-foster': 'creator',
  'le-corbusier': 'creator',
  'peter-zumthor': 'creator',
  'bjarke-ingels': 'creator',
  'kengo-kuma': 'pro',
  'alain-carle': 'pro',
  'louis-kahn': 'pro',
  'santiago-calatrava': 'pro',
  'rem-koolhaas': 'architect',
} as const;

export const TIER_ARCHITECT_COUNT = {
  starter: 3,
  creator: 7,
  pro: 11,
  architect: 12,
} as const;

/** Returns token cost multiplier (1.0, 1.5, or 2.0) */
export function getArchitectMultiplier(architectId: string): number {
  return ARCHITECT_TOKEN_MULTIPLIERS[architectId as keyof typeof ARCHITECT_TOKEN_MULTIPLIERS] ?? 1.0;
}

/** Returns minimum tier required to use an architect */
export function getArchitectTierRequired(architectId: string): Tier {
  return ARCHITECT_TIER_REQUIRED[architectId as keyof typeof ARCHITECT_TIER_REQUIRED] ?? 'starter';
}
