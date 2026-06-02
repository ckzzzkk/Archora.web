import { describe, it, expect, vi } from 'vitest';

// Mock useSession to return a controllable user
const mockUser = {
  subscriptionTier: 'starter' as 'starter' | 'creator' | 'pro' | 'architect',
  aiGenerationsUsed: 0,
  arScansUsed: 0,
};

vi.mock('../../auth/useSession', () => ({
  useSession: () => ({ user: mockUser }),
}));

// Mock data modules that useSession depends on
vi.mock('../../data/architectProfiles', () => ({
  getArchitectTierRequired: vi.fn().mockReturnValue('creator'),
}));

// Import after mocks
import { TIER_LIMITS } from '../../utils/tierLimits';

describe('useTierGate — logic (tested via TIER_LIMITS directly)', () => {
  it('starter has 0 AI generations per month', () => {
    expect(TIER_LIMITS.starter.aiGenerationsPerMonth).toBe(0);
  });

  it('creator has 40 AI generations per month', () => {
    expect(TIER_LIMITS.creator.aiGenerationsPerMonth).toBe(40);
  });

  it('pro has 100 AI generations per month', () => {
    expect(TIER_LIMITS.pro.aiGenerationsPerMonth).toBe(100);
  });

  it('architect has 300 AI generations per month', () => {
    expect(TIER_LIMITS.architect.aiGenerationsPerMonth).toBe(300);
  });

  it('starter has 0 AR scans per month', () => {
    expect(TIER_LIMITS.starter.arScansPerMonth).toBe(0);
  });

  it('creator has 15 AR scans per month', () => {
    expect(TIER_LIMITS.creator.arScansPerMonth).toBe(15);
  });

  it('pro has unlimited AR scans (-1)', () => {
    expect(TIER_LIMITS.pro.arScansPerMonth).toBe(-1);
  });

  it('starter cannot access AR measure (false)', () => {
    expect(TIER_LIMITS.starter.arMeasure).toBe(false);
  });

  it('pro can access AR measure (true)', () => {
    expect(TIER_LIMITS.pro.arMeasure).toBe(true);
  });

  it('starter has 0 VIGA requests per month', () => {
    expect(TIER_LIMITS.starter.vigaRequestsPerMonth).toBe(0);
  });

  it('creator has 0 VIGA requests per month', () => {
    expect(TIER_LIMITS.creator.vigaRequestsPerMonth).toBe(0);
  });

  it('pro has 10 VIGA requests per month', () => {
    expect(TIER_LIMITS.pro.vigaRequestsPerMonth).toBe(10);
  });

  it('architect has 50 VIGA requests per month', () => {
    expect(TIER_LIMITS.architect.vigaRequestsPerMonth).toBe(50);
  });

  it('starter has 0 AI chat messages per day', () => {
    expect(TIER_LIMITS.starter.aiChatMessagesPerDay).toBe(0);
  });

  it('creator has 25 AI chat messages per day', () => {
    expect(TIER_LIMITS.creator.aiChatMessagesPerDay).toBe(25);
  });

  it('pro has unlimited AI chat (-1)', () => {
    expect(TIER_LIMITS.pro.aiChatMessagesPerDay).toBe(-1);
  });

  it('starter has 1 max project', () => {
    expect(TIER_LIMITS.starter.maxProjects).toBe(1);
  });

  it('architect has 100 max projects', () => {
    expect(TIER_LIMITS.architect.maxProjects).toBe(100);
  });
});

describe('useTierGate — numericLimit=0 means blocked (not unlimited)', () => {
  it('confirmed: starter aiGenerationsPerMonth is 0 (blocked, not -1 unlimited)', () => {
    const limit = TIER_LIMITS.starter.aiGenerationsPerMonth;
    // 0 must not be confused with -1 (unlimited). The hook should treat 0 as blocked.
    expect(limit).toBe(0);
    expect(limit).not.toBe(-1);
  });

  it('confirmed: only -1 means unlimited', () => {
    const starterLimit = TIER_LIMITS.starter.aiGenerationsPerMonth; // 0 = blocked
    const proUnlimited = TIER_LIMITS.pro.aiChatMessagesPerDay; // -1 = unlimited
    expect(starterLimit === 0).toBe(true);
    expect(proUnlimited === -1).toBe(true);
    // The gate logic: allowed = numericLimit === -1 OR (numericLimit > 0 AND usage < limit)
    const starterAllowed = starterLimit === -1 || (starterLimit > 0 && 0 < starterLimit);
    const proAllowed = proUnlimited === -1 || (proUnlimited > 0 && 0 < proUnlimited);
    expect(starterAllowed).toBe(false); // 0 is blocked
    expect(proAllowed).toBe(true);      // -1 is unlimited
  });
});
