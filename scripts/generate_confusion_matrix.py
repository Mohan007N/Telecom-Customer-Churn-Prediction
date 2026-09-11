"""
=============================================================
Confusion Matrix Generator & Evaluator Script
=============================================================
Description: Evaluates model predictions on test data or saved metrics,
             generates an annotated confusion matrix plot with counts and percentages,
             and computes detailed classification metrics dynamically.
=============================================================
"""

import os
import sys
import json
import argparse
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

# Add project root to sys.path
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

try:
    from src.config_loader import load_config
    _cfg = load_config()
    _paths = _cfg.get("paths", {})
    DEFAULT_METRICS_PATH = _paths.get("metrics_path", "reports/metrics.json")
    DEFAULT_OUTPUT_DIR = _paths.get("figures_dir", "reports/plots")
except Exception:
    DEFAULT_METRICS_PATH = "reports/metrics.json"
    DEFAULT_OUTPUT_DIR = "reports/plots"


def create_confusion_matrix(metrics_path=DEFAULT_METRICS_PATH, output_dir=DEFAULT_OUTPUT_DIR, artifact_dir=None):
    os.makedirs(output_dir, exist_ok=True)
    
    # Try reading from metrics_path
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            metrics = json.load(f)
        
        cm_dict = metrics.get("confusion_matrix", {})
        tn = cm_dict.get("TN", 0)
        fp = cm_dict.get("FP", 0)
        fn = cm_dict.get("FN", 0)
        tp = cm_dict.get("TP", 0)
        cm = np.array([[tn, fp], [fn, tp]])
    else:
        # If metrics.json is missing, attempt to compute from test data and model
        try:
            import joblib
            model_path = _paths.get("model_output_path", "models/xgboost_churn_model.pkl") if '_paths' in globals() else "models/xgboost_churn_model.pkl"
            x_test_path = _paths.get("x_test_path", "data/X_test.csv") if '_paths' in globals() else "data/X_test.csv"
            y_test_path = _paths.get("y_test_path", "data/y_test.csv") if '_paths' in globals() else "data/y_test.csv"
            
            if os.path.exists(model_path) and os.path.exists(x_test_path) and os.path.exists(y_test_path):
                from sklearn.metrics import confusion_matrix as sk_cm
                model = joblib.load(model_path)
                X_test = pd.read_csv(x_test_path).values
                y_test = pd.read_csv(y_test_path).values.ravel()
                y_probs = model.predict_proba(X_test)[:, 1]
                threshold = 0.5
                y_preds = (y_probs >= threshold).astype(int)
                cm = sk_cm(y_test, y_preds)
                tn, fp, fn, tp = cm.ravel()
            else:
                raise FileNotFoundError(f"Metrics file '{metrics_path}' and test datasets not found.")
        except Exception as e:
            raise RuntimeError(f"Unable to generate confusion matrix without metrics or test data: {e}")

    total = np.sum(cm)
    if total == 0:
        raise ValueError("Confusion matrix total sample count is zero.")
    
    # Format annotations: Count + Percentage + Label
    labels = np.array([
        [f"True Negative\n(Retained)\n\nCount: {tn}\n({tn/total:.1%})",
         f"False Positive\n(Type I Error)\n\nCount: {fp}\n({fp/total:.1%})"],
        [f"False Negative\n(Type II Error)\n\nCount: {fn}\n({fn/total:.1%})",
         f"True Positive\n(Churned)\n\nCount: {tp}\n({tp/total:.1%})"]
    ])

    plt.figure(figsize=(8, 6.5))
    sns.set_theme(style="white")
    
    ax = sns.heatmap(
        cm, 
        annot=labels, 
        fmt="", 
        cmap="Blues", 
        cbar=True,
        linewidths=2,
        linecolor="white",
        annot_kws={"size": 11, "weight": "bold"},
        xticklabels=["Predicted: Retained (0)", "Predicted: Churned (1)"],
        yticklabels=["Actual: Retained (0)", "Actual: Churned (1)"]
    )

    plt.title("Telco Customer Churn - Confusion Matrix", fontsize=15, fontweight="bold", pad=18)
    plt.xlabel("Predicted Class", fontsize=12, labelpad=10, fontweight="bold")
    plt.ylabel("Actual Class", fontsize=12, labelpad=10, fontweight="bold")
    
    cm_path = os.path.join(output_dir, "confusion_matrix.png")
    plt.tight_layout()
    plt.savefig(cm_path, dpi=300)
    plt.close()
    
    print(f"[OK] Saved confusion matrix plot to '{cm_path}'")
    
    # Copy to artifacts directory if provided
    if artifact_dir and os.path.exists(artifact_dir):
        import shutil
        artifact_cm_path = os.path.join(artifact_dir, "confusion_matrix.png")
        shutil.copy(cm_path, artifact_cm_path)
        print(f"[OK] Copied confusion matrix plot to artifact dir: '{artifact_cm_path}'")

    # Calculate detailed performance metrics
    accuracy = (tp + tn) / total
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0

    print("\n" + "="*50)
    print("CONFUSION MATRIX SUMMARY & DERIVED METRICS")
    print("="*50)
    print(f"True Negatives  (TN): {tn:4d} | Correctly predicted Retained")
    print(f"False Positives (FP): {fp:4d} | Predicted Churn, actually Retained (Type I Error)")
    print(f"False Negatives (FN): {fn:4d} | Predicted Retained, actually Churned (Type II Error)")
    print(f"True Positives  (TP): {tp:4d} | Correctly predicted Churned")
    print("-" * 50)
    print(f"Total Test Samples   : {total:4d}")
    print(f"Overall Accuracy     : {accuracy:.4f} ({accuracy:.2%})")
    print(f"Precision (Churn)    : {precision:.4f} ({precision:.2%})")
    print(f"Recall / Sensitivity : {recall:.4f} ({recall:.2%})")
    print(f"Specificity          : {specificity:.4f} ({specificity:.2%})")
    print(f"F1-Score             : {f1:.4f}")
    print(f"False Positive Rate  : {fpr:.4f} ({fpr:.2%})")
    print(f"False Negative Rate  : {fnr:.4f} ({fnr:.2%})")
    print("="*50)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate confusion matrix plot and summary metrics.")
    parser.add_argument("--metrics-path", type=str, default=DEFAULT_METRICS_PATH, help="Path to metrics.json")
    parser.add_argument("--output-dir", type=str, default=DEFAULT_OUTPUT_DIR, help="Directory to save confusion_matrix.png")
    parser.add_argument("--artifact-dir", type=str, default=None, help="Optional artifact directory to copy plot to")
    args = parser.parse_args()
    
    create_confusion_matrix(
        metrics_path=args.metrics_path,
        output_dir=args.output_dir,
        artifact_dir=args.artifact_dir
    )
