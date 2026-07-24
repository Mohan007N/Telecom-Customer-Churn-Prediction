# Churn Predictor — Telecom Customer Churn Prediction Platform

A **production-ready, modular full-stack MLOps application** for Telecom Customer Churn prediction, featuring a clean enterprise light-theme React dashboard, modular FastAPI backend, in-memory XGBoost model loading, and high-speed CSV batch processing.

---

## 🚀 Quick Start (All-in-One Launcher)

Double-click or execute from shell:
```bat
start_all.bat
```

This will automatically:
1. Verify ML model artifacts (`models/xgboost_churn_model.pkl`) and run training pipeline if missing.
2. Launch the **FastAPI Backend Service** on `http://localhost:8000`.
3. Launch the **React Light-Theme Dashboard** on `http://localhost:5173`.

---

## 📱 Application Pages & Navigation

- **Landing Page (`/`)**: Hero section with title *"Telecom Customer Churn Prediction Platform"*, feature cards, MLOps workflow, and footer.
- **Dashboard Home (`/dashboard`)**: Total predictions, Churn vs Retained customer stats, Model Accuracy, and recent prediction logs.
- **Single Prediction (`/dashboard/single`)**: Comprehensive customer attribute form (Tenure, Charges, Services, Contract) with real-time churn risk tier assessment.
- **Batch CSV Upload (`/dashboard/batch`)**: Drag & drop CSV file upload, preview 10 rows, column validation, progress indicator, batch predictions, and downloadable `prediction_results.csv`.
- **Prediction History (`/dashboard/history`)**: Filterable audit log of customer predictions.
- **Model Performance (`/dashboard/performance`)**: 78.5% Accuracy, 70.6% Recall, 0.845 ROC-AUC score, and 2x2 confusion matrix grid.
- **Settings (`/dashboard/settings`)**: API connection settings and model decision threshold slider ($\tau = 0.61$).

---

## ⚡ FastAPI Backend Endpoints

- `POST /api/v1/predict` (or `/predict`): Single customer prediction
- `POST /api/v1/predict-batch` (or `/predict-batch`): Batch CSV upload & prediction
- `GET /api/v1/download-batch-results/{file_id}`: Download generated prediction results CSV
- `GET /api/v1/health` (or `/health`): System and model health check
- `GET /api/v1/metrics` (or `/metrics`): Classification metrics (Accuracy, Precision, Recall, F1, ROC-AUC)
- `GET /api/v1/model-info` (or `/model-info`): Model architecture details

---

## 📁 Clean Project Structure

```
Telecom-Churn-Prediction/
├── backend/                  # Modular FastAPI backend
│   └── app/
│       ├── api/              # API Route endpoints (/predict, /predict-batch, etc.)
│       ├── core/             # Configuration & Singleton Model Loader
│       ├── schemas/          # Pydantic data validation schemas
│       ├── services/         # Single & Batch Prediction service logic
│       └── main.py           # Production FastAPI entrypoint
│
├── frontend/                 # Clean Light-Theme React Enterprise Dashboard
│   └── src/
│       ├── components/       # Navbar, Sidebar, Card components
│       ├── layouts/          # DashboardLayout wrapper
│       ├── pages/            # LandingPage, DashboardHome, SinglePrediction, BatchPrediction, etc.
│       └── services/         # Axios API client
│
├── models/                   # Serialized ML Model Artifacts
│   ├── xgboost_churn_model.pkl
│   ├── scaler.pkl
│   └── feature_metadata.json
│
├── reports/                  # Metrics JSON & Plot graphics
│   ├── metrics.json
│   └── plots/
│
├── src/                      # ML Model Training Pipeline
│   ├── data_cleaning.py
│   ├── feature_engineering.py
│   ├── training.py
│   └── evaluation.py
│
├── main.py                   # ML Pipeline Orchestrator
└── start_all.bat             # Production Launcher
```
