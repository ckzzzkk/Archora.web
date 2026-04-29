"""
Blender Blueprint Renderer — FastAPI worker.
Receives Asoria blueprint JSON → builds a Blender scene → exports GLTF → uploads to Supabase Storage.
"""
import json
import os
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import requests

app = FastAPI(title="Blender Blueprint Renderer")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# In-memory task store (replace with Redis in production)
tasks: dict[str, dict] = {}


# ============================================================================
# Blender Scene Builder
# ============================================================================

def build_blender_python_script(blueprint_data: dict) -> str:
    """
    Generates a Blender Python script from Asoria BlueprintData JSON.
    Creates walls, floors, ceilings, and furniture from blueprint JSON.
    """
    import json
    bp = json.dumps(blueprint_data)

    return f'''
import bpy
import math
import json

# Clear existing scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

bp = json.loads(''' + f'"""{bp}"""' + ''')

# Materials
def mat(name, color, rough=0.5, metal=0):
    bpy.ops.material.new(name=name)
    m = bpy.data.materials[name]
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    return m

wall_mat  = mat("Wall",  (0.9, 0.85, 0.8, 1), 0.8, 0)
floor_mat = mat("Floor", (0.6, 0.5, 0.4, 1), 0.6, 0)
furn_mat  = mat("Furniture", (0.4, 0.35, 0.3, 1), 0.4, 0.1)

# Helper: add cube
def add_cube(name, sx, sy, sz, x=0, y=0, z=0, material=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (sx, sy, sz)
    obj.data.polygons[0:2]  # trigger recalc
    bpy.ops.object.transform_apply(location=False, scale=True, rotation=True)
    if material:
        obj.data.materials.append(material)
    return obj

# Helper: add plane (floor/wall)
def add_plane(name, sx, sz, x=0, y=0, z=0, rot=(0,0,0), material=None):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(x, y, z))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (sx, 1, sz)
    bpy.ops.object.transform_apply(location=False, scale=True, rotation=True)
    obj.rotation_euler = rot
    if material:
        obj.data.materials.append(material)
    return obj

# Build floors
for floor in bp.get("floors", []):
    for room in floor.get("rooms", []):
        for polygon in room.get("walls", []):
            # polygon is list of [x,y] points — trace wall slabs
            pass
        # Floor slab
        dim = floor.get("dimensions", {{"width": 10, "depth": 10}})
        add_plane("Floor", dim["width"], dim["depth"], z=floor.get("elevation", 0), material=floor_mat)

# Build rooms from walls
for floor in bp.get("floors", []):
    z_base = floor.get("elevation", 0)
    wall_height = 2.7  # default room height in metres
    for room in floor.get("rooms", []):
        # Draw each wall segment
        segments = room.get("wall_segments", [])
        for seg in segments:
            sx = seg.get("length", 3.0)
            start = seg.get("start", {{}})
            x, y = start.get("x", 0), start.get("y", 0)
            angle = seg.get("angle", 0)
            # Wall as thin tall box
            add_cube("Wall", sx, 0.15, wall_height,
                     x=x + sx/2 * math.cos(angle),
                     y=y + sx/2 * math.sin(angle),
                     z=z_base + wall_height/2,
                     material=wall_mat)

# Build furniture
for item in bp.get("furniture", []):
    w = item.get("dimensions", {{}}).get("x", 1.0)
    h = item.get("dimensions", {{}}).get("y", 0.8)
    d = item.get("dimensions", {{}}).get("z", 1.0)
    pos = item.get("worldPosition", {{}})
    add_cube(
        item.get("name", "Furniture"),
        w, d, h,
        x=pos.get("x", 0),
        y=pos.get("y", 0),
        z=pos.get("z", 0) + h/2,
        material=furn_mat
    )

# Camera — place above looking down at center
bpy.ops.object.camera_add(location=(15, -15, 20))
cam = bpy.context.active_object
cam.name = "BlueprintCam"
cam.rotation_euler = (math.radians(60), 0, math.radians(45))
bpy.context.scene.camera = cam

# Lighting — sun + ambient
bpy.ops.object.light_add(type='SUN', location=(10, -10, 20))
sun = bpy.context.active_object
sun.data.energy = 2.0
bpy.ops.object.light_add(type='AMBIENT', location=(0, 0, 10))
ambient = bpy.context.active_object
ambient.data.energy = 0.3

print("Blender scene built successfully")
'''


def run_blender_scene(script: str, output_glb: Path) -> bool:
    """Run a Blender Python script headless and export GLTF."""
    blender_path = os.environ.get("BLENDER_PATH", "blender")

    with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w") as f:
        f.write(script)
        f.flush()
        script_path = f.name

    try:
        result = subprocess.run(
            [
                blender_path, "--background",
                "--python-expr",
                f"exec(open('{script_path}').read()); import bpy; bpy.ops.export_scene.gltf(filepath='{output_glb}')",
            ],
            capture_output=True,
            text=True,
            timeout=300,
        )
        return result.returncode == 0
    finally:
        Path(script_path).unlink(missing_ok=True)


# ============================================================================
# Task Status
# ============================================================================

def render_blueprint(blueprint_data: dict, task_id: str, callback_url: str) -> dict:
    """Build scene, render to GLTF, upload to Supabase, fire callback."""
    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    with tempfile.TemporaryDirectory() as tmpdir:
        output_glb = Path(tmpdir) / "output.glb"

        script = build_blender_python_script(blueprint_data)
        success = run_blender_scene(script, output_glb)

        if not success:
            tasks[task_id] = {"status": "failed", "error": "Blender render failed"}
            return tasks[task_id]

        # Upload to Supabase Storage
        filename = f"{uuid.uuid4()}.glb"
        with open(output_glb, "rb") as f:
            headers = {
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/octet-stream",
                "x-upsert": "true",
            }
            resp = requests.put(
                f"{supabase_url}/storage/v1/object/viga-outputs/{filename}",
                headers=headers,
                data=f,
                timeout=60,
            )
        resp.raise_for_status()

        gltf_url = f"{supabase_url}/storage/v1/object/public/viga-outputs/{filename}"

        tasks[task_id] = {"status": "done", "gltf_url": gltf_url}

        # Fire callback
        try:
            requests.post(callback_url, json={
                "task_id": task_id,
                "status": "done",
                "gltf_url": gltf_url,
            }, timeout=20)
        except Exception:
            pass  # non-fatal

        return tasks[task_id]


# ============================================================================
# FastAPI Endpoints
# ============================================================================

class RenderRequest(BaseModel):
    blueprint_id: str
    blueprint_data: dict
    callback_url: str


class RenderResponse(BaseModel):
    task_id: str


@app.post("/render", response_model=RenderResponse)
async def render(req: RenderRequest) -> RenderResponse:
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "rendering"}

    import concurrent.futures
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)
    executor.submit(render_blueprint, req.blueprint_data, task_id, req.callback_url)

    return RenderResponse(task_id=task_id)


@app.get("/status/{task_id}")
async def get_status(task_id: str):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks[task_id]


@app.get("/health")
async def health():
    return {"status": "ok", "worker": "blender-blueprint-renderer"}
