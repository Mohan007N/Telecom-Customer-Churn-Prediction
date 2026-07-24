"""
Supervisor Agent
Orchestrates the entire ML pipeline by understanding user prompts
and coordinating specialized agents
"""

import re
from typing import Dict, List, Any, Optional
from loguru import logger


class SupervisorAgent:
    """
    Main orchestration agent that:
    1. Understands user's natural language prompt
    2. Plans the workflow
    3. Coordinates specialized agents
    4. Tracks progress
    5. Handles failures
    """
    
    def __init__(self):
        self.task_type = None
        self.target_column = None
        self.workflow_plan = []
        self.current_step = 0
        
    def understand_prompt(self, prompt: str, dataset_columns: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Analyze user prompt to extract:
        - Task type (classification, regression, clustering)
        - Target column
        - Special requirements
        """
        prompt_lower = prompt.lower()
        
        # Detect task type
        task_type = self._detect_task_type(prompt_lower)
        
        # Detect target column
        target_column = self._detect_target_column(prompt_lower, dataset_columns)
        
        # Detect special requirements
        requirements = self._detect_requirements(prompt_lower)
        
        result = {
            "task_type": task_type,
            "target_column": target_column,
            "requirements": requirements,
            "confidence": 0.85  # Can be enhanced with LLM
        }
        
        logger.info(f"Prompt understanding result: {result}")
        return result
    
    def _detect_task_type(self, prompt: str) -> str:
        """Detect ML task type from prompt"""
        
        # Classification keywords
        classification_keywords = [
            "classify", "classification", "predict class", "category", "categories",
            "churn", "fraud", "spam", "sentiment", "diagnosis", "detect"
        ]
        
        # Regression keywords
        regression_keywords = [
            "predict", "forecast", "estimate", "price", "sales", "revenue",
            "value", "amount", "score", "rating", "continuous"
        ]
        
        # Clustering keywords
        clustering_keywords = [
            "cluster", "segment", "group", "similar", "pattern",
            "unsupervised", "discover"
        ]
        
        # Anomaly detection keywords
        anomaly_keywords = [
            "anomaly", "outlier", "unusual", "abnormal", "fraud detection"
        ]
        
        # Count matches
        classification_score = sum(1 for kw in classification_keywords if kw in prompt)
        regression_score = sum(1 for kw in regression_keywords if kw in prompt)
        clustering_score = sum(1 for kw in clustering_keywords if kw in prompt)
        anomaly_score = sum(1 for kw in anomaly_keywords if kw in prompt)
        
        scores = {
            "classification": classification_score,
            "regression": regression_score,
            "clustering": clustering_score,
            "anomaly_detection": anomaly_score
        }
        
        # Return task with highest score
        task_type = max(scores, key=scores.get)
        
        # Default to classification if no clear indicator
        if scores[task_type] == 0:
            task_type = "classification"
        
        return task_type
    
    def _detect_target_column(self, prompt: str, columns: Optional[List[str]] = None) -> Optional[str]:
        """Detect target column from prompt"""
        
        if not columns:
            return None
        
        # Common target column patterns
        target_patterns = [
            r"predict (\w+)",
            r"target (?:is |column )?(\w+)",
            r"forecast (\w+)",
            r"estimate (\w+)",
            r"classify (\w+)",
        ]
        
        # Try to extract from patterns
        for pattern in target_patterns:
            match = re.search(pattern, prompt)
            if match:
                potential_target = match.group(1)
                # Check if it matches any column (case-insensitive)
                for col in columns:
                    if col.lower() == potential_target.lower():
                        return col
                    # Partial match
                    if potential_target.lower() in col.lower():
                        return col
        
        # Common target column names
        common_targets = [
            "target", "label", "class", "churn", "fraud", "price",
            "sales", "revenue", "outcome", "result", "y"
        ]
        
        for col in columns:
            for target in common_targets:
                if target in col.lower():
                    return col
        
        return None
    
    def _detect_requirements(self, prompt: str) -> Dict[str, bool]:
        """Detect special requirements from prompt"""
        
        return {
            "feature_engineering": "feature" in prompt or "engineer" in prompt,
            "hyperparameter_tuning": "tune" in prompt or "optimize" in prompt or "best" in prompt,
            "explainability": "explain" in prompt or "interpret" in prompt or "shap" in prompt,
            "deploy": "deploy" in prompt or "api" in prompt or "serve" in prompt,
            "monitor": "monitor" in prompt or "track" in prompt,
            "fast_training": "quick" in prompt or "fast" in prompt,
        }
    
    def create_workflow_plan(self, task_type: str, requirements: Dict[str, bool]) -> List[Dict[str, Any]]:
        """
        Create execution plan based on task type and requirements
        """
        
        workflow = []
        
        # Step 1: Dataset Analysis (Always required)
        workflow.append({
            "step": 1,
            "agent": "dataset_agent",
            "task": "analyze_dataset",
            "description": "Analyze dataset schema, quality, and statistics",
            "status": "pending"
        })
        
        # Step 2: EDA (Always required)
        workflow.append({
            "step": 2,
            "agent": "eda_agent",
            "task": "perform_eda",
            "description": "Generate comprehensive exploratory data analysis",
            "status": "pending"
        })
        
        # Step 3: Data Preprocessing (Always required)
        workflow.append({
            "step": 3,
            "agent": "pipeline_agent",
            "task": "create_preprocessing_pipeline",
            "description": "Build data cleaning and preprocessing pipeline",
            "status": "pending"
        })
        
        # Step 4: Feature Engineering (Conditional)
        if requirements.get("feature_engineering", True):
            workflow.append({
                "step": 4,
                "agent": "pipeline_agent",
                "task": "engineer_features",
                "description": "Create and select relevant features",
                "status": "pending"
            })
        
        # Step 5: Model Training (Always required)
        workflow.append({
            "step": 5,
            "agent": "training_agent",
            "task": "train_models",
            "description": f"Train multiple {task_type} models",
            "status": "pending"
        })
        
        # Step 6: Hyperparameter Optimization (Conditional)
        if requirements.get("hyperparameter_tuning", True):
            workflow.append({
                "step": 6,
                "agent": "hyperparameter_agent",
                "task": "optimize_hyperparameters",
                "description": "Optimize models using Optuna",
                "status": "pending"
            })
        
        # Step 7: Model Evaluation (Always required)
        workflow.append({
            "step": 7,
            "agent": "training_agent",
            "task": "evaluate_models",
            "description": "Compare models and select best performer",
            "status": "pending"
        })
        
        # Step 8: Explainability (Conditional)
        if requirements.get("explainability", True):
            workflow.append({
                "step": 8,
                "agent": "explainability_agent",
                "task": "explain_model",
                "description": "Generate SHAP and LIME explanations",
                "status": "pending"
            })
        
        # Step 9: Deployment (Conditional)
        if requirements.get("deploy", False):
            workflow.append({
                "step": 9,
                "agent": "deployment_agent",
                "task": "deploy_model",
                "description": "Deploy best model as REST API",
                "status": "pending"
            })
        
        # Step 10: Monitoring Setup (Conditional)
        if requirements.get("monitor", False):
            workflow.append({
                "step": 10,
                "agent": "monitoring_agent",
                "task": "setup_monitoring",
                "description": "Configure drift detection and monitoring",
                "status": "pending"
            })
        
        # Step 11: Documentation (Always required)
        workflow.append({
            "step": len(workflow) + 1,
            "agent": "documentation_agent",
            "task": "generate_documentation",
            "description": "Generate comprehensive documentation",
            "status": "pending"
        })
        
        self.workflow_plan = workflow
        logger.info(f"Created workflow plan with {len(workflow)} steps")
        return workflow
    
    def get_next_step(self) -> Optional[Dict[str, Any]]:
        """Get next pending step in workflow"""
        for step in self.workflow_plan:
            if step["status"] == "pending":
                return step
        return None
    
    def update_step_status(self, step_number: int, status: str, result: Any = None):
        """Update step status and store result"""
        for step in self.workflow_plan:
            if step["step"] == step_number:
                step["status"] = status
                if result:
                    step["result"] = result
                logger.info(f"Step {step_number} status updated to: {status}")
                break
    
    def get_progress(self) -> Dict[str, Any]:
        """Get current workflow progress"""
        total_steps = len(self.workflow_plan)
        completed_steps = sum(1 for step in self.workflow_plan if step["status"] == "completed")
        failed_steps = sum(1 for step in self.workflow_plan if step["status"] == "failed")
        
        return {
            "total_steps": total_steps,
            "completed_steps": completed_steps,
            "failed_steps": failed_steps,
            "progress_percentage": (completed_steps / total_steps * 100) if total_steps > 0 else 0,
            "current_step": self.get_next_step(),
            "workflow": self.workflow_plan
        }
    
    def handle_failure(self, step_number: int, error: str) -> Dict[str, Any]:
        """Handle step failure and decide recovery strategy"""
        logger.error(f"Step {step_number} failed: {error}")
        
        # Mark step as failed
        self.update_step_status(step_number, "failed")
        
        # Determine if workflow can continue
        critical_steps = [1, 2, 3, 5, 7]  # Dataset analysis, EDA, preprocessing, training, evaluation
        
        if step_number in critical_steps:
            return {
                "can_continue": False,
                "action": "abort",
                "message": f"Critical step {step_number} failed. Workflow aborted.",
                "error": error
            }
        else:
            return {
                "can_continue": True,
                "action": "skip",
                "message": f"Non-critical step {step_number} failed. Continuing with workflow.",
                "error": error
            }
