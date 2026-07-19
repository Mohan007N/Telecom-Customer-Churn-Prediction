"""
=============================================================
Model Training Module
=============================================================
Author: Machine Learning Engineer
Description: Initializes, configures, trains, and serializes the 
             XGBoost Classifier model.
=============================================================
"""

import os
import joblib
import numpy as np
from xgboost import XGBClassifier

def train_xgboost_model(
    X_train: np.ndarray, 
    y_train: np.ndarray, 
    model_output_path: str = "models/xgboost_churn_model.pkl"
) -> XGBClassifier:
    """
    Instantiates an XGBClassifier with optimized hyperparameters, trains it
    on the scaled training dataset, and serializes it using Joblib.
    
    Hyperparameters Explained:
    --------------------------
    - n_estimators=200: 
        Number of gradient boosted trees (boosting rounds). Too few leads to 
        underfitting; too many can lead to overfitting.
    - max_depth=4: 
        Maximum depth of a tree. Restricting depth prevents the model from
        creating overly complex rules (limits overfitting).
    - learning_rate=0.05 (eta): 
        Step size shrinkage used in update to prevent overfitting. After each
        boosting step, new feature weights are scaled by this factor.
    - subsample=0.8: 
        Subsample ratio of the training instances. Setting it to 0.8 means 
        XGBoost randomly collects 80% of data instances to grow trees, preventing overfitting.
    - colsample_bytree=0.8: 
        Subsample ratio of columns when constructing each tree.
    - random_state=42: 
        Ensures reproducibility across runs.
    - use_label_encoder=False & eval_metric='logloss': 
        Removes deprecation warnings and utilizes logloss (binary cross-entropy)
        as the evaluation metric during training.
    """
    print("\n=========================================")
    print("🚀 [MODEL TRAINING] Training XGBoost Classifier...")
    print("=========================================")
    
    # 1. Initialize XGBClassifier with defined hyperparameters
    print("  ✔ Initializing XGBClassifier with hyperparameters:")
    print("      - n_estimators = 300")
    print("      - max_depth = 3")
    print("      - learning_rate = 0.02")
    print("      - subsample = 0.8")
    print("      - colsample_bytree = 0.8")
    print("      - min_child_weight = 6")
    print("      - reg_lambda = 5.0")
    print("      - eval_metric = 'logloss'")
    
    model = XGBClassifier(
        n_estimators=300,
        max_depth=3,
        learning_rate=0.02,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=6,
        reg_lambda=5.0,
        random_state=42,
        use_label_encoder=False,
        eval_metric='logloss'
    )
    
    # 2. Fit the model
    print("  ✔ Fitting model on training data...")
    model.fit(X_train, y_train)
    print("  ✔ Model fitting completed successfully.")
    
    # 3. Save the model
    # Ensure models directory exists
    dir_name = os.path.dirname(model_output_path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
        
    print(f"  ✔ Serializing model to '{model_output_path}'...")
    joblib.dump(model, model_output_path)
    print("  ✔ Model serialization complete.")
    
    return model
