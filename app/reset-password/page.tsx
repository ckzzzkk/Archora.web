'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

const MIN_LENGTH = 6; // matches the project's password_min_length

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // /auth/callback exchanged the emailed code for a (recovery) session before sending the user here.
  useEffect(() => {
    void createClient().auth.getSession().then(({ data }) => setHasSession(Boolean(data.session)));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters.`);
    if (password !== confirm) return setError('The two passwords do not match.');
    setLoading(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (updateError) return setError(updateError.message);
    router.push('/account');
    router.refresh();
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-6 py-20">
      <div className="border border-rule rounded-card bg-surface p-8 md:p-12 w-full max-w-md mx-auto">
        <h1 className="font-heading text-2xl text-text text-center mb-2">Choose a new password</h1>
        {hasSession === false ? (
          <p className="text-text-secondary text-sm font-body text-center leading-relaxed">
            This reset link has expired or was already used.{' '}
            <Link href="/forgot-password" className="text-primary hover:text-accent transition-colors">Send a new one</Link>.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 mt-8">
            <div>
              <label htmlFor="password" className="field-label">New password</label>
              <input
                id="password"
                type="password"
                required
                minLength={MIN_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="field-label">Confirm password</label>
              <input
                id="confirm"
                type="password"
                required
                minLength={MIN_LENGTH}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="field"
              />
            </div>
            {error && (
              <div className="bg-error/10 border border-error/20 rounded-card px-5 py-3">
                <p className="text-error-ink text-sm font-body">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || hasSession === null}
              className="btn btn-action w-full"
            >
              {loading ? 'Saving...' : 'Save password'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
