"""
=============================================================
Model Evaluation & Feature Importance Module
=============================================================
Author: Machine Learning Engineer
Description: Evaluates the trained classifier, outputs key metrics,
             generates confusion matrix & feature importance plots.
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
    print("\n=========================================")
    print("📈 [EVALUATION] Computing Model Metrics...")
    print("=========================================")
    
    # Ensure outputs directory exists
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(os.path.dirname(metrics_path), exist_ok=True)
    
    # 1. Predictions & Probabilities
    train_preds = model.predict(X_train)
    test_preds = model.predict(X_test)
    test_probs = model.predict_proba(X_test)[:, 1]
    
    # 2. Performance Scores
    train_acc = accuracy_score(y_train, train_preds)
    test_acc = accuracy_score(y_test, test_preds)
    precision = precision_score(y_test, test_preds)
    recall = recall_score(y_test, test_preds)
    f1 = f1_score(y_test, test_preds)
    roc_auc = roc_auc_score(y_test, test_probs)
    
    print(f"  Accuracy (Train) : {train_acc:.4f}")
    print(f"  Accuracy (Test)  : {test_acc:.4f}")
    print(f"  Precision (Test) : {precision:.4f}")
    print(f"  Recall (Test)    : {recall:.4f}")
    print(f"  F1-Score (Test)  : {f1:.4f}")
    print(f"  ROC-AUC (Test)   : {roc_auc:.4f}")
    
    # Print Classification Report
    print("\n📋 Classification Report (Testing Data):")
    class_report_str = classification_report(y_test, test_preds)
    print(class_report_str)
    
    # Print Confusion Matrix raw
    cm = confusion_matrix(y_test, test_preds)
    print("🧩 Confusion Matrix (Raw):")
    print(f"  TN: {cm[0,0]} | FP: {cm[0,1]}")
    print(f"  FN: {cm[1,0]} | TP: {cm[1,1]}")
    
    # 3. Export Metrics to JSON (MLOps artifact tracking)
    metrics = {
        "train_accuracy": float(train_acc),
        "test_accuracy": float(test_acc),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "roc_auc": float(roc_auc)
    }
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=4)
    print(f"\n  ✔ Logged performance metrics to '{metrics_path}'")
    
    # Set plotting style
    sns.set_theme(style="white")
    
    # 4. Confusion Matrix Heatmap
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", cbar=False,
                xticklabels=["Retained (0)", "Churned (1)"],
                yticklabels=["Retained (0)", "Churned (1)"])
    plt.title("Confusion Matrix Heatmap", fontsize=14, fontweight="bold", pad=15)
    plt.xlabel("Predicted Label", fontsize=12)
    plt.ylabel("Actual Label", fontsize=12)
    
    cm_path = os.path.join(output_dir, "confusion_matrix.png")
    plt.tight_layout()
    plt.savefig(cm_path, dpi=150)
    plt.close()
    print(f"  ✔ Saved confusion matrix plot to '{cm_path}'")
    
    # 5. ROC Curve Plot
    fpr, tpr, _ = roc_curve(y_test, test_probs)
    plt.figure(figsize=(7, 6))
    plt.plot(fpr, tpr, color="darkorange", lw=2, label=f"XGBoost ROC Curve (AUC = {roc_auc:.4f})")
    plt.plot([0, 1], [0, 1], color="navy", lw=2, linestyle="--", label="Random Guess")
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel("False Positive Rate (FPR)", fontsize=12)
    plt.ylabel("True Positive Rate (TPR)", fontsize=12)
    plt.title("Receiver Operating Characteristic (ROC) Curve", fontsize=14, fontweight="bold", pad=15)
    plt.legend(loc="lower right", fontsize=11)
    
    roc_path = os.path.join(output_dir, "roc_curve.png")
    plt.tight_layout()
    plt.savefig(roc_path, dpi=150)
    plt.close()
    print(f"  ✔ Saved ROC curve plot to '{roc_path}'")
    
    # 6. Feature Importance Plot
    # Retrieve importance weights
    importances = model.feature_importances_
    feat_imp = pd.Series(importances, index=feature_names).sort_values(ascending=False)
    
    # Take top 15 features for clarity
    top_n = 15
    plt.figure(figsize=(10, 6))
    sns.barplot(x=feat_imp.head(top_n).values, y=feat_imp.head(top_n).index, palette="viridis", hue=feat_imp.head(top_n).index, legend=False)
    plt.title(f"Top {top_n} Features Influencing Churn (XGBoost Gain)", fontsize=14, fontweight="bold", pad=15)
    plt.xlabel("Relative Importance Weight", fontsize=12)
    plt.ylabel("Features", fontsize=12)
    
    feat_imp_path = os.path.join(output_dir, "feature_importance.png")
    plt.tight_layout()
    plt.savefig(feat_imp_path, dpi=150)
    plt.close()
    print(f"  ✔ Saved feature importance plot to '{feat_imp_path}'")
    
    # Explanation of top features
    print(f"\n💡 Top {5} Most Important Features:")
    for idx, (name, val) in enumerate(feat_imp.head(5).items(), 1):
        print(f"   {idx}. {name:<35} | Relative Weight: {val:.4f}")
        
    print("\n📝 Brief Interpretation:")
    print("   - Contract types (e.g. Month-to-month contracts) are usually high-importance features. Customers on monthly terms can churn easily.")
    print("   - Tenure has a major influence. The longer a customer stays, the less likely they are to churn (high negative correlation).")
    print("   - Internet service categories (such as Fiber optic) often indicate high bills or connection issues which can trigger churn.")
