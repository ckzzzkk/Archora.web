'use client';

import type { Tier, BillingInterval } from '@/lib/pricing';
import { PRICING, TIER_PERKS } from '@/lib/pricing';
import { monthlyEquivalentFor } from '@/lib/price-format';

interface PricingCardProps {
  tier: Tier;
  interval: BillingInterval;
  isLoading?: boolean;
  onSubscribe: (tier: Tier) => void;
}

/**
 * One plan. The featured plan carries the page's single magenta button, like the app's subscription screen; every
 * other plan is quiet. Selection and emphasis are ultramarine (what a thing IS), never magenta.
 */
export default function PricingCard({ tier, interval, isLoading, onSubscribe }: PricingCardProps) {
  const data = PRICING[tier];
  const perks = TIER_PERKS[tier];
  const isStarter = tier === 'starter';
  const featured = data.badge === 'Most Popular';
  const perMonth = interval === 'monthly' ? data.monthly : monthlyEquivalentFor(tier);

  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-sheet p-7 ${
        featured ? 'border-2 border-structure sh2' : 'border-rule sh1'
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-6 rounded-sm bg-structure px-3 py-1 text-xs font-semibold text-structure-on">
          Most popular
        </span>
      )}

      <h2 className="font-display text-2xl">{data.label}</h2>
      <p className="mt-2 min-h-[6.75rem] text-sm leading-relaxed text-ink-2">{data.description}</p>

      <div className="mt-6">
        {isStarter ? (
          <p className="num text-4xl font-semibold">Free</p>
        ) : (
          <>
            <p className="flex items-baseline gap-1.5">
              <span className="num text-4xl font-semibold">${perMonth.toFixed(2)}</span>
              <span className="text-sm text-ink-3">a month</span>
            </p>
            <p className="num mt-1 h-5 text-sm text-ink-2">
              {interval === 'annual' ? `$${data.annualTotal.toFixed(2)} billed yearly` : ''}
            </p>
          </>
        )}
      </div>

      <ul className="mb-8 mt-6 flex-1 space-y-3">
        {perks.map((perk) => (
          <li key={perk} className="flex items-start gap-3 text-sm text-ink-2">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-structure-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {perk}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onSubscribe(tier)}
        disabled={isLoading}
        aria-disabled={isLoading}
        className={`btn w-full ${featured ? 'btn-action' : 'btn-quiet'}`}
      >
        {isLoading ? 'Opening checkout...' : isStarter ? 'Get the app' : `Choose ${data.label}`}
      </button>
    </article>
  );
}
