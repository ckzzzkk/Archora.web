import { describe, it, expect } from 'vitest';
import {
  getTierFromProductId,
  resolveTierForEvent,
  GRANTS_ACCESS,
  REVOKES_ACCESS,
} from '../../../supabase/functions/revenuecat-webhook/tierResolver';

const ENV = {
  asoria_creator_monthly: 'creator',
  asoria_creator_annual: 'creator',
  asoria_pro_monthly: 'pro',
  asoria_pro_annual: 'pro',
  asoria_architect_monthly: 'architect',
  asoria_architect_annual: 'architect',
};

describe('getTierFromProductId', () => {
  it('maps a known product id to its tier', () => {
    expect(getTierFromProductId('asoria_creator_monthly', ENV)).toBe('creator');
    expect(getTierFromProductId('asoria_creator_annual', ENV)).toBe('creator');
    expect(getTierFromProductId('asoria_pro_monthly', ENV)).toBe('pro');
    expect(getTierFromProductId('asoria_pro_annual', ENV)).toBe('pro');
    expect(getTierFromProductId('asoria_architect_monthly', ENV)).toBe('architect');
    expect(getTierFromProductId('asoria_architect_annual', ENV)).toBe('architect');
  });
  it('returns starter for an unknown product id', () => {
    expect(getTierFromProductId('something_else', ENV)).toBe('starter');
  });
});

describe('resolveTierForEvent', () => {
  it('grants the product tier on purchase/renewal events', () => {
    for (const type of GRANTS_ACCESS) {
      expect(resolveTierForEvent(type, 'asoria_pro_monthly', ENV)).toBe('pro');
    }
  });

  it('revokes to starter on expiration/billing events regardless of product', () => {
    for (const type of REVOKES_ACCESS) {
      expect(resolveTierForEvent(type, 'asoria_pro_monthly', ENV)).toBe('starter');
    }
  });

  it('returns null (no DB change) for CANCELLATION — access continues until expiry', () => {
    expect(resolveTierForEvent('CANCELLATION', 'asoria_pro_monthly', ENV)).toBeNull();
  });

  it('returns null for unhandled event types', () => {
    expect(resolveTierForEvent('SUBSCRIBER_ALIAS', 'asoria_pro_monthly', ENV)).toBeNull();
  });
});
