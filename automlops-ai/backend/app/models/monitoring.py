"""
Monitoring Log Model
Tracks system and model performance metrics
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database.session import Base


class LogType(str, enum.Enum):
    SYSTEM = "system"
    MODEL = "model"
    DRIFT = "drift"
    ERROR = "error"


class MonitoringLog(Base):
    __tablename__ = "monitoring_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    deployment_id = Column(Integer, ForeignKey("deployments.id", ondelete="CASCADE"), nullable=False)
    log_type = Column(SQLEnum(LogType), nullable=False, index=True)
    
    # System Metrics
    cpu_usage = Column(Float, nullable=True)  # percentage
    memory_usage = Column(Float, nullable=True)  # MB
    gpu_usage = Column(Float, nullable=True)  # percentage
    
    # Model Performance
    prediction_count = Column(Integer, nullable=True)
    error_rate = Column(Float, nullable=True)
    average_latency = Column(Float, nullable=True)  # milliseconds
    throughput = Column(Float, nullable=True)  # requests per second
    accuracy = Column(Float, nullable=True)
    
    # Additional Data
    message = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    deployment = relationship("Deployment", back_populates="monitoring_logs")
