'use client';

import { useState } from 'react';

const FAQ_ITEMS = [
  {
    question: 'Can I change plans?',
    answer:
      'Yes, you can upgrade or downgrade your plan at any time. When upgrading, you get immediate access to the new features. When downgrading, you keep your current tier until the end of the billing period.',
  },
  {
    question: 'Do I lose my designs if I downgrade?',
    answer:
      'No, your designs are never deleted. If you downgrade, all your existing projects remain intact. However, some features may become locked until you upgrade again, and you will not be able to create new projects beyond your tier limit.',
  },
  {
    question: 'How does billing work?',
    answer:
      'All payments are processed securely through Stripe. You can pay monthly or annually (with a 20% discount). Your subscription automatically renews at the end of each billing cycle. You can manage your payment methods and view invoices at any time from your account page.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Absolutely. You can cancel your subscription at any time from your account page. After cancellation, you will retain access to your paid features until the end of your current billing period. Your designs remain accessible and exportable for 30 days after that.',
  },
  {
    question: "Why can't I pay in the app?",
    answer:
      'We process all subscriptions through our website to avoid app store commission fees of up to 30%. This allows us to keep prices lower and invest more in building features you love. Your subscription syncs automatically with the app the moment you subscribe.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="glass rounded-card overflow-hidden transition-all duration-300"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <span className="font-body font-medium text-text pr-4">
                {item.question}
              </span>
              <svg
                className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              className={`transition-all duration-300 ${
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              } overflow-hidden`}
            >
              <p className="px-6 pb-6 text-text-secondary text-sm font-body leading-relaxed">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
