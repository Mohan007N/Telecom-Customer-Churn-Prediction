"""
=============================================================
ML Model Metrics & Info API Endpoint
=============================================================
Description: Serves live model metrics from reports/metrics.json
             and model info from models/feature_metadata.json.
             Allows the frontend Dashboard to show real model performance.
=============================================================
"""

import json
import os
import sys
from fastapi import APIRouter
from loguru import logger

router = APIRouter()

# Resolve project root: automlops-ai/backend/app/api/ml_model.py → 5 levels up
_HERE = os.path.dirname(os.path.abspath(__file__))           # .../app/api/
_ROOT = os.path.abspath(os.path.join(_HERE, "..", "..", "..", ".."))  # mlops/

_METRICS_PATH = os.path.join(_ROOT, "reports", "metrics.json")
_META_PATH    = os.path.join(_ROOT, "models", "feature_metadata.json")
_MODEL_PATH   = os.path.join(_ROOT, "models", "xgboost_churn_model.pkl")


@router.get("/ml/metrics")
async def get_model_metrics():
    """
    Returns performance metrics from reports/metrics.json.
    Used by the Dashboard to populate the Best ROC-AUC stat card.
    """
    if not os.path.exists(_METRICS_PATH):
        return {
            "available": False,
            "message": "Model not yet trained. Run python main.py first."
        }
    try:
        with open(_METRICS_PATH, "r") as f:
            metrics = json.load(f)
        return {"available": True, **metrics}
    except Exception as e:
        logger.error(f"Failed to read metrics.json: {e}")
        return {"available": False, "message": str(e)}


@router.get("/ml/model-info")
async def get_model_info():
    """
    Returns feature metadata and model artifact status.
    """
    meta = {}
    if os.path.exists(_META_PATH):
        with open(_META_PATH, "r") as f:
            meta = json.load(f)

    return {
        "model_trained":   os.path.exists(_MODEL_PATH),
        "n_features":      meta.get("n_features", 0),
        "feature_names":   meta.get("feature_names", []),
        "derived_features": meta.get("derived_features", []),
        "dropped_cols":    meta.get("dropped_cols", []),
    }
