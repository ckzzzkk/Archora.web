---
name: asoria-3d-system-upgrade-codesign-coprojects-plan
description: Full implementation plan for 3D geometry upgrade + Co-Projects + Codesign
---

# Asoria 3D System Upgrade + Co-Projects + Codesign Implementation Plan

## Context

Asoria is a mobile-first AI architecture platform. Goal: surpass pascalorg/editor (13.8k stars) by building a 3D geometry system that is AI-aware, multiplayer-real-time, and AR-ready. All sessions save to claude mem automatically.

**Key constraints:**
- React Native + Expo SDK 55
- React Three Fiber for 3D (R3F)
- Zustand for state management
- Supabase for backend (Realtime for Codesign)
- Tier-gated: Codesign + Co-Projects = Architect tier only

**Reference:** pascalorg/editor at /tmp/pascal-editor (cloned)

---

## PHASE 1: 3D Geometry Foundation

### Task 1.1 — Wall Mitering System
**What:** Build `src/utils/procedural/wallMitering.ts` — computes proper miter joint geometry at wall corners.

**Details:**
- Adapt from `/tmp/pascal-editor/packages/core/src/systems/wall/wall-mitering.ts`
- Strip Three.js dependencies, return clean boundary point data
- Algorithm: `findJunctions()` groups walls by endpoints, `calculateJunctionIntersections()` computes parallel edge offsets and intersections
- Output: `{ wallId, leftPoints: Point2D[], rightPoints: Point2D[] }` per wall
- Integrate into `ProceduralWall.tsx` — replace simple box rendering with mitered polygon mesh
- Update `Wall` type in `blueprint.ts` — add `curveOffset?: number` for curved wall support

**New file:** `src/utils/procedural/wallMitering.ts`
**Modified:** `src/components/3d/ProceduralWall.tsx`, `src/types/blueprint.ts`

### Task 1.2 — Curved Wall Support
**What:** Build `src/utils/procedural/wallCurve.ts` — sagitta-based arc geometry for curved walls.

**Details:**
- Adapt from `/tmp/pascal-editor/packages/core/src/systems/wall/wall-curve.ts`
- `getWallArcData(wall)` — computes arc center/radius/angles from sagitta
- `getWallCurveFrameAt(wall, t)` — returns `{ point, tangent, normal }` at parameter t
- `getWallSurfacePolygon(wall, segments)` — builds 2D boundary polygon from arc
- Build custom `BufferGeometry` from polygon (no CSG needed)
- Update `ProceduralWall.tsx` to render curved walls differently from straight walls

**New file:** `src/utils/procedural/wallCurve.ts`

### Task 1.3 — Scene Registry + Dirty Batching System
**What:** Build `src/utils/sceneRegistry.ts` + `src/hooks/useDirtyProcessor.ts` + `src/hooks/useRegistry.ts`.

**Details:**
- Scene registry: `Map<id, THREE.Object3D>` + `byType: { wall: Set, slab: Set, ... }`
- `useRegistry(id, type, ref)` hook — registers mesh on mount, deregisters on unmount
- `useDirtyProcessor()` hook — `useFrame`-based, reads `dirtyNodes`, batch-processes geometry
- Add `dirtyNodes: Set<string>` + `markDirty(id)` + `clearDirty(id)` to `blueprintStore`
- Throttle: max ~60 geometry updates/frame (budget management for mobile)

**New files:** `src/utils/sceneRegistry.ts`, `src/hooks/useDirtyProcessor.ts`, `src/hooks/useRegistry.ts`
**Modified:** `src/stores/blueprintStore.ts`

### Task 1.4 — Slab Polygon Geometry
**What:** Build `src/utils/procedural/slabGeometry.ts` — proper polygon-based floor geometry with hole support.

**Details:**
- Adapt from pascalorg's `SlabSystem` + `/tmp/pascal-editor/packages/core/src/systems/slab/slab-system.tsx`
- New type: `Slab { id, polygon: [x,z][], holes: [x,z][][], elevation, autoFromWalls }`
- `FloorData.slabs: Slab[]` — floors can have multiple slabs (room segments, outdoor areas, etc.)
- `buildSlabGeometry(polygon, holes, elevation)` — `THREE.Shape` + `ShapeGeometry` with hole contours via earcut triangulation
- `autoFromWalls` mode: detect enclosing wall loop, compute polygon boundary from wall endpoints
- Replace `ProceduralFloor.tsx` with slab-based rendering using `sceneRegistry`

**New file:** `src/utils/procedural/slabGeometry.ts`
**Modified:** `src/types/blueprint.ts`, `src/components/3d/ProceduralFloor.tsx`

