"""
Pytest configuration and shared fixtures for all test modules.
"""

import pytest
import numpy as np
import pandas as pd


@pytest.fixture(scope="session")
def sample_telco_df() -> pd.DataFrame:
    """
    Creates a minimal, realistic Telco-style DataFrame (100 rows).
    Used across all test modules without touching the actual CSV.
    """
    np.random.seed(42)
    n = 100

    df = pd.DataFrame({
        "customerID":       [f"CUST-{i:04d}" for i in range(n)],
        "gender":           np.random.choice(["Male", "Female"], n),
        "SeniorCitizen":    np.random.choice([0, 1], n, p=[0.85, 0.15]),
        "Partner":          np.random.choice(["Yes", "No"], n),
        "Dependents":       np.random.choice(["Yes", "No"], n),
        "tenure":           np.random.randint(1, 72, n),
        "PhoneService":     np.random.choice(["Yes", "No"], n),
        "MultipleLines":    np.random.choice(["Yes", "No", "No phone service"], n),
        "InternetService":  np.random.choice(["DSL", "Fiber optic", "No"], n),
        "OnlineSecurity":   np.random.choice(["Yes", "No", "No internet service"], n),
        "OnlineBackup":     np.random.choice(["Yes", "No", "No internet service"], n),
        "DeviceProtection": np.random.choice(["Yes", "No", "No internet service"], n),
        "TechSupport":      np.random.choice(["Yes", "No", "No internet service"], n),
        "StreamingTV":      np.random.choice(["Yes", "No", "No internet service"], n),
        "StreamingMovies":  np.random.choice(["Yes", "No", "No internet service"], n),
        "Contract":         np.random.choice(["Month-to-month", "One year", "Two year"], n),
        "PaperlessBilling": np.random.choice(["Yes", "No"], n),
        "PaymentMethod":    np.random.choice(
            ["Electronic check", "Mailed check", "Bank transfer", "Credit card"], n
        ),
        "MonthlyCharges":   np.round(np.random.uniform(20, 110, n), 2),
        "TotalCharges":     [
            str(round(np.random.uniform(20, 8000), 2)) if np.random.rand() > 0.05 else " "
            for _ in range(n)
        ],
        "Churn":            np.random.choice(["Yes", "No"], n, p=[0.27, 0.73]),
    })
    return df


@pytest.fixture(scope="session")
def clean_telco_df(sample_telco_df, tmp_path_factory):
    """
    Returns a cleaned version of the sample DataFrame by running the
    actual data_cleaning module against a temporary CSV file.
    """
    from src.data_cleaning import load_and_clean_data

    tmp_dir = tmp_path_factory.mktemp("data")
    csv_path = tmp_dir / "test_telco.csv"
    sample_telco_df.to_csv(csv_path, index=False)

    return load_and_clean_data(str(csv_path))
