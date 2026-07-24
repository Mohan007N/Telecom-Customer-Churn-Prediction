"""
Experiments API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.experiment import Experiment
from app.models.project import Project
from app.schemas.experiment import ExperimentResponse, ModelLeaderboard

router = APIRouter()


@router.get("/projects/{project_id}/experiments", response_model=List[ExperimentResponse])
async def list_experiments(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all experiments for a project"""
    
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    experiments = db.query(Experiment).filter(
        Experiment.project_id == project_id
    ).all()
    
    return experiments


@router.get("/experiments/{experiment_id}", response_model=ExperimentResponse)
async def get_experiment(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific experiment"""
    
    experiment = db.query(Experiment).join(Project).filter(
        Experiment.id == experiment_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found"
        )
    
    return experiment


@router.get("/projects/{project_id}/leaderboard", response_model=List[ModelLeaderboard])
async def get_model_leaderboard(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get model leaderboard for a project"""
    
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get all completed experiments, sorted by f1_score
    experiments = db.query(Experiment).filter(
        Experiment.project_id == project_id,
        Experiment.status == "completed"
    ).order_by(Experiment.f1_score.desc()).all()
    
    leaderboard = []
    for rank, exp in enumerate(experiments, 1):
        leaderboard.append(ModelLeaderboard(
            experiment_id=exp.id,
            model_name=exp.model_name,
            accuracy=exp.accuracy,
            precision=exp.precision,
            recall=exp.recall,
            f1_score=exp.f1_score,
            roc_auc=exp.roc_auc,
            training_time=exp.training_time,
            rank=rank
        ))
    
    return leaderboard
