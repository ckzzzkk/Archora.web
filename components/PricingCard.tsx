'use client';

import type { Tier, BillingInterval } from '@/lib/pricing';
import { PRICING, TIER_PERKS } from '@/lib/pricing';

interface PricingCardProps {
  tier: Tier;
  interval: BillingInterval;
  isLoading?: boolean;
  onSubscribe: (tier: Tier) => void;
}

export default function PricingCard({ tier, interval, isLoading, onSubscribe }: PricingCardProps) {
  const data = PRICING[tier];
  const perks = TIER_PERKS[tier];
  const price = interval === 'monthly' ? data.monthly : data.annual;
  const isStarter = tier === 'starter';
  const isMostPopular = data.badge === 'Most Popular';

  return (
    <div
      className={`relative border border-sketch rounded-card bg-surface p-8 flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group ${
        isMostPopular ? 'ring-2 ring-primary' : ''
      }`}
      style={{
        ['--tier-color' as string]: data.color,
      }}
    >
      {/* Badge */}
      {data.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-background text-xs font-body font-semibold px-4 py-1.5 rounded-button whitespace-nowrap">
            {data.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3
          className="font-heading text-2xl mb-1"
          style={{ color: data.color }}
        >
          {data.label}
        </h3>
        <p className="text-text-dim text-sm font-body">
          {data.description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-8">
        {isStarter ? (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-mono font-bold text-text">Free</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-text-dim text-lg font-body">$</span>
            <span className="text-4xl font-mono font-bold text-text">
              {price.toFixed(2)}
            </span>
            <span className="text-text-dim text-sm font-body">/month</span>
          </div>
        )}
        {!isStarter && interval === 'annual' && (
          <p className="text-text-dim text-xs font-body mt-1">
            ${data.annualTotal.toFixed(2)} billed annually
          </p>
        )}
      </div>

      {/* Perks */}
      <ul className="space-y-3 mb-8 flex-1">
        {perks.map((perk) => (
          <li key={perk} className="flex items-start gap-3 text-sm font-body text-text-secondary">
            <svg
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              style={{ color: data.color }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {perk}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={() => onSubscribe(tier)}
        disabled={isLoading}
        className={`w-full py-3.5 rounded-button font-body font-semibold text-sm transition-all duration-300 disabled:opacity-60 ${
          isStarter
            ? 'bg-surface text-text-secondary hover:bg-elevated hover:text-text border border-border'
            : isMostPopular
              ? 'bg-primary text-background hover:bg-accent'
              : 'bg-elevated text-text hover:bg-primary hover:text-background border border-border hover:border-primary'
        }`}
      >
        {isLoading ? 'Loading...' : isStarter ? 'Download App' : 'Subscribe'}
      </button>
    </div>
  );
}
