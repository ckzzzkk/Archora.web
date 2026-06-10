import { describe, it, expect } from 'vitest';
import {
  getProductId,
  getEntitlementId,
  entitlementToTier,
  RC_ENTITLEMENTS,
} from '../iapProducts';

describe('iapProducts', () => {
  it('maps tier + billing to the canonical RC product identifier', () => {
    expect(getProductId('creator', 'monthly')).toBe('asoria_creator_monthly');
    expect(getProductId('creator', 'annual')).toBe('asoria_creator_annual');
    expect(getProductId('pro', 'monthly')).toBe('asoria_pro_monthly');
    expect(getProductId('pro', 'annual')).toBe('asoria_pro_annual');
    expect(getProductId('architect', 'monthly')).toBe('asoria_architect_monthly');
    expect(getProductId('architect', 'annual')).toBe('asoria_architect_annual');
  });

  it('maps each paid tier to its entitlement id', () => {
    expect(getEntitlementId('creator')).toBe('creator');
    expect(getEntitlementId('pro')).toBe('pro');
    expect(getEntitlementId('architect')).toBe('architect');
  });

  it('resolves the highest active entitlement to a tier', () => {
    expect(entitlementToTier(['creator'])).toBe('creator');
    expect(entitlementToTier(['creator', 'pro'])).toBe('pro');
    expect(entitlementToTier(['architect', 'creator'])).toBe('architect');
  });

  it('falls back to starter when no paid entitlement is active', () => {
    expect(entitlementToTier([])).toBe('starter');
    expect(entitlementToTier(['unknown_entitlement'])).toBe('starter');
  });

  it('exposes the three paid entitlement ids', () => {
    expect(RC_ENTITLEMENTS).toEqual(['creator', 'pro', 'architect']);
  });
});
