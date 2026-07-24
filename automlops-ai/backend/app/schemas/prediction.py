"""
=============================================================
Pydantic Schemas for Prediction & API Models
=============================================================
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class SingleCustomerInput(BaseModel):
    customerID: Optional[str] = "CUST-1001"
    gender: str = "Male"
    SeniorCitizen: int = Field(0, ge=0, le=1)
    Partner: str = "No"
    Dependents: str = "No"
    tenure: int = Field(..., ge=0, description="Tenure in months")
    PhoneService: str = "Yes"
    MultipleLines: str = "No"
    InternetService: str = "Fiber optic"
    OnlineSecurity: str = "No"
    OnlineBackup: str = "No"
    DeviceProtection: str = "No"
    TechSupport: str = "No"
    StreamingTV: str = "No"
    StreamingMovies: str = "No"
    Contract: str = "Month-to-month"
    PaperlessBilling: str = "Yes"
    PaymentMethod: str = "Electronic check"
    MonthlyCharges: float = Field(..., gt=0)
    TotalCharges: Any = Field(..., description="Total charges as float or string")
    threshold: Optional[float] = None

class PredictionOutput(BaseModel):
    customer_id: str
    churn_predicted: int
    churn_status: str
    churn_probability: float
    churn_probability_pct: str
    risk_level: str
    risk_code: str
    threshold_used: float

class BatchPredictionResponse(BaseModel):
    success: bool
    total_records: int
    churn_count: int
    retained_count: int
    churn_rate_pct: float
    download_url: Optional[str] = None
    results: List[PredictionOutput]

class ValidationErrorDetail(BaseModel):
    loc: List[str]
    msg: str
    type: str

class CSVValidationErrorResponse(BaseModel):
    error: str
    missing_columns: List[str] = []
    invalid_rows: List[Dict[str, Any]] = []

class ModelInfoResponse(BaseModel):
    model_name: str = "XGBoost Classifier"
    version: str = "1.0.0"
    num_features: int
    optimal_threshold: float
    training_accuracy: float
    testing_accuracy: float
    roc_auc: float
    recall: float
    precision: float
    f1_score: float
    feature_names: List[str]
