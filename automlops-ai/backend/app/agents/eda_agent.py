"""
EDA Agent
Automatically generates comprehensive exploratory data analysis
"""

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, Any, List
from pathlib import Path
from loguru import logger
import os


class EDAAgent:
    """
    Generates comprehensive EDA including:
    - Summary statistics
    - Distribution plots
    - Correlation analysis
    - Feature relationships
    - Target analysis
    """
    
    def __init__(self, output_dir: str = "./reports/eda"):
        self.output_dir = output_dir
        self.df = None
        self.plots = []
        
    def generate_eda(
        self,
        dataset_path: str,
        target_column: str = None
    ) -> Dict[str, Any]:
        """Generate comprehensive EDA"""
        
        logger.info(f"Starting EDA for {dataset_path}")
        
        try:
            # Create output directory
            os.makedirs(self.output_dir, exist_ok=True)
            
            # Load data
            self.df = pd.read_csv(dataset_path)
            
            # Generate components
            summary_stats = self._generate_summary_statistics()
            correlations = self._analyze_correlations()
            self._generate_distribution_plots()
            
            if target_column and target_column in self.df.columns:
                self._analyze_target(target_column)
                self._analyze_feature_target_relationships(target_column)
            
            result = {
                "status": "completed",
                "summary_statistics": summary_stats,
                "correlations": correlations,
                "plots": self.plots,
                "output_directory": self.output_dir
            }
            
            logger.info("EDA completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"EDA failed: {str(e)}")
            return {
                "status": "failed",
                "error": str(e)
            }
    
    def _generate_summary_statistics(self) -> Dict[str, Any]:
        """Generate summary statistics"""
        
        numerical_stats = self.df.describe().to_dict()
        categorical_stats = self.df.describe(include=['object']).to_dict()
        
        return {
            "numerical": numerical_stats,
            "categorical": categorical_stats,
            "data_types": self.df.dtypes.astype(str).to_dict(),
            "missing_values": self.df.isnull().sum().to_dict()
        }
    
    def _analyze_correlations(self) -> Dict[str, Any]:
        """Analyze correlations between numerical features"""
        
        numeric_df = self.df.select_dtypes(include=[np.number])
        
        if len(numeric_df.columns) > 1:
            corr_matrix = numeric_df.corr()
            
            # Save correlation heatmap
            plt.figure(figsize=(12, 10))
            sns.heatmap(corr_matrix, annot=True, fmt='.2f', cmap='coolwarm', center=0)
            plt.title('Feature Correlation Heatmap', fontsize=16, fontweight='bold')
            plt.tight_layout()
            
            corr_path = os.path.join(self.output_dir, 'correlation_heatmap.png')
            plt.savefig(corr_path, dpi=150)
            plt.close()
            
            self.plots.append({
                "name": "Correlation Heatmap",
                "path": corr_path,
                "type": "heatmap"
            })
            
            return {
                "matrix": corr_matrix.to_dict(),
                "high_correlations": self._find_high_correlations(corr_matrix)
            }
        
        return {}
    
    def _find_high_correlations(self, corr_matrix: pd.DataFrame, threshold: float = 0.7) -> List[Dict[str, Any]]:
        """Find highly correlated feature pairs"""
        
        high_corr = []
        for i in range(len(corr_matrix.columns)):
            for j in range(i + 1, len(corr_matrix.columns)):
                if abs(corr_matrix.iloc[i, j]) > threshold:
                    high_corr.append({
                        "feature_1": corr_matrix.columns[i],
                        "feature_2": corr_matrix.columns[j],
                        "correlation": round(float(corr_matrix.iloc[i, j]), 3)
                    })
        
        return high_corr
    
    def _generate_distribution_plots(self):
        """Generate distribution plots for all features"""
        
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        categorical_cols = self.df.select_dtypes(include=['object']).columns
        
        # Numerical distributions
        if len(numeric_cols) > 0:
            n_cols = min(3, len(numeric_cols))
            n_rows = (len(numeric_cols) + n_cols - 1) // n_cols
            
            fig, axes = plt.subplots(n_rows, n_cols, figsize=(15, 5 * n_rows))
            if n_rows == 1:
                axes = [axes] if n_cols == 1 else axes
            else:
                axes = axes.flatten()
            
            for idx, col in enumerate(numeric_cols):
                if idx < len(axes):
                    self.df[col].hist(bins=30, ax=axes[idx], edgecolor='black')
                    axes[idx].set_title(f'{col} Distribution')
                    axes[idx].set_xlabel(col)
                    axes[idx].set_ylabel('Frequency')
            
            # Hide empty subplots
            for idx in range(len(numeric_cols), len(axes)):
                axes[idx].set_visible(False)
            
            plt.tight_layout()
            dist_path = os.path.join(self.output_dir, 'numerical_distributions.png')
            plt.savefig(dist_path, dpi=150)
            plt.close()
            
            self.plots.append({
                "name": "Numerical Distributions",
                "path": dist_path,
                "type": "histogram"
            })
        
        # Categorical distributions (top categories)
        if len(categorical_cols) > 0 and len(categorical_cols) <= 6:
            n_cols = min(2, len(categorical_cols))
            n_rows = (len(categorical_cols) + n_cols - 1) // n_cols
            
            fig, axes = plt.subplots(n_rows, n_cols, figsize=(12, 5 * n_rows))
            if n_rows == 1 and n_cols == 1:
                axes = [axes]
            elif n_rows == 1 or n_cols == 1:
                axes = axes.flatten()
            else:
                axes = axes.flatten()
            
            for idx, col in enumerate(categorical_cols):
                if idx < len(axes):
                    value_counts = self.df[col].value_counts().head(10)
                    value_counts.plot(kind='bar', ax=axes[idx])
                    axes[idx].set_title(f'{col} Distribution (Top 10)')
                    axes[idx].set_xlabel(col)
                    axes[idx].set_ylabel('Count')
                    axes[idx].tick_params(axis='x', rotation=45)
            
            # Hide empty subplots
            for idx in range(len(categorical_cols), len(axes)):
                axes[idx].set_visible(False)
            
            plt.tight_layout()
            cat_path = os.path.join(self.output_dir, 'categorical_distributions.png')
            plt.savefig(cat_path, dpi=150)
            plt.close()
            
            self.plots.append({
                "name": "Categorical Distributions",
                "path": cat_path,
                "type": "bar"
            })
    
    def _analyze_target(self, target_column: str):
        """Analyze target variable"""
        
        plt.figure(figsize=(10, 6))
        
        if self.df[target_column].dtype == 'object' or self.df[target_column].nunique() < 20:
            # Categorical target
            value_counts = self.df[target_column].value_counts()
            value_counts.plot(kind='bar')
            plt.title(f'Target Variable: {target_column}', fontsize=14, fontweight='bold')
            plt.xlabel(target_column)
            plt.ylabel('Count')
            plt.xticks(rotation=45)
        else:
            # Numerical target
            self.df[target_column].hist(bins=30, edgecolor='black')
            plt.title(f'Target Variable Distribution: {target_column}', fontsize=14, fontweight='bold')
            plt.xlabel(target_column)
            plt.ylabel('Frequency')
        
        plt.tight_layout()
        target_path = os.path.join(self.output_dir, 'target_distribution.png')
        plt.savefig(target_path, dpi=150)
        plt.close()
        
        self.plots.append({
            "name": "Target Distribution",
            "path": target_path,
            "type": "target_analysis"
        })
    
    def _analyze_feature_target_relationships(self, target_column: str):
        """Analyze relationships between features and target"""
        
        numeric_cols = [col for col in self.df.select_dtypes(include=[np.number]).columns 
                       if col != target_column]
        
        if len(numeric_cols) > 0:
            # Select top 6 features by correlation with target
            if pd.api.types.is_numeric_dtype(self.df[target_column]):
                correlations = self.df[numeric_cols + [target_column]].corr()[target_column].drop(target_column)
                top_features = correlations.abs().nlargest(6).index.tolist()
            else:
                # For categorical target, use all numerical features
                top_features = numeric_cols[:6]
            
            n_features = len(top_features)
            if n_features > 0:
                n_cols = min(3, n_features)
                n_rows = (n_features + n_cols - 1) // n_cols
                
                fig, axes = plt.subplots(n_rows, n_cols, figsize=(15, 5 * n_rows))
                if n_rows == 1:
                    axes = [axes] if n_cols == 1 else axes
                else:
                    axes = axes.flatten()
                
                for idx, feature in enumerate(top_features):
                    if idx < len(axes):
                        if self.df[target_column].dtype == 'object' or self.df[target_column].nunique() < 20:
                            # Box plot for categorical target
                            self.df.boxplot(column=feature, by=target_column, ax=axes[idx])
                            axes[idx].set_title(f'{feature} vs {target_column}')
                        else:
                            # Scatter plot for numerical target
                            axes[idx].scatter(self.df[feature], self.df[target_column], alpha=0.5)
                            axes[idx].set_xlabel(feature)
                            axes[idx].set_ylabel(target_column)
                            axes[idx].set_title(f'{feature} vs {target_column}')
                
                # Hide empty subplots
                for idx in range(n_features, len(axes)):
                    axes[idx].set_visible(False)
                
                plt.tight_layout()
                rel_path = os.path.join(self.output_dir, 'feature_target_relationships.png')
                plt.savefig(rel_path, dpi=150)
                plt.close()
                
                self.plots.append({
                    "name": "Feature-Target Relationships",
                    "path": rel_path,
                    "type": "relationship"
                })
