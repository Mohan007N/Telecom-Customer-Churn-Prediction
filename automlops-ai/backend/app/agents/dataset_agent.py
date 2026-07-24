"""
Dataset Agent
Automatically analyzes datasets and detects data quality issues
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List
from loguru import logger
from pathlib import Path


class DatasetAgent:
    """
    Responsible for:
    - Schema detection
    - Data quality analysis
    - Missing values detection
    - Duplicate detection
    - Outlier detection
    - Imbalance detection
    - Generating validation reports
    - Suggesting fixes
    """
    
    def __init__(self):
        self.df = None
        self.report = {}
        
    def analyze(self, dataset_path: str) -> Dict[str, Any]:
        """
        Comprehensive dataset analysis
        """
        logger.info(f"Starting dataset analysis: {dataset_path}")
        
        try:
            # Load dataset
            self.df = self._load_dataset(dataset_path)
            
            # Perform analyses
            schema_info = self._detect_schema()
            quality_metrics = self._analyze_quality()
            missing_analysis = self._analyze_missing_values()
            duplicate_analysis = self._analyze_duplicates()
            outlier_analysis = self._detect_outliers()
            imbalance_analysis = self._detect_imbalance()
            suggestions = self._generate_suggestions()
            
            self.report = {
                "dataset_path": dataset_path,
                "num_rows": len(self.df),
                "num_columns": len(self.df.columns),
                "schema": schema_info,
                "quality_metrics": quality_metrics,
                "missing_values": missing_analysis,
                "duplicates": duplicate_analysis,
                "outliers": outlier_analysis,
                "imbalance": imbalance_analysis,
                "suggestions": suggestions,
                "status": "completed"
            }
            
            logger.info("Dataset analysis completed successfully")
            return self.report
            
        except Exception as e:
            logger.error(f"Dataset analysis failed: {str(e)}")
            return {
                "status": "failed",
                "error": str(e)
            }
    
    def _load_dataset(self, path: str) -> pd.DataFrame:
        """Load dataset from various formats"""
        file_path = Path(path)
        
        if file_path.suffix == '.csv':
            return pd.read_csv(path)
        elif file_path.suffix in ['.xlsx', '.xls']:
            return pd.read_excel(path)
        elif file_path.suffix == '.json':
            return pd.read_json(path)
        elif file_path.suffix == '.parquet':
            return pd.read_parquet(path)
        else:
            raise ValueError(f"Unsupported file format: {file_path.suffix}")
    
    def _detect_schema(self) -> Dict[str, Any]:
        """Detect column types and statistics"""
        schema = {}
        
        for column in self.df.columns:
            dtype = str(self.df[column].dtype)
            unique_count = self.df[column].nunique()
            null_count = self.df[column].isnull().sum()
            
            col_info = {
                "dtype": dtype,
                "unique_values": int(unique_count),
                "null_count": int(null_count),
                "null_percentage": float(null_count / len(self.df) * 100)
            }
            
            # Add statistics based on type
            if pd.api.types.is_numeric_dtype(self.df[column]):
                col_info.update({
                    "mean": float(self.df[column].mean()) if not self.df[column].isnull().all() else None,
                    "std": float(self.df[column].std()) if not self.df[column].isnull().all() else None,
                    "min": float(self.df[column].min()) if not self.df[column].isnull().all() else None,
                    "max": float(self.df[column].max()) if not self.df[column].isnull().all() else None,
                    "inferred_type": "numerical"
                })
            else:
                # Check if it's categorical
                if unique_count < len(self.df) * 0.5:
                    col_info["inferred_type"] = "categorical"
                    col_info["top_values"] = self.df[column].value_counts().head(5).to_dict()
                else:
                    col_info["inferred_type"] = "text"
            
            schema[column] = col_info
        
        return schema
    
    def _analyze_quality(self) -> Dict[str, Any]:
        """Overall data quality metrics"""
        total_cells = self.df.shape[0] * self.df.shape[1]
        missing_cells = self.df.isnull().sum().sum()
        
        return {
            "total_cells": int(total_cells),
            "missing_cells": int(missing_cells),
            "missing_percentage": float(missing_cells / total_cells * 100),
            "completeness_score": float((1 - missing_cells / total_cells) * 100),
            "memory_usage_mb": float(self.df.memory_usage(deep=True).sum() / 1024 / 1024)
        }
    
    def _analyze_missing_values(self) -> Dict[str, Any]:
        """Detailed missing value analysis"""
        missing_counts = self.df.isnull().sum()
        missing_columns = missing_counts[missing_counts > 0].to_dict()
        
        has_missing = len(missing_columns) > 0
        
        return {
            "has_missing": has_missing,
            "columns_with_missing": {k: int(v) for k, v in missing_columns.items()},
            "total_missing_columns": len(missing_columns),
            "severity": "high" if any(v > len(self.df) * 0.5 for v in missing_columns.values()) else "medium" if has_missing else "low"
        }
    
    def _analyze_duplicates(self) -> Dict[str, Any]:
        """Detect duplicate rows"""
        duplicate_count = self.df.duplicated().sum()
        has_duplicates = duplicate_count > 0
        
        return {
            "has_duplicates": has_duplicates,
            "duplicate_count": int(duplicate_count),
            "duplicate_percentage": float(duplicate_count / len(self.df) * 100),
            "severity": "high" if duplicate_count > len(self.df) * 0.1 else "medium" if has_duplicates else "low"
        }
    
    def _detect_outliers(self) -> Dict[str, Any]:
        """Detect outliers using IQR method"""
        numeric_columns = self.df.select_dtypes(include=[np.number]).columns
        outlier_info = {}
        
        for column in numeric_columns:
            Q1 = self.df[column].quantile(0.25)
            Q3 = self.df[column].quantile(0.75)
            IQR = Q3 - Q1
            
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outliers = self.df[(self.df[column] < lower_bound) | (self.df[column] > upper_bound)]
            outlier_count = len(outliers)
            
            if outlier_count > 0:
                outlier_info[column] = {
                    "count": int(outlier_count),
                    "percentage": float(outlier_count / len(self.df) * 100),
                    "lower_bound": float(lower_bound),
                    "upper_bound": float(upper_bound)
                }
        
        has_outliers = len(outlier_info) > 0
        
        return {
            "has_outliers": has_outliers,
            "columns_with_outliers": outlier_info,
            "total_columns_affected": len(outlier_info)
        }
    
    def _detect_imbalance(self) -> Dict[str, Any]:
        """Detect class imbalance in potential target columns"""
        imbalance_info = {}
        
        # Check columns with small number of unique values (potential targets)
        for column in self.df.columns:
            unique_count = self.df[column].nunique()
            
            # Binary or multi-class target candidates (2-10 classes)
            if 2 <= unique_count <= 10:
                value_counts = self.df[column].value_counts()
                majority_class = value_counts.max()
                minority_class = value_counts.min()
                
                imbalance_ratio = majority_class / minority_class if minority_class > 0 else float('inf')
                
                if imbalance_ratio > 1.5:  # Threshold for imbalance
                    imbalance_info[column] = {
                        "imbalance_ratio": float(imbalance_ratio),
                        "class_distribution": value_counts.to_dict(),
                        "severity": "high" if imbalance_ratio > 10 else "medium"
                    }
        
        has_imbalance = len(imbalance_info) > 0
        
        return {
            "has_imbalance": has_imbalance,
            "imbalanced_columns": imbalance_info
        }
    
    def _generate_suggestions(self) -> List[Dict[str, str]]:
        """Generate actionable suggestions based on analysis"""
        suggestions = []
        
        # Missing values
        if self.report.get("missing_values", {}).get("has_missing"):
            suggestions.append({
                "type": "missing_values",
                "severity": "high",
                "message": "Dataset contains missing values",
                "action": "Apply imputation strategies: mean/median for numerical, mode for categorical"
            })
        
        # Duplicates
        if self.report.get("duplicates", {}).get("has_duplicates"):
            suggestions.append({
                "type": "duplicates",
                "severity": "high",
                "message": "Duplicate rows detected",
                "action": "Remove duplicate rows to avoid data leakage"
            })
        
        # Outliers
        if self.report.get("outliers", {}).get("has_outliers"):
            suggestions.append({
                "type": "outliers",
                "severity": "medium",
                "message": "Outliers detected in numerical columns",
                "action": "Consider capping, transformation, or removal based on domain knowledge"
            })
        
        # Imbalance
        if self.report.get("imbalance", {}).get("has_imbalance"):
            suggestions.append({
                "type": "imbalance",
                "severity": "high",
                "message": "Class imbalance detected",
                "action": "Use SMOTE, class weights, or stratified sampling"
            })
        
        # Data types
        suggestions.append({
            "type": "encoding",
            "severity": "info",
            "message": "Categorical variables need encoding",
            "action": "Apply one-hot encoding or label encoding based on cardinality"
        })
        
        return suggestions
