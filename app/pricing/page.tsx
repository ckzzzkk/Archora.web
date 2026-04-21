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
  STRIPE_PRICE_IDS,
  FEATURE_COMPARISON,
} from '@/lib/pricing';
import { createCheckout } from '@/lib/stripe';
import { createClient } from '@/lib/supabase-browser';

const TIERS: Tier[] = ['starter', 'creator', 'pro', 'architect'];

export default function PricingPage() {
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [loading, setLoading] = useState<Tier | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const router = useRouter();

  async function handleSubscribe(tier: Tier) {
    if (tier === 'starter') {
      // Download app — for now, redirect to homepage
      window.open('https://asoria.app', '_blank');
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

      const priceKey = `${tier}_${interval}`;
      const priceId = STRIPE_PRICE_IDS[priceKey];

      if (!priceId) {
        alert('This plan is not available yet. Please try again later.');
        return;
      }

      const url = await createCheckout(priceId);
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      {/* Header */}
      <section className="pt-16 pb-8 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-primary font-heading text-sm tracking-widest uppercase mb-4">
            Pricing
          </p>
          <h1 className="font-heading text-4xl md:text-5xl text-text mb-6">
            Choose your plan
          </h1>
          <p className="text-text-secondary font-body text-lg leading-relaxed mb-10">
            Start free, upgrade when you are ready. All paid plans include a 7-day free trial.
          </p>
          <BillingToggle interval={interval} onChange={setInterval} />
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="w-full flex items-center justify-center gap-3 text-text-secondary font-body text-sm hover:text-text transition-colors mb-8"
          >
            <span>{showComparison ? 'Hide' : 'Show'} full feature comparison</span>
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${showComparison ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            className={`transition-all duration-500 overflow-hidden ${
              showComparison ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="border border-sketch rounded-card bg-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-text-secondary font-medium">Feature</th>
                      {TIERS.map((tier) => (
                        <th
                          key={tier}
                          className="p-4 text-center font-medium"
                          style={{ color: PRICING[tier].color }}
                        >
                          {PRICING[tier].label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURE_COMPARISON.map((row, i) => (
                      <tr
                        key={row.label}
                        className={`border-b border-border/50 ${
                          i % 2 === 0 ? 'bg-surface/30' : ''
                        }`}
                      >
                        <td className="p-4 text-text-secondary">{row.label}</td>
                        <td className="p-4 text-center text-text-dim">{row.starter}</td>
                        <td className="p-4 text-center text-text-secondary">{row.creator}</td>
                        <td className="p-4 text-center text-text-secondary">{row.pro}</td>
                        <td className="p-4 text-center text-accent">{row.architect}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="font-heading text-3xl text-text mb-4">
            Frequently asked questions
          </h2>
          <p className="text-text-secondary font-body">
            Everything you need to know about ASORIA subscriptions.
          </p>
        </div>
        <FAQ />
      </section>
    </>
  );
}
