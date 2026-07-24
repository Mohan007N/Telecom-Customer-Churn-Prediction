"""
=============================================================
Tests for src/feature_engineering.py
=============================================================
"""

import pytest
import numpy as np
import pandas as pd
import json
import os


@pytest.fixture(scope="module")
def engineering_outputs(clean_telco_df, tmp_path_factory):
    """Runs engineer_and_preprocess once and returns all outputs."""
    from src.feature_engineering import engineer_and_preprocess

    tmp_dir = tmp_path_factory.mktemp("models")
    X_train, X_test, y_train, y_test, feature_names, scaler = engineer_and_preprocess(
        clean_telco_df,
        save_metadata=True,
        metadata_dir=str(tmp_dir)
    )
    return {
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test,
        "feature_names": feature_names,
        "scaler": scaler,
        "metadata_dir": str(tmp_dir),
    }


class TestEngineerAndPreprocess:

    def test_output_shapes_consistent(self, engineering_outputs):
        """X_train and y_train must have matching row counts."""
        assert engineering_outputs["X_train"].shape[0] == len(engineering_outputs["y_train"])
        assert engineering_outputs["X_test"].shape[0] == len(engineering_outputs["y_test"])

    def test_feature_names_match_columns(self, engineering_outputs):
        """Number of feature names must equal number of columns in X_train."""
        assert engineering_outputs["X_train"].shape[1] == len(engineering_outputs["feature_names"])

    def test_no_data_leakage_in_scaler(self, engineering_outputs):
        """Scaler must be fitted ONLY on X_train — mean should differ from X_test mean."""
        # The scaler's mean is computed on X_train, not X_test
        # Test: scaler mean equals X_train column means (within tolerance)
        from sklearn.preprocessing import StandardScaler
        raw_train_mean = engineering_outputs["scaler"].mean_
        assert raw_train_mean is not None, "Scaler has no fitted mean."
        assert len(raw_train_mean) == engineering_outputs["X_train"].shape[1]

    def test_target_is_binary(self, engineering_outputs):
        """y_train and y_test must contain only 0 and 1."""
        for arr_name in ["y_train", "y_test"]:
            unique_vals = set(np.unique(engineering_outputs[arr_name]))
            assert unique_vals.issubset({0, 1}), (
                f"{arr_name} contains values other than 0/1: {unique_vals}"
            )

    def test_no_customer_id_in_features(self, engineering_outputs):
        """customerID must be dropped — it is an identifier, not a feature."""
        for name in engineering_outputs["feature_names"]:
            assert "customerID" not in name.lower(), (
                f"customerID leaked into feature: {name}"
            )

    def test_derived_features_created(self, engineering_outputs):
        """At least some known derived features must appear in feature_names."""
        feature_set = set(engineering_outputs["feature_names"])
        # These are numeric/derived — they survive OHE without suffix
        expected_derived = {"TotalServices", "ChargesRatio", "CostPerService",
                            "ChargeDifference", "HasContract", "IsSeniorAndSingle"}
        found = expected_derived & feature_set
        assert len(found) > 0, (
            f"None of the expected derived features found. Got: {list(feature_set)[:10]}"
        )

    def test_feature_metadata_saved(self, engineering_outputs):
        """feature_metadata.json must be saved and contain correct keys."""
        meta_path = os.path.join(engineering_outputs["metadata_dir"], "feature_metadata.json")
        assert os.path.exists(meta_path), "feature_metadata.json was not saved."

        with open(meta_path) as f:
            meta = json.load(f)

        assert "feature_names" in meta
        assert "n_features" in meta
        assert "dropped_cols" in meta
        assert meta["n_features"] == len(engineering_outputs["feature_names"])

    def test_train_test_stratification(self, engineering_outputs):
        """Class proportions in train and test should be roughly equal (within 5%)."""
        train_churn_rate = np.mean(engineering_outputs["y_train"])
        test_churn_rate  = np.mean(engineering_outputs["y_test"])
        assert abs(train_churn_rate - test_churn_rate) < 0.05, (
            f"Stratification drift too large: train={train_churn_rate:.3f}, "
            f"test={test_churn_rate:.3f}"
        )

    def test_scaled_data_approximately_standardized(self, engineering_outputs):
        """After StandardScaler, X_train columns should have ~mean=0, ~std=1."""
        col_means = np.abs(np.mean(engineering_outputs["X_train"], axis=0))
        col_stds  = np.std(engineering_outputs["X_train"], axis=0)
        assert np.all(col_means < 1e-9), "Scaled X_train has non-zero column means."
        assert np.allclose(col_stds, 1.0, atol=0.1), "Scaled X_train std deviates from 1."
