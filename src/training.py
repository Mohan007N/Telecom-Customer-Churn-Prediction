"""
=============================================================
Model Training Module
=============================================================
Author: Machine Learning Engineer
Description: Initializes, configures, trains, and serializes the
             XGBoost Classifier model.

Fixes applied:
  - Hyperparameters are now loaded from config.yaml (no hardcoding).
  - Added StratifiedKFold cross-validation to report generalisation metrics.
  - Added early stopping via a held-out eval_set from X_train.
  - Replaced all print() with structured logging.
=============================================================
"""

import os
import joblib
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import make_scorer, f1_score, recall_score, roc_auc_score

from src.logger import get_logger
from src.config_loader import load_config

logger = get_logger(__name__)


def train_xgboost_model(
    X_train: np.ndarray,
    y_train: np.ndarray,
    model_output_path: str = "models/xgboost_churn_model.pkl",
    handle_imbalance: bool = True
) -> XGBClassifier:
    """
    Instantiates an XGBClassifier with hyperparameters from config.yaml,
    runs StratifiedKFold cross-validation, trains the final model with
    early stopping, and serializes it using Joblib.

    Parameters:
    -----------
    X_train : np.ndarray
        Scaled training features.
    y_train : np.ndarray
        Training labels (0=Retained, 1=Churned).
    model_output_path : str
        Path to save the serialized model.
    handle_imbalance : bool
        If True, computes scale_pos_weight to address class imbalance.
        This improves Recall for the minority churn class.

    Returns:
    --------
    XGBClassifier
        Trained XGBoost model.
    """
    logger.info("=========================================")
    logger.info("🚀 [MODEL TRAINING] Training XGBoost Classifier...")
    logger.info("=========================================")

    # ── Load hyperparameters from config.yaml ─────────────────────────────
    cfg = load_config()
    model_cfg = cfg["model"]
    train_cfg = cfg["training"]

    cv_folds = train_cfg["cv_folds"]
    early_stopping_rounds = train_cfg["early_stopping_rounds"]
    val_fraction = train_cfg["val_fraction"]

    # ── Class imbalance weight ─────────────────────────────────────────────
    neg_count = int(np.sum(y_train == 0))
    pos_count = int(np.sum(y_train == 1))
    scale_pos_weight = (neg_count / pos_count) if handle_imbalance else 1.0

    logger.info("  ✔ Hyperparameters loaded from config.yaml:")
    for k, v in model_cfg.items():
        logger.info(f"      - {k:<25} = {v}")
    logger.info(f"      - {'scale_pos_weight':<25} = {scale_pos_weight:.4f}  ← fixes class imbalance")

    # ── Base model (used for CV) ───────────────────────────────────────────
    base_model = XGBClassifier(
        n_estimators=model_cfg["n_estimators"],
        max_depth=model_cfg["max_depth"],
        learning_rate=model_cfg["learning_rate"],
        subsample=model_cfg["subsample"],
        colsample_bytree=model_cfg["colsample_bytree"],
        min_child_weight=model_cfg["min_child_weight"],
        reg_lambda=model_cfg["reg_lambda"],
        scale_pos_weight=scale_pos_weight,
        random_state=model_cfg["random_state"],
        eval_metric=model_cfg["eval_metric"],
        # NOTE: use_label_encoder removed for XGBoost 2.x compatibility
    )

    # ── StratifiedKFold Cross-Validation ──────────────────────────────────
    logger.info(f"\n  🔁 Running {cv_folds}-Fold Stratified Cross-Validation...")
    skf = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=model_cfg["random_state"])

    scoring = {
        "roc_auc": "roc_auc",
        "f1": make_scorer(f1_score, pos_label=1, zero_division=0),
        "recall": make_scorer(recall_score, pos_label=1, zero_division=0),
    }

    cv_results = cross_validate(
        base_model, X_train, y_train,
        cv=skf,
        scoring=scoring,
        return_train_score=False,
        n_jobs=-1
    )

    mean_auc    = np.mean(cv_results["test_roc_auc"])
    std_auc     = np.std(cv_results["test_roc_auc"])
    mean_f1     = np.mean(cv_results["test_f1"])
    std_f1      = np.std(cv_results["test_f1"])
    mean_recall = np.mean(cv_results["test_recall"])
    std_recall  = np.std(cv_results["test_recall"])

    logger.info(f"  ✔ CV ROC-AUC : {mean_auc:.4f} ± {std_auc:.4f}")
    logger.info(f"  ✔ CV F1-Score: {mean_f1:.4f} ± {std_f1:.4f}")
    logger.info(f"  ✔ CV Recall  : {mean_recall:.4f} ± {std_recall:.4f}")

    # ── Final model with early stopping ───────────────────────────────────
    # Hold out a small validation slice from X_train for early stopping signal.
    # This slice is NOT the held-out test set — it only guides early stopping.
    from sklearn.model_selection import train_test_split
    X_tr, X_val, y_tr, y_val = train_test_split(
        X_train, y_train,
        test_size=val_fraction,
        random_state=model_cfg["random_state"],
        stratify=y_train
    )

    logger.info(
        f"\n  ✔ Training final model with early stopping "
        f"(patience={early_stopping_rounds}, "
        f"val_size={int(val_fraction * 100)}% of X_train)..."
    )

    final_model = XGBClassifier(
        n_estimators=model_cfg["n_estimators"],
        max_depth=model_cfg["max_depth"],
        learning_rate=model_cfg["learning_rate"],
        subsample=model_cfg["subsample"],
        colsample_bytree=model_cfg["colsample_bytree"],
        min_child_weight=model_cfg["min_child_weight"],
        reg_lambda=model_cfg["reg_lambda"],
        scale_pos_weight=scale_pos_weight,
        random_state=model_cfg["random_state"],
        eval_metric=model_cfg["eval_metric"],
        early_stopping_rounds=early_stopping_rounds,
    )

    final_model.fit(
        X_tr, y_tr,
        eval_set=[(X_val, y_val)],
        verbose=False
    )

    best_iteration = final_model.best_iteration
    logger.info(f"  ✔ Early stopping: best iteration = {best_iteration}")
    logger.info("  ✔ Model fitting completed successfully.")

    # ── Save model ────────────────────────────────────────────────────────
    dir_name = os.path.dirname(model_output_path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)

    logger.info(f"  ✔ Serializing model to '{model_output_path}'...")
    joblib.dump(final_model, model_output_path)
    logger.info("  ✔ Model serialization complete.")

    return final_model
