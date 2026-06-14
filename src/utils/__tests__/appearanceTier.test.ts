// src/utils/__tests__/appearanceTier.test.ts
import { describe, it, expect } from 'vitest';
import { isFeatureAllowed, getUpgradeTier } from '../tierLimits';

describe('appearanceCustomization tier flag', () => {
  it('is blocked for starter', () => {
    expect(isFeatureAllowed('starter', 'appearanceCustomization')).toBe(false);
  });
  it('is allowed for creator, pro, architect', () => {
    expect(isFeatureAllowed('creator', 'appearanceCustomization')).toBe(true);
    expect(isFeatureAllowed('pro', 'appearanceCustomization')).toBe(true);
    expect(isFeatureAllowed('architect', 'appearanceCustomization')).toBe(true);
  });
  it('upgrade target is creator', () => {
    expect(getUpgradeTier('appearanceCustomization')).toBe('creator');
  });
});
