'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/account';

  const supabase = createClient();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-sketch rounded-card bg-surface p-8 md:p-12 w-full max-w-md mx-auto">
      <h2 className="font-heading text-2xl text-text text-center mb-2">
        Sign in
      </h2>
      <p className="text-text-dim text-sm font-body text-center mb-8">
        Sign in with your ASORIA account to manage your subscription.
        <br />
        <span className="text-xs">Don&apos;t have an account? Download the ASORIA app to get started.</span>
      </p>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-text-dim text-xs font-body">sign in</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-body text-text-secondary mb-2">
            Email
          </label>
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

        <div>
          <label htmlFor="password" className="block text-sm font-body text-text-secondary mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface border border-border rounded-input px-5 py-3 text-text font-body text-sm placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
            placeholder="Your password"
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
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-text-dim text-xs font-body mt-6">
        New to ASORIA?{' '}
        <a
          href="https://asoria.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-accent transition-colors"
        >
          Download the app
        </a>{' '}
        to create an account.
      </p>
    </div>
  );
}
