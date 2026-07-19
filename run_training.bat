@echo off
title Telco Churn MLOps Pipeline
echo ======================================================
echo Starting Telco Churn MLOps Pipeline...
echo ======================================================

:: Check for Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in your system PATH.
    echo Please install Python and try again.
    pause
    exit /b 1
)

:: Verify/install dependencies
echo Checking dependencies...
python -c "import pandas, numpy, sklearn, xgboost, joblib, matplotlib, seaborn" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing required dependencies from requirements.txt...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency installation failed. Please run 'pip install -r requirements.txt' manually.
        pause
        exit /b 1
    )
)

:: Run pipeline
echo Running MLOps Pipeline Orchestrator...
echo ------------------------------------------------------
python main.py
echo ------------------------------------------------------

echo Done!
pause
