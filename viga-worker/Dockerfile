FROM ubuntu:22.04

# Install Blender + CUDA + Python
RUN apt-get update && apt-get install -y \
    blender \
    python3.11 \
    python3-pip \
    cuda-toolkit \
    libgl1-mesa-glx \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip3 install -r requirements.txt

# Clone VIGA
RUN git clone https://github.com/Fugtemypt123/VIGA.git /viga && \
    cd /viga && git submodule update --init

COPY . .

ENV VIGA_WORKER_URL=http://localhost:8000
ENV BLENDER_PATH=/usr/bin/blender

EXPOSE 8000
CMD ["uvicorn", "viga_worker.main:app", "--host", "0.0.0.0", "--port", "8000"]
