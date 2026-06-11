import { describe, it, expect } from 'vitest';
import { TIER_LIMITS } from '../../utils/tierLimits';
import { TIER_AI_LIMITS } from '../../../supabase/functions/_shared/tierConstants';

// Client (src/utils/tierLimits.ts) is the canonical tier matrix per CLAUDE.md.
// The server constants (supabase/functions/_shared/tierConstants.ts) and the
// tier_limits Postgres table (migration 061) must agree with it — this suite
// fails when they drift. If you change a tier limit: update tierLimits.ts,
// tierConstants.ts AND add a migration updating the tier_limits table.

const TIERS = ['starter', 'creator', 'pro', 'architect'] as const;

describe('client ⇄ server tier limit consistency', () => {
  for (const tier of TIERS) {
    it(`${tier}: AI generations per month match`, () => {
      expect(TIER_AI_LIMITS[tier].aiGenerations).toBe(TIER_LIMITS[tier].aiGenerationsPerMonth);
    });

    it(`${tier}: AI edits per month match`, () => {
      expect(TIER_AI_LIMITS[tier].aiEdits).toBe(TIER_LIMITS[tier].aiEditsPerMonth);
    });

    it(`${tier}: renders per month match`, () => {
      expect(TIER_AI_LIMITS[tier].renders).toBe(TIER_LIMITS[tier].rendersPerMonth);
    });

    it(`${tier}: AR scans per month match`, () => {
      expect(TIER_AI_LIMITS[tier].arScans).toBe(TIER_LIMITS[tier].arScansPerMonth);
    });
  }

  it('starter has no AI generation, edits, or renders (free tier is manual-only)', () => {
    expect(TIER_AI_LIMITS.starter).toEqual({ aiGenerations: 0, aiEdits: 0, renders: 0, arScans: 0 });
  });
});
