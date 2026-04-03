# ASORIA Production Build Report — 2026-04-04

## Summary

All 10 phases of the complete-app plan executed and merged to `main` on branch `feat/complete-app-production-ready`.
TypeScript: **zero errors** (`tsc --noEmit`). All commits on `main`.

---

## Files Changed

### New Files
| File | Purpose |
|---|---|
| `supabase/migrations/023_performance_indexes.sql` | DB indexes on projects, feed_posts, ai_generations, notifications, ar_scans |
| `src/stores/arResultStore.ts` | AR result state (pending blueprint from scan) |
| `src/utils/ar/arToBlueprintConverter.ts` | Photo analysis → BlueprintData converter + `confidence?` field |
| `src/utils/ar/scanConverter.ts` | Point array → wall segments converter |
| `src/utils/ar/furnitureSuggestions.ts` | Room-type based furniture suggestion engine |
| `supabase/functions/ai-edit-blueprint/index.ts` | AI blueprint editing edge function |
| `supabase/functions/ar-photo-analyse/index.ts` | AR photo analysis via Claude Vision |
| `supabase/migrations/022_ar_blueprint_column.sql` | AR scan blueprint_data column |
| `docs/superpowers/specs/2026-04-03-sunrise-glass-redesign.md` | Design spec |

### Modified Files
| File | Change |
|---|---|
| `src/screens/generation/GenerationScreen.tsx` | Full 7-step ARIA interview, tier gate, smart suggestion chips |
| `src/screens/dashboard/DashboardScreen.tsx` | FlashList migration, stable header, memoized renderItem |
| `src/components/blueprint/AIChatPanel.tsx` | SUNRISE glass tokens, raw Text → ArchText |
| `src/components/blueprint/FurnitureLibrarySheet.tsx` | SUNRISE glass tokens |
| `src/components/blueprint/StyleSelectorSheet.tsx` | SUNRISE glass tokens |
| `src/components/blueprint/Canvas2D.tsx` | Measurement intelligence toasts for undersized rooms |
| `src/components/ar/ARPhotoMode.tsx` | Confidence badge after photo analysis |
| `src/components/ar/ARResultScreen.tsx` | `confidence?` prop + color-coded confidence badge UI |
| `src/components/ar/ARManualMeasureMode.tsx` | Room naming prompt (Alert.prompt iOS / default Android), wall count display |
| `src/screens/workspace/BlueprintWorkspaceScreen.tsx` | Native share sheet, `exportBlueprintToFile` helper |
| `src/screens/SplashScreen.tsx` | Hardcoded hex → DS tokens |
| `src/screens/onboarding/OnboardingScreen.tsx` | Hardcoded hex → DS tokens |
| `src/services/arService.ts` | AR service improvements |
| `supabase/functions/ai-generate/index.ts` | 55s AbortController timeout |
| `supabase/functions/transcribe/index.ts` | 50s AbortController timeout + audit logging |
| `supabase/functions/ar-scan-status/index.ts` | Rate limiting + audit logging |
| `supabase/functions/generate-texture/index.ts` | Audit logging |
| `supabase/functions/_shared/rateLimit.ts` | Rate limit improvements |

---

## Features Added / Fixed

### Phase 1 — Critical Fixes
- **7-step ARIA interview**: `GenerationScreen` now orchestrates Step1–Step7 components with `validateStep`, `buildPayload`, tier gate on AI quota
- **Smart suggestion chips**: Appear at Step 3 when bedrooms ≥ 1 — suggest en-suite, garage, garden
- **FlashList migration**: `DashboardScreen` FlatList → FlashList; `DashboardHeader` extracted outside component to prevent remount
- **Performance indexes**: 7 indexes covering the most queried columns

### Phase 2 — SUNRISE Glass UI
- All blueprint bottom sheets use `SUNRISE.glass.prominentBg` + `sheetTopBorder` + `sheetHandle`
- `AIChatPanel` message bubbles use `SUNRISE.elevated` + `SUNRISE.violetBorder` for ARIA messages
- Splash + Onboarding migrated from `#1A1A1A` to `DS.colors.background`

### Phase 3 — AI Features
- `ai-generate`: 55s timeout with graceful 503 on AbortError vs network error
- `transcribe`: 50s timeout returns `{ transcript: '', error: 'TRANSCRIPTION_TIMEOUT' }` status 200 (user can type manually)
- `AIChatPanel` was already wired to `aiService.editBlueprint` — verified correct

### Phase 4 — AR System
- **Photo Mode confidence**: After 4-photo analysis, `avgConfidence` computed and shown as pill badge (green >70%, amber >40%, red ≤40%)
- **Manual Measure room naming**: `Alert.prompt` on iOS before finalising; default "Living Room" on Android
- **3-wall minimum counter**: Shows `N/3 walls minimum` in toolbar instead of disabled button

