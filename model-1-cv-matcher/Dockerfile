# ============================================================
# Model 1: CV-Job Matching Model (FastAPI + BERT)
# Port: 5001
# ============================================================
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required by torch and numpy
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer caching)
COPY requirements.txt .
# Install CPU-only PyTorch from the official PyTorch CPU index.
# The default PyPI torch wheel bundles the entire CUDA toolkit (~2.5GB) and
# times out on slow connections. The CPU wheel satisfies torch>=2.0.0.
# --timeout/--retries keep pip from dying on slow downloads.
RUN pip install --no-cache-dir --timeout 120 --retries 10 torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir --timeout 120 --retries 10 -r requirements.txt

# Copy source code
COPY cv_job_matcher.py .

# Note: the BERT model cache is not committed to the repo. It is downloaded
# once at first startup into the bert-cache directory (named volume in compose)
# and then reused in offline mode.

EXPOSE 5001

# Development command with hot-reload
CMD ["uvicorn", "cv_job_matcher:app", "--host", "0.0.0.0", "--port", "5001", "--reload"]
