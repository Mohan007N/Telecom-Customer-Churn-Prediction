"""
=============================================================
Model Loader Module — Singleton Model Manager
=============================================================
Description: Loads the trained XGBoost model and artifacts ONCE during
             startup and keeps them in memory for fast inference.
=============================================================
"""

import os
import sys
import io
import json
import pickle
import joblib
from pathlib import Path
import pandas as pd
from typing import Dict, List, Union, Optional
from loguru import logger

from app.core.config import settings

def _load_artifact(path_str: str):
    """Safely loads a pickle/joblib file into memory from path or fallbacks."""
    candidates = [
        Path(path_str),
        Path("models") / Path(path_str).name,
        Path("..") / "models" / Path(path_str).name,
        Path(__file__).resolve().parent.parent.parent.parent / "models" / Path(path_str).name,
        Path(__file__).resolve().parent.parent.parent / "models" / Path(path_str).name,
    ]
    
    target_path = None
    for cand in candidates:
        if cand.exists() and cand.is_file():
            target_path = cand
            break
            
    if target_path is None:
        raise FileNotFoundError(f"Artifact not found: {path_str}")
        
    data = target_path.read_bytes()
    try:
        return pickle.loads(data)
    except Exception:
        return joblib.load(io.BytesIO(data))

class ChurnPredictorEngine:
    def __init__(self, model_path: str, scaler_path: str, meta_path: str, metrics_path: str):
        logger.info(f"Loading ML Model artifacts...")
        
        self.model = _load_artifact(model_path)
        self.scaler = _load_artifact(scaler_path)
        
        # Load metadata
        meta_candidates = [
            Path(meta_path),
            Path("models") / Path(meta_path).name,
            Path("..") / "models" / Path(meta_path).name,
            Path(__file__).resolve().parent.parent.parent.parent / "models" / Path(meta_path).name,
        ]
        meta = None
        for cand in meta_candidates:
            if cand.exists() and cand.is_file():
                meta = json.loads(cand.read_text(encoding="utf-8"))
                break
        if meta is None:
            raise FileNotFoundError(f"Metadata not found: {meta_path}")
            
        self.feature_names: List[str] = meta["feature_names"]
        self.dropped_cols: List[str] = meta.get("dropped_cols", ["customerID", "gender", "PhoneService"])
        
        self.threshold = settings.DEFAULT_THRESHOLD
        metrics_candidates = [
            Path(metrics_path),
            Path("reports") / Path(metrics_path).name,
            Path("..") / "reports" / Path(metrics_path).name,
            Path(__file__).resolve().parent.parent.parent.parent / "reports" / Path(metrics_path).name,
        ]
        self.metrics = {}
        for cand in metrics_candidates:
            if cand.exists() and cand.is_file():
                try:
                    self.metrics = json.loads(cand.read_text(encoding="utf-8"))
                    self.threshold = float(self.metrics.get("optimal_threshold", settings.DEFAULT_THRESHOLD))
                    break
                except Exception:
                    pass

        logger.success(f"Model loaded successfully | Features: {len(self.feature_names)} | Threshold: {self.threshold}")

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        # Clean string columns
        for col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].replace("No internet service", "No")
                df[col] = df[col].replace("No phone service", "No")

        # TotalCharges numeric conversion
        if "TotalCharges" in df.columns:
            df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
            df["TotalCharges"] = df["TotalCharges"].fillna(df["TotalCharges"].median() if not df["TotalCharges"].isna().all() else 0)

        # Derived features
        service_cols = [
            "MultipleLines", "InternetService", "OnlineSecurity",
            "OnlineBackup", "DeviceProtection", "TechSupport", "StreamingTV", "StreamingMovies"
        ]
        df["TotalServices"] = 0
        for col in service_cols:
            if col in df.columns:
                df["TotalServices"] += df[col].apply(
                    lambda x: 1 if str(x) in ["Yes", "Fiber optic", "DSL"] else 0
                )

        if "tenure" in df.columns:
            def get_tenure_cohort(months):
                try:
                    m = float(months)
                    if m <= 12: return "0-1 Year"
                    elif m <= 24: return "1-2 Years"
                    elif m <= 48: return "2-4 Years"
                    else: return "4+ Years"
                except Exception:
                    return "0-1 Year"
            df["TenureCohort"] = df["tenure"].apply(get_tenure_cohort)

        if "MonthlyCharges" in df.columns and "TotalCharges" in df.columns:
            df["ChargesRatio"] = df["MonthlyCharges"] / (df["TotalCharges"] + 1e-5)
            df["CostPerService"] = df["MonthlyCharges"] / (df["TotalServices"] + 1)
        
        if "TotalCharges" in df.columns and "MonthlyCharges" in df.columns and "tenure" in df.columns:
            df["ChargeDifference"] = df["TotalCharges"] - (df["MonthlyCharges"] * df["tenure"])

        if "Contract" in df.columns:
            df["HasContract"] = (df["Contract"] != "Month-to-month").astype(int)

        if all(c in df.columns for c in ["SeniorCitizen", "Partner", "Dependents"]):
            df["IsSeniorAndSingle"] = (
                (df["SeniorCitizen"] == 1) &
                (df["Partner"] == "No") &
                (df["Dependents"] == "No")
            ).astype(int)

        # Drop non-feature columns
        for col in self.dropped_cols:
            if col in df.columns:
                df = df.drop(columns=[col])

        if "Churn" in df.columns:
            df = df.drop(columns=["Churn"])

        return df

    def predict_dataframe(self, df: pd.DataFrame, custom_threshold: Optional[float] = None) -> List[Dict]:
        thresh = float(custom_threshold) if custom_threshold is not None else self.threshold

        df_engineered = self._engineer_features(df)
        df_encoded = pd.get_dummies(df_engineered, drop_first=True)
        df_aligned = df_encoded.reindex(columns=self.feature_names, fill_value=0)

        X_scaled = self.scaler.transform(df_aligned)
        probabilities = self.model.predict_proba(X_scaled)[:, 1]
        predictions = (probabilities >= thresh).astype(int)

        medium_threshold = max(0.20, thresh * 0.65)

        results = []
        for i, (prob, pred) in enumerate(zip(probabilities, predictions)):
            p_val = round(float(prob), 4)
            if p_val >= thresh:
                risk = "High Risk"
                risk_code = "HIGH"
            elif p_val >= medium_threshold:
                risk = "Medium Risk"
                risk_code = "MEDIUM"
            else:
                risk = "Low Risk"
                risk_code = "LOW"

            customer_id = df.iloc[i].get("customerID", f"CUST-{i+1:04d}")

            results.append({
                "customer_id": str(customer_id),
                "churn_predicted": int(pred),
                "churn_status": "Churn" if pred == 1 else "Retained",
                "churn_probability": p_val,
                "churn_probability_pct": f"{p_val * 100:.1f}%",
                "risk_level": risk,
                "risk_code": risk_code,
                "threshold_used": thresh
            })

        return results

# Global singleton predictor instance
predictor_instance: Optional[ChurnPredictorEngine] = None

def init_predictor(model_path: str, scaler_path: str, meta_path: str, metrics_path: str):
    global predictor_instance
    predictor_instance = ChurnPredictorEngine(model_path, scaler_path, meta_path, metrics_path)

def get_predictor() -> ChurnPredictorEngine:
    if predictor_instance is None:
        raise RuntimeError("Predictor engine has not been initialized.")
    return predictor_instance
