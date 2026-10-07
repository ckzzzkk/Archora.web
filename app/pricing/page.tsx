'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PricingCard from '@/components/PricingCard';
import BillingToggle from '@/components/BillingToggle';
import FAQ from '@/components/FAQ';
import {
  type Tier,
  type BillingInterval,
  PRICING,
  FEATURE_COMPARISON,
} from '@/lib/pricing';
import { CheckoutError, createCheckout, getPortalUrl } from '@/lib/stripe';
import { createClient } from '@/lib/supabase-browser';

const TIERS: Tier[] = ['starter', 'creator', 'pro', 'architect'];

export default function PricingPage() {
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [loading, setLoading] = useState<Tier | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const router = useRouter();

  async function handleSubscribe(tier: Tier) {
    if (tier === 'starter') {
      window.open('https://apps.apple.com/app/asoria/id1666677001', '_blank');
      return;
    }

    setLoading(tier);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/login?redirect=/pricing`);
        return;
      }

      // The server maps a plan name to its Stripe price, so the site holds no price ids.
      const url = await createCheckout(`${tier}_${interval}`);
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      if (err instanceof CheckoutError && err.code === 'ALREADY_SUBSCRIBED') {
        // Already on a paid plan: change it in the billing portal instead of buying a second subscription.
        if (window.confirm(`${err.message}\n\nOpen billing now?`)) {
          try { window.location.href = await getPortalUrl(); return; } catch { /* fall through to the generic message */ }
        }
        return;
      }
      if (err instanceof CheckoutError && err.code === 'STORE_SUBSCRIPTION_ACTIVE') {
        alert(err.message);
        return;
      }
      alert(err instanceof CheckoutError && err.message ? err.message : 'Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      {/* Header */}
      <section className="mx-auto max-w-6xl px-6 pb-8 pt-10 md:pt-16">
        <h1 className="font-display max-w-3xl text-5xl sm:text-6xl">Pick the plan that fits how you draw.</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
          Start free and upgrade when you are ready. Cancel any time from your account.
        </p>
        <div className="mt-8 md:flex md:justify-start">
          <BillingToggle interval={interval} onChange={setInterval} />
        </div>
      </section>

      {/* Pricing cards */}
      <section className="px-6 py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <PricingCard
              key={tier}
              tier={tier}
              interval={interval}
              isLoading={loading === tier}
              onSubscribe={handleSubscribe}
            />
          ))}
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => setShowComparison(!showComparison)}
            aria-expanded={showComparison}
            aria-controls="comparison"
            className="btn btn-quiet"
          >
            {showComparison ? 'Hide' : 'Show'} the full comparison
          </button>

          <div id="comparison" hidden={!showComparison} className="mt-8">
            <div className="overflow-hidden rounded-2xl border border-rule bg-sheet sh1">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <caption className="sr-only">What each plan includes</caption>
                  <thead>
                    <tr className="border-b border-rule bg-sheet-raised">
                      <th scope="col" className="p-4 text-left font-semibold text-ink-2">Feature</th>
                      {TIERS.map((tier) => (
                        <th key={tier} scope="col" className="p-4 text-center font-display text-base">
                          {PRICING[tier].label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURE_COMPARISON.map((row) => (
                      <tr key={row.label} className="border-b border-rule-soft last:border-0">
                        <th scope="row" className="p-4 text-left font-normal text-ink-2">{row.label}</th>
                        <td className="num p-4 text-center text-ink-3">{row.starter}</td>
                        <td className="num p-4 text-center text-ink">{row.creator}</td>
                        <td className="num p-4 text-center text-ink">{row.pro}</td>
                        <td className="num p-4 text-center text-ink">{row.architect}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New to ASORIA */}
      <section className="border-y border-rule bg-paper-deep/60 px-6 py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl">New to ASORIA?</h2>
            <p className="mt-3 max-w-lg text-lg leading-relaxed text-ink-2">
              Create your account in the app. The same email and password (or Google sign-in) works here, and a plan you buy on
              the web shows up in the app.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 md:justify-end">
            <a href="https://apps.apple.com/app/asoria/id1666677001" target="_blank" rel="noopener noreferrer" className="btn btn-quiet">
              App Store
            </a>
            <a href="https://play.google.com/store/apps/details?id=app.asoria.app" target="_blank" rel="noopener noreferrer" className="btn btn-quiet">
              Google Play
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20">
        <div className="mx-auto mb-10 max-w-3xl">
          <h2 className="font-display text-3xl sm:text-4xl">Questions about plans</h2>
        </div>
        <FAQ />
      </section>
    </>
  );
}
