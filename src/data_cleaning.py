"""
=============================================================
Data Cleaning Module
=============================================================
Author: Machine Learning Engineer
Description: Handles dataset loading, duplicate removal, invalid data
             detection, and dtype conversions (specifically TotalCharges).
=============================================================
"""

import pandas as pd
import numpy as np

def load_and_clean_data(file_path: str) -> pd.DataFrame:
    """
    Loads the raw dataset, checks shapes and datatypes, handles duplicates,
    converts TotalCharges to float, and handles missing/blank values.
    
    Parameters:
    -----------
    file_path : str
        Path to the raw CSV file.
        
    Returns:
    --------
    pd.DataFrame
        Cleaned and validated DataFrame.
    """
    print("\n=========================================")
    print("🧹 [DATA CLEANING] Executing Cleaning Step...")
    print("=========================================")
    
    # 1. Load Dataset
    df = pd.read_csv(file_path, keep_default_na=False)
    print(f"  ✔ Initial raw shape: {df.shape}")
    
    # Check and update the CSV file if "No internet service" is present
    raw_changed = False
    for col in df.columns:
        if df[col].dtype == 'object':
            if (df[col] == "No internet service").any():
                df[col] = df[col].replace("No internet service", "No")
                raw_changed = True
                
    if raw_changed:
        print(f"  🔄 Found 'No internet service' in raw dataset. Updating the CSV file '{file_path}' to use 'No'...")
        df.to_csv(file_path, index=False)
        # Reload with default behavior for subsequent numeric/na handling
        df = pd.read_csv(file_path)
    
    # 2. Check and Remove Duplicates
    duplicate_count = df.duplicated().sum()
    if duplicate_count > 0:
        print(f"  ⚠️  Found {duplicate_count} duplicate records. Removing them...")
        df.drop_duplicates(inplace=True)
    else:
        print("  ✔ No duplicate records found.")
        
    # 3. Handle TotalCharges blank strings and convert to float
    # Spaces ' ' are a common issue for TotalCharges in this dataset.
    print("  ✔ Verifying and converting 'TotalCharges' datatype...")
    # Count blank space entries before conversion
    blank_spaces = (df["TotalCharges"] == " ").sum()
    print(f"  🔍 Found {blank_spaces} blank space entries in 'TotalCharges'.")
    
    # Coerce to numeric (converts spaces to NaN)
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    
    # Impute missing TotalCharges with median
    median_val = df["TotalCharges"].median()
    df["TotalCharges"].fillna(median_val, inplace=True)
    print(f"  ✔ Imputed missing 'TotalCharges' values with median: {median_val:.2f}")
    
    # 4. Simplify categories to remove redundant columns (multicollinearity)
    print("  ✔ Simplifying categorical columns by mapping redundant sub-states...")
    # Map "No internet service" to "No" for all Internet add-on features
    no_internet_cols = [
        "OnlineSecurity", "OnlineBackup", "DeviceProtection", 
        "TechSupport", "StreamingTV", "StreamingMovies"
    ]
    for col in no_internet_cols:
        if col in df.columns:
            df[col] = df[col].replace("No internet service", "No")
            
    # Map "No phone service" to "No" for MultipleLines
    if "MultipleLines" in df.columns:
        df["MultipleLines"] = df["MultipleLines"].replace("No phone service", "No")
        
    # 5. Check for any other null values
    other_nulls = df.isnull().sum().sum()
    if other_nulls > 0:
        print(f"  ⚠️  Found {other_nulls} null values in other columns. Handling...")
        df.dropna(inplace=True) # drop or impute
    else:
        print("  ✔ No other null values detected.")
        
    print(f"  ✔ Final clean dataset shape: {df.shape}")
    return df
