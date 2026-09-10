"""
=============================================================
Application Configuration & Settings — Churn Predictor API
=============================================================
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Base directories
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent

class Settings(BaseSettings):
    APP_NAME: str = "Churn Predictor API"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Model Artifact Paths (defaults to project root models/ and reports/)
    MODEL_PATH: str = os.getenv(
        "MODEL_PATH",
        str(PROJECT_ROOT / "models" / "xgboost_churn_model.pkl")
    )
    SCALER_PATH: str = os.getenv(
        "SCALER_PATH",
        str(PROJECT_ROOT / "models" / "scaler.pkl")
    )
    META_PATH: str = os.getenv(
        "META_PATH",
        str(PROJECT_ROOT / "models" / "feature_metadata.json")
    )
    METRICS_PATH: str = os.getenv(
        "METRICS_PATH",
        str(PROJECT_ROOT / "reports" / "metrics.json")
    )
    
    # CORS Origins
    CORS_ORIGINS: list[str] = ["*"]
    
    # Output Directory for CSV downloads
    OUTPUT_DIR: str = os.getenv(
        "OUTPUT_DIR",
        str(BACKEND_DIR / "temp_downloads")
    )

    class Config:
        case_sensitive = True

settings = Settings()
