"""
=============================================================
FastAPI Real-Time Serving Endpoint
=============================================================
Description: Production-ready REST API for real-time churn predictions.
             Uses the trained XGBoost model with the full inference pipeline.

Run:
    uvicorn scripts.serve:app --reload --port 8080

Endpoints:
    GET  /health         — Health check
    GET  /model-info     — Model metadata & metrics
    POST /predict        — Single or batch prediction
    GET  /docs           — Swagger UI
=============================================================
"""

import os
import sys
import json
from typing import List, Dict, Optional, Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import time

# Add project root to path for module imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.predict import ChurnPredictor


# ─────────────────────────────────────────────────────────
# Pydantic Schemas
# ─────────────────────────────────────────────────────────
class CustomerInput(BaseModel):
    """Schema for a single customer record."""
    customerID: Optional[str] = Field(default=None, description="Optional customer identifier")
    gender: Optional[str] = Field(default="Male")
    SeniorCitizen: int = Field(default=0, ge=0, le=1)
    Partner: str = Field(default="No")
    Dependents: str = Field(default="No")
    tenure: int = Field(default=1, ge=0, description="Months as customer")
    PhoneService: str = Field(default="Yes")
    MultipleLines: str = Field(default="No")
    InternetService: str = Field(default="No")
    OnlineSecurity: str = Field(default="No")
    OnlineBackup: str = Field(default="No")
    DeviceProtection: str = Field(default="No")
    TechSupport: str = Field(default="No")
    StreamingTV: str = Field(default="No")
    StreamingMovies: str = Field(default="No")
    Contract: str = Field(default="Month-to-month")
    PaperlessBilling: str = Field(default="Yes")
    PaymentMethod: str = Field(default="Electronic check")
    MonthlyCharges: float = Field(default=70.0, ge=0)
    TotalCharges: Any = Field(default="70.0", description="Total charges (numeric or string)")

    class Config:
        json_schema_extra = {
            "example": {
                "customerID": "CUST-001",
                "gender": "Female",
                "SeniorCitizen": 0,
                "Partner": "No",
                "Dependents": "No",
                "tenure": 2,
                "PhoneService": "Yes",
                "MultipleLines": "No",
                "InternetService": "Fiber optic",
                "OnlineSecurity": "No",
                "OnlineBackup": "No",
                "DeviceProtection": "No",
                "TechSupport": "No",
                "StreamingTV": "No",
                "StreamingMovies": "No",
                "Contract": "Month-to-month",
                "PaperlessBilling": "Yes",
                "PaymentMethod": "Electronic check",
                "MonthlyCharges": 89.85,
                "TotalCharges": "179.70"
            }
        }


class BatchPredictRequest(BaseModel):
    customers: List[CustomerInput] = Field(description="List of customer records")


class PredictionResult(BaseModel):
    customerID: Optional[str]
    churn_predicted: int
    churn_probability: float
    risk_level: str
    interpretation: str
    latency_ms: Optional[float]


class PredictResponse(BaseModel):
    predictions: List[PredictionResult]
    total_customers: int
    churners_detected: int
    churn_rate: float
    avg_latency_ms: float


# ─────────────────────────────────────────────────────────
# Initialize FastAPI App
# ─────────────────────────────────────────────────────────
app = FastAPI(
    title="Churn Prediction API",
    description="Real-time Telco Customer Churn Prediction powered by XGBoost",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load predictor once at startup (singleton)
_predictor: Optional[ChurnPredictor] = None


def get_predictor() -> ChurnPredictor:
    global _predictor
    if _predictor is None:
        _predictor = ChurnPredictor()
    return _predictor


# ─────────────────────────────────────────────────────────
# Lifespan — load model on startup
# ─────────────────────────────────────────────────────────
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    get_predictor()  # Preload model
    yield

app.router.lifespan_context = lifespan


# ─────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": _predictor is not None,
        "service": "Churn Prediction API",
        "version": "1.0.0"
    }


@app.get("/model-info", tags=["Model"])
async def model_info():
    """Returns model metadata and performance metrics."""
    predictor = get_predictor()
    metrics = {}
    if os.path.exists("reports/metrics.json"):
        with open("reports/metrics.json", "r") as f:
            metrics = json.load(f)
    meta = {}
    if os.path.exists("models/feature_metadata.json"):
        with open("models/feature_metadata.json", "r") as f:
            meta = json.load(f)
    return {
        "model_type": "XGBoost Classifier",
        "n_features": meta.get("n_features", len(predictor.feature_names)),
        "decision_threshold": predictor.threshold,
        "performance_metrics": metrics,
        "feature_names": predictor.feature_names,
        "derived_features": meta.get("derived_features", [])
    }


@app.post("/predict", response_model=PredictResponse, tags=["Prediction"])
async def predict(request: BatchPredictRequest):
    """
    Make churn predictions for one or more customers.
    Accepts a batch of customer records and returns predictions with
    probabilities and risk levels.
    """
    predictor = get_predictor()

    if len(request.customers) == 0:
        raise HTTPException(status_code=400, detail="No customers provided.")

    if len(request.customers) > 1000:
        raise HTTPException(status_code=400, detail="Batch size exceeds maximum of 1000.")

    # Convert Pydantic models to dicts
    customer_dicts = [c.model_dump() for c in request.customers]

    start = time.time()
    try:
        raw_results = predictor.predict(customer_dicts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    elapsed_ms = (time.time() - start) * 1000

    predictions = []
    for customer, result in zip(customer_dicts, raw_results):
        predictions.append(PredictionResult(
            customerID=customer.get("customerID"),
            churn_predicted=result["churn_predicted"],
            churn_probability=result["churn_probability"],
            risk_level=result["risk_level"],
            interpretation=result["interpretation"],
            latency_ms=round(elapsed_ms / len(raw_results), 2)
        ))

    churners = sum(1 for p in predictions if p.churn_predicted == 1)
    return PredictResponse(
        predictions=predictions,
        total_customers=len(predictions),
        churners_detected=churners,
        churn_rate=round(churners / len(predictions), 4),
        avg_latency_ms=round(elapsed_ms, 2)
    )


@app.post("/predict/single", tags=["Prediction"])
async def predict_single(customer: CustomerInput):
    """Make a prediction for a single customer."""
    predictor = get_predictor()
    start = time.time()
    try:
        results = predictor.predict([customer.model_dump()])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    elapsed_ms = round((time.time() - start) * 1000, 2)
    result = results[0]
    result["latency_ms"] = elapsed_ms
    result["customerID"] = customer.customerID
    return result


# ─────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("scripts.serve:app", host="0.0.0.0", port=8080, reload=True)
