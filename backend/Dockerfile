# Multi-stage production Dockerfile for Traveler Backend (SS Journey)
FROM python:3.12-slim as base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy application source code and migrations
COPY backend /app/backend
COPY alembic.ini /app/alembic.ini

# Expose port (default Render / standard web port 8000)
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/healthz || exit 1

# Production run command: runs alembic migration then starts uvicorn
CMD ["sh", "-c", "alembic upgrade head && python -m backend.seed && uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
