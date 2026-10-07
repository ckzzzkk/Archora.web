'use client';

import { maxAnnualSavingPercent, type BillingInterval } from '@/lib/pricing';

interface BillingToggleProps {
  interval: BillingInterval;
  onChange: (interval: BillingInterval) => void;
}

const OPTIONS: Array<{ value: BillingInterval; label: string }> = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Yearly' },
];

/** A segmented control. The chosen segment is ultramarine: selection says what a thing IS, not what you are doing. */
export default function BillingToggle({ interval, onChange }: BillingToggleProps) {
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-lg border border-rule bg-sheet-raised p-1">
        {OPTIONS.map((o) => {
          const on = interval === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={`min-h-[44px] rounded-md px-6 text-sm font-semibold transition-colors ${
                on ? 'bg-structure text-structure-on' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-ink-2">Pay yearly and save up to {maxAnnualSavingPercent()}%</p>
    </div>
  );
}
