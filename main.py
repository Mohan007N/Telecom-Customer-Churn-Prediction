"""
=============================================================
Telco Customer Churn Prediction Orchestration Pipeline
=============================================================
Author: Machine Learning Engineer (MLOps)
Description: End-to-end pipeline execution from data cleaning,
             EDA, feature engineering, training, and evaluation.
=============================================================
"""

import os
import shutil
import pandas as pd
from src.data_cleaning import load_and_clean_data
from src.eda import perform_eda
from src.feature_engineering import engineer_and_preprocess
from src.training import train_xgboost_model
from src.evaluation import evaluate_model

def run_pipeline(
    raw_data_path: str = "WA_Fn-UseC_-Telco-Customer-Churn.csv",
    plots_dir: str = "reports/plots",
    metrics_path: str = "reports/metrics.json",
    model_output_path: str = "models/xgboost_churn_model.pkl"
) -> None:
    """
    Orchestrates the entire machine learning pipeline.
    """
    print("=" * 70)
    print("🎬 MLOps Pipeline Orchestrator — Telco Churn Project")
    print("=" * 70)
    
    # 1. Data Cleaning
    clean_df = load_and_clean_data(raw_data_path)
    
    # 2. Exploratory Data Analysis
    perform_eda(clean_df, output_dir=plots_dir)
    
    # 3. Feature Engineering & Preprocessing
    X_train, X_test, y_train, y_test, feature_names, scaler = engineer_and_preprocess(clean_df)
    
    # Save the processed splits for future model experimentation/reproducibility
    processed_dir = "data/processed"
    os.makedirs(processed_dir, exist_ok=True)
    pd.DataFrame(X_train, columns=feature_names).to_csv(os.path.join(processed_dir, "X_train.csv"), index=False)
    pd.DataFrame(X_test, columns=feature_names).to_csv(os.path.join(processed_dir, "X_test.csv"), index=False)
    pd.DataFrame(y_train, columns=["Churn"]).to_csv(os.path.join(processed_dir, "y_train.csv"), index=False)
    pd.DataFrame(y_test, columns=["Churn"]).to_csv(os.path.join(processed_dir, "y_test.csv"), index=False)
    print(f"  ✔ Preprocessed splits successfully stored in '{processed_dir}/'")
    
    # 4. Model Training
    model = train_xgboost_model(X_train, y_train, model_output_path=model_output_path)
    
    # Duplicate model directly to workspace root as 'xgboost_churn_model.pkl' per requirements
    shutil.copy(model_output_path, "xgboost_churn_model.pkl")
    print("  ✔ Successfully copied model to workspace root as 'xgboost_churn_model.pkl'")
    
    # 5. Model Evaluation & Feature Importance
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
    
    print("\n" + "=" * 70)
    print("🎉 PIPELINE RUN COMPLETED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_pipeline()
