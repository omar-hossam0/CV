# ============================================================
# Model 2: CV Classifier Model (FastAPI)
# Port: 5002
# ============================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install Python dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY cv_classifier.py .

EXPOSE 5002

# Development command with hot-reload
CMD ["uvicorn", "cv_classifier:app", "--host", "0.0.0.0", "--port", "5002", "--reload"]
