"""
Deployment Schemas
Pydantic models for deployment validation
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.models.deployment import DeploymentStatus


class DeploymentBase(BaseModel):
    name: str
    replicas: int = 1


class DeploymentCreate(DeploymentBase):
    project_id: int
    experiment_id: int
    port: Optional[int] = None


class DeploymentUpdate(BaseModel):
    status: Optional[DeploymentStatus] = None
    is_healthy: Optional[bool] = None
    replicas: Optional[int] = None


class DeploymentResponse(DeploymentBase):
    id: int
    project_id: int
    experiment_id: Optional[int] = None
    model_name: str
    model_version: str
    endpoint_url: Optional[str] = None
    status: DeploymentStatus
    container_id: Optional[str] = None
    port: Optional[int] = None
    is_healthy: bool
    last_health_check: Optional[datetime] = None
    total_predictions: int
    error_count: int
    average_latency: Optional[float] = None
    has_data_drift: bool
    has_concept_drift: bool
    created_at: datetime
    deployed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PredictionRequest(BaseModel):
    """Request schema for making predictions"""
    features: Dict[str, Any]


class PredictionResponse(BaseModel):
    """Response schema for predictions"""
    prediction: Any
    probability: Optional[float] = None
    latency: float
    model_version: str
    request_id: str
