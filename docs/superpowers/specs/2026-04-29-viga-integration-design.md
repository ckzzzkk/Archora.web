# VIGA Integration Design — Asoria Architect Tier

**Date:** 2026-04-29
**Status:** Draft
**Owner:** Asoria Architecture Team

---

## 1. Problem Statement

Architect tier subscribers need:
1. **Image-to-3D reconstruction** — upload a photo of any object/room, get a 3D mesh they can place in blueprints and AR
2. **High-fidelity walkthrough** — explore their blueprint in a photorealistic first-person walkthrough within the app
3. **Integration with existing AI/AR/Sketch pipelines** — custom meshes should be usable across all Asoria surfaces (AR placement, AI generation reference, Sketch → 3D path)

Currently Asoria's 3D system is entirely procedural (R3F + Three.js, no loaded GLTF files). The Architect tier needs a bridge to external real-world reference data.

---

## 2. Solution Overview

**VIGA** (Vision-as-Inverse-Graphics Agent) handles image-to-3D reconstruction via an iterative Generator→Render→Verifier loop running on Blender.

The R3F blueprint viewer stays as the primary editor. VIGA is additive — it produces custom furniture meshes that feed into the existing system.

```
[Mobile App]                        [GPU Worker Service]
  |                                        |
  |-- Blueprint JSON --------------------->| (for walkthrough: R3F handles directly)
  |-- Upload Photo ----------------------->| VIGA image→3D pipeline
  |                                        | Blender renders + converts .blend→GLTF
  |<-- Supabase Storage URL (GLTF) --------|
  |                                        |
  v                                        v
[Three.js GLTFLoader]            [Supabase Storage]
[Places mesh in R3F/AR]          [GLTF stored here]
```

---

## 3. Architecture

### 3.1 VIGA GPU Worker Service

A standalone Python/Blender GPU service deployed on Modal, RunPod, or bare metal.

**Responsibilities:**
- Run VIGA's iterative Generator→Render→Verifier loop
- Convert output `.blend` files to GLTF/GLB via Blender headless
- Return GLTF URL via callback or polling

**Stack:**
- Python 3.10/3.11 with Conda environments (`agent`, `blender`, `sam`, `sam3d`)
- Blender (headless) for scene rendering and GLTF export
- CUDA-enabled GPU (NVIDIA, recommended RTX 3080+)
- VIGA framework + Infinigen dependencies

**Environments:**
- `blender` env: runs `bpy` scripts for scene export
- `sam` / `sam3d` envs: for scene segmentation during reconstruction
- `agent` env: VIGA's Generator/Verifier loop

**API Interface:**
```
POST /reconstruct
Body: { image_url, user_id, project_id, mode: "furniture" | "room" }
Response: { task_id }

GET /status/{task_id}
Response: { status: "processing" | "done" | "failed", gltf_url?: string, error?: string }
```

### 3.2 Supabase Edge Function Orchestration

**`POST /functions/v1/viga-request`**
- Validates JWT, checks tier (Architect only)
- Downloads user image from provided URL
- Calls GPU worker `POST /reconstruct`
- Stores task record in `viga_tasks` table
- Returns `task_id` to client

**`POST /functions/v1/viga-webhook`** (called by GPU worker on completion)
- Updates `viga_tasks` row with `gltf_url`
- If furniture: inserts into `custom_furniture` table (linked to `user_id`)
- Triggers Supabase Realtime notification to client

### 3.3 Database Tables

**`viga_tasks`**
```sql
id          uuid primary key,
user_id     uuid references auth.users,
project_id  uuid,
task_id     text unique,          -- GPU worker task ID
mode        text,                 -- 'furniture' | 'room'
status      text,                 -- 'pending' | 'processing' | 'done' | 'failed'
gltf_url    text,
created_at  timestamptz,
updated_at  timestamptz
```

**`custom_furniture`**
```sql
id                uuid primary key,
user_id           uuid references auth.users,
viga_task_id      uuid references viga_tasks,
name              text,
gltf_url          text,
thumbnail_url     text,
width_m           float,
height_m          float,
depth_m           float,
category          text,
created_at        timestamptz
```

### 3.4 Mobile App Integration

