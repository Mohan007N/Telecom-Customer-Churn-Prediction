"""
Experiment Model
Tracks model training experiments and their results
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database.session import Base


class ExperimentStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Experiment(Base):
    __tablename__ = "experiments"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False, index=True)
    model_name = Column(String, nullable=False)  # XGBoost, RandomForest, etc.
    status = Column(SQLEnum(ExperimentStatus), default=ExperimentStatus.PENDING)
    
    # Hyperparameters
    hyperparameters = Column(JSON, nullable=True)
    
    # Metrics
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    roc_auc = Column(Float, nullable=True)
    mse = Column(Float, nullable=True)  # For regression
    rmse = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    r2_score = Column(Float, nullable=True)
    
    # Additional Information
    training_time = Column(Float, nullable=True)  # seconds
    inference_time = Column(Float, nullable=True)  # milliseconds
    memory_usage = Column(Float, nullable=True)  # MB
    model_size = Column(Float, nullable=True)  # MB
    
    # Artifacts
    model_path = Column(String, nullable=True)
    confusion_matrix_path = Column(String, nullable=True)
    roc_curve_path = Column(String, nullable=True)
    feature_importance_path = Column(String, nullable=True)
    
    # MLflow Integration
    mlflow_run_id = Column(String, nullable=True)
    mlflow_experiment_id = Column(String, nullable=True)
    
    # Metadata
    extra_config = Column(JSON, nullable=True)  # Additional metadata (renamed: 'metadata' is reserved by SQLAlchemy)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="experiments")