### Task 1.5 — Ceiling System
**What:** Build `src/utils/procedural/ceilingGeometry.ts` + `src/components/3d/ProceduralCeiling.tsx`.

**Details:**
- New type: `Ceiling { id, polygon, holes, height, ceilingType, autoFromWalls }`
- `FloorData.ceilings: Ceiling[]`
- Geometry builders per type:
  - `flat_white/dark` → flat `ShapeGeometry`
  - `coffered` → recessed panel grid (multiple offset polygons)
  - `tray` → single recessed center polygon
  - `vaulted` → angled `ExtrudeGeometry` (two-slope roof-like)
  - `exposed_beams` → parallel box extrusions in one direction
  - `barrel_vault` → curved ceiling via `TubeGeometry` along arc path
- Ceiling positioned at `Y = ceilingHeight - 0.01` to avoid z-fighting with floor

**New files:** `src/utils/procedural/ceilingGeometry.ts`, `src/components/3d/ProceduralCeiling.tsx`
**Modified:** `src/types/blueprint.ts`, `src/components/3d/ProceduralBuilding.tsx`

### Task 1.6 — Roof System
**What:** Build `src/utils/procedural/roofGeometry.ts` + `src/components/3d/ProceduralRoof.tsx`.

**Details:**
- New types: `Roof { id, position, rotation, children: RoofSegmentId[] }` + `RoofSegment { id, roofType, width, depth, wallHeight, roofHeight, overhang }`
- `FloorData.roofs: Roof[]`
- Geometry: CSG-free assembly for RN (no three-bvh-csg on mobile)
  - Each segment type (gable, hip, shed, flat) has a `buildSegmentGeometry()` function
  - `buildGableRoof(w, d, h, overhang)` → two inclined planes meeting at ridge
  - `buildHipRoof(w, d, h, overhang)` → four inclined planes
  - `buildShedRoof(w, d, h, overhang)` → single inclined plane
  - Segments merged via `mergeGeometries()` (BufferGeometry merge)
- Face material remapping: top → shingle material, rake face → edge material, wall-facing → wall material

**New files:** `src/utils/procedural/roofGeometry.ts`, `src/components/3d/ProceduralRoof.tsx`
**Modified:** `src/types/blueprint.ts`, `src/components/3d/ProceduralBuilding.tsx`

### Task 1.7 — Stair Opening Sync + Segment-Based Stairs
**What:** Build `src/utils/procedural/stairGeometry.ts` + update `StairsFurniture.tsx` + `src/utils/procedural/stairOpeningSync.ts`.

**Details:**
- Extend `StaircaseData`: add `width, totalRise, stepCount, innerRadius, sweepAngle, railingMode, railingHeight, slabOpeningMode`
- New type: `StairSegment { id, segmentType: 'stair'|'landing', width, length, height, stepCount, attachmentSide }`
- `StaircaseData.children: StairSegment[]`
- Geometry builder: `buildStairSegmentGeometry(segment)` → `ExtrudeGeometry` from riser/tread profile, rotateY(-90°)
- `buildSpiralStaircase()` → helix of steps + central pole + guard rails
- `buildLStaircase()` → two flights + landing platform
- Stair opening sync: `syncAutoStairOpenings(floor, staircases)` → computes stair footprint polygon at each floor level, adds to `Slab.holes` with `source: 'stair'`
- Update `FloorData` to store `slabs` and use them in floor rendering

**New files:** `src/utils/procedural/stairGeometry.ts`, `src/utils/procedural/stairOpeningSync.ts`
**Modified:** `src/types/blueprint.ts`, `src/components/3d/furniture/StairsFurniture.tsx`, `src/components/3d/ProceduralBuilding.tsx`

---

## PHASE 2: Co-Projects

### Task 2.1 — Co-Projects Database Schema
**What:** Create Supabase migrations for Co-Projects data model.

**Details:**
- New table: `co_projects`
  - `id uuid PK`, `name text`, `owner_id uuid FK`, `created_at`, `updated_at`
- New table: `co_project_members`
  - `id uuid PK`, `project_id uuid FK`, `user_id uuid FK`, `role enum('owner'|'editor'|'viewer')`, `joined_at`
- New table: `co_project_activity`
  - `id uuid PK`, `project_id uuid FK`, `user_id uuid FK`, `action text`, `entity_type text`, `entity_id uuid`, `snapshot jsonb`, `created_at`
- RLS policies: project members can read/write based on role, owner has full access
- Indexes on `project_id`, `user_id` for activity feed queries

