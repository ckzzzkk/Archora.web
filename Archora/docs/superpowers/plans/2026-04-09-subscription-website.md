# ASORIA Subscription Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 14 subscription website at `asoria.app` — Stripe checkout, Supabase auth, 3D animations, legal pages, contact form — with Spotify-model app linking (pay on web, app auto-syncs).

**Architecture:** Standalone Next.js 14 App Router site in `/website` directory, sharing the same Supabase project and Stripe account as the mobile app. Website handles all payments; app redirects upgrade buttons to the website. Stripe webhooks (already implemented) sync tier changes back to the app automatically.

**Tech Stack:** Next.js 14 (App Router) · Tailwind CSS 3 · React Three Fiber + Drei · Framer Motion · @supabase/ssr · TypeScript strict

**Spec:** `docs/superpowers/specs/2026-04-09-subscription-website-design.md`

---

## File Structure

```
website/
├── app/
│   ├── layout.tsx              # Root layout: fonts, metadata, Nav, Footer
│   ├── page.tsx                # Homepage
│   ├── pricing/page.tsx        # Tier comparison + subscribe buttons
│   ├── features/page.tsx       # Feature showcase with 3D scenes
│   ├── login/page.tsx          # Supabase auth (email + Google)
│   ├── account/page.tsx        # Protected: manage subscription
│   ├── privacy/page.tsx        # Privacy policy
│   ├── terms/page.tsx          # Terms of service
│   ├── contact/page.tsx        # Contact form
│   ├── checkout/
│   │   ├── success/page.tsx    # Post-payment success
│   │   └── cancel/page.tsx     # Payment cancelled
│   ├── auth/
│   │   └── callback/route.ts   # Supabase OAuth code exchange
│   └── globals.css             # Tailwind base + CSS custom properties
├── components/
│   ├── Nav.tsx                 # Top navigation
│   ├── Footer.tsx              # Site footer
│   ├── PricingCard.tsx         # Tier card
│   ├── BillingToggle.tsx       # Monthly/Annual switch
│   ├── FeatureSection.tsx      # Feature showcase block
│   ├── HeroScene.tsx           # 3D hero (R3F, client-only)
│   ├── GlassCard.tsx           # Glass morphism card
│   ├── ContactForm.tsx         # Contact form
│   ├── AuthForm.tsx            # Login/signup form
│   ├── FAQ.tsx                 # Accordion FAQ
│   └── AnimatedCounter.tsx     # Scroll-triggered counter
├── lib/
│   ├── supabase-server.ts      # createServerClient (cookies)
│   ├── supabase-browser.ts     # createBrowserClient
│   ├── stripe.ts               # Edge function call helpers
│   ├── pricing.ts              # Tier data, prices, feature comparison
│   └── theme.ts                # Theme token constants
├── middleware.ts                # Supabase session refresh (CRITICAL)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local
```

**Existing files modified:**
- `supabase/functions/stripe-checkout/index.ts` — accept `successUrl`/`cancelUrl` params
- `supabase/functions/stripe-portal/index.ts` — accept `returnUrl` param
- `supabase/migrations/026_contact_messages.sql` — new table
- `supabase/functions/contact-form/index.ts` — new edge function
- `src/screens/subscription/SubscriptionScreen.tsx` — redirect to website
- `src/utils/branding.ts` — add website URLs

---

## Phase 1: Project Scaffold + Theme

### Task 1: Initialize Next.js project

**Files:**
- Create: `website/package.json`
- Create: `website/tsconfig.json`
- Create: `website/next.config.js`
- Create: `website/tailwind.config.ts`
- Create: `website/app/globals.css`
- Create: `website/.env.local`

- [ ] **Step 1: Create Next.js app**

```bash
cd /home/chisanga/Archora/Archora
npx create-next-app@14 website --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --no-git
```

- [ ] **Step 2: Install dependencies**

```bash
cd /home/chisanga/Archora/Archora/website
npm install @supabase/ssr @supabase/supabase-js framer-motion @react-three/fiber @react-three/drei three
npm install -D @types/three
```

