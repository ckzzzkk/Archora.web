import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Subscription Activated',
  description: 'Your ASORIA subscription is now active.',
};

export default function CheckoutSuccessPage() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-lg mx-auto text-center">
        {/* Animated checkmark */}
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-success/20 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        <h1 className="font-heading text-3xl md:text-4xl text-text mb-4">
          Welcome aboard!
        </h1>
        <p className="text-text-secondary font-body text-lg leading-relaxed mb-10">
          Your subscription is now active. Open the ASORIA app to start using
          your new features — everything syncs automatically.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="asoria://subscription-success"
            className="bg-primary text-background font-body font-semibold px-8 py-4 rounded-button text-sm hover:bg-accent transition-colors inline-block"
          >
            Open App
          </a>
          <Link
            href="/account"
            className="glass font-body font-medium text-text px-8 py-4 rounded-button text-sm hover:bg-glass-prominent transition-colors inline-block"
          >
            Go to Account
          </Link>
        </div>

        <p className="text-text-dim text-xs font-body mt-8">
          If the app does not open, make sure ASORIA is installed on your device.
        </p>
      </div>
    </section>
  );
}
