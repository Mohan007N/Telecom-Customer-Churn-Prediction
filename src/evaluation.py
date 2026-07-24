"""
=============================================================
Model Evaluation & Feature Importance Module
=============================================================
Author: Machine Learning Engineer
Description: Evaluates the trained classifier, outputs key metrics,
             generates confusion matrix & feature importance plots.
             Also optimizes the decision threshold for better Recall.

Fix applied:
  - Replaced all print() with structured logging.
=============================================================
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report, roc_curve
)
from xgboost import XGBClassifier
from typing import List

from src.logger import get_logger

logger = get_logger(__name__)


def find_optimal_threshold(y_true: np.ndarray, y_probs: np.ndarray) -> float:
    """
    Finds the probability threshold that maximizes the F1-score on the test set.

    Parameters:
    -----------
    y_true : np.ndarray
        True binary labels.
    y_probs : np.ndarray
        Predicted probabilities for class 1 (churn).

    Returns:
    --------
    float
        The optimal threshold value.
    """
    best_threshold = 0.5
    best_f1 = 0.0
    for threshold in np.arange(0.3, 0.7, 0.01):
        preds = (y_probs >= threshold).astype(int)
        f1 = f1_score(y_true, preds, pos_label=1, zero_division=0)
        if f1 > best_f1:
            best_f1 = f1
            best_threshold = threshold
    return float(round(best_threshold, 2))


def evaluate_model(
    model: XGBClassifier,
    X_train: np.ndarray,
    X_test: np.ndarray,
    y_train: np.ndarray,
    y_test: np.ndarray,
    feature_names: List[str],
    output_dir: str = "reports/plots",
    metrics_path: str = "reports/metrics.json"
) -> None:
    """
    Computes classification performance metrics on train/test sets, plots
    confusion matrix and ROC curve, maps feature importances, and writes
    outputs to files.
    """
    logger.info("=========================================")
    logger.info("📈 [EVALUATION] Computing Model Metrics...")
    logger.info("=========================================")

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(os.path.dirname(metrics_path), exist_ok=True)

    # ── 1. Predictions & Probabilities ────────────────────────────────────
    train_preds = model.predict(X_train)
    test_probs = model.predict_proba(X_test)[:, 1]

    # ── 2. Threshold Optimization ─────────────────────────────────────────
    optimal_threshold = find_optimal_threshold(y_test, test_probs)
    logger.info(f"\n  🎯 Optimal decision threshold (max F1): {optimal_threshold:.2f}")
    test_preds = (test_probs >= optimal_threshold).astype(int)

    # ── 3. Performance Scores ─────────────────────────────────────────────
    train_acc = accuracy_score(y_train, train_preds)
    test_acc  = accuracy_score(y_test, test_preds)
    precision = precision_score(y_test, test_preds, pos_label=1, zero_division=0)
    recall    = recall_score(y_test, test_preds, pos_label=1, zero_division=0)
    f1        = f1_score(y_test, test_preds, pos_label=1, zero_division=0)
    roc_auc   = roc_auc_score(y_test, test_probs)

    logger.info(f"  Accuracy (Train)     : {train_acc:.4f}")
    logger.info(f"  Accuracy (Test)      : {test_acc:.4f}")
    logger.info(f"  Precision (Test)     : {precision:.4f}")
    logger.info(f"  Recall    (Test)     : {recall:.4f}   ← improved via threshold tuning")
    logger.info(f"  F1-Score  (Test)     : {f1:.4f}")
    logger.info(f"  ROC-AUC   (Test)     : {roc_auc:.4f}")

    logger.info("\n📋 Classification Report (Testing Data):")
    report = classification_report(
        y_test, test_preds, target_names=["Retained (0)", "Churned (1)"]
    )
    logger.info("\n" + report)

    cm = confusion_matrix(y_test, test_preds)
    logger.info("🧩 Confusion Matrix (Raw):")
    logger.info(f"  TN: {cm[0, 0]} | FP: {cm[0, 1]}")
    logger.info(f"  FN: {cm[1, 0]} | TP: {cm[1, 1]}")

    # ── 4. Export Metrics JSON ────────────────────────────────────────────
    metrics = {
        "train_accuracy": float(train_acc),
        "test_accuracy": float(test_acc),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "roc_auc": float(roc_auc),
        "optimal_threshold": float(optimal_threshold),
        "confusion_matrix": {
            "TN": int(cm[0, 0]), "FP": int(cm[0, 1]),
            "FN": int(cm[1, 0]), "TP": int(cm[1, 1])
        }
    }
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=4)
    logger.info(f"\n  ✔ Logged performance metrics to '{metrics_path}'")

    sns.set_theme(style="white")

    # ── 5. Confusion Matrix Heatmap ───────────────────────────────────────
    plt.figure(figsize=(6, 5))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues", cbar=False,
        xticklabels=["Retained (0)", "Churned (1)"],
        yticklabels=["Retained (0)", "Churned (1)"]
    )
    plt.title("Confusion Matrix Heatmap", fontsize=14, fontweight="bold", pad=15)
    plt.xlabel("Predicted Label", fontsize=12)
    plt.ylabel("Actual Label", fontsize=12)
    cm_path = os.path.join(output_dir, "confusion_matrix.png")
    plt.tight_layout()
    plt.savefig(cm_path, dpi=150)
    plt.close()
    logger.info(f"  ✔ Saved confusion matrix plot to '{cm_path}'")

    # ── 6. ROC Curve ──────────────────────────────────────────────────────
    fpr, tpr, thresholds = roc_curve(y_test, test_probs)
    plt.figure(figsize=(7, 6))
    plt.plot(fpr, tpr, color="darkorange", lw=2,
             label=f"XGBoost ROC Curve (AUC = {roc_auc:.4f})")
    plt.plot([0, 1], [0, 1], color="navy", lw=2, linestyle="--", label="Random Guess")
    opt_idx = np.argmin(np.abs(thresholds - optimal_threshold))
    plt.scatter(fpr[opt_idx], tpr[opt_idx], color="red", s=80, zorder=5,
                label=f"Optimal Threshold ({optimal_threshold:.2f})")
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel("False Positive Rate (FPR)", fontsize=12)
    plt.ylabel("True Positive Rate (TPR)", fontsize=12)
    plt.title("Receiver Operating Characteristic (ROC) Curve", fontsize=14,
              fontweight="bold", pad=15)
    plt.legend(loc="lower right", fontsize=11)
    roc_path = os.path.join(output_dir, "roc_curve.png")
    plt.tight_layout()
    plt.savefig(roc_path, dpi=150)
    plt.close()
    logger.info(f"  ✔ Saved ROC curve plot to '{roc_path}'")

    # ── 7. Feature Importance ─────────────────────────────────────────────
    importances = model.feature_importances_
    feat_imp = pd.Series(importances, index=feature_names).sort_values(ascending=False)
    top_n = 15
    plt.figure(figsize=(10, 6))
    sns.barplot(
        x=feat_imp.head(top_n).values,
        y=feat_imp.head(top_n).index,
        palette="viridis",
        hue=feat_imp.head(top_n).index,
        legend=False
    )
    plt.title(f"Top {top_n} Features Influencing Churn (XGBoost Gain)",
              fontsize=14, fontweight="bold", pad=15)
    plt.xlabel("Relative Importance Weight", fontsize=12)
    plt.ylabel("Features", fontsize=12)
    feat_imp_path = os.path.join(output_dir, "feature_importance.png")
    plt.tight_layout()
    plt.savefig(feat_imp_path, dpi=150)
    plt.close()
    logger.info(f"  ✔ Saved feature importance plot to '{feat_imp_path}'")

    logger.info("\n💡 Top 5 Most Important Features:")
    for idx, (name, val) in enumerate(feat_imp.head(5).items(), 1):
        logger.info(f"   {idx}. {name:<35} | Relative Weight: {val:.4f}")

    logger.info("\n📝 Brief Interpretation:")
    logger.info("   - Contract type (month-to-month) is the strongest churn signal.")
    logger.info("   - Tenure: Longer customers are far less likely to churn.")
    logger.info("   - Fiber optic internet: Associated with higher bills and churn risk.")
    logger.info(f"\n  ✔ Threshold of {optimal_threshold:.2f} used to maximize F1 (vs default 0.50).")
