# ASORIA Subscription Website — Design Spec

**Date:** 2026-04-09
**Status:** Draft
**Contact:** crokora.official@gmail.com

---

## Problem

ASORIA needs a web presence that serves as the single payment gateway for subscriptions (Spotify model: pay on web, app auto-links), showcases app features with 3D animations, provides legal pages, and matches the app's Teal Sketch design language.

## Solution

A Next.js 14 marketing + subscription site at `asoria.app`, sharing the same Supabase project for auth and the same Stripe integration for payments. The app's "Upgrade" buttons redirect to the website. Stripe webhooks (already implemented) sync the tier back to the app automatically.

---

## Architecture

```
Monorepo: /home/chisanga/Archora/Archora
├── /website              ← NEW: Next.js 14 site
│   ├── app/              ← App Router pages
│   ├── components/       ← React components
│   ├── lib/              ← Supabase client, Stripe helpers, theme tokens
│   └── public/           ← Static assets
├── /src                  ← Existing React Native app
├── /supabase             ← Shared: Edge Functions, migrations
```

**Stack:**
- Next.js 14 (App Router)
- Tailwind CSS 3 (same utility classes as NativeWind)
- React Three Fiber + Drei (3D scenes)
- Framer Motion (page/scroll animations)
- `@supabase/ssr` (auth for Next.js)
- Vercel deployment

**Shared with app:**
- Supabase project `harhahyurvxwnoxugehe` (auth, DB, edge functions)
- Stripe account (same price IDs, same webhook)
- Tier definitions and pricing

---

## Pages

### 1. Homepage (`/`)

**Hero section:**
- Headline: "Design Your Dream Space With AI"
- Subheading: brand tagline "Describe it. Build it. Walk through it."
- 3D scene: animated low-poly house that assembles itself (Three.js)
- Two CTAs: "Get Started Free" → app store links, "View Plans" → /pricing
- Gradient mesh background (deep teal → black)

**Feature highlights (3 cards):**
- AI Floor Plan Generation — "Describe your vision, ARIA designs it"
- AR Room Scanning — "Point your phone, capture your space"
- 3D Walkthrough — "Step inside your design before it's built"
- Each card: icon, title, 2-line description, subtle hover glow animation

**How it works (3 steps):**
1. Describe — tell ARIA what you want
2. Generate — AI creates a full blueprint
3. Explore — walk through in 3D or AR

**Stats strip:**
- "10,000+ Designs Generated" / "50,000+ Rooms Scanned" / "4.8 App Rating"
- Animated counter on scroll-in

**CTA banner:**
- "Ready to design?" + "Download the App" buttons (App Store + Play Store)

**Footer:**
- Links: Pricing, Features, Privacy, Terms, Contact
- Social: Instagram, Twitter
- Copyright: "2026 ASORIA by Crokora. All rights reserved."

### 2. Pricing (`/pricing`)

**Billing toggle:** Monthly / Annual with animated slider (20% savings badge on annual)

**4 tier cards (horizontal on desktop, vertical scroll on mobile):**

| | Starter | Creator | Pro | Architect |
|---|---|---|---|---|
| Price | Free | $14.99/mo | $24.99/mo | $39.99/mo |
| Annual | — | $11.99/mo | $19.99/mo | $31.99/mo |
| Projects | 3 | 25 | 50 | Unlimited |
| AI Designs/mo | 10 | 200 | 500 | Unlimited |
| AR | No | Placement | All modes | All modes |
| Styles | 3 | All 12 | All 12 | All 12 |
| Floors | 1 | 5 | 10 | Unlimited |
| Auto-save | No | 120s | 60s | 30s |
| Community | Read-only | Publish | Publish | Publish |
| Revenue share | — | 60% | 60% | 80% |
| CTA | "Download App" | "Subscribe" | "Subscribe" | "Subscribe" |

- Creator card has "Most Popular" badge
- Subscribe buttons require login (redirect to /login?redirect=/pricing if not authenticated)
- After login + click: calls existing `stripe-checkout` edge function → Stripe hosted checkout
- Success redirect: `/checkout/success`
- Cancel redirect: `/checkout/cancel`

**Feature comparison table:** Expandable accordion with all 13 feature rows from the app.

**FAQ section (5 items):**
1. "Can I change plans?" — Yes, upgrade/downgrade anytime
2. "Do I lose my designs if I downgrade?" — No, designs are kept but some features lock
3. "How does billing work?" — Stripe handles all payments securely
4. "Can I cancel anytime?" — Yes, keep access until end of billing period
5. "Why can't I pay in the app?" — We keep costs low by avoiding app store fees, passing savings to you

### 3. Features (`/features`)

**5 feature sections (full-width, alternating layout):**

