import Link from 'next/link';
import { PRICING, maxAnnualSavingPercent, type Tier } from '@/lib/pricing';

/** Plain statements of what each plan adds, taken from the app's limits (src/utils/tierLimits.ts in the app repo). */
const HIGHLIGHTS: Record<'creator' | 'pro' | 'architect', string[]> = {
  creator: ['40 AI designs a month', 'All 16 design styles', 'AR room scan and furniture placement'],
  pro: ['100 designs and 80 edits a month', 'AR measure, CAD export and cost estimator', 'Custom textures and voice input'],
  architect: ['300 designs and 300 edits a month', 'AI custom furniture from a photo or a prompt', 'Co-design with up to 5 collaborators'],
};

const SHOWN: Tier[] = ['creator', 'pro', 'architect'];

export default function PricingTeaser() {
  return (
    <section aria-labelledby="pricing-title" className="border-y border-rule bg-paper-deep/60">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 id="pricing-title" className="font-display max-w-xl text-3xl sm:text-4xl md:text-5xl">
            Start free. Pay when you need more.
          </h2>
          <p className="max-w-xs text-ink-2">Pay yearly and save up to {maxAnnualSavingPercent()}%. Cancel any time from your account.</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {SHOWN.map((t) => {
            const p = PRICING[t];
            return (
              <article key={t} className="flex flex-col rounded-xl border border-rule bg-sheet p-7 sh1">
                <h3 className="font-display text-2xl">{p.label}</h3>
                <p className="mt-4 flex items-baseline gap-1.5">
                  <span className="num text-4xl font-semibold">${p.monthly.toFixed(2)}</span>
                  <span className="text-sm text-ink-3">a month</span>
                </p>
                <p className="num mt-1 text-sm text-ink-2">${p.annualTotal.toFixed(2)} a year</p>
                <ul className="mt-5 space-y-2 text-sm text-ink-2">
                  {HIGHLIGHTS[t as 'creator' | 'pro' | 'architect'].map((line) => (
                    <li key={line} className="flex gap-2.5">
                      <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-structure" />
                      {line}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <p className="mt-8 text-ink-2">
          Starter is free: one project, manual design, community access.{' '}
          <Link href="/pricing" className="font-semibold text-structure-ink underline decoration-structure/40 underline-offset-4 hover:decoration-structure">
            Compare every plan
          </Link>
        </p>
      </div>
    </section>
  );
}
