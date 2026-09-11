# =============================================================
# Production Dockerfile — Telecom Churn Predictor FastAPI Backend
# =============================================================

# Multi-stage build for minimal image size and fast startup
FROM python:3.12-slim as builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Final minimal production image
FROM python:3.12-slim

WORKDIR /app

# Create non-root user for security compliance
RUN groupadd -g 1000 appgroup && \
    useradd -u 1000 -g appgroup -s /bin/sh -m appuser

# Copy python dependencies from builder
COPY --from=builder /install /usr/local

# Copy backend codebase
COPY . /app

# Create necessary directories and set permissions for non-root user
RUN mkdir -p /app/temp_downloads /app/models /app/reports /app/logs && \
    chown -R appuser:appgroup /app

# Environment configurations
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    PYTHONPATH=/app

EXPOSE 8000

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')" || exit 1

# Launch uvicorn
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
