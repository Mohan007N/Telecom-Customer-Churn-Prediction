"""
Training Agent
Automatically trains multiple ML models and compares them
"""

import time
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    mean_squared_error, mean_absolute_error, r2_score,
    confusion_matrix, classification_report
)
from sklearn.linear_model import LogisticRegression, Ridge, Lasso
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import (
    RandomForestClassifier, RandomForestRegressor,
    ExtraTreesClassifier, ExtraTreesRegressor,
    GradientBoostingClassifier, GradientBoostingRegressor,
    AdaBoostClassifier, AdaBoostRegressor
)
from sklearn.svm import SVC, SVR
from sklearn.naive_bayes import GaussianNB
from sklearn.neural_network import MLPClassifier, MLPRegressor
import xgboost as xgb
try:
    import lightgbm as lgb
    _LGBM_AVAILABLE = True
except ImportError:
    _LGBM_AVAILABLE = False
try:
    from catboost import CatBoostClassifier, CatBoostRegressor
    _CATBOOST_AVAILABLE = True
except ImportError:
    CatBoostClassifier = None
    CatBoostRegressor  = None
    _CATBOOST_AVAILABLE = False
from loguru import logger
import joblib
try:
    import psutil
    _PSUTIL_AVAILABLE = True
except ImportError:
    _PSUTIL_AVAILABLE = False
import os


