# Website redesign: Vellum (2026-10-07)

**Goal.** The website reads as the same product as the app: Vellum (paper ground, six pigments, rounded rectangles, the pressed-lip button, ink shadows, paper grain). Every page is restyled; login, Google sign-in, password reset, pricing/checkout, account and the Stripe wiring keep their logic untouched.

**Memorable moment (one).** The hero is a drafting sheet that draws itself: walls, rooms and dimension lines (mono, ink) with margin notes from ARIA (iris). Below it, one scroll-driven sequence: plan -> raised 3D -> furnished -> AR scan on a phone. All other motion answers an action (press, hover, toggle). `prefers-reduced-motion` shows the final static state.

**Tokens.** Light: paper #E9E9E0, sheet #FEFEFB, rule #C8C9BA, ink #1E211A, ink2 #585D52, ink3 #5F6257. Dark (system setting): paper #15170F, sheet #20231A, rule #3B4032, ink #ECEEE2, ink2 #A6AC9B, ink3 #909586. Pigments (app meanings): magenta #FF2D87 primary action (one per view, text on it is #2B0316, never the ground), ultramarine #3246E8 structure/links/selection, iris #7B4DF0 ARIA/AI output only, viridian #00A87E done/saved, crimson #C8152C errors only, chartreuse #C9E81C new. Type: Inter Tight (display only), Inter (body), JetBrains Mono (measurements and figures only). Radii: 6/10/14/16/18/22 by hierarchy, no pills. Shadows: ink, only for real elevation.

**Not doing.** Tracked all-caps eyebrows, numbered markers unless a true sequence, "->" on buttons, fade-in on every section, stock photos, invented user counts or testimonials, WebGL on the first screen (three.js hero removed).

**Pages.** Home, Features, Pricing, Contact, Login/Forgot/Reset, Account, Terms, Privacy, Checkout success/cancel.

**Done when.** `tsc` and `next build` pass; screenshots at 390 / 768 / 1280 px, light and dark, reviewed for every page; contrast of every text/fill pair >= 4.5:1; keyboard focus visible; login redirect, `/account` guard and checkout calls behave as before on the live preview.
