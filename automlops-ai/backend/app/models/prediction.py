"""
Prediction Model
Stores prediction requests and responses for monitoring
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base


class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    deployment_id = Column(Integer, ForeignKey("deployments.id", ondelete="CASCADE"), nullable=False)
    
    # Input/Output
    input_data = Column(JSON, nullable=False)
    prediction = Column(JSON, nullable=False)
    prediction_probability = Column(Float, nullable=True)
    
    # Performance Metrics
    latency = Column(Float, nullable=True)  # milliseconds
    model_version = Column(String, nullable=True)
    
    # Request Information
    request_id = Column(String, nullable=True, index=True)
    user_id = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    deployment = relationship("Deployment", back_populates="predictions")
