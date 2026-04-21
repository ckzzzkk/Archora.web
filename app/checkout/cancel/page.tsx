import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Checkout Cancelled',
  description: 'Your checkout was cancelled. No charges were made.',
};

export default function CheckoutCancelPage() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-lg mx-auto text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-accent/20 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="font-heading text-3xl md:text-4xl text-text mb-4">
          Changed your mind?
        </h1>
        <p className="text-text-secondary font-body text-lg leading-relaxed mb-10">
          No worries — your account has not been charged. You can come back
          and subscribe any time you are ready.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/pricing"
            className="bg-primary text-background font-body font-semibold px-8 py-4 rounded-button text-sm hover:bg-accent transition-colors inline-block"
          >
            Return to Pricing
          </Link>
          <a
            href="asoria://home"
            className="border border-sketch bg-surface font-body font-medium text-text px-8 py-4 rounded-button text-sm hover:bg-elevated transition-colors inline-block"
          >
            Open App
          </a>
        </div>
      </div>
    </section>
  );
}
