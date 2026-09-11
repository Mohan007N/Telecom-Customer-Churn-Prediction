"""
=============================================================
Tests — FastAPI Endpoints, Monitoring Service & Security
=============================================================
"""

import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import (
    sanitize_csv_formula_injection,
    sanitize_filename
)
from backend.app.services.monitoring_service import monitoring_service

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_api_root_and_health(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert "app" in data
    assert data["status"] == "Online"

    health_res = client.get("/api/v1/health")
    assert health_res.status_code == 200
    health_data = health_res.json()
    assert health_data["status"] == "healthy"
    assert health_data["model_loaded"] is True

def test_security_headers(client):
    res = client.get("/")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert "Strict-Transport-Security" in res.headers
    assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "Content-Security-Policy" in res.headers

def test_model_info_and_metrics(client):
    res = client.get("/api/v1/model-info")
    assert res.status_code == 200
    info = res.json()
    assert info["num_features"] > 0
    assert "XGBoost" in info["model_name"]

    metrics_res = client.get("/api/v1/metrics")
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert "test_accuracy" in metrics
    assert "roc_auc" in metrics

def test_single_prediction_endpoint(client):
    payload = {
        "tenure": 2,
        "MonthlyCharges": 89.5,
        "TotalCharges": 179.0,
        "Contract": "Month-to-month",
        "InternetService": "Fiber optic",
        "PaymentMethod": "Electronic check",
        "PaperlessBilling": "Yes",
        "SeniorCitizen": 0,
        "Partner": "No",
        "Dependents": "No",
        "PhoneService": "Yes",
        "MultipleLines": "No",
        "OnlineSecurity": "No",
        "OnlineBackup": "No",
        "DeviceProtection": "No",
        "TechSupport": "No",
        "StreamingTV": "No",
        "StreamingMovies": "No",
        "threshold": 0.5
    }
    res = client.post("/api/v1/predict", json=payload)
    assert res.status_code == 200
    pred = res.json()
    assert "churn_probability" in pred
    assert "churn_predicted" in pred
    assert pred["risk_code"] in ["LOW", "MEDIUM", "HIGH"]
    assert 0.0 <= pred["churn_probability"] <= 1.0

def test_batch_prediction_endpoint(client):
    csv_content = (
        "customerID,gender,SeniorCitizen,Partner,Dependents,tenure,PhoneService,MultipleLines,InternetService,OnlineSecurity,OnlineBackup,DeviceProtection,TechSupport,StreamingTV,StreamingMovies,Contract,PaperlessBilling,PaymentMethod,MonthlyCharges,TotalCharges\n"
        "7590-VHVEG,Female,0,Yes,No,1,No,No phone service,DSL,No,Yes,No,No,No,No,Month-to-month,Yes,Electronic check,29.85,29.85\n"
        "5575-GNVDE,Male,0,No,No,34,Yes,No,DSL,Yes,No,Yes,No,No,No,One year,No,Mailed check,56.95,1889.5\n"
    )
    file_bytes = io.BytesIO(csv_content.encode("utf-8"))
    res = client.post(
        "/api/v1/predict-batch",
        files={"file": ("test_cohort.csv", file_bytes, "text/csv")}
    )
    assert res.status_code == 200
    batch_res = res.json()
    assert batch_res["total_records"] == 2
    assert "download_url" in batch_res
    assert len(batch_res["results"]) == 2

def test_monitoring_telemetry_endpoints(client):
    metrics_res = client.get("/api/v1/monitoring/metrics")
    assert metrics_res.status_code == 200
    m_data = metrics_res.json()
    assert "total_inferences" in m_data
    assert "latency_ms" in m_data
    assert "prediction_summary" in m_data

    drift_res = client.get("/api/v1/monitoring/drift")
    assert drift_res.status_code == 200
    d_data = drift_res.json()
    assert "global_drift_status" in d_data
    assert "features" in d_data
    assert "MonthlyCharges" in d_data["features"]

    health_res = client.get("/api/v1/monitoring/health")
    assert health_res.status_code == 200
    h_data = health_res.json()
    assert h_data["status"] == "HEALTHY"

def test_simulate_traffic_and_psi_drift(client):
    sim_res = client.post("/api/v1/monitoring/simulate-traffic?count=10&drift_mode=true")
    assert sim_res.status_code == 200
    data = sim_res.json()
    assert "Successfully simulated 10 inferences" in data["message"]

    drift_res = client.get("/api/v1/monitoring/drift")
    assert drift_res.status_code == 200
    d_data = drift_res.json()
    assert d_data["features"]["MonthlyCharges"]["sample_count"] >= 10

def test_input_sanitization_helpers():
    # Formula injection protection
    assert sanitize_csv_formula_injection("=cmd|' /C calc'!A0") == "'=cmd|' /C calc'!A0"
    assert sanitize_csv_formula_injection("+123") == "'+123"
    assert sanitize_csv_formula_injection("@SUM(A1:A10)") == "'@SUM(A1:A10)"
    assert sanitize_csv_formula_injection("Normal Text") == "Normal Text"

    # Filename path traversal protection
    assert sanitize_filename("../../etc/passwd") == "passwd.csv"
    assert sanitize_filename("customers_batch_2026.csv") == "customers_batch_2026.csv"
    assert sanitize_filename("report*invalid?.csv") == "reportinvalid.csv"
