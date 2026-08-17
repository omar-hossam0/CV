# ============================================================
# Model 3: Skill Analyzer Model (Flask)
# Port: 5003
# ============================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=skill_analyzer.py
ENV FLASK_ENV=development

WORKDIR /app

# Install Python dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY skill_analyzer.py .

EXPOSE 5003

# Development command with hot-reload via Flask debug mode
CMD ["flask", "run", "--host", "0.0.0.0", "--port", "5003", "--debug"]
