# VIGA GPU Worker

Standalone Python service that runs VIGA's iterative Generator→Render→Verifier loop to reconstruct 3D meshes from images, exports to GLTF, and calls back to Asoria Supabase.

## Requirements

- NVIDIA GPU with CUDA support (RTX 3080+ recommended)
- Blender (headless) installed and on PATH
- Python 3.10 / 3.11
- Conda environments: `agent`, `blender`, `sam`, `sam3d`

## Setup

```bash
git clone https://github.com/Fugtemypt123/VIGA.git
cd VIGA
git submodule update --init

# Download SAM checkpoint
mkdir -p data/checkpoints
# Place SAM model at data/checkpoints/sam_vit_h_4df910.pth

# Create conda environments
conda env create -f requirements/agent_env.yml
conda env create -f requirements/blender_env.yml
conda env create -f requirements/sam_env.yml
conda env create -f requirements/sam3d_env.yml

# Configure paths
cp utils/_path.py.example utils/_path.py
# Edit utils/_path.py with your conda paths

# Configure API keys
cp utils/_api_keys.py.example utils/_api_keys.py
# Edit utils/_api_keys.py with your ANTHROPIC_API_KEY, MESHY_API_KEY
```

## Environment Variables

```bash
cp .env.example .env
# Fill in all required variables
```

## Run

```bash
pip install fastapi uvicorn python-multipart aiohttp
uvicorn viga_worker.main:app --host 0.0.0.0 --port 8000
```

## API

See `docs/viga-gpu-worker.md` in the Asoria repo for full API contract.
