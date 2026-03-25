# ASORIA — Root Context (200 lines max)

## What We're Building
Fully generative AI-powered mobile architecture design platform. iOS + Android.
Everything the user sees is generated on demand. No pre-made templates.
Full product vision: docs/ASORIA_MASTER_PLAN.md

## 5 Core Features
1. AI Building Generation — 7-step designer interview → Claude API → BlueprintData JSON → Skia 2D + R3F 3D
2. Design Studio — Zustand store, Skia canvas, React Three Fiber, full editing, AI assistant
3. Prompt-to-Furniture — procedural engine (standard) + Meshy AI (Architect tier)
4. AR System — Room Scan (Creator+) · Furniture Placement (Creator+) · Measure (Pro+) · Import to Studio
5. Community (Inspo) — social, likes, saves, ratings, comments, template monetisation

## Stack (all decisions final)
TypeScript 5.x strict · React Native + Expo SDK 55 · React Navigation v6
NativeWind (Tailwind only, StyleSheet.create BANNED) · Reanimated 3 (ALL animations)
Gesture Handler · Skia (2D) · Three.js + R3F · expo-av (audio) · expo-sensors (shake)
Zustand · Zod · MMKV · Expo SecureStore (JWT only)
Supabase (Postgres + RLS + Auth + Storage + Edge Functions, Deno TS)
Upstash Redis · Stripe · Cloudflare CDN
AI: Claude claude-sonnet-4-6 · OpenAI Whisper · Replicate SDXL · Meshy · Roboflow · SAM

## Brand and Design Language
Oval-first UI — every button, card, input, chip is soft-cornered. Never sharp corners.
Border radius: buttons 50px · cards 20–24px · inputs 50px · tab bar pill 999px · modals 24px top
Fonts: ArchitectsDaughter_400Regular (headings) · Inter (body) · JetBrainsMono (numbers/measurements)
JetBrainsMono: install @expo-google-fonts/jetbrains-mono (not yet installed)
Sketchy white line illustrations as accents on dark backgrounds — SVG stroke-only, never bitmap
BASE_COLORS are final — never override. Theme variants in src/theme/colors.ts.
Background #1A1A1A · Surface #222222 · Elevated #2C2C2C · Border #333333
Text Primary #F0EDE8 · Text Secondary #9A9590 · Text Dim #5A5550
Success #7AB87A · Warning #D4A84B · Error #C0604A · Primary #C8C8C8

## Architecture Rules
- 1 unit = 1 metre everywhere
- blueprintStore (Zustand) is single source of truth for all blueprint data
- All mutations through store actions — never direct state changes
- Auto-save: Starter = manual · Creator = 120s · Pro = 60s · Architect = 30s debounce
- All API calls via Edge Functions — never directly from client
- All Edge Functions gracefully return fallback when API keys missing (no crash)
- user_id always from verified JWT — never from request body
- requireOwnership() before every write
- Zod validation on every Edge Function input
- All API keys in Supabase Vault via Deno.env.get()
- UUID PKs everywhere — never sequential integers
- RLS on every table, default deny
- JWT: 15min access + 7-day rotating refresh in Expo SecureStore
- Rate limits: auth 5/min · AI 10/hr · else 300/min
- Never use ActivityIndicator — use CompassRoseLoader everywhere
- Supabase client: import from src/utils/supabaseClient.ts (NOT src/services/supabase)
- UIStore actions: always access via s.actions.showToast / s.actions.openModal

## Naming
Screens: PascalCase + Screen | Components: PascalCase | Hooks: use + camelCase
Stores: camelCase + Store | Services: camelCase + Service
Edge Functions: kebab-case folder | Migrations: NNN_snake_case | Schemas: camelCase + Schema

## Navigation
Tab order: Home · Create · [FAB] · Inspo · AR · Account
  Home = DashboardScreen (projects, engagement)
  Create = SketchScreen (freehand canvas)
  FAB = centre compass rose → Generation modal (7-step interview)
  Inspo = FeedScreen (community templates, masonry layout)
  AR = ARScanScreen (3 modes: Scan · Place · Measure)
  Account = AccountScreen
Tab bar: floating oval pill, icons only, no labels, long-press for tooltip
Tab bar HIDES completely on: AR · Create · Workspace · Generation flow
Swipe left/right between tabs · Swipe down dismisses modals · Swipe right = back in Generation steps

## AI Generation Flow (GenerationScreen)
7-step designer interview — NOT a single text box. See docs/ASORIA_MASTER_PLAN.md §4.
Steps: building type → plot size → rooms/toggles → style → optional image upload → notes + voice → review + generate
Voice: expo-av record → transcribe Edge Function (Whisper) → fills text area
Image: picker → Supabase Storage upload → URL in payload
Payload type: GenerationPayload (buildingType, plotSize, plotUnit, bedrooms, bathrooms,
  livingAreas, hasGarage, hasGarden, hasPool, poolSize, style, referenceImageUrl,
  additionalNotes, transcript)
Progress shown as animated oval pill steps. Never show raw spinner alone.

