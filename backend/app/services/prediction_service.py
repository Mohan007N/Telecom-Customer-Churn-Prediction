"""
=============================================================
Prediction Service — Business Logic for Single & Batch Predictions
=============================================================
"""

import os
import io
import time
import uuid
import pandas as pd
import numpy as np
from typing import List, Dict, Tuple, Optional, Any
from fastapi import HTTPException
from loguru import logger

from app.core.model_loader import get_predictor
from app.schemas.prediction import (
    SingleCustomerInput,
    PredictionOutput,
    BatchPredictionResponse,
    CSVValidationErrorResponse
)
from app.core.config import settings
from app.core.security import sanitize_csv_formula_injection, sanitize_filename
from app.services.monitoring_service import monitoring_service

# Essential columns required for inference
REQUIRED_CSV_COLUMNS = [
    "tenure", "MonthlyCharges", "TotalCharges", "Contract"
]

# Intelligent column normalization mapping
COLUMN_ALIAS_MAP = {
    "customerid": "customerID",
    "customer_id": "customerID",
    "customer id": "customerID",
    "id": "customerID",
    "tenure": "tenure",
    "tenure_months": "tenure",
    "months": "tenure",
    "monthlycharges": "MonthlyCharges",
    "monthly_charges": "MonthlyCharges",
    "monthly charges": "MonthlyCharges",
    "monthlycharge": "MonthlyCharges",
    "totalcharges": "TotalCharges",
    "total_charges": "TotalCharges",
    "total charges": "TotalCharges",
    "totalcharge": "TotalCharges",
    "contract": "Contract",
    "contract_type": "Contract",
    "internetservice": "InternetService",
    "internet_service": "InternetService",
    "paymentmethod": "PaymentMethod",
    "payment_method": "PaymentMethod",
    "paperlessbilling": "PaperlessBilling",
    "paperless_billing": "PaperlessBilling",
    "seniorcitizen": "SeniorCitizen",
    "senior_citizen": "SeniorCitizen",
    "phoneservice": "PhoneService",
    "phone_service": "PhoneService",
    "multiplelines": "MultipleLines",
    "multiple_lines": "MultipleLines",
    "onlinesecurity": "OnlineSecurity",
    "online_security": "OnlineSecurity",
    "onlinebackup": "OnlineBackup",
    "online_backup": "OnlineBackup",
    "deviceprotection": "DeviceProtection",
    "device_protection": "DeviceProtection",
    "techsupport": "TechSupport",
    "tech_support": "TechSupport",
    "streamingtv": "StreamingTV",
    "streaming_tv": "StreamingTV",
    "streamingmovies": "StreamingMovies",
    "streaming_movies": "StreamingMovies",
    "gender": "gender",
    "partner": "Partner",
    "dependents": "Dependents"
}

def predict_single(input_data: SingleCustomerInput) -> PredictionOutput:
    start_time = time.perf_counter()
    try:
        predictor = get_predictor()
        data_dict = input_data.model_dump()
        
        # Ensure TotalCharges is numeric string or float
        data_dict["TotalCharges"] = str(data_dict["TotalCharges"])
        
        df = pd.DataFrame([data_dict])
        results = predictor.predict_dataframe(df, custom_threshold=input_data.threshold)
        
        res = results[0]
        output = PredictionOutput(**res)

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        monitoring_service.record_single_prediction(data_dict, res, elapsed_ms)

        return output
    except Exception as e:
        monitoring_service.record_error()
        logger.error(f"Single prediction execution error: {e}")
        raise e


