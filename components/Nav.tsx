'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Mark from './Mark';
import { createClient } from '@/lib/supabase-browser';

const NAV_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
];

/** A floating plate, like the app's tab bar: rounded-rect (not a pill), ink shadow, hairline rule. */
export default function Nav() {
  const [open, setOpen] = useState(false);
  const [raised, setRaised] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [signedIn, setSignedIn] = useState(false);

  // Same sign-in as the app: show Account instead of Log in when there is a session.
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const supabase = createClient();
      void supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
      const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      /* no Supabase config (preview without env): stay on Log in */
    }
    return unsubscribe;
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setRaised(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6">
      <nav
        aria-label="Main"
        className={`mx-auto max-w-6xl rounded-xl border border-rule/70 bg-sheet/90 backdrop-blur-md transition-shadow duration-200 ${
          raised || open ? 'sh2' : 'sh1'
        }`}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 text-ink" aria-label="ASORIA home">
            <Mark size={30} />
            <span className="font-display text-[1.35rem] leading-none">ASORIA</span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active(l.href) ? 'page' : undefined}
                  className={`relative rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${
                    active(l.href) ? 'text-structure-ink' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  {l.label}
                  {active(l.href) && (
                    <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-structure" />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 md:flex">
            <Link href={signedIn ? '/account' : '/login'} className="btn btn-quiet btn-small">
              {signedIn ? 'Account' : 'Log in'}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="flex h-11 w-11 items-center justify-center rounded-md text-ink md:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
              <path
                d={open ? 'M5 5 L17 17 M17 5 L5 17' : 'M3 7 H19 M3 15 H19'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden md:hidden"
            >
              <ul className="flex flex-col gap-1 border-t border-rule/70 px-3 py-3">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={active(l.href) ? 'page' : undefined}
                      className={`block rounded-md px-3 py-3 text-base font-medium ${
                        active(l.href) ? 'bg-structure/10 text-structure-ink' : 'text-ink'
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link href={signedIn ? '/account' : '/login'} className="btn btn-quiet w-full">
                    {signedIn ? 'Account' : 'Log in'}
                  </Link>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
