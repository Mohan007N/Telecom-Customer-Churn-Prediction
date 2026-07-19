# MLOps Telco Customer Churn Prediction Pipeline

This repository contains a production-ready, modular machine learning pipeline using **XGBoost** to predict customer churn based on the IBM Telco Customer Churn dataset. It has been built following software engineering best practices for an MLOps project.

---

## 📁 Project Folder Structure

```text
mlops/
├── data/                                 # Data storage
│   ├── raw/                              # Place raw datasets here
│   └── processed/                        # Automated train/test preprocessed splits (CSVs)
├── models/                               # Saved serializations
│   └── xgboost_churn_model.pkl           # Saved XGBoost classifier binary (joblib)
├── reports/                              # Generated artifacts
│   ├── plots/                            # Plot graphs (distribution, heatmap, feature importance, etc.)
│   └── metrics.json                      # Performance score tracking file
├── src/                                  # Source modules
│   ├── __init__.py
│   ├── data_cleaning.py                  # Cleaning, duplicates & dtype handling
│   ├── eda.py                            # Summary statistics and seaborn plotting
│   ├── feature_engineering.py            # Creating derived features, scaling, splitting
│   ├── training.py                       # XGBoost model training and serialization logic
│   └── evaluation.py                     # Performance reporting & feature importance
├── main.py                               # Main pipeline orchestrator
├── run_training.bat                      # Windows double-clickable automation script
├── requirements.txt                      # Project dependencies file
├── xgboost_churn_model.pkl               # Copy of the trained model in project root
└── README.md                             # Project documentation
```

---

## ⚡ How to Run

### 1. Installation
Install the necessary python modules via the terminal:
```bash
pip install -r requirements.txt
```

### 2. Run the Full Orchestrated Pipeline
Execute the orchestrator:
```bash
python main.py
```
*Alternatively (on Windows), double-click the **`run_training.bat`** file.*

---

## 🔍 Pipeline Steps

### 1. Data Cleaning
- Converts `TotalCharges` to numeric.
- Identifies and handles blank/missing spaces in `TotalCharges` using median imputation.
- Identifies and drops duplicate entries.

### 2. Exploratory Data Analysis (EDA)
- Displays summary statistics for both categorical and numerical variables.
- Generates and exports plots to `reports/plots/`:
  - `churn_distribution.png` (displays relative class balance)
  - `monthly_charges_vs_churn.png` (stacked monthly price histograms)
  - `tenure_vs_churn.png` (tenure length boxplot comparisons)
  - `correlation_heatmap.png` (relationships between numeric features and Churn)

### 3. Feature Engineering
- **Derived Feature `TotalServices`**: Counts the number of active services a customer has subscribed to out of 9 options.
- **Derived Feature `TenureCohort`**: Groups tenure length into intervals (`0-1 Year`, `1-2 Years`, `2-4 Years`, `4+ Years`) representing logical contract periods.
- **Derived Feature `ChargesRatio`**: Captures monthly expense intensity relative to lifetime payments.
- One-hot encodes all categorical factors.
- Applies standard scaling (`StandardScaler`) to continuous features.
- Performs an 80/20 train/test split, stratified by the target label (`Churn`).

### 4. XGBoost Model Training
Trains the `XGBClassifier` using the following hyperparameters:
- `n_estimators=200`: Optimizes tree count.
- `max_depth=4`: Avoids complex rules and prevents overfitting.
- `learning_rate=0.05`: Step-size shrinkage.
- `subsample=0.8` & `colsample_bytree=0.8`: Regularizes feature/sample selections.

### 5. Model Evaluation
- Computes Accuracy, Precision, Recall, F1, and ROC-AUC.
- Generates and exports evaluation plots:
  - `confusion_matrix.png`
  - `roc_curve.png`
  - `feature_importance.png` (visualizes feature importance by gain weight)
- Saves final score values to `reports/metrics.json` for MLOps tracking.