**Files:** `supabase/migrations/013_co_projects.sql`, `supabase/migrations/014_co_project_members.sql`, `supabase/migrations/015_co_project_activity.sql`

### Task 2.2 — Co-Projects Store + Service
**What:** Build Zustand store + service for Co-Projects management.

**Details:**
- `src/stores/coProjectStore.ts` — `coProjects: CoProject[]`, `activeProject`, `activityFeed: ActivityEntry[]`
- Actions: `createCoProject`, `joinCoProject`, `leaveCoProject`, `fetchActivityFeed`, `addActivity`
- `src/services/coProjectService.ts` — Supabase queries, RPC calls
- Activity feed: last 50 entries per project, newest first, grouped by date

**New files:** `src/stores/coProjectStore.ts`, `src/services/coProjectService.ts`

### Task 2.3 — Co-Projects UI
**What:** Build Co-Projects screens and components.

**Details:**
- `src/screens/coProjects/CoProjectsScreen.tsx` — list of Co-Projects user belongs to, create new button
- `src/screens/coProjects/CoProjectDetailScreen.tsx` — project detail with activity feed, member list, Codesign button
- `src/components/coProjects/` — `CoProjectCard`, `MemberList`, `ActivityFeed`, `InviteModal`
- Tab bar: Co-Projects section in account tab or new tab
- NativeWind styling per Asoria design language (oval-first UI)

**New files:** `src/screens/coProjects/*.tsx`, `src/components/coProjects/*.tsx`
**Modified:** `src/navigation/` — add CoProjectsStack

---

## PHASE 3: Codesign

### Task 3.1 — Codesign Session Architecture
**What:** Build the core Codesign session system.

**Details:**
- `src/services/codesignService.ts` — session lifecycle (create, join, leave, heartbeat)
- `src/stores/codesignStore.ts` — `sessionId`, `participants: Participant[]`, `cursors: Record<userId, CursorPosition>`, `isActive`
- `Participant { userId, displayName, avatarUrl, cursorPosition, lastSeen }`
- `CursorPosition { x, y, z, floorIndex, tool, selection }`
- Supabase Realtime channel per session: `codesign:${sessionId}`
- Broadcast cursor position at 10fps (throttled)
- Session state synced via Realtime postgres changes subscription on `blueprint_state` table

**New files:** `src/services/codesignService.ts`, `src/stores/codesignStore.ts`

### Task 3.2 — Cursor Presence + Live Editing
**What:** Render other users' cursors in the 3D workspace + propagate edits.

**Details:**
- `src/components/3d/CursorOverlay.tsx` — renders other participants' cursors as named labels with color coding
- Cursor: colored dot + username label, positioned at world coordinates projected to screen
- `useCursorBroadcast()` hook — reads local cursor position, broadcasts to session channel at 10fps throttle
- `useCursorReceive()` hook — subscribes to session channel, updates `codesignStore.cursors`
- Blueprint mutations (wall add, furniture place, etc.) broadcast delta to session channel
- Remote deltas received → applied to local blueprintStore → `markDirty(ids)` for geometry update
- Conflict resolution: last-write-wins with optimistic local apply

**New files:** `src/components/3d/CursorOverlay.tsx`, `src/hooks/useCursorBroadcast.ts`, `src/hooks/useCursorReceive.ts`

### Task 3.3 — Codesign Session UI
**What:** Build UI for starting/joining Codesign sessions.

**Details:**
- `src/screens/codesign/CodesignSessionScreen.tsx` — full-screen 3D editor with live participant bar at top
- Participant bar: avatars of active participants, "X is editing...", connection status indicator
- Floating toolbar: end session, invite more, mute audio (future), participant list overlay
- Session invite: copy link or username search to add collaborators
- Connection states: connecting, connected, reconnecting, disconnected (with clear UX)

**New files:** `src/screens/codesign/CodesignSessionScreen.tsx`, `src/components/codesign/*.tsx`

### Task 3.4 — Blueprint State Sync for Codesign
**What:** Create `blueprint_state` table + Supabase Edge Function for real-time sync.

**Details:**
- New table: `blueprint_state`
  - `project_id uuid`, `floor_index int`, `state jsonb`, `version bigint`, `updated_at`, `updated_by uuid`
- RLS: project members only
- Edge Function: `PATCH /codesign-sync` — accepts delta, applies if version matches expected (optimistic concurrency)
- On apply: insert into `co_project_activity` with action type
- Subscribe to `blueprint_state` changes via Supabase Realtime

**Files:** `supabase/migrations/016_blueprint_state.sql`, `supabase/functions/codesign-sync/index.ts`

---

## PHASE 4: Architect Agent Moderator

