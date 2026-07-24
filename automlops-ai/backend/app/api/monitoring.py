"""
Monitoring API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.deployment import Deployment
from app.models.monitoring import MonitoringLog
from app.models.project import Project

router = APIRouter()


@router.get("/deployments/{deployment_id}/metrics")
async def get_deployment_metrics(
    deployment_id: int,
    hours: int = 24,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get monitoring metrics for a deployment"""
    
    deployment = db.query(Deployment).join(Project).filter(
        Deployment.id == deployment_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not deployment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found"
        )
    
    # Get logs from last N hours
    since = datetime.utcnow() - timedelta(hours=hours)
    logs = db.query(MonitoringLog).filter(
        MonitoringLog.deployment_id == deployment_id,
        MonitoringLog.created_at >= since
    ).all()
    
    # Aggregate metrics
    metrics = {
        "deployment_id": deployment_id,
        "status": deployment.status,
        "total_predictions": deployment.total_predictions,
        "error_count": deployment.error_count,
        "average_latency": deployment.average_latency,
        "has_drift": deployment.has_data_drift or deployment.has_concept_drift,
        "logs_count": len(logs),
        "time_range_hours": hours
    }
    
    return metrics


@router.get("/deployments/{deployment_id}/health")
async def check_deployment_health(
    deployment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check deployment health status"""
    
    deployment = db.query(Deployment).join(Project).filter(
        Deployment.id == deployment_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not deployment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found"
        )
    
    return {
        "deployment_id": deployment_id,
        "is_healthy": deployment.is_healthy,
        "status": deployment.status,
        "last_check": deployment.last_health_check
    }
