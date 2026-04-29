# Blender Blueprint Renderer

Receives blueprint JSON → builds a Blender scene programmatically → exports GLTF.

## Quick Start

```bash
cd blender_render
pip install -r requirements.txt
uvicorn viga_worker.main:app --host 0.0.0.0 --port 8000
```

## Environment Variables

```bash
SUPABASE_URL=https://harhahyurvxwnoxugehe.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RENDER_WORKER_URL=http://localhost:8000
```

## API

### POST /render
Submit a blueprint rendering job.

```json
{
  "blueprint_id": "uuid",
  "blueprint_data": { ... },
  "callback_url": "https://harhahyurvxwnoxugehe.supabase.co/functions/v1/render-webhook?project_id=uuid"
}
```

Response: `{ "task_id": "uuid" }`

### GET /status/{task_id}
Check render status.

### POST /render-sync (optional)
Synchronous render — returns GLTF URL directly. Slower but no webhook needed.

## How It Works

1. Receives `BlueprintData` JSON from Asoria
2. Creates a Blender scene with walls, floors, ceilings from the blueprint data
3. Adds furniture as box meshes with dimensions from blueprint data
4. Applies PBR materials (via Blender's Principled BSDF)
5. Renders a camera path for first-person walkthrough
6. Exports to GLTF via Blender headless
7. Uploads GLTF to Supabase Storage `viga-outputs` bucket
8. Calls `callback_url` with the GLTF URL

## Requirements

- **Blender 4.x** (headless) — `blender` must be on PATH or set `BLENDER_PATH`
- **Python 3.11+** with `pip install -r requirements.txt`
- **16GB+ RAM** recommended for scene building
- **No GPU required** — CPU rendering with Cycles (slower but works)
- GPU strongly recommended if available (Blender GPU compute)

## Blender Python Script

The core scene-building logic runs inside Blender. Key operations:
- `bpy.ops.mesh.primitive_cube_add` for furniture
- `bpy.ops.mesh.primitive_plane_add` for floors/walls
- `bpy.ops.object.modifier_add` for bevels and subdivision
- `bpy.ops.export_scene.gltf` for GLTF export

Materials use Blender's Principled BSDF with roughness/metalness from furniture data.
