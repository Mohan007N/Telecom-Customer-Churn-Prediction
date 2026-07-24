"""
Dataset Model
Tracks dataset information and validation results
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base


class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)  # bytes
    num_rows = Column(Integer, nullable=True)
    num_columns = Column(Integer, nullable=True)
    
    # Data Quality Metrics
    has_duplicates = Column(Boolean, default=False)
    duplicate_count = Column(Integer, default=0)
    has_missing = Column(Boolean, default=False)
    missing_percentage = Column(Float, default=0.0)
    has_outliers = Column(Boolean, default=False)
    is_imbalanced = Column(Boolean, default=False)
    imbalance_ratio = Column(Float, nullable=True)
    
    # Schema Information
    schema_info = Column(JSON, nullable=True)  # Column names, types, stats
    validation_report = Column(JSON, nullable=True)  # Detailed validation results
    suggested_fixes = Column(JSON, nullable=True)  # AI-suggested data fixes
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="datasets")
