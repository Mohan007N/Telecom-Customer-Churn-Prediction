"""
=============================================================
FastAPI API Endpoints — Churn Predictor Routes
=============================================================
"""

import os
from typing import Optional, Dict, Any
from fastapi import APIRouter, File, UploadFile, HTTPException, Query, Body
from fastapi.responses import FileResponse

from app.schemas.prediction import (
    SingleCustomerInput,
    PredictionOutput,
    BatchPredictionResponse,
    ModelInfoResponse
)
from app.services.prediction_service import predict_single, process_batch_csv
from app.services.analytics_service import get_dataset_analytics
from app.services.monitoring_service import monitoring_service
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
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File size exceeds maximum allowed limit ({settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB)"
        )
        
    return process_batch_csv(file_bytes, file.filename)


@router.get("/download-batch-results/{file_id}", summary="Download prediction results CSV file")
async def download_prediction_results(file_id: str):
    """
    Download generated CSV results for a batch prediction.
    """
    # Prevent path traversal
    safe_file_id = os.path.basename(file_id)
    filepath = os.path.join(settings.OUTPUT_DIR, safe_file_id)
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
        raise HTTPException(status_code=404, detail="Model metrics artifact not found or not yet generated.")
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
        training_accuracy=float(metrics.get("train_accuracy", 0.0)),
        testing_accuracy=float(metrics.get("test_accuracy", 0.0)),
        roc_auc=float(metrics.get("roc_auc", 0.0)),
        recall=float(metrics.get("recall", 0.0)),
        precision=float(metrics.get("precision", 0.0)),
        f1_score=float(metrics.get("f1_score", 0.0)),
        feature_names=predictor.feature_names
    )


@router.get("/analytics", summary="Retrieve real Telco customer cohort analytics and telemetry")
async def get_dataset_cohort_analytics():
    """
    Returns full cohort breakdown, distributions, XGBoost feature importances,
    and 12 scored real customer records.
    """
    try:
        return get_dataset_analytics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")


# =====================================================================
# Real-Time Model Monitoring & Drift Detection Endpoints
# =====================================================================

@router.get("/monitoring/metrics", summary="Retrieve real-time inference latency & telemetry")
async def get_monitoring_metrics():
    """
    Returns rolling P50/P95/P99 latency, total inference counts,
    probability distributions, and recent prediction logs.
    """
    return monitoring_service.get_system_metrics()


@router.get("/monitoring/drift", summary="Retrieve Population Stability Index (PSI) drift report")
async def get_monitoring_drift():
    """
    Calculates and returns PSI drift metrics across continuous and
    categorical features against baseline Telco training distribution.
    """
    return monitoring_service.get_drift_report()


@router.get("/monitoring/health", summary="Model serving health and memory telemetry")
async def get_monitoring_health():
    """
    Returns memory footprint, uptime, model status, and overall health.
    """
    try:
        predictor = get_predictor()
        loaded = predictor.model is not None
    except Exception:
        loaded = False

    metrics = monitoring_service.get_system_metrics()
    return {
        "status": "HEALTHY" if loaded else "DEGRADED",
        "model_loaded": loaded,
        "uptime": metrics["uptime_formatted"],
        "memory_mb": metrics["memory_usage_mb"],
        "total_inferences": metrics["total_inferences"],
        "error_rate_pct": metrics["error_rate_pct"],
        "latency_p95_ms": metrics["latency_ms"]["p95"]
    }


@router.post("/monitoring/reset", summary="Reset monitoring telemetry counters")
async def reset_monitoring_telemetry():
    """
    Resets dynamic latency and drift buffers.
    """
    monitoring_service.reset_metrics()
    return {"message": "Monitoring metrics reset successfully."}


@router.post("/monitoring/simulate-traffic", summary="Simulate synthetic live inference traffic for testing")
async def simulate_traffic(count: int = Query(default=15, ge=1, le=100), drift_mode: bool = Query(default=False)):
    """
    Injects synthetic traffic samples into the model to demonstrate live telemetry & drift alerts.
    """
    import random
    
    for i in range(count):
        if drift_mode:
            # Simulate drifted sample (higher monthly charges, short tenure, month-to-month)
            tenure_val = random.randint(1, 8)
            monthly_val = round(random.uniform(95.0, 118.0), 2)
            contract_val = "Month-to-month"
            total_val = round(monthly_val * tenure_val, 2)
            internet_val = "Fiber optic"
            payment_val = "Electronic check"
        else:
            # Normal distribution sample
            tenure_val = random.randint(6, 68)
            monthly_val = round(random.uniform(25.0, 85.0), 2)
            contract_val = random.choice(["Month-to-month", "One year", "Two year"])
            total_val = round(monthly_val * tenure_val, 2)
            internet_val = random.choice(["DSL", "Fiber optic", "No"])
            payment_val = random.choice(["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"])

        sample_input = SingleCustomerInput(
            tenure=tenure_val,
            MonthlyCharges=monthly_val,
            TotalCharges=total_val,
            Contract=contract_val,
            InternetService=internet_val,
            PaymentMethod=payment_val,
            PaperlessBilling="Yes",
            SeniorCitizen=0,
            Partner="No",
            Dependents="No",
            PhoneService="Yes",
            MultipleLines="No",
            OnlineSecurity="No",
            OnlineBackup="No",
            DeviceProtection="No",
            TechSupport="No",
            StreamingTV="No",
            StreamingMovies="No",
            threshold=0.5
        )
        try:
            predict_single(sample_input)
        except Exception:
            pass

    return {
        "message": f"Successfully simulated {count} inferences (drift_mode={drift_mode})",
        "current_metrics": monitoring_service.get_system_metrics()
    }
