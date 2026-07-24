"""
Projects API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
from pathlib import Path

from app.core.security import get_current_user
from app.core.config import settings
from app.database.session import get_db
from app.models.user import User
from app.models.project import Project, ProjectStatus
from app.models.dataset import Dataset
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate, ProjectExecute
from app.services.ml_pipeline_service import MLPipelineService
from loguru import logger

router = APIRouter()


@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new ML project"""
    
    new_project = Project(
        name=project_data.name,
        description=project_data.description,
        user_prompt=project_data.user_prompt,
        status=ProjectStatus.CREATED,
        owner_id=current_user.id
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    logger.info(f"Project created: {new_project.id} by user {current_user.id}")
    
    return new_project


@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all projects for current user"""
    
    projects = db.query(Project).filter(
        Project.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return projects


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific project"""
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    return project


@router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a project"""
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Update fields
    update_data = project_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    
    return project


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a project"""
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    db.delete(project)
    db.commit()
    
    logger.info(f"Project deleted: {project_id}")
    
    return None


@router.post("/projects/{project_id}/upload-dataset")
async def upload_dataset(
    project_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload dataset to project"""
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Validate file type
    if not file.filename.endswith(('.csv', '.xlsx', '.json', '.parquet')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload CSV, Excel, JSON, or Parquet files."
        )
    
    # Create upload directory
    upload_dir = Path(settings.UPLOAD_DIR) / str(project_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_path = upload_dir / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Get file size
    file_size = os.path.getsize(file_path)
    
    # Update project
    project.dataset_path = str(file_path)
    project.dataset_name = file.filename
    project.dataset_size = file_size
    project.status = ProjectStatus.ANALYZING
    
    db.commit()
    
    logger.info(f"Dataset uploaded for project {project_id}: {file.filename}")
    
    return {
        "message": "Dataset uploaded successfully",
        "filename": file.filename,
        "size": file_size,
        "path": str(file_path)
    }


@router.post("/projects/{project_id}/execute")
async def execute_project(
    project_id: int,
    execution_config: ProjectExecute,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Execute the complete ML pipeline for the project
    This is where the magic happens - AI agents automatically handle everything
    """
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if not project.dataset_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No dataset uploaded. Please upload a dataset first."
        )
    
    # Initialize ML Pipeline Service
    pipeline_service = MLPipelineService(project_id, db)
    
    # Execute pipeline in background
    background_tasks.add_task(
        pipeline_service.execute_pipeline,
        project=project,
        config=execution_config
    )
    
    logger.info(f"ML Pipeline execution started for project {project_id}")
    
    return {
        "message": "ML Pipeline execution started",
        "project_id": project_id,
        "status": "processing"
    }


@router.get("/projects/{project_id}/progress")
async def get_project_progress(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get project execution progress"""
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get progress from extra_config
    extra_config = project.extra_config or {}
    workflow = extra_config.get("workflow", [])
    
    total_steps = len(workflow)
    completed_steps = sum(1 for step in workflow if step.get("status") == "completed")
    
    return {
        "project_id": project_id,
        "status": project.status,
        "total_steps": total_steps,
        "completed_steps": completed_steps,
        "progress_percentage": (completed_steps / total_steps * 100) if total_steps > 0 else 0,
        "workflow": workflow
    }