### Task 4.1 — Architect Agent Integration in Codesign
**What:** Connect Architect Agent to Codesign sessions as a watching moderator.

**Details:**
- Architect Agent already exists in Asoria (CLAUDE.md). Extend it to accept Codesign session context.
- New hook: `useArchitectAgentModerator(sessionId)` — feeds session events to the agent
- Agent receives: cursor positions, edit deltas, participant actions
- Agent responds with: design suggestions, conflict warnings, improvement prompts
- Suggestions appear as toast notifications or floating annotations in the 3D view
- `architectInsights: string[]` stored in `co_project_activity` for session replay

**New files:** `src/hooks/useArchitectAgentModerator.ts`, `src/services/architectModeratorService.ts`

### Task 4.2 — Architect Agent Suggestions UI
**What:** Render Architect Agent suggestions during Codesign.

**Details:**
- `src/components/codesign/ArchitectSuggestionOverlay.tsx` — floating card showing agent suggestion
- Types: `DesignTip`, `StructuralWarning`, `ConflictAlert`, `ImprovementIdea`
- Auto-dismiss after 10s for non-critical suggestions
- Critical conflicts (e.g., structural issue) persist until user acknowledges
- Suggestion history panel (collapsible) — shows all suggestions from current session

**New files:** `src/components/codesign/ArchitectSuggestionOverlay.tsx`

---

## PHASE 5: Tier Gating + UI Updates

### Task 5.1 — Tier Gating for Co-Projects + Codesign
**What:** Gate Co-Projects and Codesign behind Architect tier.

**Details:**
- `src/utils/tierLimits.ts` — add `codesignEnabled`, `coProjectsEnabled` booleans (Architect only)
- `TierGate` component already exists — use it to wrap Co-Projects and Codesign UI
- CoProjectsScreen: show upgrade prompt for non-Architect users
- Codesign button on CoProjectDetailScreen: only visible if user is Architect
- Backend: Supabase RLS checks `user.tier === 'architect'` on all new tables

**Modified:** `src/utils/tierLimits.ts`, `src/hooks/useTierGate.ts`

### Task 5.2 — BlueprintStore Upgrade for Dirty Node System
**What:** Add dirty nodes + scene registry to blueprintStore as foundation for all systems.

**Details:**
- Add to `blueprintStore` state: `dirtyNodes: Set<string>`
- Add actions: `markDirty(id)`, `clearDirty(id)`, `clearAllDirty()`
- Integrate with existing `mutate()` — after each mutation, mark affected node IDs dirty
- Undo/redo: on undo/redo, diff snapshots and mark only changed nodes dirty (via RAF pattern)
- `sceneRegistry` imported from `src/utils/sceneRegistry.ts` — not in store, global singleton

**Modified:** `src/stores/blueprintStore.ts`

### Task 5.3 — Main Navigation + Tab Bar Updates
**What:** Add Co-Projects to navigation, update tab bar.

**Details:**
- Current tabs: Home · Create · FAB · Inspo · AR · Account
- Co-Projects accessible from Account screen OR dedicated tab (decision: put under Account for now, minimal UI impact)
- Codesign accessible only via CoProjectDetailScreen (start session button)
- Tab bar hides on AR, Create, Codesign sessions

**Modified:** `src/navigation/MainNavigator.tsx`, `src/navigation/CustomTabBar.tsx`

### Task 5.4 — Obsidian Vault Sync
**What:** Auto-sync significant changes to Obsidian vault.

**Details:**
- After any schema change, migration, or major feature: update corresponding vault file in `~/Obsidian/Asoria-Vault/`
- Triggered by: new migration file, new screen, new store, design system change
- Keep vault as a mirror of significant state — code is authoritative

**Modified:** Update vault files per CLAUDE.md protocol after each phase

---

## Task Order

**Phase 1 order (sequential within phase, can run parallel where independence allows):**
1. `Task 1.3` — Scene registry + dirty batching (foundation, all others depend on it)
2. `Task 1.1` — Wall mitering (high visual impact, fast win)
3. `Task 1.2` — Curved walls (depends on 1.1)
4. `Task 1.4` — Slab polygon (depends on 1.3)
5. `Task 1.5` — Ceiling system (depends on 1.4)
6. `Task 1.6` — Roof system (independent, but uses same slab geometry pattern)
7. `Task 1.7` — Stair opening sync (depends on 1.4 + 1.5)

**Phase 2 order:**
8. `Task 2.1` — Database migrations (first, before any service)
9. `Task 2.2` — Store + service (depends on 2.1)
10. `Task 2.3` — UI (depends on 2.2)

