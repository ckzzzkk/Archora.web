/**
 * aiLimits.ts — Consolidated AI usage limit constants
 * Single source of truth for all AI feature limits (client + server)
 */

export type QuotaType = 'ai_generation' | 'ai_edit' | 'render' | 'ar_scan';

export const TIER_AI_LIMITS = {
  starter: { aiGenerations: 10, aiEdits: 10, renders: 2, arScans: 0 },
  creator: { aiGenerations: 40, aiEdits: 40, renders: 10, arScans: 15 },
  pro: { aiGenerations: 100, aiEdits: 100, renders: 30, arScans: 30 },
  architect: { aiGenerations: -1, aiEdits: -1, renders: -1, arScans: -1 },
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
