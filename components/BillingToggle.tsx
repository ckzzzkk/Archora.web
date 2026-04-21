'use client';

import type { BillingInterval } from '@/lib/pricing';

interface BillingToggleProps {
  interval: BillingInterval;
  onChange: (interval: BillingInterval) => void;
}

export default function BillingToggle({ interval, onChange }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span
        className={`text-sm font-body transition-colors ${
          interval === 'monthly' ? 'text-text' : 'text-text-dim'
        }`}
      >
        Monthly
      </span>

      <button
        onClick={() => onChange(interval === 'monthly' ? 'annual' : 'monthly')}
        className="relative w-16 h-8 rounded-button bg-surface-top border border-glass-border transition-colors"
        aria-label="Toggle billing interval"
      >
        <span
          className={`absolute top-1 w-6 h-6 rounded-full bg-primary transition-all duration-300 ${
            interval === 'annual' ? 'left-[calc(100%-28px)]' : 'left-1'
          }`}
        />
      </button>

      <span
        className={`text-sm font-body transition-colors ${
          interval === 'annual' ? 'text-text' : 'text-text-dim'
        }`}
      >
        Annual
      </span>

      <span className="text-xs font-body font-semibold text-accent bg-accent/10 px-3 py-1 rounded-button border border-accent/20">
        Save 20%
      </span>
    </div>
  );
}
