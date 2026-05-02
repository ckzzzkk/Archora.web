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
AI: Claude claude-sonnet-4-6 · Groq Whisper · fal.ai Flux Schnell · Meshy · Roboflow · SAM

## Brand and Design Language
Oval-first UI — every button, card, input, chip is soft-cornered. Never sharp corners.
Border radius: buttons 50px · cards 20–24px · inputs 50px · tab bar pill 999px · modals 24px top
Fonts: ArchitectsDaughter_400Regular (headings) · Inter (body) · JetBrainsMono (numbers/measurements)
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
- Supabase client: import from src/utils/supabaseClient.ts (NOT src/services/supabase) — NOTE: actual canonical path is `src/lib/supabase.ts`
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
  1 project · 2 rooms · 5 furniture/room · 1 floor
  0 AI generations · 0 edits · 15 min/day edit · 5 undo · manual save
  3 styles (minimalist, modern, rustic) · no AR · no renders · no AI chat
  1 export/mo · community read-only · export watermark

Creator ($14.99/mo · $179.90/yr):
  25 projects · 15 rooms · 50 furniture/room · 5 floors
  40 AI gen/mo · 30 edits/mo · 25 AI chat/day
  all 12 styles · AR furniture placement (15 scans/mo) · auto-save 120s
  walk-through mode · cinematic tour (watermarked) · copy room
  10 photo imports/mo · 20 exports/mo · 5 renders/mo
  1 collaborator · publish 5 templates · 60% revenue share

Pro ($24.99/mo · $239.90/yr):
  50 projects · 20 rooms · 100 furniture/room · 10 floors
  100 AI gen/mo · 80 edits/mo · unlimited AI chat
  all styles · AR all modes (scan + place + measure, unlimited) · auto-save 60s
  custom textures (fal.ai) · walk-through + cinematic tour · copy room + layout
  unlimited photo imports · unlimited exports · 30 renders/mo
  unlimited first-person 3D sessions · batch generation (3)
  1 collaborator · unlimited templates · 60% revenue share · cost estimator
  CAD export · commercial buildings · building code compliance
  audio input (Whisper transcription) · custom furniture

Architect ($39.99/mo · $383.90/yr):
  100 projects · 50 rooms · unlimited furniture · 20 floors
  300 AI gen/mo · 300 edits/mo · 200 AI chat/day
  all styles · AR 100 scans/mo · auto-save 30s
  Meshy AI furniture · cinematic tour (no watermark) · copy room + layout
  100 photo imports/mo · 50 exports/mo · 100 renders/mo
  5 collaborators · co-projects · co-design · CAD export
  unlimited templates · 70% revenue share · cost estimator
  commercial buildings · building code compliance · VIP support

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
.claude/vault.md — Obsidian vault backup documentation

## Obsidian Vault Backup Protocol

**Vault location:** ~/Obsidian/Asoria-Vault/
**Purpose:** mirrors all significant app state, decisions, and documentation as a backup layer

After ANY code change, update the corresponding vault file BEFORE committing:

| Code change | Vault file to update |
|------------|---------------------|
| New/modified screen | 01-App-Structure/ or 02-Screens/ |
| New/modified component | 01-App-Structure/ or 03-Components/ |
| New/modified store | 01-App-Structure/ or 04-Stores/ |
| New/modified service | 01-App-Structure/ or 05-Services/ |
| New/modified hook | 01-App-Structure/ or 06-Hooks/ |
| Design system change | 08-Theme/Design-System.md |
| Tier limits change | 00-Project/Subscription-Tiers.md |
| New Supabase migration | 09-Supabase/Supabase-Backend.md |
| Architecture decision | 12-Docs/ADR.md |
| Agent reassignment | 10-Agents/Agent-Handoffs.md |
| New project-level change | 00-Project/00-Project-Overview.md |

**The codebase is always authoritative.** The vault is a mirror for documentation and backup. If there's a conflict, the code wins.
