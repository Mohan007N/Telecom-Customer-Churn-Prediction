"""
=============================================================
Inference Pipeline — Telco Customer Churn Prediction
=============================================================
Description: Loads the trained XGBoost model, scaler, and feature
             metadata, applies the same preprocessing used during
             training, and returns churn predictions with probabilities.
             
Usage:
    python scripts/predict.py
    python scripts/predict.py --input data/sample_input.json
=============================================================
"""

import os
import sys
import json
import argparse
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Union, Optional

# Ensure UTF-8 output on Windows (prevents UnicodeEncodeError with emoji chars)
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout.reconfigure(encoding="utf-8")



# ─────────────────────────────────────────────────────────
# Default paths — can be overridden via CLI or function args
# ─────────────────────────────────────────────────────────
DEFAULT_MODEL_PATH   = "models/xgboost_churn_model.pkl"
DEFAULT_SCALER_PATH  = "models/scaler.pkl"
DEFAULT_META_PATH    = "models/feature_metadata.json"
DEFAULT_METRICS_PATH = "reports/metrics.json"


class ChurnPredictor:
    """
    Encapsulates all inference logic for the churn prediction model.
    Applies the exact same preprocessing pipeline used during training.
    """

    def __init__(
        self,
        model_path: str = DEFAULT_MODEL_PATH,
        scaler_path: str = DEFAULT_SCALER_PATH,
        meta_path: str = DEFAULT_META_PATH,
        metrics_path: str = DEFAULT_METRICS_PATH
    ):
        print("🔧 Loading model artifacts...")
        self.model  = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)

        with open(meta_path, "r") as f:
            meta = json.load(f)
        self.feature_names: List[str] = meta["feature_names"]
        self.dropped_cols: List[str] = meta.get("dropped_cols", ["customerID", "gender", "PhoneService"])

        # Load optimal threshold from evaluation metrics
        self.threshold = 0.5  # default fallback
        if os.path.exists(metrics_path):
            with open(metrics_path, "r") as f:
                metrics = json.load(f)
            self.threshold = metrics.get("optimal_threshold", 0.5)

        print(f"  ✔ Model loaded: {model_path}")
        print(f"  ✔ Scaler loaded: {scaler_path}")
        print(f"  ✔ Feature names: {len(self.feature_names)} features")
        print(f"  ✔ Decision threshold: {self.threshold:.2f}")

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Applies the same feature engineering as training."""
        df = df.copy()

        # Simplify categories
        for col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].replace("No internet service", "No")
                df[col] = df[col].replace("No phone service", "No")

        # TotalCharges conversion
        df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
        df["TotalCharges"] = df["TotalCharges"].fillna(df["TotalCharges"].median())

        # Derived features
        service_cols = [
            "MultipleLines", "InternetService", "OnlineSecurity",
            "OnlineBackup", "DeviceProtection", "TechSupport", "StreamingTV", "StreamingMovies"
        ]
        df["TotalServices"] = 0
        for col in service_cols:
            if col in df.columns:
                df["TotalServices"] += df[col].apply(
                    lambda x: 1 if x in ["Yes", "Fiber optic", "DSL"] else 0
                )

        def get_tenure_cohort(months):
            if months <= 12: return "0-1 Year"
            elif months <= 24: return "1-2 Years"
            elif months <= 48: return "2-4 Years"
            else: return "4+ Years"
        df["TenureCohort"] = df["tenure"].apply(get_tenure_cohort)

        df["ChargesRatio"] = df["MonthlyCharges"] / (df["TotalCharges"] + 1e-5)
        df["CostPerService"] = df["MonthlyCharges"] / (df["TotalServices"] + 1)
        df["ChargeDifference"] = df["TotalCharges"] - (df["MonthlyCharges"] * df["tenure"])

        if "Contract" in df.columns:
            df["HasContract"] = (df["Contract"] != "Month-to-month").astype(int)

        if all(c in df.columns for c in ["SeniorCitizen", "Partner", "Dependents"]):
            df["IsSeniorAndSingle"] = (
                (df["SeniorCitizen"] == 1) &
                (df["Partner"] == "No") &
                (df["Dependents"] == "No")
            ).astype(int)

        # Drop columns not used in training
        for col in self.dropped_cols:
            if col in df.columns:
                df = df.drop(columns=[col])

        # Drop target if present
        if "Churn" in df.columns:
            df = df.drop(columns=["Churn"])

        return df

    def predict(self, input_data: Union[Dict, List[Dict], pd.DataFrame]) -> List[Dict]:
        """
        Makes churn predictions for one or more customer records.

        Parameters:
        -----------
        input_data : dict | list[dict] | pd.DataFrame
            Raw customer data with the original column names (before preprocessing).

        Returns:
        --------
        list[dict]
            List of prediction results with:
              - churn_predicted (int): 1=Churned, 0=Retained
              - churn_probability (float): Model confidence (0.0 – 1.0)
              - risk_level (str): "High" | "Medium" | "Low"
        """
        # Normalize input to DataFrame
        if isinstance(input_data, dict):
            df = pd.DataFrame([input_data])
        elif isinstance(input_data, list):
            df = pd.DataFrame(input_data)
        elif isinstance(input_data, pd.DataFrame):
            df = input_data.copy()
        else:
            raise TypeError(f"Unsupported input type: {type(input_data)}")

        # Feature engineering
        df_engineered = self._engineer_features(df)

        # One-Hot Encoding
        df_encoded = pd.get_dummies(df_engineered, drop_first=True)

        # Align columns to match training feature set
        df_aligned = df_encoded.reindex(columns=self.feature_names, fill_value=0)

        # Scale
        X_scaled = self.scaler.transform(df_aligned)

        # Predict
        probabilities = self.model.predict_proba(X_scaled)[:, 1]
        predictions = (probabilities >= self.threshold).astype(int)

        results = []
        for prob, pred in zip(probabilities, predictions):
            if prob >= 0.70:
                risk = "High 🔴"
            elif prob >= 0.45:
                risk = "Medium 🟡"
            else:
                risk = "Low 🟢"

            results.append({
                "churn_predicted": int(pred),
                "churn_probability": round(float(prob), 4),
                "risk_level": risk,
                "interpretation": "Customer is likely to churn" if pred == 1 else "Customer is likely to stay"
            })

        return results


# ─────────────────────────────────────────────────────────
# Demo / CLI entrypoint
# ─────────────────────────────────────────────────────────
SAMPLE_CUSTOMERS = [
    {
        "customerID": "DEMO-001",
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
    },
    {
        "customerID": "DEMO-002",
        "gender": "Male",
        "SeniorCitizen": 0,
        "Partner": "Yes",
        "Dependents": "Yes",
        "tenure": 60,
        "PhoneService": "Yes",
        "MultipleLines": "Yes",
        "InternetService": "DSL",
        "OnlineSecurity": "Yes",
        "OnlineBackup": "Yes",
        "DeviceProtection": "Yes",
        "TechSupport": "Yes",
        "StreamingTV": "No",
        "StreamingMovies": "No",
        "Contract": "Two year",
        "PaperlessBilling": "No",
        "PaymentMethod": "Bank transfer (automatic)",
        "MonthlyCharges": 55.00,
        "TotalCharges": "3300.00"
    }
]


def main():
    parser = argparse.ArgumentParser(description="Churn Prediction Inference Script")
    parser.add_argument("--input", type=str, default=None,
                        help="Path to JSON file with customer data (list of dicts)")
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL_PATH)
    parser.add_argument("--scaler", type=str, default=DEFAULT_SCALER_PATH)
    parser.add_argument("--meta", type=str, default=DEFAULT_META_PATH)
    args = parser.parse_args()

    print("=" * 60)
    print("  🤖 Churn Prediction Inference Pipeline")
    print("=" * 60)

    predictor = ChurnPredictor(
        model_path=args.model,
        scaler_path=args.scaler,
        meta_path=args.meta
    )

    if args.input:
        with open(args.input, "r") as f:
            customers = json.load(f)
        print(f"\n📥 Loaded {len(customers)} customer(s) from '{args.input}'")
    else:
        customers = SAMPLE_CUSTOMERS
        print(f"\n📥 Running with {len(customers)} built-in demo customers")

    results = predictor.predict(customers)

    print("\n" + "=" * 60)
    print("📊 PREDICTION RESULTS")
    print("=" * 60)
    for i, (customer, result) in enumerate(zip(customers, results), 1):
        cid = customer.get("customerID", f"Customer #{i}")
        print(f"\n  [{i}] {cid}")
        print(f"      Churn Predicted  : {'✅ YES - Churner' if result['churn_predicted'] else '✅ NO - Retained'}")
        print(f"      Churn Probability : {result['churn_probability']:.1%}")
        print(f"      Risk Level        : {result['risk_level']}")
        print(f"      Interpretation    : {result['interpretation']}")
    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