- [ ] **Step 3: Create `.env.local`**

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://harhahyurvxwnoxugehe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcmhhaHl1cnZ4d25veHVnZWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NDI3NDAsImV4cCI6MjA4NDExODc0MH0.PSoUF-4xDz-2P2zgqyB3d9QQ0K74mI8C6WsNfECf7mA
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SPJhcQBuIRe6zvljDEuCfHMQ38UKFzVfPdDBBNRCYlu61ORrIBFnc87rq5ldnjwiclDHUX7cnZlqXMrckLyE2ls00lR7l9iqC
NEXT_PUBLIC_STRIPE_PRICE_CREATOR_MONTHLY=price_1TCR1wQBuIRe6zvl0zVSzYfy
NEXT_PUBLIC_STRIPE_PRICE_CREATOR_ANNUAL=price_1TCR20QBuIRe6zvlK49f9zNH
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL=
NEXT_PUBLIC_STRIPE_PRICE_ARCHITECT_MONTHLY=price_1TCR24QBuIRe6zvl1FA855j9
NEXT_PUBLIC_STRIPE_PRICE_ARCHITECT_ANNUAL=price_1TCR27QBuIRe6zvlfhCVeJbF
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF
```

- [ ] **Step 4: Configure Tailwind with ASORIA theme**

Write `website/tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#061A1A',
        surface: '#0C2424',
        elevated: '#122E2E',
        'surface-top': '#193535',
        border: 'rgba(201, 255, 253, 0.12)',
        'border-light': 'rgba(201, 255, 253, 0.20)',
        primary: '#C9FFFD',
        'primary-dim': '#8ADEDD',
        'primary-ghost': 'rgba(201, 255, 253, 0.30)',
        accent: '#FFEE8C',
        success: '#7AB87A',
        error: '#FF8C9A',
        rose: '#FF8C9A',
        text: '#FEFFFD',
        'text-secondary': '#8ADEDD',
        'text-dim': '#4A8080',
        'glass-bg': 'rgba(201, 255, 253, 0.06)',
        'glass-border': 'rgba(201, 255, 253, 0.12)',
        'glass-prominent': 'rgba(201, 255, 253, 0.10)',
      },
      borderRadius: {
        card: '24px',
        button: '50px',
        input: '50px',
      },
      fontFamily: {
        heading: ['var(--font-architects-daughter)', 'cursive'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Write `globals.css`**

Replace `website/app/globals.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #061A1A;
  --surface: #0C2424;
  --elevated: #122E2E;
  --primary: #C9FFFD;
  --primary-dim: #8ADEDD;
  --accent: #FFEE8C;
  --text: #FEFFFD;
  --text-secondary: #8ADEDD;
  --text-dim: #4A8080;
  --glass-bg: rgba(201, 255, 253, 0.06);
  --glass-border: rgba(201, 255, 253, 0.12);
}

html {
  background-color: var(--background);
  color: var(--text);
  scroll-behavior: smooth;
}

body {
  min-height: 100vh;
  font-family: var(--font-inter), sans-serif;
  -webkit-font-smoothing: antialiased;
}

::selection {
  background: rgba(201, 255, 253, 0.25);
  color: #FEFFFD;
}

/* Glass card utility */
.glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px);
}

.glass-prominent {
  background: rgba(201, 255, 253, 0.10);
  border: 1px solid rgba(201, 255, 253, 0.20);
  backdrop-filter: blur(16px);
}
```

- [ ] **Step 6: Add `website/` to root `.gitignore` exclusions and commit**

```bash
cd /home/chisanga/Archora/Archora
# Add .env.local to website .gitignore
echo ".env.local" >> website/.gitignore
git add website/
git commit -m "feat(website): scaffold Next.js 14 project with ASORIA Teal Sketch theme"
```

---

### Task 2: Lib modules — theme, pricing, Supabase clients

**Files:**
- Create: `website/lib/theme.ts`
- Create: `website/lib/pricing.ts`
- Create: `website/lib/supabase-server.ts`
- Create: `website/lib/supabase-browser.ts`
- Create: `website/lib/stripe.ts`
- Create: `website/middleware.ts`

- [ ] **Step 1: Write `lib/theme.ts`**

```typescript
export const THEME = {
  colors: {
    background: '#061A1A',
    surface: '#0C2424',
    elevated: '#122E2E',
    primary: '#C9FFFD',
    primaryDim: '#8ADEDD',
    accent: '#FFEE8C',
    success: '#7AB87A',
    error: '#FF8C9A',
    text: '#FEFFFD',
    textSecondary: '#8ADEDD',
    textDim: '#4A8080',
  },
  tierColors: {
    starter: '#4A8080',
    creator: '#C9FFFD',
    pro: '#7AB87A',
    architect: '#FFEE8C',
  },
} as const;
```

- [ ] **Step 2: Write `lib/pricing.ts`**

```typescript
export type Tier = 'starter' | 'creator' | 'pro' | 'architect';
export type BillingInterval = 'monthly' | 'annual';

export const PRICING: Record<Tier, {
  monthly: number;
  annual: number;
  annualTotal: number;
  label: string;
  badge: string | null;
  color: string;
  description: string;
}> = {
  starter: {
    monthly: 0, annual: 0, annualTotal: 0,
    label: 'Starter', badge: null, color: '#4A8080',
    description: 'Get started with AI-powered architecture design',
  },
  creator: {
    monthly: 14.99, annual: 11.99, annualTotal: 143.90,
    label: 'Creator', badge: 'Most Popular', color: '#C9FFFD',
    description: 'Unlock the full creative toolkit',
  },
  pro: {
    monthly: 24.99, annual: 19.99, annualTotal: 239.90,
    label: 'Pro', badge: null, color: '#7AB87A',
    description: 'Professional-grade design and AR tools',
  },
  architect: {
    monthly: 39.99, annual: 31.99, annualTotal: 383.90,
    label: 'Architect', badge: null, color: '#FFEE8C',
    description: 'Unlimited power for serious architects',
  },
};

export const STRIPE_PRICE_IDS: Record<string, string> = {
  creator_monthly:   process.env.NEXT_PUBLIC_STRIPE_PRICE_CREATOR_MONTHLY   ?? '',
  creator_annual:    process.env.NEXT_PUBLIC_STRIPE_PRICE_CREATOR_ANNUAL    ?? '',
  pro_monthly:       process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY       ?? '',
  pro_annual:        process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL        ?? '',
  architect_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ARCHITECT_MONTHLY ?? '',
  architect_annual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_ARCHITECT_ANNUAL  ?? '',
};

export interface FeatureRow {
  label: string;
  starter: string;
  creator: string;
  pro: string;
  architect: string;
}

export const FEATURE_COMPARISON: FeatureRow[] = [
  { label: 'Projects',          starter: '3',         creator: '25',        pro: '50',        architect: 'Unlimited' },
  { label: 'Rooms per project', starter: '4',         creator: '15',        pro: '20',        architect: 'Unlimited' },
  { label: 'AI designs / month',starter: '10',        creator: '200',       pro: '500',       architect: 'Unlimited' },
  { label: 'Design styles',     starter: '3',         creator: 'All 12',    pro: 'All 12',    architect: 'All 12' },
  { label: 'Floors',            starter: '1',         creator: '5',         pro: '10',        architect: 'Unlimited' },
  { label: 'AR modes',          starter: 'None',      creator: 'Placement', pro: 'All modes', architect: 'All modes' },
  { label: 'Auto-save',         starter: 'Manual',    creator: '120s',      pro: '60s',       architect: '30s' },
  { label: 'Daily edit time',   starter: '45 min',    creator: 'Unlimited', pro: 'Unlimited', architect: 'Unlimited' },
  { label: 'Undo steps',        starter: '10',        creator: '50',        pro: '100',       architect: 'Unlimited' },
  { label: 'Community',         starter: 'Read-only', creator: 'Publish',   pro: 'Publish',   architect: 'Publish' },
  { label: 'Template revenue',  starter: '—',         creator: '60%',       pro: '60%',       architect: '80%' },
  { label: 'CAD export',        starter: 'No',        creator: 'No',        pro: 'No',        architect: 'Yes' },
  { label: 'VIP support',       starter: 'No',        creator: 'No',        pro: 'No',        architect: 'Yes' },
];

export const TIER_PERKS: Record<Tier, string[]> = {
  starter: ['3 projects', '10 AI designs/month', '3 design styles', 'Community read-only'],
  creator: ['25 projects', '200 AI designs/month', 'All 12 styles', 'AR furniture placement', 'Auto-save', 'Publish to community'],
  pro: ['50 projects', '500 AI designs/month', 'All AR modes', 'Custom furniture', '60s auto-save', 'AI image references'],
  architect: ['Unlimited everything', 'CAD export', 'Custom AI furniture', 'Team collaboration', '80% template revenue', 'VIP support'],
};
```

- [ ] **Step 3: Write `lib/supabase-server.ts`**

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Component — can't set cookies, middleware handles refresh
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Server Component
          }
        },
      },
    },
  );
}
```

- [ ] **Step 4: Write `lib/supabase-browser.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 5: Write `lib/stripe.ts`**

