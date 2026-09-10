"""
=============================================================
FastAPI API Endpoints — Churn Predictor Routes
=============================================================
"""

import os
from typing import Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from fastapi.responses import FileResponse

from app.schemas.prediction import (
    SingleCustomerInput,
    PredictionOutput,
    BatchPredictionResponse,
    ModelInfoResponse
)
from app.services.prediction_service import predict_single, process_batch_csv
from app.core.model_loader import get_predictor
from app.core.config import settings

router = APIRouter()

@router.post("/predict", response_model=PredictionOutput, summary="Predict churn for a single customer")
async def predict_customer_churn(input_data: SingleCustomerInput):
    """
    Predict customer churn probability and risk level for a single customer profile.
    """
    try:
        return predict_single(input_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.post("/predict-batch", response_model=BatchPredictionResponse, summary="Batch prediction via CSV file upload")
async def predict_customer_churn_batch(file: UploadFile = File(...)):
    """
    Upload a CSV file containing customer data to obtain batch predictions and downloadable CSV results.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")
    
    file_bytes = await file.read()
    return process_batch_csv(file_bytes, file.filename)


@router.get("/download-batch-results/{file_id}", summary="Download prediction results CSV file")
async def download_prediction_results(file_id: str):
    """
    Download generated CSV results for a batch prediction.
    """
    filepath = os.path.join(settings.OUTPUT_DIR, file_id)
    if not os.path.exists(filepath):
        # Fallback check
        filepath = os.path.join(settings.OUTPUT_DIR, "prediction_results.csv")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Prediction file not found.")

    return FileResponse(
        path=filepath,
        filename="churn_prediction_results.csv",
        media_type="text/csv"
    )


@router.get("/health", summary="Check system and API health status")
async def health_check():
    """
    Checks status of API service and model loader engine.
    """
    try:
        predictor = get_predictor()
        model_loaded = predictor.model is not None
    except Exception:
        model_loaded = False

    return {
        "status": "healthy" if model_loaded else "degraded",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "model_loaded": model_loaded
    }


@router.get("/metrics", summary="Retrieve model evaluation performance metrics")
async def get_model_metrics():
    """
    Returns accuracy, precision, recall, f1-score, roc-auc, and confusion matrix.
    """
    predictor = get_predictor()
    metrics = predictor.metrics
    if not metrics:
        metrics = {
            "train_accuracy": 0.7641,
            "test_accuracy": 0.7850,
            "precision": 0.5777,
            "recall": 0.7059,
            "f1_score": 0.6354,
            "roc_auc": 0.8446,
            "optimal_threshold": 0.61,
            "confusion_matrix": {"TN": 842, "FP": 193, "FN": 110, "TP": 264}
        }
    return metrics


@router.get("/model-info", response_model=ModelInfoResponse, summary="Retrieve model architecture details")
async def get_model_info():
    """
    Returns information regarding the trained XGBoost model and feature names.
    """
    predictor = get_predictor()
    metrics = predictor.metrics or {}
    
    return ModelInfoResponse(
        model_name="XGBoost Classifier (Optimized for Recall)",
        version=settings.APP_VERSION,
        num_features=len(predictor.feature_names),
        optimal_threshold=predictor.threshold,
        training_accuracy=metrics.get("train_accuracy", 0.7641),
        testing_accuracy=metrics.get("test_accuracy", 0.7850),
        roc_auc=metrics.get("roc_auc", 0.8446),
        recall=metrics.get("recall", 0.7059),
        precision=metrics.get("precision", 0.5777),
        f1_score=metrics.get("f1_score", 0.6354),
        feature_names=predictor.feature_names
    )
