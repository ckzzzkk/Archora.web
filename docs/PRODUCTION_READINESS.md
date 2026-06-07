# Asoria — Production Readiness Runbook

_Last updated: 2026-06-07. Owner: Chisanga._

This is the single source of truth for shipping Asoria to the App Store and Google
Play. It covers what is **done in code**, what only **you** can finish (accounts,
devices, deploys), and the **exact order** to do it in.

Status legend: ✅ done & verified · 🟡 code-done, needs device/keys · ⛔ blocked on you

---

## 0. Snapshot

| Area | State |
|------|-------|
| TypeScript (`src/`) | ✅ compiles, 0 errors |
| AI generation pipeline | ✅ code complete (timeouts, schema validation, geometry repair, procedural fallback, Realtime progress, batch) |
| AI **quality** | 🟡 unverified vs live AI — procedural fallback scores low (see §3) |
| AR native modules (Android) | ✅ ported + **Kotlin compiles** against ARCore 1.36 |
| AR native modules (iOS) | 🟡 ported faithfully — **needs a macOS/Xcode build** (cannot compile on Linux) |
| RevenueCat IAP (code) | ✅ merged on `source-only` |
| RevenueCat IAP (operational) | ⛔ store/dashboard/Vault setup pending (§4) |

---

## 1. AR — what was broken and what changed (2026-06-07)

**Root cause:** the native AR TurboModules existed only on the stale, 244-commit-divergent
`feature/ar-room-scan` branch. On `source-only` they were absent, so
`ARCoreModule.isAvailable === false` and every scan path silently degraded to
"AR not available." The TS/JS layer was complete the whole time — it was talking to
native code that wasn't on the branch.

**Fix (this session), Option A — legacy module + New-Architecture interop layer:**
- `android/app/src/main/java/com/asoria/ar/ARCoreModule.kt` — ported; `onCatalystInstanceDestroy` → `invalidate()`; added `addListener`/`removeListeners` for `NativeEventEmitter`.
- `android/app/src/main/java/com/asoria/ar/ARCorePackage.kt` — ported.
- `android/app/src/main/java/com/asoria/app/MainApplication.kt` — `add(ARCorePackage())`.
- `android/app/build.gradle` — `implementation("com.google.ar:core:1.36.0")`.
- `android/app/src/main/AndroidManifest.xml` — `uses-feature camera.ar (required=false)` + `meta-data com.google.ar.core = optional`.
- `ios/LocalPods/ARKitModule/{ARKitModule.swift,.m,.podspec}` — ported.
- `ios/Podfile` — moved the `pod 'ARKitModule'` line **inside** the target block (it was outside `end`, which would fail `pod install`).

**Why interop, not full TurboModule conversion:** the JS wrapper calls
`TurboModuleRegistry.getEnforcing` by name, there is no codegen config wired, and RN
0.83 + bridgeless ships the Native Module Interop Layer on by default — which exposes
legacy `ReactPackage` modules by name. Full TurboModule conversion is the long-term
ideal but is **not required to ship**.

**Verified:** `./gradlew :app:compileDebugKotlin` → `BUILD SUCCESSFUL`.

---

## 2. C — Device verification (only you can do this; needs a dev build, NOT Expo Go)

AR + IAP require native modules, so you must run a **development build** on a real device.

```bash
# Android dev build to a connected device
npx expo run:android
# iOS (on macOS only)
cd ios && pod install && cd .. && npx expo run:ios
```

### 2a. AR checklist (per device)
- [ ] Open AR tab → entry screen shows correct capability ("LiDAR" / "AR" / "Photo").
- [ ] Android non-AR / iOS non-ARKit device → degrades to Photo mode without crashing.
- [ ] Scan Room → planes detected, room geometry imports into the Studio.
- [ ] Furniture Placement (Creator+) → tap places furniture on a surface.
- [ ] Measure (Pro+) → two-point distance is within ~5cm of a tape measure.
- [ ] Confirm `ARCoreModule.isAvailable === true` in logs (no "AR module not available").