**Image-to-3D Flow (VIGAScreen):**
1. User opens VIGAScreen (Architect tier only — TierGate enforced)
2. Selects source: camera or photo library
3. Optionally names the object and sets category
4. Submits → shows progress indicator (async, not blocking)
5. On completion: GLTF downloaded and cached locally
6. Mesh added to `blueprintStore.furniture` and to AR `FURNITURE_CATALOGUE`
7. User can place it in blueprint or AR like any other furniture

**Sketch → VIGA path:**
- SketchScreen export → upload as reference image → VIGAScreen reconstructs → places in blueprint

**AI Generation integration:**
- Step 5 (reference image) can now use a VIGA-reconstructed mesh as the reference
- The GLTF URL or its features are passed to the AI generation edge function as supplemental context

---

## 4. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Hosting | Separate GPU worker service | VIGA needs Blender + CUDA, can't run in Edge Functions |
| Output format | `.blend → GLTF` via Blender headless | Mobile needs GLTF; Three.js GLTFLoader already in app |
| Walkthrough | R3F first-person (no VIGA) | R3F already supports first-person mode; VIGA doesn't add value here |
| Image-to-3D UX | Async with notification | VIGA takes minutes due to iterative loop; blocking UX is unrealistic |
| Tier gate | Architect only | GPU cost is significant; image-to-3D is a premium Architect feature |
| Realtime feedback | Supabase Realtime | Task status updates pushed to app without polling |

---

## 5. Integration with Existing Systems

### 5.1 AR System
- Custom furniture from VIGA stored in `custom_furniture` table
- `ARPlaceMode` fetches user's custom furniture alongside `FURNITURE_CATALOGUE`
- `addFurnitureFromAR()` already accepts furniture world positions — mesh dimensions from VIGA used for hit testing scale
- Works because AR module uses world position + dimensions, not mesh hardcoding

### 5.2 AI Generation (GenerationScreen)
- Step 5 reference image: user can now select a VIGA-reconstructed mesh
- Mesh features (dimensions, proportions) passed to `ai-generate` edge function
- Optionally: trigger a Meshy AI refinement pass on the VIGA output (Architect tier — Meshy already in stack)

### 5.3 Sketch (SketchScreen)
- Export sketch as reference image to Supabase Storage
- Auto-populates VIGAScreen with sketch as source image
- This creates a "sketch → 3D model" path that bypasses the AI interview for simple objects

### 5.4 Blueprint Viewer (R3F)
- GLTFLoader renders VIGA output meshes alongside procedural furniture
- No changes to `ProceduralBuilding` or `blueprintStore` required
- Mesh loaded as `<GltfMesh>` or similar R3F primitive with position/rotation/scale from `blueprintStore.furniture`

---

## 6. Open Questions / Future Work

1. **Walkthrough quality** — R3F first-person is functional but not photorealistic. If Architect users want photorealism, we could add a VIGA "render from blueprint" path that outputs a static image only (not a walkthrough video). This is out of scope for v1.

2. **Meshy AI integration** — Architect tier already has Meshy access. After VIGA produces a raw reconstruction, a Meshy refinement pass could clean up topology. Not in v1.

3. **Room-level reconstruction** — VIGA's static scene mode can reconstruct a full room from a single image. This could feed into the blueprint itself (auto-detect walls, rooms, doors). Higher complexity, out of scope for v1.

4. **Iteration count UX** — VIGA runs 12-24 iterations by default. We expose this as a quality slider (Low/Medium/High) that maps to iteration counts. Not in v1 — start with fixed default.

5. **Concurrency / rate limits** — GPU workers have limited parallelism. Architect tier should have a `viga_requests_per_month` limit tracked in `user_metadata` or a dedicated table.

---

## 7. Scope for Implementation

### In Scope (v1)
- VIGA GPU worker service (deployment + API)
- Supabase Edge Function orchestration
- `viga_tasks` + `custom_furniture` tables + RLS
- VIGAScreen (Architect-tier gated, async upload → mesh)
- GLTF loading in app + placement in blueprint and AR
- Supabase Realtime notifications for task completion

### Out of Scope
- Photorealistic walkthrough (R3F first-person is sufficient for v1)
- Meshy AI refinement on VIGA output
- Room-level reconstruction
- Quality slider for iteration control
- Rate limiting beyond tier gate
