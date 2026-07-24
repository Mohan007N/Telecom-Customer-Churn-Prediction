"""
=============================================================
Feature Engineering & Preprocessing Module
=============================================================
Author: Machine Learning Engineer
Description: Standardizes columns, constructs derived MLOps features,
             one-hot encodes data, scales features, and returns splits.
             Also saves feature metadata for inference reproducibility.

Fixes applied:
  - Removed duplicate `import json` inside the function body (was line 144).
  - Replaced all print() with structured logging.
=============================================================
"""

import json
import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from typing import Tuple, List

from src.logger import get_logger
from src.config_loader import load_config

logger = get_logger(__name__)


def engineer_and_preprocess(
    df: pd.DataFrame,
    save_metadata: bool = True,
    metadata_dir: str = "models"
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, List[str], StandardScaler]:
    """
    Performs feature engineering by creating derived features, separates
    features and target labels, performs one-hot encoding, and scales features.

    Parameters:
    -----------
    df : pd.DataFrame
        Cleaned dataset.
    save_metadata : bool
        If True, saves feature_names and scaler metadata for inference.
    metadata_dir : str
        Directory where inference metadata (feature_metadata.json) is saved.

    Returns:
    --------
    Tuple
        - X_train (scaled array)
        - X_test (scaled array)
        - y_train (labels array)
        - y_test (labels array)
        - feature_names (List[str])
        - fitted_scaler (StandardScaler)
    """
    logger.info("=========================================")
    logger.info("🛠️  [PREPROCESSING] Engineering Features...")
    logger.info("=========================================")

    cfg = load_config()
    test_size = cfg["training"]["test_size"]
    random_state = cfg["training"]["random_state"]

    # ── 1. Derived Features ────────────────────────────────────────────────
    logger.info("  ✔ Creating derived feature 'TotalServices'...")
    service_cols = [
        "PhoneService", "MultipleLines", "InternetService", "OnlineSecurity",
        "OnlineBackup", "DeviceProtection", "TechSupport", "StreamingTV", "StreamingMovies"
    ]
    df = df.copy()
    df["TotalServices"] = 0
    for col in service_cols:
        if col in df.columns:
            df["TotalServices"] += df[col].apply(
                lambda x: 1 if x in ["Yes", "Fiber optic", "DSL"] else 0
            )

    logger.info("  ✔ Creating derived feature 'TenureCohort'...")
    def get_tenure_cohort(months: int) -> str:
        if months <= 12:
            return "0-1 Year"
        elif months <= 24:
            return "1-2 Years"
        elif months <= 48:
            return "2-4 Years"
        else:
            return "4+ Years"
    df["TenureCohort"] = df["tenure"].apply(get_tenure_cohort)

    logger.info(
        "  ✔ Creating derived features: ChargesRatio, CostPerService, "
        "ChargeDifference, HasContract, IsSeniorAndSingle..."
    )
    df["ChargesRatio"] = df["MonthlyCharges"] / (df["TotalCharges"] + 1e-5)
    df["CostPerService"] = df["MonthlyCharges"] / (df["TotalServices"] + 1)
    df["ChargeDifference"] = df["TotalCharges"] - (df["MonthlyCharges"] * df["tenure"])

    if "Contract" in df.columns:
        df["HasContract"] = (df["Contract"] != "Month-to-month").astype(int)

    if all(col in df.columns for col in ["SeniorCitizen", "Partner", "Dependents"]):
        df["IsSeniorAndSingle"] = (
            (df["SeniorCitizen"] == 1) &
            (df["Partner"] == "No") &
            (df["Dependents"] == "No")
        ).astype(int)

    # ── 2. Drop noisy / identifier columns ────────────────────────────────
    cols_to_drop = ["customerID", "gender", "PhoneService"]
    for col in cols_to_drop:
        if col in df.columns:
            logger.info(f"  ✔ Dropping column '{col}'.")
            df = df.drop(columns=[col])

    # ── 3. Separate features and target ───────────────────────────────────
    logger.info("  ✔ Splitting features (X) and target label (y)...")
    if "Churn" in df.columns:
        df["Churn"] = df["Churn"].map({"No": 0, "Yes": 1})
        y = df["Churn"].values
        X = df.drop(columns=["Churn"])
    else:
        raise ValueError("Target variable 'Churn' not found in dataset!")

    # ── 4. One-Hot Encoding ────────────────────────────────────────────────
    logger.info("  ✔ One-Hot Encoding categorical features...")
    X_encoded = pd.get_dummies(X, drop_first=True)
    feature_names = list(X_encoded.columns)
    logger.info(f"  ✔ Number of features after encoding: {len(feature_names)}")

    # ── 5. Train-Test Split ────────────────────────────────────────────────
    logger.info(
        f"  ✔ Splitting dataset ({int((1 - test_size) * 100)}:{int(test_size * 100)} "
        "Train/Test split, stratified)..."
    )
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X_encoded, y, test_size=test_size, random_state=random_state, stratify=y
    )

    # ── 6. Scaling ─────────────────────────────────────────────────────────
    logger.info("  ✔ Scaling features using StandardScaler (fit on train only)...")
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train_raw)
    X_test = scaler.transform(X_test_raw)

    logger.info(f"  ✔ Train size: {X_train.shape[0]} | Test size: {X_test.shape[0]}")

    # ── 7. Save feature metadata for inference reproducibility ────────────
    if save_metadata:
        os.makedirs(metadata_dir, exist_ok=True)
        meta = {
            "feature_names": feature_names,
            "n_features": len(feature_names),
            "dropped_cols": cols_to_drop,
            "derived_features": [
                "TotalServices", "TenureCohort", "ChargesRatio",
                "CostPerService", "ChargeDifference", "HasContract", "IsSeniorAndSingle"
            ]
        }
        # FIX: removed duplicate `import json` that previously appeared inside
        # this function body (old line 144). `json` is now imported at the top.
        meta_path = os.path.join(metadata_dir, "feature_metadata.json")
        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=4)
        logger.info(f"  ✔ Saved feature metadata to '{meta_path}'")

    return X_train, X_test, y_train, y_test, feature_names, scaler