**Phase 3 order:**
11. `Task 3.1` — Session architecture (depends on 2.1)
12. `Task 3.4` — Blueprint state sync (depends on 3.1)
13. `Task 3.2` — Cursor presence (depends on 3.1)
14. `Task 3.3` — Session UI (depends on 3.2 + 3.4)

**Phase 4 order:**
15. `Task 4.1` — Architect Agent integration (depends on 3.1)
16. `Task 4.2` — Suggestions UI (depends on 4.1)

**Phase 5 order:**
17. `Task 5.2` — BlueprintStore upgrade (foundation, can happen early alongside 1.3)
18. `Task 5.1` — Tier gating (depends on all features being built)
19. `Task 5.3` — Navigation updates (depends on 5.1)
20. `Task 5.4` — Vault sync (ongoing throughout)

---

## Key Files Reference

### Will be CREATED (new files):
- `src/utils/procedural/wallMitering.ts`
- `src/utils/procedural/wallCurve.ts`
- `src/utils/sceneRegistry.ts`
- `src/hooks/useDirtyProcessor.ts`
- `src/hooks/useRegistry.ts`
- `src/utils/procedural/slabGeometry.ts`
- `src/components/3d/ProceduralCeiling.tsx`
- `src/utils/procedural/ceilingGeometry.ts`
- `src/components/3d/ProceduralRoof.tsx`
- `src/utils/procedural/roofGeometry.ts`
- `src/utils/procedural/stairGeometry.ts`
- `src/utils/procedural/stairOpeningSync.ts`
- `src/stores/coProjectStore.ts`
- `src/services/coProjectService.ts`
- `src/screens/coProjects/CoProjectsScreen.tsx`
- `src/screens/coProjects/CoProjectDetailScreen.tsx`
- `src/components/coProjects/CoProjectCard.tsx`
- `src/components/coProjects/MemberList.tsx`
- `src/components/coProjects/ActivityFeed.tsx`
- `src/components/coProjects/InviteModal.tsx`
- `src/services/codesignService.ts`
- `src/stores/codesignStore.ts`
- `src/components/3d/CursorOverlay.tsx`
- `src/hooks/useCursorBroadcast.ts`
- `src/hooks/useCursorReceive.ts`
- `src/screens/codesign/CodesignSessionScreen.tsx`
- `src/components/codesign/CodesignParticipantBar.tsx`
- `src/components/codesign/CodesignToolbar.tsx`
- `src/hooks/useArchitectAgentModerator.ts`
- `src/services/architectModeratorService.ts`
- `src/components/codesign/ArchitectSuggestionOverlay.tsx`
- `supabase/migrations/013_co_projects.sql`
- `supabase/migrations/014_co_project_members.sql`
- `supabase/migrations/015_co_project_activity.sql`
- `supabase/migrations/016_blueprint_state.sql`
- `supabase/functions/codesign-sync/index.ts`

### Will be MODIFIED:
- `src/types/blueprint.ts` — add Slab, Ceiling, Roof, RoofSegment, StairSegment types; extend StaircaseData
- `src/stores/blueprintStore.ts` — add dirtyNodes, markDirty/clearDirty, scene registry integration
- `src/components/3d/ProceduralWall.tsx` — mitered wall rendering
- `src/components/3d/ProceduralFloor.tsx` — slab-based rendering
- `src/components/3d/ProceduralBuilding.tsx` — add ceiling, roof, slab rendering; update floor group
- `src/components/3d/furniture/StairsFurniture.tsx` — segment-based stair geometry
- `src/navigation/MainNavigator.tsx` — add CoProjectsStack
- `src/navigation/CustomTabBar.tsx` — hide on Codesign sessions
- `src/utils/tierLimits.ts` — add codesignEnabled, coProjectsEnabled
- `src/hooks/useTierGate.ts` — extend for new features

---

## Success Criteria

1. Walls render with proper miter joints at corners — no gaps, no overlaps
2. Floor slabs render as proper polygons derived from room walls — not square approximations
3. Ceiling types (coffered, vaulted, exposed beams) render with correct geometry
4. Roof segments (gable, hip, shed) render with proper assembly
5. Stairs auto-punch holes in floor slabs below them
6. Scene registry + dirty batching working — geometry updates batch in useFrame
7. Co-Projects: user can create project, add members, see activity feed
8. Codesign: two users can join same session and see each other's cursors + edits in real-time
9. Architect Agent suggestions appear during Codesign sessions
10. All features gated to Architect tier
11. Everything auto-saves to claude mem (session logging active)
12. Obsidian vault updated after each phase completion
