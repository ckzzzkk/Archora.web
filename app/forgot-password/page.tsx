'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    // The email link returns to /auth/callback, which signs the recovery session in and continues to /reset-password.
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent('/reset-password')}`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    // Same message whether or not the address has an account (no account enumeration).
    setSent(true);
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-6 py-20">
      <div className="border border-sketch rounded-card bg-surface p-8 md:p-12 w-full max-w-md mx-auto">
        <h1 className="font-heading text-2xl text-text text-center mb-2">Reset your password</h1>
        {sent ? (
          <p className="text-text-secondary text-sm font-body text-center leading-relaxed">
            If an account exists for {email.trim()}, a reset link is on its way. It works for a short time, so check your inbox soon.
          </p>
        ) : (
          <>
            <p className="text-text-dim text-sm font-body text-center mb-8">
              Enter the email you use for ASORIA. It is the same account as in the app.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-body text-text-secondary mb-2">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-border rounded-input px-5 py-3 text-text font-body text-sm placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              {error && (
                <div className="bg-error/10 border border-error/20 rounded-card px-5 py-3">
                  <p className="text-error text-sm font-body">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-background font-body font-semibold text-sm py-3.5 rounded-button hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
        <p className="text-center text-text-dim text-xs font-body mt-6">
          <Link href="/login" className="text-primary hover:text-accent transition-colors">Back to sign in</Link>
        </p>
      </div>
    </section>
  );
}
