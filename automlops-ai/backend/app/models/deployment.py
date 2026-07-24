"""
Deployment Model
Tracks model deployments and their status
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database.session import Base


class DeploymentStatus(str, enum.Enum):
    PENDING = "pending"
    DEPLOYING = "deploying"
    RUNNING = "running"
    STOPPED = "stopped"
    FAILED = "failed"


class Deployment(Base):
    __tablename__ = "deployments"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    experiment_id = Column(Integer, ForeignKey("experiments.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False, index=True)
    model_name = Column(String, nullable=False)
    model_version = Column(String, nullable=False)
    endpoint_url = Column(String, nullable=True)
    status = Column(SQLEnum(DeploymentStatus), default=DeploymentStatus.PENDING)
    
    # Deployment Configuration
    container_id = Column(String, nullable=True)
    port = Column(Integer, nullable=True)
    replicas = Column(Integer, default=1)
    
    # Health Check
    is_healthy = Column(Boolean, default=True)
    last_health_check = Column(DateTime(timezone=True), nullable=True)
    
    # Monitoring Metrics
    total_predictions = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    average_latency = Column(Float, nullable=True)  # milliseconds
    
    # Drift Detection
    has_data_drift = Column(Boolean, default=False)
    has_concept_drift = Column(Boolean, default=False)
    drift_detected_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    deployment_config = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deployed_at = Column(DateTime(timezone=True), nullable=True)
    stopped_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="deployments")
    predictions = relationship("Prediction", back_populates="deployment", cascade="all, delete-orphan")
    monitoring_logs = relationship("MonitoringLog", back_populates="deployment", cascade="all, delete-orphan")
