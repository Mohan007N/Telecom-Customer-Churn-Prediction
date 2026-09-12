"""
=============================================================
Application Configuration & Settings — Churn Predictor API
=============================================================
"""

import os
import json
from pathlib import Path
from typing import List, Union, Optional
from pydantic import field_validator
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
    APP_NAME: str = "Churn Predictor API"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Server host & port
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    # Inference defaults
    DEFAULT_THRESHOLD: float = 0.61

    # Security & Rate Limiting
    RATE_LIMIT_MAX_REQUESTS: int = 300
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024 # 10MB
    API_KEY: Optional[str] = None

    # Raw Dataset Path
    RAW_DATA_PATH: str = resolve_file_path("WA_Fn-UseC_-Telco-Customer-Churn.csv")
    
    # Model Artifact Paths
    MODEL_PATH: str = resolve_file_path("xgboost_churn_model.pkl", "models")
    SCALER_PATH: str = resolve_file_path("scaler.pkl", "models")
    META_PATH: str = resolve_file_path("feature_metadata.json", "models")
    METRICS_PATH: str = resolve_file_path("metrics.json", "reports")
    
    # CORS Origins (accepts comma-separated string, JSON array, or '*')
    CORS_ORIGINS: Union[str, List[str]] = "*"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            clean = v.strip()
            if clean.startswith("[") and clean.endswith("]"):
                try:
                    return json.loads(clean)
                except Exception:
                    pass
            return [x.strip() for x in clean.split(",") if x.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    # Output Directory for CSV downloads
    OUTPUT_DIR: str = str(BACKEND_DIR / "temp_downloads")

    model_config = SettingsConfigDict(case_sensitive=True, extra="ignore")

settings = Settings()
