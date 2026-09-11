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
    APP_NAME: str = os.getenv("APP_NAME", "Churn Predictor API")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    API_PREFIX: str = os.getenv("API_PREFIX", "/api/v1")
    
    # Server host & port
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1")

    # Inference defaults
    DEFAULT_THRESHOLD: float = float(os.getenv("DEFAULT_THRESHOLD", "0.5"))

    # Security & Rate Limiting
    RATE_LIMIT_MAX_REQUESTS: int = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "180"))
    RATE_LIMIT_WINDOW_SECONDS: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
    MAX_UPLOAD_SIZE_BYTES: int = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(10 * 1024 * 1024)))

    # Raw Dataset Path
    RAW_DATA_PATH: str = os.getenv(
        "RAW_DATA_PATH",
        str(PROJECT_ROOT / "WA_Fn-UseC_-Telco-Customer-Churn.csv")
    )
    
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
    CORS_ORIGINS: list[str] = [
        x.strip() for x in os.getenv("CORS_ORIGINS", "*").split(",") if x.strip()
    ]
    
    # Output Directory for CSV downloads
    OUTPUT_DIR: str = os.getenv(
        "OUTPUT_DIR",
        str(BACKEND_DIR / "temp_downloads")
    )

    class Config:
        case_sensitive = True

settings = Settings()
