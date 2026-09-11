"""
=============================================================
Application Configuration & Settings — Churn Predictor API
=============================================================
"""

import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directories
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent

def resolve_file_path(filename: str, subfolder: str = "") -> str:
    """
    Intelligently searches multiple candidate locations for an artifact or data file.
    Supports local repo root, backend folder, Docker /app container paths, etc.
    """
    candidates = [
        PROJECT_ROOT / subfolder / filename if subfolder else PROJECT_ROOT / filename,
        BACKEND_DIR / subfolder / filename if subfolder else BACKEND_DIR / filename,
        Path(subfolder) / filename if subfolder else Path(filename),
        Path("/app") / subfolder / filename if subfolder else Path("/app") / filename,
        Path("..") / subfolder / filename if subfolder else Path("..") / filename,
    ]
    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return str(candidate.resolve())
    # Return default expected path
    return str((PROJECT_ROOT / subfolder / filename if subfolder else PROJECT_ROOT / filename).resolve())


class Settings(BaseSettings):
    APP_NAME: str = os.getenv("APP_NAME", "Churn Predictor API")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    API_PREFIX: str = os.getenv("API_PREFIX", "/api/v1")
    
    # Server host & port
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1")

    # Inference defaults
    DEFAULT_THRESHOLD: float = float(os.getenv("DEFAULT_THRESHOLD", "0.61"))

    # Security & Rate Limiting
    RATE_LIMIT_MAX_REQUESTS: int = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "300"))
    RATE_LIMIT_WINDOW_SECONDS: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
    MAX_UPLOAD_SIZE_BYTES: int = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(10 * 1024 * 1024))) # 10MB
    API_KEY: Optional[str] = os.getenv("API_KEY", None)

    # Raw Dataset Path
    RAW_DATA_PATH: str = os.getenv(
        "RAW_DATA_PATH",
        resolve_file_path("WA_Fn-UseC_-Telco-Customer-Churn.csv")
    )
    
    # Model Artifact Paths
    MODEL_PATH: str = os.getenv(
        "MODEL_PATH",
        resolve_file_path("xgboost_churn_model.pkl", "models")
    )
    SCALER_PATH: str = os.getenv(
        "SCALER_PATH",
        resolve_file_path("scaler.pkl", "models")
    )
    META_PATH: str = os.getenv(
        "META_PATH",
        resolve_file_path("feature_metadata.json", "models")
    )
    METRICS_PATH: str = os.getenv(
        "METRICS_PATH",
        resolve_file_path("metrics.json", "reports")
    )
    
    # CORS Origins (comma separated or * for open)
    CORS_ORIGINS: List[str] = [
        x.strip() for x in os.getenv("CORS_ORIGINS", "*").split(",") if x.strip()
    ]
    
    # Output Directory for CSV downloads
    OUTPUT_DIR: str = os.getenv(
        "OUTPUT_DIR",
        str(BACKEND_DIR / "temp_downloads")
    )

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