**AI Generation:**
- 3D scene: blueprint drawing itself (animated lines)
- Description of 7-step interview, ARIA personality, structural intelligence
- "Generates structurally sound blueprints accounting for weather, physics, and building codes"

**Design Studio:**
- Screenshot/mockup of workspace
- 2D Skia canvas, wall/door/window tools, furniture library
- Multi-floor support, undo/redo

**AR System:**
- 3D scene: phone scanning a room (animated)
- 3 modes: Photo Analysis, Manual Measure, Depth Scan
- "Import real rooms into your digital workspace"

**3D Walkthrough:**
- 3D scene: first-person camera moving through a house
- Immersive exploration, realistic materials and lighting

**Community:**
- Social features: publish designs, browse templates, like/save/rate
- Template marketplace with revenue sharing

### 4. Login (`/login`)

- Supabase Auth UI with email/password + Google OAuth
- Same Supabase project = same user database as the app
- If user has no account, sign-up form with display name + email + password
- Redirect parameter: after login, redirect to `?redirect=` URL (default: /account)
- Session persisted via Supabase SSR cookies

### 5. Account (`/account`) — Protected route

- Current tier badge with color accent
- Usage dashboard: AI generations used, projects count
- "Manage Subscription" button → Stripe billing portal (via `stripe-portal` edge function)
- "Cancel Subscription" option with confirmation
- "Download the App" link
- "Sign Out" button

### 6. Privacy Policy (`/privacy`)

Full privacy policy covering:
- Data controller: Crokora (crokora.official@gmail.com)
- Data collected: account info (email, name), usage data, designs, AR scans
- Third-party services: Supabase (database), Stripe (payments), Google (OAuth), Anthropic (AI), OpenAI (transcription)
- Storage: Supabase Cloud (EU-West), encrypted at rest
- User rights: access, correction, deletion, export (GDPR Article 15-20)
- Data retention: account data kept until deletion, designs kept indefinitely while account active
- Cookies: session cookies only (Supabase auth), no tracking cookies
- Children: not designed for users under 16
- Contact: crokora.official@gmail.com
- Updates: users notified of material changes via email

### 7. Terms of Service (`/terms`)

Full terms covering:
- Service description: AI architecture design platform
- Account responsibilities: accurate info, password security
- Subscription terms: billing cycles, auto-renewal, cancellation policy
- Acceptable use: no illegal structures, no copyright infringement, no reverse engineering
- Intellectual property: user owns their designs, ASORIA owns the platform
- AI-generated content: designs are suggestions, not certified engineering plans
- Liability limitation: not responsible for construction based on AI designs
- Dispute resolution: governed by UK law (Crokora is UK-based)
- Termination: either party can terminate, designs exportable for 30 days after
- Contact: crokora.official@gmail.com

### 8. Contact (`/contact`)

- Contact email: crokora.official@gmail.com
- Contact form: name, email, subject, message → sends email via Supabase edge function
- Business: Crokora
- Social links: Instagram (@asoria.app), Twitter (@asoria_app)
- Support hours: "We typically respond within 24 hours"

### 9. Checkout Success (`/checkout/success`)

- Animated checkmark + confetti
- "Welcome to [Tier]!" message
- "Your subscription is now active. Open the ASORIA app to start using your new features."
- "Open App" button → `asoria://subscription-success` deep link
- "Go to Account" link

### 10. Checkout Cancel (`/checkout/cancel`)

- "Changed your mind?"
- "No worries — your account hasn't been charged."
- "Return to Pricing" button
- "Open App" button

---

## Theme Tokens (Website)

Exact match with app's Teal Sketch palette:

```css
:root {
  --background: #061A1A;
  --surface: #0C2424;
  --elevated: #122E2E;
  --border: rgba(201, 255, 253, 0.12);

  --primary: #C9FFFD;       /* Cyan */
  --primary-dim: #8ADEDD;
  --accent: #FFEE8C;        /* Yellow */
  --success: #7AB87A;
  --error: #FF8C9A;

  --text: #FEFFFD;
  --text-secondary: #8ADEDD;
  --text-dim: #4A8080;

  --glass-bg: rgba(201, 255, 253, 0.06);
  --glass-border: rgba(201, 255, 253, 0.12);
  --glass-prominent: rgba(201, 255, 253, 0.10);

  --radius-card: 24px;
  --radius-button: 50px;
  --radius-input: 50px;

  --font-heading: 'Architects Daughter', cursive;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

---

## App Integration Changes

### SubscriptionScreen.tsx

Replace in-app Stripe checkout with website redirect:

```typescript
// Before: called stripe-checkout edge function directly
// After: opens website pricing page
const handleUpgrade = (tier: string) => {
  Linking.openURL('https://asoria.app/pricing');
};
```

Keep the tier comparison cards and feature table in-app (read-only). Remove the "Upgrade to X" per-card buttons and replace with a single "View Plans on Web" button.

### AppState Sync

Already implemented: when app returns from background, `syncSubscription()` checks Stripe status and updates the local tier. No changes needed.

### BRAND.urls Update

```typescript
urls: {
  website: 'https://asoria.app',
  pricing: 'https://asoria.app/pricing',
  support: 'https://asoria.app/contact',
  privacy: 'https://asoria.app/privacy',
  terms: 'https://asoria.app/terms',
},
```

---

## Supabase Auth Configuration

Add website URL to Supabase Auth settings:
- Site URL: `https://asoria.app`
- Redirect URLs: `https://asoria.app/auth/callback`, `asoria://auth/callback`
- Google OAuth redirect: add `https://asoria.app/auth/callback`

