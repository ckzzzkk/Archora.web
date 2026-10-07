'use client';

import { useState } from 'react';
import { maxAnnualSavingPercent } from '@/lib/pricing';

const FAQ_ITEMS = [
  {
    question: 'Can I change plans?',
    answer:
      'Yes. Change your plan any time from your account page. An upgrade takes effect straight away and you pay the prorated difference. A downgrade takes effect at the end of your current billing period.',
  },
  {
    question: 'Do I lose my designs if I downgrade?',
    answer:
      'No, your designs are never deleted. If you downgrade, all your existing projects remain intact. However, some features may become locked until you upgrade again, and you will not be able to create new projects beyond your tier limit.',
  },
  {
    question: 'How does billing work?',
    answer:
      `All payments are processed securely through Stripe. You can pay monthly or annually (with up to ${maxAnnualSavingPercent()}% off). Your subscription automatically renews at the end of each billing cycle. You can manage your payment methods and view invoices at any time from your account page.`,
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Absolutely. You can cancel your subscription at any time from your account page. Your plan stays active until the end of the period you have paid for, then your account returns to Starter.',
  },
  {
    question: 'Should I subscribe in the app or here?',
    answer:
      'Either works, and it is the same account. A plan bought on the web shows up in the app the next time you open it. If you already subscribe through the App Store or Google Play, change or cancel it there, and if you subscribed here, manage it from your account page, so you are never billed twice.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        const panelId = `faq-panel-${i}`;
        return (
          <div key={i} className="overflow-hidden rounded-xl border border-rule bg-sheet">
            <h3>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
              >
                <span className="font-semibold text-ink">{item.question}</span>
                <svg
                  className={`h-5 w-5 shrink-0 text-structure-ink transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </h3>
            <div id={panelId} role="region" hidden={!isOpen}>
              <p className="px-5 pb-5 text-sm leading-relaxed text-ink-2">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
