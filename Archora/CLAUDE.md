# ARCHORA — Root Context (150 lines max)

## What We're Building
Fully generative AI-powered mobile architecture design platform. iOS + Android.
Everything the user sees is generated on demand. No pre-made templates.

## 5 Core Features
1. AI Building Generation — Claude API → BlueprintData JSON → Skia 2D + R3F 3D
2. Blueprint Workspace — Zustand store, Skia canvas, React Three Fiber, full editing
3. Prompt-to-Furniture — procedural engine (standard) + Meshy AI (Architect tier)
4. AI Room Scanning — ARKit/ARCore → Roboflow → SAM → Meshy → Three.js scene
5. Community Feed — social, likes, saves, ratings, comments, template monetisation

## Stack (all decisions final)
TypeScript 5.x strict · React Native + Expo SDK 55 · React Navigation v6
NativeWind (Tailwind only, StyleSheet.create BANNED) · Reanimated 3 (ALL animations)
Gesture Handler · Skia (2D) · Three.js + R3F + Drei · Cannon-es (physics)
Zustand · Zod · MMKV · Expo SecureStore (JWT only)
Supabase (Postgres + RLS + Auth + Storage + Edge Functions, Deno TS)
Upstash Redis · Stripe · Cloudflare CDN
AI: Claude claude-sonnet-4-6 · OpenAI Whisper · Replicate SDXL · Meshy · Roboflow · SAM

## Architecture Rules
- 1 unit = 1 metre everywhere
- blueprintStore (Zustand) is single source of truth for all blueprint data
- All mutations through store actions — never direct state changes
- MMKV auto-save every 2s (debounced)
- All API calls via Edge Functions — never directly from client
- user_id always from verified JWT — never from request body
- requireOwnership() before every write
- Zod validation on every Edge Function input
- All API keys in Supabase Vault via Deno.env.get()
- UUID PKs everywhere — never sequential integers
- RLS on every table, default deny
- JWT: 15min access + 7-day rotating refresh in Expo SecureStore
- Rate limits: auth 5/min · AI 10/hr · else 300/min
- Never use ActivityIndicator — use CompassRoseLoader everywhere

## Naming
Screens: PascalCase + Screen | Components: PascalCase | Hooks: use + camelCase
Stores: camelCase + Store | Services: camelCase + Service
Edge Functions: kebab-case folder | Migrations: NNN_snake_case | Schemas: camelCase + Schema

## Tiers
TIER_LIMITS in src/utils/tierLimits.ts is the ONLY source of truth for all limit values.
Always: useTierGate hook + TierGate component client-side AND server-side quota check.

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
src/stores/blueprintStore.ts — blueprint state
src/types/blueprint.ts — BlueprintData type (contract between AI and renderers)
src/theme/ — colours, spacing, typography tokens
supabase/functions/ — all Edge Functions (Deno TypeScript)
supabase/migrations/ — all SQL migrations

## Context Files (read on demand)
tasks/handoffs.md — inter-agent communication
tasks/lessons.md — lessons archive (50 lines max)
docs/adr/ — Architecture Decision Records