def process_batch_csv(file_bytes: bytes, filename: str) -> BatchPredictionResponse:
    start_time = time.perf_counter()
    try:
        predictor = get_predictor()
        
        try:
            df_raw = pd.read_csv(io.BytesIO(file_bytes))
        except Exception as e:
            monitoring_service.record_error()
            raise HTTPException(
                status_code=400,
                detail=f"Invalid CSV file format: {str(e)}"
            )

        if df_raw.empty:
            monitoring_service.record_error()
            raise HTTPException(
                status_code=400,
                detail="Uploaded CSV file is empty."
            )

        # Normalize column names intelligently (strip whitespace, lowercase lookup)
        renamed_cols = {}
        for col in df_raw.columns:
            clean_name = str(col).strip()
            lookup_key = clean_name.lower().replace("-", "_")
            if lookup_key in COLUMN_ALIAS_MAP:
                renamed_cols[col] = COLUMN_ALIAS_MAP[lookup_key]
            else:
                renamed_cols[col] = clean_name
        df_raw = df_raw.rename(columns=renamed_cols)

        # 1. Validate required columns
        missing_cols = [col for col in REQUIRED_CSV_COLUMNS if col not in df_raw.columns]
        if missing_cols:
            monitoring_service.record_error()
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "CSV Validation Failed: Missing required columns.",
                    "missing_columns": missing_cols,
                    "required_columns": REQUIRED_CSV_COLUMNS
                }
            )

        # Fill default values for optional columns if missing
        default_values = {
            "customerID": [f"CUST-{i+1:04d}" for i in range(len(df_raw))],
            "gender": "Male",
            "SeniorCitizen": 0,
            "Partner": "No",
            "Dependents": "No",
            "PhoneService": "Yes",
            "MultipleLines": "No",
            "InternetService": "Fiber optic",
            "OnlineSecurity": "No",
            "OnlineBackup": "No",
            "DeviceProtection": "No",
            "TechSupport": "No",
            "StreamingTV": "No",
            "StreamingMovies": "No",
            "PaperlessBilling": "Yes",
            "PaymentMethod": "Electronic check"
        }

        for col, def_val in default_values.items():
            if col not in df_raw.columns:
                df_raw[col] = def_val

        # 2. Convert & handle missing numeric values
        df_raw["tenure"] = pd.to_numeric(df_raw["tenure"], errors="coerce").fillna(1)
        df_raw["MonthlyCharges"] = pd.to_numeric(df_raw["MonthlyCharges"], errors="coerce").fillna(50.0)
        df_raw["TotalCharges"] = pd.to_numeric(df_raw["TotalCharges"], errors="coerce")
        df_raw["TotalCharges"] = df_raw["TotalCharges"].fillna(df_raw["MonthlyCharges"] * df_raw["tenure"])

        # 3. Execute batch predictions
        results_list = predictor.predict_dataframe(df_raw)
        
        # 4. Append predictions back to dataframe for export CSV
        df_export = df_raw.copy()
        df_export["Churn_Predicted"] = [r["churn_predicted"] for r in results_list]
        df_export["Churn_Status"] = [r["churn_status"] for r in results_list]
        df_export["Churn_Probability"] = [r["churn_probability"] for r in results_list]
        df_export["Risk_Level"] = [r["risk_level"] for r in results_list]

        # Sanitize CSV values against formula injection
        for col in df_export.columns:
            if df_export[col].dtype == 'object':
                df_export[col] = df_export[col].apply(sanitize_csv_formula_injection)

        # Save output CSV file for download
        os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
        safe_name = sanitize_filename(f"results_{uuid.uuid4().hex[:8]}.csv")
        output_filepath = os.path.join(settings.OUTPUT_DIR, safe_name)
        df_export.to_csv(output_filepath, index=False)
        
        # Also save as fixed name prediction_results.csv
        df_export.to_csv(os.path.join(settings.OUTPUT_DIR, "prediction_results.csv"), index=False)

        total_records = len(results_list)
        churn_count = sum(1 for r in results_list if r["churn_predicted"] == 1)
        retained_count = total_records - churn_count
        churn_rate_pct = round((churn_count / total_records) * 100, 2) if total_records > 0 else 0.0

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        monitoring_service.record_batch_predictions(df_raw, results_list, elapsed_ms)

        return BatchPredictionResponse(
            success=True,
            total_records=total_records,
            churn_count=churn_count,
            retained_count=retained_count,
            churn_rate_pct=churn_rate_pct,
            download_url=f"/api/v1/download-batch-results/{safe_name}",
            results=[PredictionOutput(**r) for r in results_list]
        )
    except HTTPException:
        raise
    except Exception as e:
        monitoring_service.record_error()
        logger.error(f"Batch prediction execution error: {e}")
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")
