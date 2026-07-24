"""
=============================================================
Data Cleaning Module
=============================================================
Author: Machine Learning Engineer
Description: Handles dataset loading, duplicate removal, invalid data
             detection, and dtype conversions (specifically TotalCharges).
             Raw CSV is never mutated — all operations stay in memory.

Fix applied:
  - Removed redundant double pd.read_csv() call.
    Now uses a single read with na_values=[" "] to handle blank strings.
  - Replaced all print() with structured logging.
=============================================================
"""

import pandas as pd
import numpy as np
import os

from src.logger import get_logger

logger = get_logger(__name__)


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

    Notes:
    ------
    - The raw CSV on disk is NEVER modified. All mutations stay in memory.
    - Blank strings in TotalCharges are treated as NaN and imputed with median.
    """
    logger.info("=========================================")
    logger.info("🧹 [DATA CLEANING] Executing Cleaning Step...")
    logger.info("=========================================")

    # ── 1. Load Dataset ────────────────────────────────────────────────────
    # FIX: single read with na_values=[" "] handles both pandas NA detection
    # and blank-string coercion simultaneously — eliminates the previous
    # redundant double pd.read_csv() call (old lines 42 & 57).
    df = pd.read_csv(file_path, na_values=[" "])
    logger.info(f"  ✔ Initial raw shape: {df.shape}")

    # ── 2. In-memory categorical simplification ────────────────────────────
    # NOTE: Raw CSV on disk is never written to.
    replacements = {
        "No internet service": "No",
        "No phone service": "No"
    }
    for col in df.select_dtypes(include="str").columns:
        df[col] = df[col].replace(replacements)
    logger.info("  🔄 Replaced 'No internet service' and 'No phone service' → 'No' (in memory only).")

    # ── 3. Remove Duplicates ───────────────────────────────────────────────
    duplicate_count = df.duplicated().sum()
    if duplicate_count > 0:
        logger.warning(f"  ⚠️  Found {duplicate_count} duplicate records. Removing them...")
        df = df.drop_duplicates()
    else:
        logger.info("  ✔ No duplicate records found.")

    # ── 4. Handle TotalCharges → float ────────────────────────────────────
    logger.info("  ✔ Verifying and converting 'TotalCharges' datatype...")
    # na_values=[" "] in read_csv already coerced blanks to NaN; count them.
    blank_count = df["TotalCharges"].isna().sum()
    logger.debug(f"  🔍 Found {blank_count} NaN entries in 'TotalCharges' (blanks + genuine NaN).")

    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    median_val = df["TotalCharges"].median()
    df["TotalCharges"] = df["TotalCharges"].fillna(median_val)
    logger.info(f"  ✔ Imputed missing 'TotalCharges' values with median: {median_val:.2f}")

    # ── 5. Simplify internet/phone sub-categories (MultipleLines) ─────────
    logger.info("  ✔ Simplifying categorical columns by mapping redundant sub-states...")
    internet_cols = [
        "OnlineSecurity", "OnlineBackup", "DeviceProtection",
        "TechSupport", "StreamingTV", "StreamingMovies"
    ]
    for col in internet_cols:
        if col in df.columns:
            df[col] = df[col].replace("No internet service", "No")
    if "MultipleLines" in df.columns:
        df["MultipleLines"] = df["MultipleLines"].replace("No phone service", "No")

    # ── 6. Final null check ────────────────────────────────────────────────
    other_nulls = df.isnull().sum()
    cols_with_nulls = other_nulls[other_nulls > 0]
    if len(cols_with_nulls) > 0:
        logger.warning(
            f"  ⚠️  Found null values in: {cols_with_nulls.to_dict()}. Dropping affected rows..."
        )
        df = df.dropna()
    else:
        logger.info("  ✔ No other null values detected.")

    logger.info(f"  ✔ Final clean dataset shape: {df.shape}")
    return df