### Phase 5 — Sketching
- Snap-to-grid (10cm), room area labels, 7-tool Canvas2D, `makeImageSnapshot` — all already implemented and verified

### Phase 6 — Own Contributions
- **Measurement intelligence**: `useEffect` in Canvas2D watches for newly detected rooms, fires toast if below `MIN_BEDROOM_AREA` (7.5m²), `MIN_BATHROOM_AREA` (2.5m²), or `SMALL_ROOM_AREA` (4m²)
- **Native share**: `Share.share()` with extracted `exportBlueprintToFile()` helper; ASORIA branding in title/message
- **Tour Mode**: Already implemented in `InHouseView` with `startCinematicTour` / `stopTour`, cinematic tier gate, 2.5s/room interval — verified complete

### Phase 7 — Backend Hardening
- `ar-scan-status`: Added `checkRateLimit(120/60s)` + `logAudit`
- `generate-texture`: Added `logAudit`
- `transcribe`: Added `logAudit`
- All AI/AR functions (ai-generate, ai-edit-blueprint, ai-furniture, ar-photo-analyse, ar-reconstruct, generate-furniture): already had full auth + rate limit + Zod + audit

### Phase 8 — Flow Verification
All 5 critical flows verified (static trace):
1. **New user**: WelcomeScreen → Login/SignUp → Onboarding → Dashboard → Generation (7 steps) → Workspace ✅
2. **AR Photo scan**: ARPhotoMode → 4 photos → analysePhoto → arToBlueprintConverter → ARResultScreen → loadBlueprint → Workspace ✅
3. **Returning user**: RootNavigator checks `isAuthenticated` → Dashboard auto-loads → Workspace ✅
4. **Feed + community**: FeedScreen → TemplateDetail, like/save optimistic updates ✅
5. **Account management**: signOut via Alert confirm → authActions.signOut() ✅

### Phase 9 — Optimisation
- `React.memo`: Already on `ProjectCard` and `FeedCard` — verified
- Optimistic like/save: Already in `LikeButton` and `SaveButton` with revert-on-error — verified

### Phase 10 — Final Build
- TypeScript: **zero errors** (`tsc --noEmit` with no output)

---

## Edge Functions Requiring Supabase Dashboard Deployment

| Function | Change | Priority |
|---|---|---|
| `ai-generate` | 55s timeout | High |
| `transcribe` | 50s timeout + audit | High |
| `ar-scan-status` | Rate limit + audit | Medium |
| `generate-texture` | Audit logging | Medium |
| `ai-edit-blueprint` | New function | High |
| `ar-photo-analyse` | New function | High |

Deploy command:
```bash
supabase functions deploy ai-generate
supabase functions deploy transcribe
supabase functions deploy ar-scan-status
supabase functions deploy generate-texture
supabase functions deploy ai-edit-blueprint
supabase functions deploy ar-photo-analyse
```

---

## Known Risks for Manual Testing

1. **ARCore device requirement**: `ARManualMeasureMode` + `ARPhotoMode` require a physical device with ARCore. Simulator will show permission/device errors. Test on an ARCore-supported Android device.

2. **Alert.prompt Android gap**: Room naming in `ARManualMeasureMode` uses `Alert.prompt` (iOS only). Android users get default name "Living Room". Consider a cross-platform input modal in a future iteration.

3. **Skia `makeImageSnapshot`**: Export + Share require 2D view to be active. The canvas ref won't return an image in 3D/FirstPerson modes — handled gracefully with toast.

4. **Tour Mode tier gate**: `cinematicTour` feature key must exist in `TIER_LIMITS`. Verify `useTierGate('cinematicTour')` resolves correctly for Creator+ tiers.

5. **FlashList v2.0.2**: `estimatedItemSize` prop was removed in v2 — intentionally not passed to avoid TS error. If FlashList is downgraded, this will need to be re-added.

6. **Supabase audit table**: `logAudit` writes to a `audit_log` table. Confirm this table exists in production before deploying updated edge functions.

---

## Recommended Next Steps

1. **EAS Build** → `eas build --platform android --profile preview` for internal distribution
2. **Supabase Production** → run all 23 migrations on production database
3. **Stripe Products** → create Pro tier products, add `STRIPE_PRO_MONTHLY_PRICE_ID` + `STRIPE_PRO_ANNUAL_PRICE_ID` to Supabase Vault
4. **Android Alert.prompt** → replace `Alert.prompt` in `ARManualMeasureMode` with a cross-platform `TextInput` overlay for room naming
5. **Push Notifications** → configure FCM in Firebase console + add `EXPO_PUSH_TOKEN` to Supabase secrets
6. **Supabase Production auth** → configure Google OAuth consent screen for production bundle ID
