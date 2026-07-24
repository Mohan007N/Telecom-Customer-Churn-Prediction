"""
=============================================================
Interactive Graph & Dashboard Confusion Matrix Generator
=============================================================
Description: Evaluates XGBoost model on test data, generates high-res PNG plots,
             and outputs an interactive, standalone HTML Confusion Matrix Graph Dashboard.
=============================================================
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

def generate_dashboard():
    print("[*] Loading test data and model...")
    model_path = "models/xgboost_churn_model.pkl"
    if not os.path.exists(model_path):
        model_path = "xgboost_churn_model.pkl"
        
    model = joblib.load(model_path)
    X_test = pd.read_csv("data/processed/X_test.csv")
    y_test = pd.read_csv("data/processed/y_test.csv")["Churn"].values

    # Get prediction probabilities for Class 1 (Churn)
    y_probs = model.predict_proba(X_test)[:, 1].tolist()
    y_true = y_test.tolist()
    
    output_dir = "reports/plots"
    os.makedirs(output_dir, exist_ok=True)
    
    # Save probabilities to JSON for web dashboard interactivity
    data_payload = {
        "y_true": y_true,
        "y_probs": [round(p, 4) for p in y_probs],
        "total_samples": len(y_true)
    }
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Confusion Matrix Graph Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {{
            --bg-dark: #0f172a;
            --card-bg: rgba(30, 41, 59, 0.7);
            --border-color: rgba(255, 255, 255, 0.1);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --tn-color: #10b981;
            --fp-color: #f59e0b;
            --fn-color: #ef4444;
            --tp-color: #3b82f6;
            --accent-cyan: #06b6d4;
        }}
        
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
        }}
        
        body {{
            background: radial-gradient(circle at top right, #1e1b4b, #0f172a 60%);
            color: var(--text-main);
            min-height: 100vh;
            padding: 2rem;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        
        header {{
            text-align: center;
            margin-bottom: 2rem;
        }}
        
        header h1 {{
            font-size: 2.2rem;
            font-weight: 800;
            background: linear-gradient(135deg, #38bdf8, #818cf8, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }}
        
        header p {{
            color: var(--text-muted);
            font-size: 1.05rem;
        }}
        
        .controls-card {{
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 2rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }}
        
        .slider-group {{
            flex: 1;
        }}
        
        .slider-header {{
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.75rem;
            font-weight: 600;
        }}
        
        .slider-header span.val {{
            color: var(--accent-cyan);
            font-size: 1.2rem;
            font-weight: 700;
        }}
        
        input[type=range] {{
            width: 100%;
            height: 8px;
            border-radius: 4px;
            background: #334155;
            outline: none;
            accent-color: var(--accent-cyan);
            cursor: pointer;
        }}
        
        .grid-layout {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
        }}
        
        .card {{
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 1.75rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }}
        
        .card-title {{
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }}
        
        /* 2x2 Matrix Graph Styling */
        .matrix-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            position: relative;
        }}
        
        .matrix-cell {{
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }}
        
        .matrix-cell:hover {{
            transform: translateY(-3px);
            box-shadow: 0 12px 20px -5px rgba(0,0,0,0.4);
        }}
        
        .cell-tn {{ background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); }}
        .cell-fp {{ background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.3); }}
        .cell-fn {{ background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); }}
        .cell-tp {{ background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); }}
        
        .cell-tag {{
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }}
        
        .cell-tn .cell-tag {{ color: var(--tn-color); }}
        .cell-fp .cell-tag {{ color: var(--fp-color); }}
        .cell-fn .cell-tag {{ color: var(--fn-color); }}
        .cell-tp .cell-tag {{ color: var(--tp-color); }}
        
        .cell-value {{
            font-size: 2.2rem;
            font-weight: 800;
            margin-bottom: 0.25rem;
        }}
        
        .cell-pct {{
            font-size: 0.95rem;
            color: var(--text-muted);
        }}
        
        /* Metric Badges Grid */
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
        }}
        
        .metric-badge {{
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1rem;
        }}
        
        .metric-name {{
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-bottom: 0.3rem;
        }}
        
        .metric-val {{
            font-size: 1.6rem;
            font-weight: 700;
            color: var(--accent-cyan);
        }}
        
        .bar-container {{
            width: 100%;
            height: 6px;
            background: #334155;
            border-radius: 3px;
            margin-top: 0.5rem;
            overflow: hidden;
        }}
        
        .bar-fill {{
            height: 100%;
            background: linear-gradient(90deg, #38bdf8, #818cf8);
            border-radius: 3px;
            transition: width 0.4s ease;
        }}
        
        .chart-card {{
            grid-column: span 2;
        }}
    </style>
</head>
<body>

<div class="container">
    <header>
        <h1>📊 Confusion Matrix Graph & Evaluation Dashboard</h1>
        <p>Telco Customer Churn Prediction Model (XGBoost Classifier)</p>
    </header>

    <div class="controls-card">
        <div class="slider-group">
            <div class="slider-header">
                <span>Decision Threshold ($\tau$)</span>
                <span class="val" id="thresholdVal">0.61</span>
            </div>
            <input type="range" id="thresholdSlider" min="0.10" max="0.90" step="0.01" value="0.61">
        </div>
        <div style="text-align: right;">
            <div style="font-size:0.85rem; color:var(--text-muted)">Total Test Set</div>
            <div style="font-size:1.5rem; font-weight:700">{len(y_true):,} Samples</div>
        </div>
    </div>

    <div class="grid-layout">
        <!-- Confusion Matrix Visual Graph -->
        <div class="card">
            <div class="card-title">🧩 Confusion Matrix Graph</div>
            <div class="matrix-grid">
                <div class="matrix-cell cell-tn">
                    <div class="cell-tag">True Negative (TN)</div>
                    <div class="cell-value" id="valTN">0</div>
                    <div class="cell-pct" id="pctTN">0%</div>
                    <div style="font-size:0.75rem; margin-top:0.4rem; color:var(--text-muted)">Actual Retained $\rightarrow$ Pred Retained</div>
                </div>
                <div class="matrix-cell cell-fp">
                    <div class="cell-tag">False Positive (FP)</div>
                    <div class="cell-value" id="valFP">0</div>
                    <div class="cell-pct" id="pctFP">0%</div>
                    <div style="font-size:0.75rem; margin-top:0.4rem; color:var(--text-muted)">Type I Error (False Alarm)</div>
                </div>
                <div class="matrix-cell cell-fn">
                    <div class="cell-tag">False Negative (FN)</div>
                    <div class="cell-value" id="valFN">0</div>
                    <div class="cell-pct" id="pctFN">0%</div>
                    <div style="font-size:0.75rem; margin-top:0.4rem; color:var(--text-muted)">Type II Error (Missed Churn)</div>
                </div>
                <div class="matrix-cell cell-tp">
                    <div class="cell-tag">True Positive (TP)</div>
                    <div class="cell-value" id="valTP">0</div>
                    <div class="cell-pct" id="pctTP">0%</div>
                    <div style="font-size:0.75rem; margin-top:0.4rem; color:var(--text-muted)">Actual Churn $\rightarrow$ Pred Churn</div>
                </div>
            </div>
        </div>

        <!-- Derived Performance Metrics -->
        <div class="card">
            <div class="card-title">📈 Model Performance Metrics</div>
            <div class="metrics-grid">
                <div class="metric-badge">
                    <div class="metric-name">Accuracy</div>
                    <div class="metric-val" id="metricAcc">0.0%</div>
                    <div class="bar-container"><div class="bar-fill" id="barAcc" style="width: 0%"></div></div>
                </div>
                <div class="metric-badge">
                    <div class="metric-name">Recall / Sensitivity</div>
                    <div class="metric-val" id="metricRec">0.0%</div>
                    <div class="bar-container"><div class="bar-fill" id="barRec" style="width: 0%"></div></div>
                </div>
                <div class="metric-badge">
                    <div class="metric-name">Precision</div>
                    <div class="metric-val" id="metricPrec">0.0%</div>
                    <div class="bar-container"><div class="bar-fill" id="barPrec" style="width: 0%"></div></div>
                </div>
                <div class="metric-badge">
                    <div class="metric-name">F1-Score</div>
                    <div class="metric-val" id="metricF1">0.000</div>
                    <div class="bar-container"><div class="bar-fill" id="barF1" style="width: 0%"></div></div>
                </div>
                <div class="metric-badge">
                    <div class="metric-name">Specificity</div>
                    <div class="metric-val" id="metricSpec">0.0%</div>
                    <div class="bar-container"><div class="bar-fill" id="barSpec" style="width: 0%"></div></div>
                </div>
                <div class="metric-badge">
                    <div class="metric-name">False Positive Rate</div>
                    <div class="metric-val" id="metricFPR">0.0%</div>
                    <div class="bar-container"><div class="bar-fill" id="barFPR" style="width: 0%; background:#f59e0b;"></div></div>
                </div>
            </div>
        </div>

        <!-- Visual Bar Chart Comparison -->
        <div class="card chart-card">
            <div class="card-title">📊 Actual vs Predicted Distribution Graph</div>
            <div style="height: 260px;">
                <canvas id="distributionChart"></canvas>
            </div>
        </div>
    </div>
</div>

<script>
    const dataset = {json.dumps(data_payload)};
    const yTrue = dataset.y_true;
    const yProbs = dataset.y_probs;
    const total = dataset.total_samples;

    const slider = document.getElementById('thresholdSlider');
    const thresholdVal = document.getElementById('thresholdVal');
    
    let chartInstance = null;

    function updateMetrics() {{
        const thresh = parseFloat(slider.value);
        thresholdVal.textContent = thresh.toFixed(2);

        let tn = 0, fp = 0, fn = 0, tp = 0;
        for (let i = 0; i < total; i++) {{
            const pred = yProbs[i] >= thresh ? 1 : 0;
            const actual = yTrue[i];
            if (actual === 0 && pred === 0) tn++;
            else if (actual === 0 && pred === 1) fp++;
            else if (actual === 1 && pred === 0) fn++;
            else if (actual === 1 && pred === 1) tp++;
        }}

        // Matrix cells
        document.getElementById('valTN').textContent = tn;
        document.getElementById('pctTN').textContent = ((tn / total) * 100).toFixed(1) + '%';
        document.getElementById('valFP').textContent = fp;
        document.getElementById('pctFP').textContent = ((fp / total) * 100).toFixed(1) + '%';
        document.getElementById('valFN').textContent = fn;
        document.getElementById('pctFN').textContent = ((fn / total) * 100).toFixed(1) + '%';
        document.getElementById('valTP').textContent = tp;
        document.getElementById('pctTP').textContent = ((tp / total) * 100).toFixed(1) + '%';

        // Calculations
        const accuracy = (tp + tn) / total;
        const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
        const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
        const specificity = (tn + fp) > 0 ? tn / (tn + fp) : 0;
        const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
        const fpr = (fp + tn) > 0 ? fp / (fp + tn) : 0;

        document.getElementById('metricAcc').textContent = (accuracy * 100).toFixed(1) + '%';
        document.getElementById('barAcc').style.width = (accuracy * 100) + '%';

        document.getElementById('metricRec').textContent = (recall * 100).toFixed(1) + '%';
        document.getElementById('barRec').style.width = (recall * 100) + '%';

        document.getElementById('metricPrec').textContent = (precision * 100).toFixed(1) + '%';
        document.getElementById('barPrec').style.width = (precision * 100) + '%';

        document.getElementById('metricF1').textContent = f1.toFixed(3);
        document.getElementById('barF1').style.width = (f1 * 100) + '%';

        document.getElementById('metricSpec').textContent = (specificity * 100).toFixed(1) + '%';
        document.getElementById('barSpec').style.width = (specificity * 100) + '%';

        document.getElementById('metricFPR').textContent = (fpr * 100).toFixed(1) + '%';
        document.getElementById('barFPR').style.width = (fpr * 100) + '%';

        updateChart(tn, fp, fn, tp);
    }}

    function updateChart(tn, fp, fn, tp) {{
        const ctx = document.getElementById('distributionChart').getContext('2d');
        const actualRetained = tn + fp;
        const actualChurned = fn + tp;
        const predRetained = tn + fn;
        const predChurned = fp + tp;

        if (chartInstance) {{
            chartInstance.data.datasets[0].data = [actualRetained, actualChurned];
            chartInstance.data.datasets[1].data = [predRetained, predChurned];
            chartInstance.update();
        }} else {{
            chartInstance = new Chart(ctx, {{
                type: 'bar',
                data: {{
                    labels: ['Retained (Class 0)', 'Churned (Class 1)'],
                    datasets: [
                        {{
                            label: 'Actual Ground Truth',
                            data: [actualRetained, actualChurned],
                            backgroundColor: '#38bdf8'
                        }},
                        {{
                            label: 'Model Predictions',
                            data: [predRetained, predChurned],
                            backgroundColor: '#818cf8'
                        }}
                    ]
                }},
                options: {{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {{
                        legend: {{ labels: {{ color: '#94a3b8' }} }}
                    }},
                    scales: {{
                        x: {{ ticks: {{ color: '#94a3b8' }}, grid: {{ color: 'rgba(255,255,255,0.05)' }} }},
                        y: {{ ticks: {{ color: '#94a3b8' }}, grid: {{ color: 'rgba(255,255,255,0.05)' }} }}
                    }}
                }}
            }});
        }}
    }}

    slider.addEventListener('input', updateMetrics);
    updateMetrics();
</script>
</body>
</html>
"""
    html_path = os.path.join(output_dir, "confusion_matrix.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    print(f"[OK] Generated interactive graph dashboard: '{html_path}'")
    
    # Also save artifact copy
    artifact_dir = r"C:\Users\mohan\.gemini\antigravity-ide\brain\350cc305-17e2-4e7a-9400-9fb78bc21da1"
    if os.path.exists(artifact_dir):
        import shutil
        shutil.copy(html_path, os.path.join(artifact_dir, "confusion_matrix.html"))
        print(f"[OK] Copied dashboard HTML to artifact dir")

if __name__ == "__main__":
    generate_dashboard()
