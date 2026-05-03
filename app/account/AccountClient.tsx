'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { getPortalUrl, syncSubscription } from '@/lib/stripe';
import { PRICING, type Tier } from '@/lib/pricing';

interface AccountClientProps {
  email: string;
  displayName: string;
  tier: string;
}

export default function AccountClient({ email, displayName, tier: initialTier }: AccountClientProps) {
  const [loading, setLoading] = useState(false);
  const [tier, setTier] = useState(initialTier);
  const router = useRouter();
  const tierData = PRICING[tier as Tier] ?? PRICING.starter;
  const isStarter = tier === 'starter';

  // Sync subscription tier on mount (in case user just returned from Stripe checkout)
  useEffect(() => {
    syncSubscription()
      .then(({ tier: syncedTier }) => {
        if (syncedTier && syncedTier !== tier) {
          setTier(syncedTier);
        }
      })
      .catch(console.error);
  }, []);

  async function handleManageSubscription() {
    setLoading(true);
    try {
      const url = await getPortalUrl();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <section className="min-h-[80vh] py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-3xl md:text-4xl text-text mb-2">Account</h1>
        <p className="text-text-secondary font-body mb-12">
          Manage your ASORIA subscription and settings.
        </p>

        {/* Profile card */}
        <div className="border border-sketch rounded-card bg-surface p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center font-heading text-xl text-background"
              style={{ backgroundColor: tierData.color }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-body font-medium text-text text-lg">{displayName}</p>
              <p className="font-body text-sm text-text-dim">{email}</p>
            </div>
          </div>

          {/* Tier badge */}
          <div className="flex items-center gap-3 mb-6">
            <span
              className="px-4 py-1.5 rounded-button text-xs font-body font-semibold"
              style={{
                backgroundColor: `${tierData.color}20`,
                color: tierData.color,
                border: `1px solid ${tierData.color}40`,
              }}
            >
              {tierData.label} Plan
            </span>
            {!isStarter && (
              <span className="text-text-dim text-xs font-body">Active</span>
            )}
          </div>

          <p className="text-text-secondary text-sm font-body">{tierData.description}</p>
        </div>

        {/* Usage placeholder */}
        <div className="border border-sketch rounded-card bg-surface p-8 mb-8">
          <h2 className="font-heading text-xl text-text mb-6">Usage</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-text-dim text-xs font-body mb-1">AI Generations</p>
              <p className="text-text font-mono text-2xl">--</p>
              <p className="text-text-dim text-xs font-body">this month</p>
            </div>
            <div>
              <p className="text-text-dim text-xs font-body mb-1">Projects</p>
              <p className="text-text font-mono text-2xl">--</p>
              <p className="text-text-dim text-xs font-body">active</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {!isStarter ? (
            <button
              onClick={handleManageSubscription}
              disabled={loading}
              className="w-full border border-sketch rounded-card bg-surface p-5 flex items-center justify-between hover:bg-elevated transition-colors disabled:opacity-50 group"
            >
              <div className="text-left">
                <p className="font-body font-medium text-text">Manage Subscription</p>
                <p className="text-text-dim text-sm font-body">Update payment, view invoices, or change plan</p>
              </div>
              <svg className="w-5 h-5 text-text-dim group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <a
              href="/pricing"
              className="w-full border border-sketch rounded-card bg-surface p-5 flex items-center justify-between hover:bg-elevated transition-colors group block"
            >
              <div className="text-left">
                <p className="font-body font-medium text-text">Upgrade Plan</p>
                <p className="text-text-dim text-sm font-body">Unlock more features and higher limits</p>
              </div>
              <svg className="w-5 h-5 text-text-dim group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          )}

          <a
            href="asoria://home"
            className="w-full border border-sketch rounded-card bg-surface p-5 flex items-center justify-between hover:bg-elevated transition-colors group block"
          >
            <div className="text-left">
              <p className="font-body font-medium text-text">Open in App</p>
              <p className="text-text-dim text-sm font-body">Launch ASORIA on your device</p>
            </div>
            <svg className="w-5 h-5 text-text-dim group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>

          <button
            onClick={handleSignOut}
            className="w-full border border-sketch rounded-card bg-surface p-5 flex items-center justify-between hover:bg-error/10 transition-colors group"
          >
            <div className="text-left">
              <p className="font-body font-medium text-text group-hover:text-error transition-colors">Sign Out</p>
              <p className="text-text-dim text-sm font-body">Log out of your account</p>
            </div>
            <svg className="w-5 h-5 text-text-dim group-hover:text-error transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
