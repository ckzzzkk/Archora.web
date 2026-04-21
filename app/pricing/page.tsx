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

      {/* Download the App banner */}
      <section className="py-16 px-6 bg-surface border-y border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl text-text mb-4">
            New to ASORIA?
          </h2>
          <p className="text-text-secondary font-body text-lg mb-8">
            Download the ASORIA app to create your account and start designing.
            Subscriptions purchased here sync instantly with the app.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://apps.apple.com/app/asoria/id1666677001"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-background font-body font-semibold px-8 py-4 rounded-button text-sm hover:bg-accent transition-colors btn-sketch inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=app.asoria.app"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-sketch bg-surface font-body font-semibold px-8 py-4 rounded-button text-sm hover:bg-elevated transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.634z"/></svg>
              Google Play
            </a>
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