## Tiers
TIER_LIMITS in src/utils/tierLimits.ts is the ONLY source of truth for all limit values.
Always: useTierGate hook + TierGate component client-side AND server-side quota check.

Starter (free):
  3 projects · 4 rooms · 10 furniture · 10 AI/mo · 45min/day edit · 10 undo
  3 styles (minimalist, modern, rustic) · no AR · manual save · community read-only

Creator ($14.99/mo · $179.90/yr):
  25 projects · 15 rooms · 50 furniture · 200 AI/mo · unlimited edit · 50 undo
  all 12 styles · AR furniture placement (15 sessions/mo) · auto-save 120s
  community publish · walk-through mode · 50% template revenue · multi-floor up to 5

Pro ($24.99/mo · $239.90/yr) — NEW TIER:
  50 projects · 20 rooms · 100 furniture · 500 AI/mo · unlimited edit · 100 undo
  all styles · AR all modes (scan + place + measure) · auto-save 60s
  custom texture gen (SDXL) · AI image upload reference · furniture image → model
  60% template revenue · multi-floor up to 10 · community publish
  Stripe: create product manually → add STRIPE_PRO_MONTHLY_PRICE_ID + STRIPE_PRO_ANNUAL_PRICE_ID

Architect ($39.99/mo · $383.90/yr):
  unlimited everything · custom AI furniture (Meshy) · professional annotations
  CAD export · cost estimator · team 5 members · commercial buildings
  70% template revenue · white-label exports · VIP support · auto-save 30s

## Engagement Systems
- Points: src/services/pointsService.ts → award_points RPC → authStore.user.pointsTotal
- Streaks: src/hooks/useStreak.ts → update_streak RPC → authStore.user.streakCount
- Edit timer: src/hooks/useEditTimer.ts — Starter tier only, daily_edit_seconds_today in DB
- Undo/redo: blueprintStore history stack — maxUndoSteps per tier (-1 = unlimited)
- Shake to undo/redo: src/hooks/useShakeDetector.ts (expo-sensors Accelerometer)
- Notifications: src/services/notificationService.ts + Supabase Realtime channel

## Procedural Furniture (65+ pieces)
All in src/utils/procedural/furniture.ts — FurnitureDefault has w/h/d (metres), color, category, outdoor.
3D components grouped by category in src/components/3d/furniture/:
  LivingFurniture · BedroomFurniture · StorageFurniture · MediaFurniture
  BathroomFurniture · TablesFurniture · OutdoorFurniture · OutdoorStructures

## Design Styles (12)
src/data/designStyles.ts — DESIGN_STYLES array, isStyleAccessible(styleId, availableStyles)
Starter: minimalist, modern, rustic only. Creator/Pro/Architect: all 12.
Apply via blueprintStore.actions.applyStyle(styleId, primaryWallColour).

## Agent File Ownership
Architect Agent: planning, CLAUDE.md, docs/ASORIA_MASTER_PLAN.md, cross-agent conflicts
Auth Agent: src/screens/auth/, src/services/authService.ts, src/hooks/useAuth.ts
Database Agent: supabase/migrations/, supabase/functions/_shared/, src/types/database.ts
3D Blueprint Agent: src/stores/blueprintStore.ts, src/components/blueprint/, src/utils/procedural/
AI Pipeline Agent: supabase/functions/ai-generate/, transcribe/, generate-texture/, generate-furniture/
AR Agent: src/screens/ar/, src/services/arService.ts, supabase/functions/ar-*/
Payments Agent: src/screens/subscription/, src/hooks/useTierGate.ts, src/utils/tierLimits.ts
UI Social Agent: src/screens/ (except auth/workspace/ar), src/navigation/, src/components/common/

## Key Files
src/utils/tierLimits.ts — all tier limit values (single source of truth)
src/stores/blueprintStore.ts — blueprint state, undo/redo history, saveStatus, applyStyle
src/types/blueprint.ts — BlueprintData type (contract between AI and renderers)
src/types/r3f-jsx.d.ts — R3F JSX ambient types (mesh scale, wireframe, emissive, cone, torus)
src/data/textures.ts — 50 wall + 30 floor texture definitions
src/data/designStyles.ts — 12 design style definitions
src/theme/colors.ts — BASE_COLORS + 6 theme variants (final, do not add new colours without ADR)
src/theme/spacing.ts — spacing scale, border radius, font size tokens
src/navigation/MainNavigator.tsx — tab configuration (Home/Create/Inspo/AR/Account)
src/navigation/CustomTabBar.tsx — oval pill floating tab bar
src/screens/generation/GenerationScreen.tsx — 7-step AI interview flow
docs/ASORIA_MASTER_PLAN.md — full product vision and feature specifications
supabase/functions/ — all Edge Functions (Deno TypeScript)
supabase/migrations/ — all SQL migrations (010 points/streaks, 011 notifications, 012 RPCs)

## Context Files (read on demand)
tasks/handoffs.md — inter-agent communication
tasks/lessons.md — lessons archive (50 lines max)
docs/adr/ — Architecture Decision Records
docs/ASORIA_MASTER_PLAN.md — full product vision (read before any feature work)