class TrainingAgent:
    """
    Trains multiple models and provides comprehensive comparison
    """
    
    def __init__(self, task_type: str = "classification"):
        self.task_type = task_type
        self.models = {}
        self.results = []
        self.best_model = None
        self.best_model_name = None
        
    def get_models(self) -> Dict[str, Any]:
        """Get appropriate models based on task type"""
        
        if self.task_type == "classification":
            return {
                "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
                "Decision Tree": DecisionTreeClassifier(random_state=42),
                "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
                "Extra Trees": ExtraTreesClassifier(n_estimators=100, random_state=42, n_jobs=-1),
                "XGBoost": xgb.XGBClassifier(
                    n_estimators=100,
                    max_depth=6,
                    learning_rate=0.1,
                    random_state=42,
                    n_jobs=-1,
                    eval_metric='logloss'
                ),
                "LightGBM": lgb.LGBMClassifier(
                    n_estimators=100,
                    random_state=42,
                    n_jobs=-1,
                    verbose=-1
                ),
                "CatBoost": CatBoostClassifier(
                    iterations=100,
                    random_state=42,
                    verbose=False
                ),
                "AdaBoost": AdaBoostClassifier(n_estimators=50, random_state=42),
                "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, random_state=42),
                "SVM": SVC(kernel='rbf', probability=True, random_state=42),
                "Naive Bayes": GaussianNB(),
                "MLP Neural Network": MLPClassifier(
                    hidden_layer_sizes=(100, 50),
                    max_iter=500,
                    random_state=42
                )
            }
        elif self.task_type == "regression":
            return {
                "Ridge Regression": Ridge(random_state=42),
                "Lasso Regression": Lasso(random_state=42),
                "Decision Tree": DecisionTreeRegressor(random_state=42),
                "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1),
                "Extra Trees": ExtraTreesRegressor(n_estimators=100, random_state=42, n_jobs=-1),
                "XGBoost": xgb.XGBRegressor(
                    n_estimators=100,
                    max_depth=6,
                    learning_rate=0.1,
                    random_state=42,
                    n_jobs=-1
                ),
                "LightGBM": lgb.LGBMRegressor(
                    n_estimators=100,
                    random_state=42,
                    n_jobs=-1,
                    verbose=-1
                ),
                "CatBoost": CatBoostRegressor(
                    iterations=100,
                    random_state=42,
                    verbose=False
                ),
                "AdaBoost": AdaBoostRegressor(n_estimators=50, random_state=42),
                "Gradient Boosting": GradientBoostingRegressor(n_estimators=100, random_state=42),
                "SVR": SVR(kernel='rbf'),
                "MLP Neural Network": MLPRegressor(
                    hidden_layer_sizes=(100, 50),
                    max_iter=500,
                    random_state=42
                )
            }
        else:
            raise ValueError(f"Unsupported task type: {self.task_type}")
    
    def train_all_models(
        self,
        X_train: np.ndarray,
        X_test: np.ndarray,
        y_train: np.ndarray,
        y_test: np.ndarray,
        feature_names: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Train all models and collect results
        """
        logger.info(f"Starting training for {self.task_type}")
        
        models = self.get_models()
        self.results = []
        
        for model_name, model in models.items():
            try:
                logger.info(f"Training {model_name}...")
                result = self._train_single_model(
                    model_name, model, X_train, X_test, y_train, y_test, feature_names
                )
                self.results.append(result)
                
            except Exception as e:
                logger.error(f"Failed to train {model_name}: {str(e)}")
                self.results.append({
                    "model_name": model_name,
                    "status": "failed",
                    "error": str(e)
                })
        
        # Sort by primary metric
        self._rank_models()
        
        # Select best model
        self._select_best_model()
        
        logger.info(f"Training completed. Best model: {self.best_model_name}")
        return self.results
    
    def _train_single_model(
        self,
        model_name: str,
        model: Any,
        X_train: np.ndarray,
        X_test: np.ndarray,
        y_train: np.ndarray,
        y_test: np.ndarray,
        feature_names: List[str] = None
    ) -> Dict[str, Any]:
        """Train a single model and collect metrics"""
        
        # Track memory before training
        process = psutil.Process(os.getpid())
        memory_before = process.memory_info().rss / 1024 / 1024  # MB
        
        # Training
        start_time = time.time()
        model.fit(X_train, y_train)
        training_time = time.time() - start_time
        
        # Track memory after training
        memory_after = process.memory_info().rss / 1024 / 1024  # MB
        memory_usage = memory_after - memory_before
        
        # Predictions
        inference_start = time.time()
        y_pred = model.predict(X_test)
        inference_time = (time.time() - inference_start) * 1000 / len(X_test)  # ms per sample
        
        # Prepare result
        result = {
            "model_name": model_name,
            "status": "completed",
            "training_time": round(training_time, 2),
            "inference_time": round(inference_time, 4),
            "memory_usage": round(memory_usage, 2),
        }
        
        # Calculate metrics based on task type
        if self.task_type == "classification":
            # Get probabilities if available
            y_pred_proba = None
            if hasattr(model, 'predict_proba'):
                y_pred_proba = model.predict_proba(X_test)
                if y_pred_proba.shape[1] == 2:  # Binary classification
                    y_pred_proba = y_pred_proba[:, 1]
            
            result.update({
                "accuracy": round(accuracy_score(y_test, y_pred), 4),
                "precision": round(precision_score(y_test, y_pred, average='weighted', zero_division=0), 4),
                "recall": round(recall_score(y_test, y_pred, average='weighted', zero_division=0), 4),
                "f1_score": round(f1_score(y_test, y_pred, average='weighted', zero_division=0), 4),
            })
            
            # ROC-AUC for binary classification
            if y_pred_proba is not None and len(np.unique(y_train)) == 2:
                try:
                    result["roc_auc"] = round(roc_auc_score(y_test, y_pred_proba), 4)
                except:
                    result["roc_auc"] = None
            
        elif self.task_type == "regression":
            mse = mean_squared_error(y_test, y_pred)
            result.update({
                "mse": round(mse, 4),
                "rmse": round(np.sqrt(mse), 4),
                "mae": round(mean_absolute_error(y_test, y_pred), 4),
                "r2_score": round(r2_score(y_test, y_pred), 4),
            })
        
        # Feature importance (if available)
        if hasattr(model, 'feature_importances_') and feature_names:
            importances = model.feature_importances_
            top_features = sorted(
                zip(feature_names, importances),
                key=lambda x: x[1],
                reverse=True
            )[:10]
            result["top_features"] = [
                {"feature": feat, "importance": round(float(imp), 4)}
                for feat, imp in top_features
            ]
        
        # Store model
        self.models[model_name] = model
        
        return result
    
    def _rank_models(self):
        """Rank models by primary metric"""
        
        if self.task_type == "classification":
            # Rank by F1 score
            self.results.sort(key=lambda x: x.get("f1_score", 0), reverse=True)
        elif self.task_type == "regression":
            # Rank by R2 score
            self.results.sort(key=lambda x: x.get("r2_score", -float('inf')), reverse=True)
        
        # Add rank
        for idx, result in enumerate(self.results, 1):
            result["rank"] = idx
    
    def _select_best_model(self):
        """Select the best performing model"""
        
        if self.results:
            best_result = self.results[0]
            self.best_model_name = best_result["model_name"]
            self.best_model = self.models.get(self.best_model_name)
            
            logger.info(f"Best model selected: {self.best_model_name}")
    
    def save_best_model(self, output_path: str) -> str:
        """Save the best model to disk"""
        
        if self.best_model is None:
            raise ValueError("No best model available to save")
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        joblib.dump(self.best_model, output_path)
        
        logger.info(f"Best model saved to {output_path}")
        return output_path
    
    def get_leaderboard(self) -> List[Dict[str, Any]]:
        """Get model leaderboard"""
        return self.results
    
    def get_best_model_info(self) -> Dict[str, Any]:
        """Get information about the best model"""
        
        if not self.results:
            return None
        
        return {
            "model_name": self.best_model_name,
            "metrics": self.results[0],
            "model_object": self.best_model
        }
