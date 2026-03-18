# ASORIA — Architecture Decisions Log

Lightweight log of key decisions made during development.
Full ADRs live in docs/adr/.

## 2026-03-12 — 3D Renderer Strategy
**Decision:** Use @react-three/fiber (R3F) + @react-three/drei for 3D instead of bare Three.js.
**Reason:** R3F's declarative React API allows furniture/wall components to be composed naturally.
Drei provides out-of-the-box OrbitControls, Sky, Grid, Environment which we need.
**Trade-off:** R3F/Drei require expo-gl (WebGL) — restricts to physical devices (not Expo Go simulator).

## 2026-03-12 — Blueprint Coordinate System
**Decision:** Blueprint XY plane maps to Three.js XZ plane (Y is up in 3D).
**Reason:** Standard architectural drawing convention uses plan view (top-down X/Y).
**Impact:** All `blueprintToScene()` calls must swap `y → z` with elevation as `y`.

## 2026-03-12 — Furniture Component Pattern
**Decision:** Each furniture type is its own React component (Sofa, Chair, Bed, etc.) rather than a config-driven generic renderer.
**Reason:** Gives per-type artistic control over shape, proportions and detail level. Easier to iterate.
**Trade-off:** More files, but each is simple (<100 lines).

## 2026-03-12 — Offline-First Blueprint Storage
**Decision:** MMKV auto-saves blueprint every 2s (debounced). Server sync is secondary.
**Reason:** Blueprint edits are frequent and must survive app kills without server round-trips.
**Impact:** `useOfflineSync` hook handles eventual consistency upload when back online.

## 2026-03-12 — Module Declarations for Native Packages
**Decision:** `src/types/global.d.ts` declares @shopify/react-native-skia, @react-three/fiber/native, @react-three/drei/native as TypeScript modules.
**Reason:** These are installed via native package managers (CocoaPods/Gradle) and Metro, not npm, so they don't appear in package.json. tsc requires declarations to compile cleanly.

## 2026-03-12 — Edge Function Error Handling
**Decision:** All errors go through `_shared/errors.ts` Errors helper. Edge Functions never throw raw exceptions to clients.
**Reason:** Consistent error codes allow the mobile client to handle errors programmatically (show upgrade prompt on QUOTA_EXCEEDED, etc.).

## 2026-03-12 — Audit Log Immutability
**Decision:** `audit_logs` table has no UPDATE/DELETE RLS policies. Records are insert-only.
**Reason:** Audit trails must be tamper-proof. Edge Functions insert via service role.

## 2026-03-12 — Tier Gate Pattern
**Decision:** Every gated feature uses BOTH `useTierGate` (client) AND server-side quota check in the Edge Function.
**Reason:** Client gate is UX only — server is the authoritative enforcement boundary. Both are required.
