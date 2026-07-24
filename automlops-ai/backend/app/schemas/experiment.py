"""
Experiment Schemas
Pydantic models for experiment validation
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.experiment import ExperimentStatus


class ExperimentBase(BaseModel):
    name: str
    model_name: str


class ExperimentCreate(ExperimentBase):
    project_id: int
    hyperparameters: Optional[Dict[str, Any]] = None


class ExperimentUpdate(BaseModel):
    status: Optional[ExperimentStatus] = None
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    training_time: Optional[float] = None
    model_path: Optional[str] = None


class ExperimentResponse(ExperimentBase):
    id: int
    project_id: int
    status: ExperimentStatus
    hyperparameters: Optional[Dict[str, Any]] = None
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    mse: Optional[float] = None
    rmse: Optional[float] = None
    mae: Optional[float] = None
    r2_score: Optional[float] = None
    training_time: Optional[float] = None
    inference_time: Optional[float] = None
    memory_usage: Optional[float] = None
    model_size: Optional[float] = None
    model_path: Optional[str] = None
    mlflow_run_id: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ModelLeaderboard(BaseModel):
    """Leaderboard entry for model comparison"""
    experiment_id: int
    model_name: str
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    training_time: Optional[float] = None
    rank: int
