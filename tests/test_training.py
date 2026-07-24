"""
=============================================================
Tests for src/training.py
=============================================================
"""

import pytest
import numpy as np
import os
from xgboost import XGBClassifier


@pytest.fixture(scope="module")
def training_inputs(clean_telco_df, tmp_path_factory):
    """Runs feature engineering and returns training inputs."""
    from src.feature_engineering import engineer_and_preprocess

    meta_dir = tmp_path_factory.mktemp("models_train")
    X_train, X_test, y_train, y_test, feature_names, scaler = engineer_and_preprocess(
        clean_telco_df,
        save_metadata=True,
        metadata_dir=str(meta_dir)
    )
    return {
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test,
        "feature_names": feature_names,
    }


@pytest.fixture(scope="module")
def trained_model(training_inputs, tmp_path_factory):
    """Trains a model and returns (model, model_path)."""
    from src.training import train_xgboost_model

    out_dir = tmp_path_factory.mktemp("model_output")
    model_path = str(out_dir / "test_model.pkl")

    model = train_xgboost_model(
        training_inputs["X_train"],
        training_inputs["y_train"],
        model_output_path=model_path,
        handle_imbalance=True
    )
    return model, model_path


class TestTrainXGBoostModel:

    def test_returns_xgbclassifier(self, trained_model):
        """train_xgboost_model must return an XGBClassifier instance."""
        model, _ = trained_model
        assert isinstance(model, XGBClassifier)

    def test_model_file_saved(self, trained_model):
        """Serialized model .pkl file must exist on disk."""
        _, model_path = trained_model
        assert os.path.exists(model_path), f"Model file not found at '{model_path}'"

    def test_model_predicts_binary(self, trained_model, training_inputs):
        """Model predictions must be in {0, 1}."""
        model, _ = trained_model
        preds = model.predict(training_inputs["X_test"])
        unique_vals = set(np.unique(preds))
        assert unique_vals.issubset({0, 1}), (
            f"Unexpected prediction values: {unique_vals}"
        )

    def test_model_produces_probabilities(self, trained_model, training_inputs):
        """predict_proba must return values in [0, 1]."""
        model, _ = trained_model
        probs = model.predict_proba(training_inputs["X_test"])[:, 1]
        assert np.all(probs >= 0) and np.all(probs <= 1), (
            "Probabilities outside [0, 1] range detected."
        )

    def test_model_has_feature_importances(self, trained_model, training_inputs):
        """model.feature_importances_ must have length equal to number of features."""
        model, _ = trained_model
        n_features = training_inputs["X_train"].shape[1]
        assert len(model.feature_importances_) == n_features

    def test_model_has_best_iteration(self, trained_model):
        """Early stopping should set best_iteration on the model."""
        model, _ = trained_model
        assert hasattr(model, "best_iteration"), "Model has no best_iteration attribute."
        assert model.best_iteration >= 0

    def test_model_pkl_loadable(self, trained_model):
        """Saved .pkl must be deserializable and functional."""
        import joblib
        _, model_path = trained_model
        loaded_model = joblib.load(model_path)
        assert isinstance(loaded_model, XGBClassifier)

    def test_scale_pos_weight_applied(self, training_inputs):
        """scale_pos_weight must reflect class ratio when handle_imbalance=True."""
        y_train = training_inputs["y_train"]
        neg = np.sum(y_train == 0)
        pos = np.sum(y_train == 1)
        expected_weight = neg / pos

        from src.training import train_xgboost_model
        import tempfile, os
        with tempfile.TemporaryDirectory() as tmpdir:
            model = train_xgboost_model(
                training_inputs["X_train"], y_train,
                model_output_path=os.path.join(tmpdir, "m.pkl"),
                handle_imbalance=True
            )
        # XGBoost stores scale_pos_weight in get_params()
        actual_weight = model.get_params()["scale_pos_weight"]
        assert abs(actual_weight - expected_weight) < 0.01, (
            f"scale_pos_weight mismatch: expected {expected_weight:.4f}, got {actual_weight:.4f}"
        )


class TestConfigHyperparameters:

    def test_config_yaml_exists(self):
        """config.yaml must be present in the project root."""
        assert os.path.exists("config.yaml"), "config.yaml not found in project root."

    def test_config_has_required_keys(self):
        """config.yaml must define model, training, data, and paths sections."""
        from src.config_loader import load_config
        cfg = load_config()
        for section in ["model", "training", "data", "paths"]:
            assert section in cfg, f"Missing section '{section}' in config.yaml"

    def test_model_config_keys(self):
        """model section must contain all required XGBoost hyperparameters."""
        from src.config_loader import load_config
        model_cfg = load_config()["model"]
        required = {
            "n_estimators", "max_depth", "learning_rate", "subsample",
            "colsample_bytree", "min_child_weight", "reg_lambda",
            "random_state", "eval_metric"
        }
        missing = required - set(model_cfg.keys())
        assert not missing, f"Missing hyperparameter keys in config.yaml: {missing}"
