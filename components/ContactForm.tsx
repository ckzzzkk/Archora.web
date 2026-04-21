'use client';

import { useState, type FormEvent } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/contact-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error((err as { error?: string }).error ?? 'Failed to send message');
      }

      setStatus('success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'success') {
    return (
      <div className="glass rounded-card p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-heading text-2xl text-text mb-3">Message Sent</h3>
        <p className="text-text-secondary font-body">
          Thank you for reaching out. We typically respond within 24 hours.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 text-primary text-sm font-body hover:text-accent transition-colors"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-card p-8 md:p-12 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-body text-text-secondary mb-2">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface border border-glass-border rounded-input px-5 py-3 text-text font-body text-sm placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
            placeholder="Your name"
          />
        </div>
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
            className="w-full bg-surface border border-glass-border rounded-input px-5 py-3 text-text font-body text-sm placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-body text-text-secondary mb-2">
          Subject
        </label>
        <input
          id="subject"
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full bg-surface border border-glass-border rounded-input px-5 py-3 text-text font-body text-sm placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
          placeholder="What is this about?"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-body text-text-secondary mb-2">
          Message
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-surface border border-glass-border rounded-card px-5 py-4 text-text font-body text-sm placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors resize-none"
          placeholder="Tell us how we can help..."
        />
      </div>

      {status === 'error' && (
        <div className="bg-error/10 border border-error/20 rounded-card px-5 py-3">
          <p className="text-error text-sm font-body">{errorMsg}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full md:w-auto bg-primary text-background font-body font-semibold text-sm px-10 py-3.5 rounded-button hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'sending' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