### 2b. AI generation checklist
- [ ] Run the 7-step interview → a generation completes and renders walls in 2D + 3D.
- [ ] Kill network mid-generation → graceful timeout/NETWORK error, no crash.
- [ ] With Vault keys unset → 503 `AI_NOT_CONFIGURED` shows "AI features coming soon" (no crash).

### 2c. IAP checklist (sandbox; after §4 is done)
- [ ] Purchase each tier → `users.subscription_tier` updates → tier gates unlock.
- [ ] Restore Purchases on a fresh install → tier returns.
- [ ] Cancel in sandbox → access persists until expiry (webhook returns null on CANCELLATION).

---

## 3. A — AI quality (measure it; don't assume)

The deterministic quality harness already supports live measurement.

```bash
# Procedural baseline (free, offline)
npx vitest run src/__tests__/quality/measureQuality.test.ts

# Live AI (real ai-generate-optimal — costs credits)
RUN_AI_QUALITY=1 \
EXPO_PUBLIC_SUPABASE_URL=https://harhahyurvxwnoxugehe.supabase.co \
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key> \
QUALITY_AI_TOKEN=<a valid user JWT> \
npx vitest run src/__tests__/quality/measureQuality.test.ts
```

**Procedural baseline today (the offline fallback):** Overall 67, Circulation pass 13%,
Structural pass **0%**. Bathrooms open onto living rooms (no hallway); rooms span 8m
with no beam. **This is what users get when AI is unavailable or returns broken geometry.**

**Action:** run the live-AI measurement once keys are set. If the live AI also scores
low on circulation/structural, the layout engine (`src/utils/layoutEngine/`) needs work
— adding hallway/corridor circulation and span/beam structural logic. Tracked as a
separate effort, not a publish blocker.

---

## 4. D — Operational publishing (only you can do this) — DO IN THIS ORDER

> ⚠️ Do **not** deploy migration 060 / the webhook until steps 4.1–4.3 are done.
> A live webhook with missing `RC_PRODUCT_*` Vault vars silently resolves every
> purchase to `starter`.

### 4.1 App Store Connect
- [ ] Sign the Paid Apps agreement.
- [ ] Create 6 auto-renewing subscriptions: `asoria_creator_monthly/annual`, `asoria_pro_monthly/annual`, `asoria_architect_monthly/annual`.

### 4.2 Google Play Console
- [ ] Create the same 6 subscription products + base plans.

### 4.3 RevenueCat dashboard
- [ ] Create the project; add iOS + Android apps.
- [ ] 3 entitlements: `creator`, `pro`, `architect`.
- [ ] An offering containing all 6 products.
- [ ] Webhook URL → `https://harhahyurvxwnoxugehe.supabase.co/functions/v1/revenuecat-webhook` + an Authorization secret.

### 4.4 Secrets
- [ ] Supabase Vault: `REVENUECAT_WEBHOOK_AUTH` (= the RC webhook secret), and `RC_PRODUCT_*` whose **values exactly equal** the product-id strings from `src/utils/iapProducts.ts` `getProductId()`.
- [ ] EAS secrets: `REVENUECAT_IOS_KEY`, `REVENUECAT_ANDROID_KEY`.

### 4.5 Deploy (run only after 4.1–4.4) — exact commands
```bash
# from repo root, with supabase CLI linked to harhahyurvxwnoxugehe
supabase db push                               # applies migration 060
supabase functions deploy revenuecat-webhook   # deploys the webhook
```
- [ ] Verify in RevenueCat: send a test event → `users.subscription_tier` changes.

### 4.6 Build & submit
- [ ] `eas build --platform all --profile production`
- [ ] Sandbox-test IAP (§2c) on the production build.
- [ ] `eas submit` to both stores.

---

## 5. Open items (not publish blockers)
- iOS AR build verification (needs macOS).
- Live-AI quality measurement + possible layout-engine circulation/structural work (§3).
- `generate-texture` blocking 60s poll → async job queue (deferred tech debt).
