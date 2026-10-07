import { PRICING, type Tier } from './pricing';

/** What a yearly plan works out to per month, in whole cents (393.90 / 12 = 32.825 exactly: floats would round it down). */
export function monthlyEquivalentFor(tier: Tier): number {
  return Math.round(Math.round(PRICING[tier].annualTotal * 100) / 12) / 100;
}
