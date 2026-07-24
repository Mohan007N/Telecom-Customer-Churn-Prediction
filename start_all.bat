@echo off
setlocal enabledelayedexpansion

:: ============================================================
::  Churn Predictor — Production Launcher
::  Starts:
::    1. FastAPI Backend Inference API  → http://localhost:8000
::    2. React Enterprise Dashboard     → http://localhost:5173
:: ============================================================

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

echo.
echo =============================================================
echo   Churn Predictor ^| Production Full-Stack Launcher
echo =============================================================
echo.

:: ── Step 1: Check ML model artifacts ─────────────────────────
echo [1/3] Checking ML model artifacts...
if not exist "%ROOT%\models\xgboost_churn_model.pkl" (
    echo       Artifacts missing. Running ML pipeline main.py...
    pushd "%ROOT%"
    python main.py
    if errorlevel 1 (
        echo [ERROR] ML pipeline failed. Fix errors and retry.
        pause & exit /b 1
    )
    popd
    echo       Done. Model artifacts created.
) else (
    echo       OK - model artifacts found.
)

:: ── Step 2: Install Python dependencies ──────────────────────
echo.
echo [2/3] Checking Python dependencies...
pushd "%ROOT%"
python -m pip install -r requirements.txt --quiet 2>nul
popd
echo       Done.

:: ── Step 3: Install Frontend Node dependencies ───────────────
echo.
echo [3/3] Checking Node dependencies...
if not exist "%ROOT%\automlops-ai\frontend\node_modules" (
    echo       Installing npm packages...
    pushd "%ROOT%\automlops-ai\frontend"
    call npm install
    popd
) else (
    echo       OK - node_modules found.
)

:: ── Step 4: Launch Services ──────────────────────────────────
echo.
echo Launching Churn Predictor services...
echo.

:: Service 1: FastAPI Backend (port 8000)
echo   [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "Churn Predictor Backend :8000" cmd /k "cd /d "%ROOT%\automlops-ai\backend" && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Small delay
timeout /t 2 /nobreak >nul

:: Service 2: React Frontend (port 5173)
echo   [2/2] Starting React Frontend on http://localhost:5173 ...
start "Churn Predictor Frontend :5173" cmd /k "cd /d "%ROOT%\automlops-ai\frontend" && npm run dev"

echo.
echo =============================================================
echo   Services active! Open browser at:
echo.
echo     Frontend Dashboard :  http://localhost:5173
echo     FastAPI Backend API:  http://localhost:8000/docs
echo =============================================================
echo.
pause