---

## 3D Scenes (Three.js)

### Hero Scene: Self-Assembling House
- Low-poly house model built from primitive geometries (boxes for walls, triangular prism for roof)
- Animation: walls rise from ground, roof slides in, windows appear
- Slow auto-rotation after assembly
- Teal wireframe aesthetic matching the brand

### Features: Blueprint Drawing
- Animated line-drawing of a floor plan (Skia-style on canvas)
- Walls draw themselves, doors appear, furniture fades in
- Top-down view matching the app's 2D canvas

### Features: Room Scanning
- Phone model (box) with camera rays (lines) hitting surfaces
- Points appear where rays hit, forming room outline
- Matches the AR scanning concept

---

## New Edge Function: contact-form

For the contact page form submission:

```typescript
// supabase/functions/contact-form/index.ts
// - Rate limit: 3/hour per IP (no auth required)
// - Validates: name, email, subject, message (all required, Zod)
// - Inserts into contact_messages table (new migration 026)
// - Returns { success: true }
// - Messages viewable in Supabase dashboard, email notification optional later
```

**Migration 026:**
```sql
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);
-- No RLS needed — only service_role inserts, admin reads via dashboard
```

---

## Deployment

- **Host:** Vercel (connects to GitHub repo, auto-deploys on push)
- **Domain:** asoria.app (configure in Vercel + DNS)
- **Environment variables:** Same Supabase URL + anon key, Stripe publishable key
- **Build:** `next build` in `/website` directory
- **Vercel config:** Root directory set to `website/`

---

## File Structure

```
website/
├── app/
│   ├── layout.tsx              ← Root layout (fonts, theme, nav, footer)
│   ├── page.tsx                ← Homepage
│   ├── pricing/page.tsx        ← Pricing + subscribe
│   ├── features/page.tsx       ← Feature showcase
│   ├── login/page.tsx          ← Auth (login/signup)
│   ├── account/page.tsx        ← Protected: subscription management
│   ├── privacy/page.tsx        ← Privacy policy
│   ├── terms/page.tsx          ← Terms of service
│   ├── contact/page.tsx        ← Contact form
│   ├── checkout/
│   │   ├── success/page.tsx    ← Post-payment success
│   │   └── cancel/page.tsx     ← Payment cancelled
│   ├── auth/
│   │   └── callback/route.ts   ← Supabase OAuth callback handler
│   └── globals.css             ← Tailwind + CSS variables
├── components/
│   ├── Nav.tsx                 ← Top navigation bar
│   ├── Footer.tsx              ← Site footer
│   ├── PricingCard.tsx         ← Tier card component
│   ├── FeatureSection.tsx      ← Feature showcase section
│   ├── BillingToggle.tsx       ← Monthly/Annual switch
│   ├── HeroScene.tsx           ← 3D hero animation (R3F)
│   ├── BlueprintScene.tsx      ← 3D blueprint animation
│   ├── GlassCard.tsx           ← Glass morphism card
│   └── ContactForm.tsx         ← Contact form component
├── lib/
│   ├── supabase-server.ts      ← Supabase SSR client
│   ├── supabase-browser.ts     ← Supabase browser client
│   ├── stripe.ts               ← Stripe checkout helpers
│   └── theme.ts                ← Theme tokens (matching app)
├── public/
│   ├── favicon.ico
│   ├── og-image.png            ← Open Graph image for social sharing
│   └── app-store-badge.svg
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Success Criteria

1. User can subscribe to Creator/Pro/Architect from the website
2. App automatically detects new subscription when user returns
3. All legal pages have real, complete content
4. 3D animations run smoothly on desktop and degrade gracefully on mobile
5. Auth works with same credentials as the app (email + Google)
6. TypeScript strict, 0 errors in both app and website
7. Lighthouse score > 90 for performance
