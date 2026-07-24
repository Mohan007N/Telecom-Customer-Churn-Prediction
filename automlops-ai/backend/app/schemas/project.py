"""
Project Schemas
Pydantic models for project validation
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.project import ProjectStatus, TaskType


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    user_prompt: str = Field(..., min_length=10, description="Natural language task description")


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    target_column: Optional[str] = None
    extra_config: Optional[Dict[str, Any]] = None


class ProjectResponse(ProjectBase):
    id: int
    task_type: Optional[TaskType] = None
    status: ProjectStatus
    dataset_path: Optional[str] = None
    dataset_name: Optional[str] = None
    dataset_size: Optional[int] = None
    target_column: Optional[str] = None
    extra_config: Optional[Dict[str, Any]] = None
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ProjectExecute(BaseModel):
    """Schema for executing the full ML pipeline"""
    auto_select_target: bool = Field(default=True, description="Automatically detect target column")
    target_column: Optional[str] = Field(None, description="Manually specify target column")
    train_models: bool = Field(default=True, description="Train multiple models")
    enable_hyperparameter_tuning: bool = Field(default=True, description="Enable Optuna optimization")
    deploy_best_model: bool = Field(default=False, description="Auto-deploy best model")