```typescript
import { createClient } from './supabase-browser';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://asoria.app';

async function callEdgeFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((err as { error?: string }).error ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

export async function createCheckout(priceId: string): Promise<string> {
  const data = await callEdgeFunction<{ url: string }>('stripe-checkout', {
    priceId,
    successUrl: `${SITE_URL}/checkout/success`,
    cancelUrl: `${SITE_URL}/checkout/cancel`,
  });
  return data.url;
}

export async function getPortalUrl(): Promise<string> {
  const data = await callEdgeFunction<{ url: string }>('stripe-portal', {
    returnUrl: `${SITE_URL}/account`,
  });
  return data.url;
}

export async function syncSubscription(): Promise<{ synced: boolean; tier?: string }> {
  return callEdgeFunction('stripe-sync', {});
}
```

- [ ] **Step 6: Write `middleware.ts`**

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  // Refresh the auth session
  await supabase.auth.getUser();

  // Protect /account route
  const { data: { user } } = await supabase.auth.getUser();
  if (request.nextUrl.pathname.startsWith('/account') && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

- [ ] **Step 7: Commit**

```bash
git add website/lib/ website/middleware.ts
git commit -m "feat(website): add Supabase SSR clients, Stripe helpers, pricing data, middleware"
```

---

## Phase 2: Layout + Static Pages

### Task 3: Root layout with Nav and Footer

**Files:**
- Create: `website/components/Nav.tsx`
- Create: `website/components/Footer.tsx`
- Modify: `website/app/layout.tsx`

- [ ] **Step 1: Write `components/Nav.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
];

export function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-glass-border"
         style={{ background: 'rgba(6, 26, 26, 0.90)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-heading text-xl text-primary tracking-widest">
          ASORIA
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href ? 'text-primary' : 'text-text-secondary hover:text-text'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-sm font-medium text-text-secondary hover:text-text transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/pricing"
            className="px-5 py-2 rounded-button bg-primary text-background text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-text p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-glass-border px-6 py-4 space-y-3"
             style={{ background: 'rgba(6, 26, 26, 0.95)' }}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-text-secondary hover:text-text py-2"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/login" className="block text-text-secondary hover:text-text py-2"
                onClick={() => setMenuOpen(false)}>
            Log in
          </Link>
          <Link
            href="/pricing"
            className="block text-center px-5 py-3 rounded-button bg-primary text-background font-semibold mt-2"
            onClick={() => setMenuOpen(false)}
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
```

- [ ] **Step 2: Write `components/Footer.tsx`**

```tsx
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-glass-border bg-surface">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="font-heading text-lg text-primary tracking-widest">ASORIA</span>
            <p className="text-text-dim text-sm mt-2">Describe it. Build it. Walk through it.</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-text-dim">
              <li><Link href="/features" className="hover:text-text transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-text transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-text-dim">
              <li><Link href="/contact" className="hover:text-text transition-colors">Contact</Link></li>
              <li><a href="https://instagram.com/asoria.app" target="_blank" rel="noopener" className="hover:text-text transition-colors">Instagram</a></li>
              <li><a href="https://twitter.com/asoria_app" target="_blank" rel="noopener" className="hover:text-text transition-colors">Twitter</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-text-dim">
              <li><Link href="/privacy" className="hover:text-text transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-text transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-glass-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-dim text-xs">
            &copy; {new Date().getFullYear()} ASORIA by Crokora. All rights reserved.
          </p>
          <a href="mailto:crokora.official@gmail.com" className="text-text-dim text-xs hover:text-text transition-colors">
            crokora.official@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Write `app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { Inter, Architects_Daughter, JetBrains_Mono } from 'next/font/google';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const heading = Architects_Daughter({ weight: '400', subsets: ['latin'], variable: '--font-architects-daughter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

export const metadata: Metadata = {
  title: {
    default: 'ASORIA — AI Architecture Design',
    template: '%s | ASORIA',
  },
  description: 'Design your dream space with AI. Generate floor plans, visualize in 3D, and walk through your creations.',
  metadataBase: new URL('https://asoria.app'),
  openGraph: {
    title: 'ASORIA — AI Architecture Design',
    description: 'Describe it. Build it. Walk through it.',
    url: 'https://asoria.app',
    siteName: 'ASORIA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ASORIA — AI Architecture Design',
    description: 'Describe it. Build it. Walk through it.',
    creator: '@asoria_app',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${heading.variable} ${mono.variable}`}>
      <body className="bg-background text-text font-body antialiased">
        <Nav />
        <main className="pt-16 min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify dev server runs**

```bash
cd /home/chisanga/Archora/Archora/website && npm run dev
# Open http://localhost:3000 — should show Nav + Footer on dark teal background
```

- [ ] **Step 5: Commit**

```bash
git add website/app/layout.tsx website/components/Nav.tsx website/components/Footer.tsx
git commit -m "feat(website): root layout with Nav + Footer — Teal Sketch theme, responsive"
```

---

### Task 4: Homepage

**Files:**
- Create: `website/app/page.tsx`
- Create: `website/components/GlassCard.tsx`
- Create: `website/components/AnimatedCounter.tsx`

- [ ] **Step 1: Write `components/GlassCard.tsx`**

```tsx
import { type ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  prominent?: boolean;
}

export function GlassCard({ children, className = '', prominent }: GlassCardProps) {
  return (
    <div className={`rounded-card ${prominent ? 'glass-prominent' : 'glass'} ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Write `components/AnimatedCounter.tsx`**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

export function AnimatedCounter({ target, suffix = '', prefix = '', duration = 2000 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} className="font-mono text-3xl md:text-4xl font-bold text-primary tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}
```

- [ ] **Step 3: Write `app/page.tsx`**

```tsx
import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { AnimatedCounter } from '@/components/AnimatedCounter';

const FEATURES = [
  {
    icon: '~',
    title: 'AI Floor Plan Generation',
    description: 'Describe your vision to ARIA, our AI architect. She designs structurally sound blueprints in seconds.',
  },
  {
    icon: '^',
    title: 'AR Room Scanning',
    description: 'Point your phone at any room. Capture walls, doors, and windows — import directly into your workspace.',
  },
  {
    icon: '#',
    title: '3D Walkthrough',
    description: 'Step inside your design before it\'s built. Explore every room in immersive first-person view.',
  },
];

const STEPS = [
  { number: '01', title: 'Describe', text: 'Tell ARIA what you want — building type, rooms, style, budget.' },
  { number: '02', title: 'Generate', text: 'AI creates a complete blueprint with walls, doors, furniture, and materials.' },
  { number: '03', title: 'Explore', text: 'Walk through your design in 3D, scan real rooms with AR, and refine every detail.' },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-surface to-background" />
        <div className="absolute inset-0 opacity-30"
             style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(201, 255, 253, 0.08), transparent 70%)' }} />

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <h1 className="font-heading text-5xl md:text-7xl text-primary tracking-wider mb-6">
            Design Your Dream Space With AI
          </h1>
          <p className="text-text-secondary text-lg md:text-xl mb-10 max-w-xl mx-auto">
            Describe it. Build it. Walk through it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="px-8 py-4 rounded-button bg-primary text-background font-semibold text-lg hover:opacity-90 transition-opacity"
            >
              View Plans
            </Link>
            <Link
              href="/features"
              className="px-8 py-4 rounded-button border border-primary-ghost text-primary font-medium text-lg hover:bg-glass-bg transition-colors"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl text-center text-primary mb-14">
          Everything You Need to Design
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <GlassCard key={f.title} className="p-8 hover:border-primary-dim transition-colors group">
              <span className="text-4xl mb-4 block text-accent font-mono">{f.icon}</span>
              <h3 className="font-heading text-xl text-text mb-3">{f.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{f.description}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20 bg-surface">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl text-center text-primary mb-14">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {STEPS.map((s) => (
              <div key={s.number} className="text-center">
                <span className="font-mono text-5xl font-bold text-accent opacity-40">{s.number}</span>
                <h3 className="font-heading text-xl text-text mt-3 mb-2">{s.title}</h3>
                <p className="text-text-secondary text-sm">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          <div>
            <AnimatedCounter target={10000} suffix="+" />
            <p className="text-text-dim text-sm mt-2">Designs Generated</p>
          </div>
          <div>
            <AnimatedCounter target={50000} suffix="+" />
            <p className="text-text-dim text-sm mt-2">Rooms Scanned</p>
          </div>
          <div>
            <AnimatedCounter target={4} suffix=".8" />
            <p className="text-text-dim text-sm mt-2">App Rating</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-surface">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl text-primary mb-6">Ready to Design?</h2>
          <p className="text-text-secondary mb-8">Download ASORIA and start creating your dream space today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="px-8 py-4 rounded-button bg-primary text-background font-semibold hover:opacity-90 transition-opacity"
            >
              View Plans
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add website/app/page.tsx website/components/GlassCard.tsx website/components/AnimatedCounter.tsx
git commit -m "feat(website): homepage — hero, feature cards, how-it-works, stats, CTA"
```

---

### Task 5: Legal pages (Privacy + Terms) and Contact page

**Files:**
- Create: `website/app/privacy/page.tsx`
- Create: `website/app/terms/page.tsx`
- Create: `website/app/contact/page.tsx`
- Create: `website/components/ContactForm.tsx`

- [ ] **Step 1: Write `app/privacy/page.tsx`** — Full privacy policy (see spec for content requirements). Page must include: data controller (Crokora, crokora.official@gmail.com), data collected, third-party services (Supabase, Stripe, Google, Anthropic, OpenAI), storage location, GDPR user rights, cookie policy, children policy, contact.

- [ ] **Step 2: Write `app/terms/page.tsx`** — Full terms of service. Must include: service description, account responsibilities, subscription terms, acceptable use, IP ownership, AI disclaimer, liability limitation, UK law jurisdiction, termination, contact.

- [ ] **Step 3: Write `components/ContactForm.tsx`** — Client component with name, email, subject, message fields. Submits to `contact-form` edge function (built in Phase 5). Shows success/error toast.

- [ ] **Step 4: Write `app/contact/page.tsx`** — Contact form + email + social links.

- [ ] **Step 5: Commit**

```bash
git add website/app/privacy/ website/app/terms/ website/app/contact/ website/components/ContactForm.tsx
git commit -m "feat(website): privacy policy, terms of service, contact page with form"
```

---

### Task 6: Features page

**Files:**
- Create: `website/app/features/page.tsx`
- Create: `website/components/FeatureSection.tsx`

- [ ] **Step 1: Write `components/FeatureSection.tsx`** — Alternating layout (image left / text right, then reversed). Props: title, description, highlights (string[]), reversed (boolean), children (for 3D scene slot).

- [ ] **Step 2: Write `app/features/page.tsx`** — 5 feature sections: AI Generation, Design Studio, AR System, 3D Walkthrough, Community. Each with description and highlights list. 3D scenes added later in Phase 4.

- [ ] **Step 3: Commit**

```bash
git add website/app/features/ website/components/FeatureSection.tsx
git commit -m "feat(website): features page — 5 feature sections with descriptions"
```

---

## Phase 3: Auth + Pricing + Checkout

### Task 7: Login page with Supabase Auth

**Files:**
- Create: `website/app/login/page.tsx`
- Create: `website/components/AuthForm.tsx`
- Create: `website/app/auth/callback/route.ts`

- [ ] **Step 1: Write `app/auth/callback/route.ts`** — OAuth code exchange handler:

```typescript
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') ?? '/account';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(redirect, origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_failed', origin));
}
```

- [ ] **Step 2: Write `components/AuthForm.tsx`** — Client component with:
  - Email/password sign-in form
  - Email/password sign-up form (with display name field)
  - Toggle between sign-in and sign-up
  - "Sign in with Google" button using `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`
  - Error display
  - Redirect to `?redirect=` URL param after success

- [ ] **Step 3: Write `app/login/page.tsx`** — Renders AuthForm with redirect parameter.

- [ ] **Step 4: Commit**

```bash
git add website/app/login/ website/app/auth/ website/components/AuthForm.tsx
git commit -m "feat(website): login page — email/password + Google OAuth, auth callback"
```

---

### Task 8: Pricing page with Stripe checkout

**Files:**
- Create: `website/app/pricing/page.tsx`
- Create: `website/components/PricingCard.tsx`
- Create: `website/components/BillingToggle.tsx`
- Create: `website/components/FAQ.tsx`

- [ ] **Step 1: Write `components/BillingToggle.tsx`** — Monthly/Annual toggle switch with animated indicator. Shows "Save 20%" badge on annual.

- [ ] **Step 2: Write `components/PricingCard.tsx`** — Props: tier, pricing data, billing interval, isCurrentTier, onSubscribe callback. Shows price, perks list, CTA button. Starter shows "Download App", paid tiers show "Subscribe".

- [ ] **Step 3: Write `components/FAQ.tsx`** — Accordion with 5 FAQ items from spec.

- [ ] **Step 4: Write `app/pricing/page.tsx`** — Client component with:
  - BillingToggle state (monthly/annual)
  - 4 PricingCard components in a grid
  - Feature comparison table (from `FEATURE_COMPARISON` in pricing.ts)
  - FAQ section
  - Subscribe handler: check auth → if not, redirect to `/login?redirect=/pricing` → call `createCheckout(priceId)` → redirect to Stripe

- [ ] **Step 5: Commit**

```bash
git add website/app/pricing/ website/components/PricingCard.tsx website/components/BillingToggle.tsx website/components/FAQ.tsx
git commit -m "feat(website): pricing page — tier cards, billing toggle, comparison table, Stripe checkout"
```

---

### Task 9: Checkout success/cancel pages and Account page

**Files:**
- Create: `website/app/checkout/success/page.tsx`
- Create: `website/app/checkout/cancel/page.tsx`
- Create: `website/app/account/page.tsx`

- [ ] **Step 1: Write `app/checkout/success/page.tsx`** — Animated checkmark, "Welcome to [Tier]!" message, "Open App" button (deep link `asoria://subscription-success`), "Go to Account" link.

- [ ] **Step 2: Write `app/checkout/cancel/page.tsx`** — "Changed your mind?" message, "Return to Pricing" button, "Open App" button.

- [ ] **Step 3: Write `app/account/page.tsx`** — Protected page (middleware redirects if not authenticated). Shows: current tier badge, usage stats, "Manage Subscription" button (Stripe portal), "Cancel" option, "Download App" link, sign-out button.

- [ ] **Step 4: Commit**

```bash
git add website/app/checkout/ website/app/account/
git commit -m "feat(website): checkout success/cancel pages, account dashboard"
```

---

## Phase 4: Edge Function Updates

### Task 10: Update stripe-checkout and stripe-portal for web URLs

**Files:**
- Modify: `supabase/functions/stripe-checkout/index.ts`
- Modify: `supabase/functions/stripe-portal/index.ts`

- [ ] **Step 1: Read `stripe-checkout/index.ts` to find the hardcoded URLs**

- [ ] **Step 2: Add `successUrl` and `cancelUrl` to the Zod schema with whitelist validation**

In `stripe-checkout/index.ts`, add to the RequestSchema:
```typescript
const ALLOWED_URL_PREFIXES = ['asoria://', 'https://asoria.app', 'http://localhost:3000'];

const RequestSchema = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().refine(
    (url) => ALLOWED_URL_PREFIXES.some(p => url.startsWith(p)),
    'Invalid success URL',
  ).optional(),
  cancelUrl: z.string().refine(
    (url) => ALLOWED_URL_PREFIXES.some(p => url.startsWith(p)),
    'Invalid cancel URL',
  ).optional(),
});
```

Then use the provided URLs or fall back to deep links:
```typescript
success_url: parsed.data.successUrl ?? 'asoria://subscription-success',
cancel_url: parsed.data.cancelUrl ?? 'asoria://subscription-cancel',
```

- [ ] **Step 3: Same pattern for `stripe-portal/index.ts`** — Add `returnUrl` to request body with whitelist validation, fall back to `'asoria://account'`.

- [ ] **Step 4: Deploy updated functions**

```bash
export SUPABASE_ACCESS_TOKEN=$(cat ~/.supabase/access-token)
/tmp/supabase-v2/supabase functions deploy stripe-checkout --project-ref harhahyurvxwnoxugehe
/tmp/supabase-v2/supabase functions deploy stripe-portal --project-ref harhahyurvxwnoxugehe
```

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/stripe-checkout/ supabase/functions/stripe-portal/
git commit -m "feat: stripe-checkout + stripe-portal accept web redirect URLs (backward-compatible)"
```

---

### Task 11: Contact form edge function + migration

**Files:**
- Create: `supabase/migrations/026_contact_messages.sql`
- Create: `supabase/functions/contact-form/index.ts`

- [ ] **Step 1: Write migration**

```sql
-- 026_contact_messages.sql
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);
-- No RLS — only service_role inserts (edge function), admin reads via dashboard
```

- [ ] **Step 2: Write edge function `contact-form/index.ts`**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

const RequestSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  subject: z.string().min(1).max(500),
  message: z.string().min(1).max(5000),
});

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') return Errors.notFound();

  // Rate limit by IP (no auth required for contact form)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const allowed = await checkRateLimit(`contact:${ip}`, 3, 3600);
  if (!allowed) return Errors.rateLimited('Too many messages. Please try again later.');

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Errors.validation('Invalid JSON');
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return Errors.validation('Invalid form data', parsed.error.issues);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { error } = await supabase.from('contact_messages').insert({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  if (error) {
    console.error('[contact-form]', error);
    return Errors.internal();
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
```

- [ ] **Step 3: Deploy function and push migration**

```bash
export SUPABASE_ACCESS_TOKEN=$(cat ~/.supabase/access-token)
/tmp/supabase-v2/supabase functions deploy contact-form --project-ref harhahyurvxwnoxugehe --no-verify-jwt
echo "y" | /tmp/supabase-v2/supabase db push --linked
```

Note: `--no-verify-jwt` because the contact form doesn't require authentication.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/026_contact_messages.sql supabase/functions/contact-form/
git commit -m "feat: contact-form edge function + contact_messages migration"
```

---

## Phase 5: 3D Scenes

### Task 12: Hero 3D scene — self-assembling house

**Files:**
- Create: `website/components/HeroScene.tsx`
- Modify: `website/app/page.tsx` — add dynamic import of HeroScene

- [ ] **Step 1: Write `components/HeroScene.tsx`** — Client-only R3F component:
  - `<Canvas>` with transparent background
  - Low-poly house: box geometries for walls, triangular prism for roof
  - Animation: walls rise from y=-2 to y=0, roof slides down, windows fade in
  - Slow auto-rotation after assembly via `useFrame`
  - Wireframe material in cyan (`#C9FFFD`) with slight emissive glow
  - `<OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />` from Drei

- [ ] **Step 2: Add to homepage** — Dynamic import with `ssr: false`:

```tsx
import dynamic from 'next/dynamic';
const HeroScene = dynamic(() => import('@/components/HeroScene').then(m => m.HeroScene), {
  ssr: false,
  loading: () => <div className="w-full h-[400px]" />,
});
```

Place inside the hero section.

- [ ] **Step 3: Commit**

```bash
git add website/components/HeroScene.tsx website/app/page.tsx
git commit -m "feat(website): 3D hero scene — self-assembling wireframe house"
```

---

## Phase 6: App Integration

### Task 13: Update app to redirect subscriptions to website

**Files:**
- Modify: `src/screens/subscription/SubscriptionScreen.tsx`
- Modify: `src/utils/branding.ts`

- [ ] **Step 1: Update `branding.ts`** — Add pricing URL:

```typescript
urls: {
  website: 'https://asoria.app',
  pricing: 'https://asoria.app/pricing',
  support: 'https://asoria.app/contact',
  privacy: 'https://asoria.app/privacy',
  terms: 'https://asoria.app/terms',
},
```

- [ ] **Step 2: Update `SubscriptionScreen.tsx`** — Replace per-tier "Upgrade" buttons with website redirect:

Find the `handleUpgrade` or equivalent function and replace the `subscriptionService.createCheckout()` call with:
```typescript
import { Linking } from 'react-native';
import { BRAND } from '../../utils/branding';

const handleUpgrade = () => {
  Linking.openURL(BRAND.urls.pricing);
};
```

Keep the tier comparison cards for viewing but change the per-card CTA to a single "View Plans & Subscribe" button that opens the website.

- [ ] **Step 3: Run TypeScript check on app**

```bash
cd /home/chisanga/Archora/Archora && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/subscription/SubscriptionScreen.tsx src/utils/branding.ts
git commit -m "feat: redirect subscription upgrades to asoria.app/pricing (Spotify model)"
```

---

## Phase 7: Final Verification + Deploy

### Task 14: Full verification and deployment

- [ ] **Step 1: TypeScript check on website**

```bash
cd /home/chisanga/Archora/Archora/website && npx tsc --noEmit
```

- [ ] **Step 2: TypeScript check on app**

```bash
cd /home/chisanga/Archora/Archora && npx tsc --noEmit
```

- [ ] **Step 3: Build website**

```bash
cd /home/chisanga/Archora/Archora/website && npm run build
```

- [ ] **Step 4: Push all commits**

```bash
cd /home/chisanga/Archora/Archora && git push origin main
```

- [ ] **Step 5: Deploy edge functions**

```bash
export SUPABASE_ACCESS_TOKEN=$(cat ~/.supabase/access-token)
/tmp/supabase-v2/supabase functions deploy stripe-checkout --project-ref harhahyurvxwnoxugehe
/tmp/supabase-v2/supabase functions deploy stripe-portal --project-ref harhahyurvxwnoxugehe
/tmp/supabase-v2/supabase functions deploy contact-form --project-ref harhahyurvxwnoxugehe --no-verify-jwt
```

- [ ] **Step 6: Push migration**

```bash
echo "y" | /tmp/supabase-v2/supabase db push --linked
```

- [ ] **Step 7: Trigger app build**

```bash
cd /home/chisanga/Archora/Archora && eas build --platform android --profile preview --non-interactive
```

---

## Supabase Auth Configuration (Manual)

After deployment, these must be configured in Supabase Dashboard:
1. **Authentication → URL Configuration → Site URL**: `https://asoria.app`
2. **Authentication → URL Configuration → Redirect URLs**: Add `https://asoria.app/auth/callback`
3. **Google Cloud Console → OAuth 2.0 → Authorized redirect URIs**: Add `https://asoria.app/auth/callback`
