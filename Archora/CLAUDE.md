# ASORIA — Root Context (150 lines max)

## What We're Building
Fully generative AI-powered mobile architecture design platform. iOS + Android.
Everything the user sees is generated on demand. No pre-made templates.

## 5 Core Features
1. AI Building Generation — Claude API → BlueprintData JSON → Skia 2D + R3F 3D
2. Blueprint Workspace — Zustand store, Skia canvas, React Three Fiber, full editing
3. Prompt-to-Furniture — procedural engine (standard) + Meshy AI (Architect tier)
4. AR Placement — expo-camera tap-to-place, manual AR without ARKit/depth (Creator+)
5. Community Feed — social, likes, saves, ratings, comments, template monetisation

## Stack (all decisions final)
TypeScript 5.x strict · React Native + Expo SDK 55 · React Navigation v6
NativeWind (Tailwind only, StyleSheet.create BANNED) · Reanimated 3 (ALL animations)
Gesture Handler · Skia (2D) · Three.js + R3F · expo-av (audio) · expo-sensors (shake)
Zustand · Zod · MMKV · Expo SecureStore (JWT only)
Supabase (Postgres + RLS + Auth + Storage + Edge Functions, Deno TS)
Upstash Redis · Stripe · Cloudflare CDN
AI: Claude claude-sonnet-4-6 · OpenAI Whisper · Replicate SDXL · Meshy · Roboflow · SAM

## Architecture Rules
- 1 unit = 1 metre everywhere
- blueprintStore (Zustand) is single source of truth for all blueprint data
- All mutations through store actions — never direct state changes
- Auto-save: Starter = manual only, Creator = 120s debounce, Architect = 30s debounce
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

## Tiers
TIER_LIMITS in src/utils/tierLimits.ts is the ONLY source of truth for all limit values.
Always: useTierGate hook + TierGate component client-side AND server-side quota check.
Starter: 3 projects, 4 rooms, 10 furniture, 10 AI/mo, 45min/day edit, 10 undo, 3 styles, no AR
Creator: 20 projects, 15 rooms, 50 furniture, 100 AI/mo, unlimited edit, 50 undo, all styles, 15 AR/mo
Architect: unlimited everything, custom AI furniture (Meshy), 80% template revenue share, VIP support
Annual prices: Creator $143.90/yr ($11.99/mo), Architect $383.90/yr ($31.99/mo)

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
Starter: minimalist, modern, rustic only. Creator/Architect: all 12.
Apply via blueprintStore.actions.applyStyle(styleId, primaryWallColour).

## Agent File Ownership
Architect Agent: planning, CLAUDE.md, cross-agent conflicts
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
src/theme/ — colours, spacing, typography tokens
supabase/functions/ — all Edge Functions (Deno TypeScript)
supabase/migrations/ — all SQL migrations (010 points/streaks, 011 notifications, 012 RPCs)

## Context Files (read on demand)
tasks/handoffs.md — inter-agent communication
tasks/lessons.md — lessons archive (50 lines max)
docs/adr/ — Architecture Decision Records
