# VIGA GPU Worker — API Contract

## Overview

The VIGA GPU Worker is a standalone Python/Blender service that runs VIGA's iterative Generator→Render→Verifier loop to reconstruct 3D meshes from images. It is deployed separately from the Asoria Supabase infrastructure.

## Endpoint: `POST /reconstruct`

**Description:** Submit a new image-to-3D reconstruction task.

**Request:**
```json
{
  "image_url": "https://supabase/storage/v1/object/public/viga-inputs/uuid.jpg",
  "user_id": "uuid",
  "project_id": "uuid (optional)",
  "mode": "furniture" | "room",
  "callback_url": "https://supabase/functions/v1/viga-webhook?task_id=uuid"
}
```

**Response:** `200 OK`
```json
{ "task_id": "worker-internal-task-id" }
```

## Endpoint: `GET /status/{task_id}`

**Description:** Check the status of a reconstruction task.

**Response (processing):**
```json
{ "status": "processing" }
```

**Response (done):**
```json
{
  "status": "done",
  "gltf_url": "https://supabase/storage/v1/object/public/viga-outputs/uuid.glb",
  "metadata": {
    "name": "Custom Sofa",
    "category": "living",
    "width_m": 2.2,
    "height_m": 0.85,
    "depth_m": 0.95,
    "thumbnail_url": "https://..."
  }
}
```

**Response (failed):**
```json
{ "status": "failed", "error": "Blender render failed" }
```

## Callback (on completion)

The worker MUST call the `callback_url` with a POST request:
```json
{
  "task_id": "worker-internal-task-id",
  "status": "done" | "failed",
  "gltf_url": "https://...",
  "error": "string",
  "metadata": { ... }
}
```

## Deployment Requirements

- **Blender** (headless) installed and callable as `blender`
- **CUDA-enabled GPU** (NVIDIA, RTX 3080+ recommended)
- **VIGA + Infinigen** dependencies in conda envs: `agent`, `blender`, `sam`, `sam3d`
- **Python 3.10/3.11**
- Deployed on: Modal, RunPod, or bare metal
- Environment variables:
  - `VIGA_WORKER_URL` — public URL of this worker
  - `SUPABASE_URL` — Asoria Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (for storage + webhook)
  - `OPENAI_API_KEY` — for VIGA agent LLM calls
  - `MESHY_API_KEY` — for optional post-processing

## GLTF Export

The worker converts `.blend` output to GLTF using Blender headless:
```
blender --background --python-expr "import bpy; bpy.ops.export_scene.gltf(filepath='output.glb')"
```

Upload the resulting GLTF to Supabase Storage (`viga-outputs` bucket) before calling the webhook.
