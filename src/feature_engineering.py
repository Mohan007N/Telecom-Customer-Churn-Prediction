"""
=============================================================
Feature Engineering & Preprocessing Module
=============================================================
Author: Machine Learning Engineer
Description: Standardizes columns, constructs derived MLOps features,
             one-hot encodes data, scales features, and returns splits.
=============================================================
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from typing import Tuple, List

def engineer_and_preprocess(
    df: pd.DataFrame
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, List[str], StandardScaler]:
    """
    Performs feature engineering by creating derived features, separates
    features and target labels, performs one-hot encoding, and scales features.
    
    Parameters:
    -----------
    df : pd.DataFrame
        Cleaned dataset.
        
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
    print("\n=========================================")
    print("🛠️  [PREPROCESSING] Engineering Features...")
    print("=========================================")
    
    # 1. Feature Engineering: Derived Features
    print("  ✔ Creating derived feature 'TotalServices'...")
    # List of service columns in the dataset
    service_cols = [
        "PhoneService", "MultipleLines", "InternetService", "OnlineSecurity", 
        "OnlineBackup", "DeviceProtection", "TechSupport", "StreamingTV", "StreamingMovies"
    ]
    # Count how many services are active (i.e. not 'No' and not 'No internet service')
    df["TotalServices"] = 0
    for col in service_cols:
        if col in df.columns:
            df["TotalServices"] += df[col].apply(lambda x: 1 if x in ["Yes", "Fiber optic", "DSL"] else 0)
            
    print("  ✔ Creating derived feature 'TenureCohort' (binned tenure)...")
    # Binning customer tenure into categories
    def get_tenure_cohort(months):
        if months <= 12:
            return "0-1 Year"
        elif months <= 24:
            return "1-2 Years"
        elif months <= 48:
            return "2-4 Years"
        else:
            return "4+ Years"
    df["TenureCohort"] = df["tenure"].apply(get_tenure_cohort)
    
    print("  ✔ Creating derived feature 'MonthlyChargesToTotalChargesRatio'...")
    # Ratio of Monthly charges to total charges (avoiding divide-by-zero)
    df["ChargesRatio"] = df["MonthlyCharges"] / (df["TotalCharges"] + 1e-5)
    
    print("  ✔ Creating interaction features ('CostPerService', 'ChargeDifference', 'HasContract', 'IsSeniorAndSingle')...")
    # New feature: Cost per service used
    df["CostPerService"] = df["MonthlyCharges"] / (df["TotalServices"] + 1)
    
    # New feature: Deviation from expected charges (captures price increases/one-off charges)
    df["ChargeDifference"] = df["TotalCharges"] - (df["MonthlyCharges"] * df["tenure"])
    
    # New feature: contract exists (Month-to-month contracts are highly prone to Churn)
    if "Contract" in df.columns:
        df["HasContract"] = (df["Contract"] != "Month-to-month").astype(int)
        
    # New feature: Senior Citizen and single/no dependents (higher risk cohort)
    if all(col in df.columns for col in ["SeniorCitizen", "Partner", "Dependents"]):
        df["IsSeniorAndSingle"] = ((df["SeniorCitizen"] == 1) & (df["Partner"] == "No") & (df["Dependents"] == "No")).astype(int)
        
    # 2. Drop customerID and low-importance noisy columns (gender, PhoneService)
    cols_to_drop = ["customerID", "gender", "PhoneService"]
    for col in cols_to_drop:
        if col in df.columns:
            print(f"  ✔ Dropping column '{col}' to simplify feature space.")
            df = df.drop(columns=[col])
        
    # 3. Separate features (X) and target variable (y)
    print("  ✔ Splitting features (X) and target label (y)...")
    
    # Target Variable Encoding
    if "Churn" in df.columns:
        # Map target label Churn (Yes=1, No=0)
        df["Churn"] = df["Churn"].map({"No": 0, "Yes": 1})
        y = df["Churn"].values
        X = df.drop(columns=["Churn"])
    else:
        raise ValueError("Target variable 'Churn' not found in dataset!")
        
    # 4. One-Hot Encoding for Categorical variables
    print("  ✔ One-Hot Encoding categorical features...")
    X_encoded = pd.get_dummies(X, drop_first=True)
    feature_names = list(X_encoded.columns)
    print(f"  ✔ Number of features after encoding: {len(feature_names)}")
    
    # 5. Train-Test Split (80:20 Ratio, Stratified)
    print("  ✔ Splitting dataset (80:20 Train/Test split, stratified)...")
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X_encoded,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )
    
    # 6. Scaling Numerical Columns
    print("  ✔ Scaling numerical columns using StandardScaler...")
    # Select numerical columns that are not binary dummy variables
    # We can scale everything, or just columns that have continuous values.
    # Typically, scaling all inputs in X (even dummies) is common, or scaling only specific ones.
    # In MLOps pipelines, scaling all features is clean and standard for many models.
    scaler = StandardScaler()
    
    X_train = scaler.fit_transform(X_train_raw)
    X_test = scaler.transform(X_test_raw)
    
    print(f"  ✔ Train split size: {X_train.shape[0]} | Test split size: {X_test.shape[0]}")
    
    return X_train, X_test, y_train, y_test, feature_names, scaler
