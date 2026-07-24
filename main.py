"""
=============================================================
Telco Customer Churn Prediction Orchestration Pipeline
=============================================================
Author: Machine Learning Engineer (MLOps)
Description: End-to-end pipeline execution from data cleaning,
             EDA, feature engineering, training, and evaluation.

Fixes applied:
  - Replaced all print() with structured logging.
  - Pipeline paths loaded from config.yaml instead of hardcoded defaults.
=============================================================
"""

import os
import shutil
import pandas as pd
import joblib

from src.data_cleaning import load_and_clean_data
from src.eda import perform_eda
from src.feature_engineering import engineer_and_preprocess
from src.training import train_xgboost_model
from src.evaluation import evaluate_model
from src.logger import get_logger
from src.config_loader import load_config

logger = get_logger(__name__)


def run_pipeline(
    raw_data_path: str = None,
    plots_dir: str = None,
    metrics_path: str = None,
    model_output_path: str = None,
    scaler_output_path: str = None
) -> None:
    """
    Orchestrates the entire machine learning pipeline.

    All path defaults are read from config.yaml; individual arguments
    can override them when calling programmatically.
    """
    cfg = load_config()
    paths = cfg["paths"]
    data_cfg = cfg["data"]

    # Resolve defaults from config if not explicitly passed
    raw_data_path     = raw_data_path     or data_cfg["raw_data_path"]
    plots_dir         = plots_dir         or paths["plots_dir"]
    metrics_path      = metrics_path      or paths["metrics_path"]
    model_output_path = model_output_path or paths["model_output_path"]
    scaler_output_path = scaler_output_path or paths["scaler_output_path"]
    processed_dir     = data_cfg["processed_dir"]

    logger.info("=" * 70)
    logger.info("🎬 MLOps Pipeline Orchestrator — Telco Churn Project")
    logger.info("=" * 70)

    # ── 1. Data Cleaning ──────────────────────────────────────────────────
    try:
        clean_df = load_and_clean_data(raw_data_path)
    except Exception as e:
        logger.error(f"[DATA CLEANING] Failed: {e}", exc_info=True)
        raise

    # ── 2. Exploratory Data Analysis ──────────────────────────────────────
    try:
        perform_eda(clean_df, output_dir=plots_dir)
    except Exception as e:
        logger.error(f"[EDA] Failed: {e}", exc_info=True)
        raise

    # ── 3. Feature Engineering & Preprocessing ────────────────────────────
    try:
        X_train, X_test, y_train, y_test, feature_names, scaler = engineer_and_preprocess(
            clean_df,
            save_metadata=True,
            metadata_dir=paths["metadata_dir"]
        )
    except Exception as e:
        logger.error(f"[FEATURE ENGINEERING] Failed: {e}", exc_info=True)
        raise

    # ── Save processed splits for reproducibility ─────────────────────────
    try:
        os.makedirs(processed_dir, exist_ok=True)
        pd.DataFrame(X_train, columns=feature_names).to_csv(
            os.path.join(processed_dir, "X_train.csv"), index=False
        )
        pd.DataFrame(X_test, columns=feature_names).to_csv(
            os.path.join(processed_dir, "X_test.csv"), index=False
        )
        pd.DataFrame(y_train, columns=["Churn"]).to_csv(
            os.path.join(processed_dir, "y_train.csv"), index=False
        )
        pd.DataFrame(y_test, columns=["Churn"]).to_csv(
            os.path.join(processed_dir, "y_test.csv"), index=False
        )
        logger.info(f"  ✔ Preprocessed splits stored in '{processed_dir}/'")
    except Exception as e:
        logger.warning(f"[SAVE SPLITS] Warning: {e}")

    # ── 4. Save Scaler ────────────────────────────────────────────────────
    try:
        os.makedirs(os.path.dirname(scaler_output_path), exist_ok=True)
        joblib.dump(scaler, scaler_output_path)
        logger.info(f"  ✔ StandardScaler saved to '{scaler_output_path}'")
    except Exception as e:
        logger.error(f"[SAVE SCALER] Failed: {e}", exc_info=True)
        raise

    # ── 5. Model Training ─────────────────────────────────────────────────
    try:
        model = train_xgboost_model(
            X_train, y_train,
            model_output_path=model_output_path,
            handle_imbalance=cfg["training"]["handle_imbalance"]
        )
    except Exception as e:
        logger.error(f"[MODEL TRAINING] Failed: {e}", exc_info=True)
        raise

    # Copy model to workspace root for quick access
    try:
        shutil.copy(model_output_path, "xgboost_churn_model.pkl")
        logger.info("  ✔ Model copied to workspace root as 'xgboost_churn_model.pkl'")
    except Exception as e:
        logger.warning(f"[MODEL COPY] Warning: {e}")

    # ── 6. Model Evaluation & Feature Importance ──────────────────────────
    try:
        evaluate_model(
            model=model,
            X_train=X_train,
            X_test=X_test,
            y_train=y_train,
            y_test=y_test,
            feature_names=feature_names,
            output_dir=plots_dir,
            metrics_path=metrics_path
        )
    except Exception as e:
        logger.error(f"[EVALUATION] Failed: {e}", exc_info=True)
        raise

    # ── 7. Print summary of all saved artifacts ───────────────────────────
    logger.info("\n" + "=" * 70)
    logger.info("🎉 PIPELINE RUN COMPLETED SUCCESSFULLY!")
    logger.info("=" * 70)
    logger.info("\n📦 Artifacts saved:")
    artifacts = [
        model_output_path,
        scaler_output_path,
        "models/feature_metadata.json",
        metrics_path,
        "xgboost_churn_model.pkl",
    ]
    for path in artifacts:
        status = "✔" if os.path.exists(path) else "✘"
        logger.info(f"   {status} {path}")

    logger.info("\n🚀 Next step: Run 'python scripts/predict.py' to test inference.")


if __name__ == "__main__":
    run_pipeline()
