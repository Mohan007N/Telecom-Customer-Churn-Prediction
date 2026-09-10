"""
=============================================================
Churn Predictor — Production FastAPI Application Entrypoint
=============================================================
"""

import os
import sys
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from loguru import logger

from app.core.config import settings
from app.core.model_loader import init_predictor
from app.api import endpoints

# Configure Loguru logging
logger.remove()
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> | <level>{message}</level>"
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Loads ML Model into memory ONCE during application startup"""
    logger.info("Initializing Churn Predictor Backend Application...")
    try:
        init_predictor(
            model_path=settings.MODEL_PATH,
            scaler_path=settings.SCALER_PATH,
            meta_path=settings.META_PATH,
            metrics_path=settings.METRICS_PATH
        )
        logger.success("Churn Predictor Model loaded into memory successfully!")
    except Exception as e:
        logger.error(f"Failed to load model artifacts on startup: {e}")
    
    yield
    
    logger.info("Shutting down Churn Predictor Backend...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production MLOps FastAPI Inference Engine for Telecom Customer Churn Prediction",
    docs_url="/docs",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Error handling request {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

# Root endpoint
@app.get("/", summary="API Root Status")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "Online",
        "docs": "/docs",
        "endpoints": [
            "/predict",
            "/predict-batch",
            "/health",
            "/metrics",
            "/model-info"
        ]
    }

# Include endpoints with prefix and root aliases
app.include_router(endpoints.router, prefix=settings.API_PREFIX, tags=["Churn Predictor Core"])
app.include_router(endpoints.router, prefix="", tags=["Direct Endpoints"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
