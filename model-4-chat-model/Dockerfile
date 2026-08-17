# ============================================================
# Model 4: Career Assistant Chat Model (FastAPI + Groq)
# Port: 5004
# ============================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install Python dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY chat_model.py .

EXPOSE 5004

# Development command with hot-reload
CMD ["uvicorn", "chat_model:app", "--host", "0.0.0.0", "--port", "5004", "--reload"]
