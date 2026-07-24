"""
=============================================================
Tests for src/data_cleaning.py
=============================================================
"""

import pytest
import pandas as pd
import numpy as np


class TestLoadAndCleanData:

    def test_returns_dataframe(self, clean_telco_df):
        """Output must be a pandas DataFrame."""
        assert isinstance(clean_telco_df, pd.DataFrame)

    def test_no_null_values(self, clean_telco_df):
        """Cleaned DataFrame must have zero null values."""
        assert clean_telco_df.isnull().sum().sum() == 0, (
            f"Unexpected nulls:\n{clean_telco_df.isnull().sum()[clean_telco_df.isnull().sum() > 0]}"
        )

    def test_total_charges_is_numeric(self, clean_telco_df):
        """TotalCharges must be float after cleaning."""
        assert pd.api.types.is_float_dtype(clean_telco_df["TotalCharges"]), (
            f"Expected float dtype, got {clean_telco_df['TotalCharges'].dtype}"
        )

    def test_no_duplicate_rows(self, clean_telco_df):
        """Cleaned DataFrame must have no duplicate rows."""
        assert clean_telco_df.duplicated().sum() == 0

    def test_no_internet_service_replaced(self, clean_telco_df):
        """'No internet service' strings must be replaced with 'No'."""
        for col in clean_telco_df.select_dtypes(include="str").columns:
            assert "No internet service" not in clean_telco_df[col].values, (
                f"Column '{col}' still contains 'No internet service'."
            )

    def test_no_phone_service_replaced(self, clean_telco_df):
        """'No phone service' strings must be replaced with 'No'."""
        for col in clean_telco_df.select_dtypes(include="str").columns:
            assert "No phone service" not in clean_telco_df[col].values, (
                f"Column '{col}' still contains 'No phone service'."
            )

    def test_shape_has_expected_columns(self, clean_telco_df):
        """All original columns must still be present after cleaning."""
        expected_cols = {
            "customerID", "SeniorCitizen", "tenure", "MonthlyCharges",
            "TotalCharges", "Churn", "Contract", "InternetService"
        }
        assert expected_cols.issubset(set(clean_telco_df.columns)), (
            f"Missing columns: {expected_cols - set(clean_telco_df.columns)}"
        )

    def test_blank_total_charges_imputed(self, sample_telco_df, tmp_path):
        """Blank TotalCharges entries must be imputed (not left as NaN)."""
        from src.data_cleaning import load_and_clean_data

        # Inject blanks into TotalCharges
        df_with_blanks = sample_telco_df.copy()
        df_with_blanks.loc[:5, "TotalCharges"] = " "
        csv_path = tmp_path / "blanks_test.csv"
        df_with_blanks.to_csv(csv_path, index=False)

        result = load_and_clean_data(str(csv_path))
        assert result["TotalCharges"].isnull().sum() == 0, (
            "Blank TotalCharges entries were not imputed."
        )

    def test_raw_csv_not_mutated(self, sample_telco_df, tmp_path):
        """The original CSV must not be modified after cleaning."""
        import hashlib

        csv_path = tmp_path / "original.csv"
        sample_telco_df.to_csv(csv_path, index=False)

        with open(csv_path, "rb") as f:
            hash_before = hashlib.md5(f.read()).hexdigest()

        from src.data_cleaning import load_and_clean_data
        load_and_clean_data(str(csv_path))

        with open(csv_path, "rb") as f:
            hash_after = hashlib.md5(f.read()).hexdigest()

        assert hash_before == hash_after, "Raw CSV was mutated on disk!"
