"""
=============================================================
Application Configuration & Settings
=============================================================
"""

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Churn Predictor API"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Model Artifact Paths
    MODEL_PATH: str = os.getenv("MODEL_PATH", "../models/xgboost_churn_model.pkl")
    SCALER_PATH: str = os.getenv("SCALER_PATH", "../models/scaler.pkl")
    META_PATH: str = os.getenv("META_PATH", "../models/feature_metadata.json")
    METRICS_PATH: str = os.getenv("METRICS_PATH", "../reports/metrics.json")
    
    # CORS Origins
    CORS_ORIGINS: list[str] = ["*"]
    
    # Output Directory for CSV downloads
    OUTPUT_DIR: str = os.getenv("OUTPUT_DIR", "temp_downloads")

    # Legacy Database Compatibility
    DATABASE_URL_SYNC: str = os.getenv("DATABASE_URL_SYNC", "sqlite:///./automlops.db")
    DATABASE_URL_ASYNC: str = os.getenv("DATABASE_URL_ASYNC", "sqlite+aiosqlite:///./automlops.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "churn-predictor-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    class Config:
        case_sensitive = True

settings = Settings()
