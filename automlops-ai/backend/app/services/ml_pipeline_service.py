"""
ML Pipeline Service
Orchestrates the entire ML workflow using AI agents
"""

import pandas as pd
import numpy as np
from typing import Dict, Any
from loguru import logger
from sqlalchemy.orm import Session
import traceback

from app.models.project import Project, ProjectStatus
from app.models.experiment import Experiment, ExperimentStatus
from app.models.dataset import Dataset
from app.schemas.project import ProjectExecute
from app.agents.supervisor_agent import SupervisorAgent
from app.agents.dataset_agent import DatasetAgent
from app.agents.eda_agent import EDAAgent
from app.agents.training_agent import TrainingAgent


class MLPipelineService:
    """
    Main service that coordinates all AI agents to execute the ML pipeline
    """
    
    def __init__(self, project_id: int, db: Session):
        self.project_id = project_id
        self.db = db
        self.supervisor = SupervisorAgent()
        
    async def execute_pipeline(self, project: Project, config: ProjectExecute):
        """
        Execute the complete ML pipeline
        """
        logger.info(f"Starting ML pipeline for project {project.id}")
        
        try:
            # Step 1: Understand the task
            logger.info("Step 1: Understanding user prompt...")
            df = pd.read_csv(project.dataset_path)
            understanding = self.supervisor.understand_prompt(
                project.user_prompt,
                df.columns.tolist()
            )
            
            # Update project with understood task
            project.task_type = understanding["task_type"]
            if understanding["target_column"]:
                project.target_column = understanding["target_column"]
            elif config.target_column:
                project.target_column = config.target_column
            self.db.commit()
            
            # Step 2: Create workflow plan
            logger.info("Step 2: Creating workflow plan...")
            workflow = self.supervisor.create_workflow_plan(
                understanding["task_type"],
                understanding["requirements"]
            )
            
            # Save workflow to project extra_config
            project.extra_config = {"workflow": workflow}
            self.db.commit()
            
            # Step 3: Execute workflow
            logger.info("Step 3: Executing workflow...")
            await self._execute_workflow(project, config, workflow)
            
            # Mark as completed
            project.status = ProjectStatus.COMPLETED
            self.db.commit()
            
            logger.info(f"ML pipeline completed for project {project.id}")
            
        except Exception as e:
            logger.error(f"Pipeline failed: {str(e)}")
            logger.error(traceback.format_exc())
            project.status = ProjectStatus.FAILED
            self.db.commit()
    
    async def _execute_workflow(self, project: Project, config: ProjectExecute, workflow: list):
        """Execute each step in the workflow"""
        
        for step in workflow:
            try:
                logger.info(f"Executing step {step['step']}: {step['task']}")
                
                # Update step status
                step["status"] = "running"
                project.extra_config = {"workflow": workflow}
                self.db.commit()
                
                # Execute based on agent type
                if step["agent"] == "dataset_agent":
                    result = await self._execute_dataset_analysis(project)
                    step["result"] = result
                    
                elif step["agent"] == "eda_agent":
                    result = await self._execute_eda(project)
                    step["result"] = result
                    
                elif step["agent"] == "training_agent" and step["task"] == "train_models":
                    result = await self._execute_training(project, config)
                    step["result"] = result
                    
                else:
                    # Placeholder for other agents
                    step["result"] = {"status": "skipped", "message": "Agent not implemented yet"}
                
                # Mark as completed
                step["status"] = "completed"
                project.extra_config = {"workflow": workflow}
                self.db.commit()
                
                logger.info(f"Step {step['step']} completed")
                
            except Exception as e:
                logger.error(f"Step {step['step']} failed: {str(e)}")
                step["status"] = "failed"
                step["error"] = str(e)
                project.extra_config = {"workflow": workflow}
                self.db.commit()
    
    async def _execute_dataset_analysis(self, project: Project) -> Dict[str, Any]:
        """Execute dataset analysis"""
        
        agent = DatasetAgent()
        result = agent.analyze(project.dataset_path)
        
        # Save dataset record
        dataset = Dataset(
            project_id=project.id,
            name=project.dataset_name,
            file_path=project.dataset_path,
            file_size=project.dataset_size,
            num_rows=result.get("num_rows"),
            num_columns=result.get("num_columns"),
            has_duplicates=result.get("duplicates", {}).get("has_duplicates", False),
            duplicate_count=result.get("duplicates", {}).get("duplicate_count", 0),
            has_missing=result.get("missing_values", {}).get("has_missing", False),
            has_outliers=result.get("outliers", {}).get("has_outliers", False),
            is_imbalanced=result.get("imbalance", {}).get("has_imbalance", False),
            schema_info=result.get("schema"),
            validation_report=result,
            suggested_fixes=result.get("suggestions")
        )
        
        self.db.add(dataset)
        self.db.commit()
        
        return result
    
    async def _execute_eda(self, project: Project) -> Dict[str, Any]:
        """Execute exploratory data analysis"""
        
        output_dir = f"./reports/eda/project_{project.id}"
        agent = EDAAgent(output_dir=output_dir)
        result = agent.generate_eda(
            project.dataset_path,
            project.target_column
        )
        
        return result
    
    async def _execute_training(self, project: Project, config: ProjectExecute) -> Dict[str, Any]:
        """Execute model training"""
        
        # Load and preprocess data
        df = pd.read_csv(project.dataset_path)
        
        # Simple preprocessing for demo
        # In production, this would be handled by a preprocessing agent
        from sklearn.model_selection import train_test_split
        from sklearn.preprocessing import StandardScaler, LabelEncoder
        
        # Separate features and target
        if project.target_column not in df.columns:
            raise ValueError(f"Target column '{project.target_column}' not found in dataset")
        
        X = df.drop(columns=[project.target_column])
        y = df[project.target_column]
        
        # Encode categorical target if needed
        if y.dtype == 'object':
            le = LabelEncoder()
            y = le.fit_transform(y)
        
        # Simple encoding for categorical features
        X_encoded = pd.get_dummies(X, drop_first=True)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_encoded, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train models
        agent = TrainingAgent(task_type=project.task_type)
        results = agent.train_all_models(
            X_train_scaled,
            X_test_scaled,
            y_train,
            y_test,
            feature_names=X_encoded.columns.tolist()
        )
        
        # Save experiments to database
        for result in results:
            if result.get("status") == "completed":
                experiment = Experiment(
                    project_id=project.id,
                    name=f"{result['model_name']} - Auto",
                    model_name=result['model_name'],
                    status=ExperimentStatus.COMPLETED,
                    accuracy=result.get('accuracy'),
                    precision=result.get('precision'),
                    recall=result.get('recall'),
                    f1_score=result.get('f1_score'),
                    roc_auc=result.get('roc_auc'),
                    training_time=result.get('training_time'),
                    inference_time=result.get('inference_time'),
                    memory_usage=result.get('memory_usage'),
                    extra_config=result
                )
                
                self.db.add(experiment)
        
        self.db.commit()
        
        return {
            "status": "completed",
            "models_trained": len(results),
            "best_model": agent.best_model_name,
            "leaderboard": results
        }
