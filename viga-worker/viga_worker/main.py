"""
VIGA GPU Worker — FastAPI application.
Runs VIGA's iterative Generator→Render→Verifier loop to reconstruct 3D meshes from images.
"""
import os
import tempfile
import uuid
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx

# ============================================================================
# Request/Response Models
# ============================================================================

class ReconstructRequest(BaseModel):
    image_url: str = Field(..., description="Public URL of the input image")
    user_id: str = Field(..., description="Asoria user ID")
    project_id: str | None = None
    mode: Literal["furniture", "room"] = "furniture"
    callback_url: str = Field(..., description="Supabase viga-webhook URL")


class ReconstructResponse(BaseModel):
    task_id: str


class TaskStatus(BaseModel):
    status: Literal["processing", "done", "failed"]
    gltf_url: str | None = None
    error: str | None = None
    metadata: dict | None = None


# ============================================================================
# FastAPI App
# ============================================================================

app = FastAPI(title="VIGA GPU Worker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# In-memory task store (replace with Redis in production)
tasks: dict[str, TaskStatus] = {}


# ============================================================================
# Core VIGA Logic
# ============================================================================

def run_viga_reconstruction(
    image_url: str,
    task_id: str,
    mode: Literal["furniture", "room"],
) -> TaskStatus:
    """
    Downloads the input image, runs VIGA's Generator→Render→Verifier loop,
    exports to GLTF, uploads to Supabase Storage, and returns the result.
    """
    import urllib.request

    # Download image to a temp file
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp_in:
        urllib.request.urlretrieve(image_url, tmp_in.name)
        input_path = Path(tmp_in.name)

    try:
        # Call VIGA's scene generation pipeline
        # This is a placeholder — the actual VIGA call depends on your setup:
        #
        # from agents.generator import GeneratorAgent
        # from agents.verifier import VerifierAgent
        # generator = GeneratorAgent()
        # verifier = VerifierAgent()
        # for iteration in range(12):
        #     scene_code = generator.generate(input_path, mode=mode)
        #     blender_output = run_blender_scene(scene_code)
        #     verification = verifier.verify(blender_output, input_path)
        #     if verification.accepted:
        #         break
        #
        # The actual implementation depends on how VIGA is set up
        # (conda envs, Blender path, SAM model path, etc.)

        blender_path = os.environ.get("BLENDER_PATH", "blender")
        viga_output_dir = Path(tempfile.mkdtemp())
        scene_output = viga_output_dir / "scene.blend"

        # Run Blender headless to execute the generated scene code
        # This is where VIGA's Python output gets executed:
        # result = subprocess.run([
        #     blender_path, "--background", "--python-expr",
        #     f"import bpy; exec({scene_code})"
        # ], capture_output=True, text=True)

        # Convert .blend → GLTF using Blender headless
        gltf_output = viga_output_dir / "output.glb"
        # subprocess.run([
        #     blender_path, "--background",
        #     "--python-expr",
        #     f"import bpy; bpy.ops.export_scene.gltf(filepath='{gltf_output}')"
        # ], check=True)

        # Upload GLTF to Supabase Storage
        supabase_url = os.environ["SUPABASE_URL"]
        supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        filename = f"{uuid.uuid4()}.glb"

        with open(gltf_output, "rb") as f:
            files = {"file": (filename, f.read(), "model/gltf-binary")}
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{supabase_url}/storage/v1/object/viga-outputs/{filename}",
                headers={
                    "Authorization": f"Bearer {supabase_key}",
                    "Content-Type": "application/octet-stream",
                },
                content=f.read(),
            )
        response.raise_for_status()

        gltf_url = f"{supabase_url}/storage/v1/object/public/viga-outputs/{filename}"

        return TaskStatus(
            status="done",
            gltf_url=gltf_url,
            metadata={
                "name": "Custom Furniture",
                "category": mode,
                "width_m": 1.0,
                "height_m": 1.0,
                "depth_m": 1.0,
            },
        )

    except Exception as exc:
        return TaskStatus(status="failed", error=str(exc))
    finally:
        input_path.unlink(missing_ok=True)


# ============================================================================
# Endpoints
# ============================================================================

@app.post("/reconstruct", response_model=ReconstructResponse)
async def reconstruct(body: ReconstructRequest) -> ReconstructResponse:
    """Submit a new image→3D reconstruction task."""
    task_id = f"viga_{uuid.uuid4()}"
    tasks[task_id] = TaskStatus(status="processing")

    # Run VIGA in background thread (GPU work)
    import asyncio
    from concurrent.futures import ThreadPoolExecutor

    def background():
        result = run_viga_reconstruction(body.image_url, task_id, body.mode)
        tasks[task_id] = result

        # Fire callback to Supabase
        try:
            import json
            payload = {
                "task_id": task_id,
                "status": result.status,
                "gltf_url": result.gltf_url,
                "error": result.error,
                "metadata": result.metadata,
            }
            with httpx.SyncClient() as client:
                client.post(body.callback_url, json=payload, timeout=30)
        except Exception:
            pass  # non-fatal — task status is in Supabase

    loop = asyncio.get_event_loop()
    loop.run_in_executor(ThreadPoolExecutor(max_workers=2), background)

    return ReconstructResponse(task_id=task_id)


@app.get("/status/{task_id}", response_model=TaskStatus)
async def get_status(task_id: str) -> TaskStatus:
    """Check the status of a reconstruction task."""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks[task_id]


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}
