"""
=============================================================
IBM Telco Customer Churn - Data Preprocessing Pipeline
=============================================================
MLOps Project | Preprocessing Phase
Dataset: WA_Fn-UseC_-Telco-Customer-Churn.csv
Source : https://www.kaggle.com/datasets/blastchar/telco-customer-churn
=============================================================
"""

# ─────────────────────────────────────────────────────────
# Step 1: Import Libraries
# ─────────────────────────────────────────────────────────
import pandas as pd
import numpy as np
import os
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score, confusion_matrix

print("=" * 60)
print("  Telco Customer Churn — Preprocessing Pipeline")
print("=" * 60)


# ─────────────────────────────────────────────────────────
# Step 2: Load Dataset
# ─────────────────────────────────────────────────────────
print("\n📂 Step 2: Loading dataset...")
csv_path = "WA_Fn-UseC_-Telco-Customer-Churn.csv"
df = pd.read_csv(csv_path, keep_default_na=False)

# Check and update the CSV file if "No internet service" is present
raw_changed = False
for col in df.columns:
    if df[col].dtype == 'object':
        if (df[col] == "No internet service").any():
            df[col] = df[col].replace("No internet service", "No")
            raw_changed = True
            
if raw_changed:
    print(f"  🔄 Found 'No internet service' in raw dataset. Updating '{csv_path}' to use 'No'...")
    df.to_csv(csv_path, index=False)
    # Reload with default behavior
    df = pd.read_csv(csv_path)
else:
    # Reload with default behavior if loaded with keep_default_na=False
    df = pd.read_csv(csv_path)

print(df.head())
print(f"\n✅ Dataset shape: {df.shape}")
# Expected: (7043, 21)


# ─────────────────────────────────────────────────────────
# Step 3: Dataset Information
# ─────────────────────────────────────────────────────────
print("\n📋 Step 3: Dataset info...")
print("-" * 40)
df.info()
print("-" * 40)


# ─────────────────────────────────────────────────────────
# Step 4: Check Missing Values
# ─────────────────────────────────────────────────────────
print("\n🔍 Step 4: Checking missing values...")
null_counts = df.isnull().sum()
print("Null values per column:")
print(null_counts[null_counts > 0] if null_counts.sum() > 0 else "  No null values found.")

# Check for blank-space entries (common in TotalCharges)
blank_counts = (df == " ").sum()
print("\nBlank-space entries per column:")
print(blank_counts[blank_counts > 0] if blank_counts.sum() > 0 else "  No blank-space entries found.")


# ─────────────────────────────────────────────────────────
# Step 5: Check & Convert TotalCharges to numeric
# ─────────────────────────────────────────────────────────
print("\n🔄 Step 5: Checking TotalCharges dtype & converting...")
print(f"  TotalCharges dtype BEFORE conversion: {df['TotalCharges'].dtype}")

df["TotalCharges"] = pd.to_numeric(
    df["TotalCharges"],
    errors="coerce"
)

print(f"  TotalCharges dtype AFTER  conversion: {df['TotalCharges'].dtype}")
null_after = df["TotalCharges"].isnull().sum()
print(f"  Null values in TotalCharges after conversion: {null_after}")


# ─────────────────────────────────────────────────────────
# Step 6: Handle Missing Values (median imputation) & Simplify categories
# ─────────────────────────────────────────────────────────
print("\n🩹 Step 6: Filling missing TotalCharges with median...")
median_val = df["TotalCharges"].median()
df["TotalCharges"].fillna(median_val, inplace=True)

print(f"  Median used: {median_val}")
print(f"  Remaining nulls in TotalCharges: {df['TotalCharges'].isnull().sum()}")

print("  Simplifying categorical columns by mapping redundant sub-states...")
# Map "No internet service" to "No" for all Internet add-on features
no_internet_cols = [
    "OnlineSecurity", "OnlineBackup", "DeviceProtection", 
    "TechSupport", "StreamingTV", "StreamingMovies"
]
for col in no_internet_cols:
    if col in df.columns:
        df[col] = df[col].replace("No internet service", "No")
        
# Map "No phone service" to "No" for MultipleLines
if "MultipleLines" in df.columns:
    df["MultipleLines"] = df["MultipleLines"].replace("No phone service", "No")

# ─────────────────────────────────────────────────────────
# Step 7: Feature Engineering & Column Cleanup
# ─────────────────────────────────────────────────────────
print("\n🛠️  Step 7: Performing feature engineering and dropping customerID/noise...")

# 1. TotalServices count
service_cols = [
    "PhoneService", "MultipleLines", "InternetService", "OnlineSecurity", 
    "OnlineBackup", "DeviceProtection", "TechSupport", "StreamingTV", "StreamingMovies"
]
df["TotalServices"] = 0
for col in service_cols:
    if col in df.columns:
        df["TotalServices"] += df[col].apply(lambda x: 1 if x in ["Yes", "Fiber optic", "DSL"] else 0)

# 2. TenureCohort binning
def get_tenure_cohort(months):
    if months <= 12:
        return "0-1 Year"
    elif months <= 24:
        return "1-2 Years"
    elif months <= 48:
        return "2-4 Years"
    else:
        return "4+ Years"
df["TenureCohort"] = df["tenure"].apply(get_tenure_cohort)

# 3. ChargesRatio
df["ChargesRatio"] = df["MonthlyCharges"] / (df["TotalCharges"] + 1e-5)

# 4. CostPerService
df["CostPerService"] = df["MonthlyCharges"] / (df["TotalServices"] + 1)

# 5. ChargeDifference
df["ChargeDifference"] = df["TotalCharges"] - (df["MonthlyCharges"] * df["tenure"])

# 6. HasContract
if "Contract" in df.columns:
    df["HasContract"] = (df["Contract"] != "Month-to-month").astype(int)
    
# 7. IsSeniorAndSingle
if all(col in df.columns for col in ["SeniorCitizen", "Partner", "Dependents"]):
    df["IsSeniorAndSingle"] = ((df["SeniorCitizen"] == 1) & (df["Partner"] == "No") & (df["Dependents"] == "No")).astype(int)

# 8. Drop customerID and low-importance columns (gender, PhoneService)
cols_to_drop = ["customerID", "gender", "PhoneService"]
for col in cols_to_drop:
    if col in df.columns:
        df.drop(col, axis=1, inplace=True)

print(f"  Shape after feature engineering: {df.shape}")
print(f"  Columns: {list(df.columns)}")


# ─────────────────────────────────────────────────────────
# Step 8: Encode Target Variable (Churn → 0/1)
# ─────────────────────────────────────────────────────────
print("\n🏷️  Step 8: Encoding target variable (Churn)...")
df["Churn"] = df["Churn"].map({
    "No": 0,
    "Yes": 1
})

print("  Churn value counts:")
print(df["Churn"].value_counts().to_string())


# ─────────────────────────────────────────────────────────
# Step 9: One-Hot Encode Categorical Features
# ─────────────────────────────────────────────────────────
print("\n🔢 Step 9: One-hot encoding categorical features...")
df = pd.get_dummies(df, drop_first=True)
print(f"  Shape after encoding: {df.shape}")


# ─────────────────────────────────────────────────────────
# Step 10: Split Features and Target
# ─────────────────────────────────────────────────────────
print("\n✂️  Step 10: Splitting features (X) and target (y)...")
X = df.drop("Churn", axis=1)
y = df["Churn"]

print(f"  Features (X) shape: {X.shape}")
print(f"  Target   (y) shape: {y.shape}")


# ─────────────────────────────────────────────────────────
# Step 11: Train-Test Split (80/20, stratified)
# ─────────────────────────────────────────────────────────
print("\n📊 Step 11: Train-Test split (80/20, stratified)...")
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print(f"  X_train: {X_train.shape}  |  X_test: {X_test.shape}")
print(f"  y_train: {y_train.shape}  |  y_test: {y_test.shape}")


# ─────────────────────────────────────────────────────────
# Step 12: Scale Numerical Columns (StandardScaler)
# ─────────────────────────────────────────────────────────
print("\n⚖️  Step 12: Scaling features with StandardScaler...")
scaler = StandardScaler()

X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

print(f"  X_train scaled shape: {X_train.shape}")
print(f"  X_test  scaled shape: {X_test.shape}")


# ─────────────────────────────────────────────────────────
# Step 13: Train Model (XGBoost Classifier)
# ─────────────────────────────────────────────────────────
print("\n🚀 Step 13: Training XGBoost Classifier...")
model = XGBClassifier(
    n_estimators=300,
    max_depth=3,
    learning_rate=0.02,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=6,
    reg_lambda=5.0,
    random_state=42,
    use_label_encoder=False,
    eval_metric='logloss'
)
model.fit(X_train, y_train)

# Predictions & probabilities
train_pred = model.predict(X_train)
test_pred = model.predict(X_test)
test_prob = model.predict_proba(X_test)[:, 1]

# Compute metrics
train_acc = accuracy_score(y_train, train_pred)
test_acc = accuracy_score(y_test, test_pred)
roc_auc = roc_auc_score(y_test, test_prob)
conf_matrix = confusion_matrix(y_test, test_pred)
class_report = classification_report(y_test, test_pred)

print(f"  Training Accuracy: {train_acc:.4f}")
print(f"  Testing  Accuracy: {test_acc:.4f}")
print(f"  Testing  ROC-AUC : {roc_auc:.4f}")
print("\n📋 Classification Report:")
print(class_report)
print("🧩 Confusion Matrix:")
print(f"  TN: {conf_matrix[0, 0]} | FP: {conf_matrix[0, 1]}")
print(f"  FN: {conf_matrix[1, 0]} | TP: {conf_matrix[1, 1]}")

if 0.80 <= test_acc <= 0.85:
    print("\n  ✅ Accuracy is in the expected 80-85% range — everything looks correct!")
elif test_acc > 0.85:
    print("\n  ⚠️  Accuracy is above 85% — possible overfitting, investigate further.")
else:
    print("\n  ⚠️  Accuracy is below 80% — may need feature engineering or tuning.")


# ─────────────────────────────────────────────────────────
# Step 14: Save Artifacts & Preprocessed Data
# ─────────────────────────────────────────────────────────
print("\n💾 Step 14: Saving model, scaler, and preprocessed datasets...")

# Create directories if they do not exist
os.makedirs("models", exist_ok=True)
os.makedirs("data", exist_ok=True)

# Save scaler and model using pickle
scaler_path = os.path.join("models", "scaler.pkl")
model_path = os.path.join("models", "churn_xgb_model.pkl")

with open(scaler_path, "wb") as f:
    pickle.dump(scaler, f)
print(f"  ✔ Saved StandardScaler to '{scaler_path}'")

with open(model_path, "wb") as f:
    pickle.dump(model, f)
print(f"  ✔ Saved XGBoost Model to '{model_path}'")

# Save train/test datasets as CSV files (preserving feature names)
X_train_df = pd.DataFrame(X_train, columns=X.columns)
X_test_df = pd.DataFrame(X_test, columns=X.columns)

x_train_path = os.path.join("data", "X_train.csv")
x_test_path = os.path.join("data", "X_test.csv")
y_train_path = os.path.join("data", "y_train.csv")
y_test_path = os.path.join("data", "y_test.csv")

X_train_df.to_csv(x_train_path, index=False)
X_test_df.to_csv(x_test_path, index=False)
y_train.to_csv(y_train_path, index=False)
y_test.to_csv(y_test_path, index=False)

print(f"  ✔ Saved split datasets to 'data/' folder")


# ─────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  ✅ MODEL TRAINING AND PREPROCESSING COMPLETE")
print("=" * 60)
print(f"""
  ✔ Raw dataset parsed and cleaned
  ✔ TotalCharges column imputed
  ✔ CustomerID column dropped
  ✔ Categorical features encoded
  ✔ Scaler & XGBoost Classifier trained
  ✔ Accuracy & ROC-AUC evaluated
  ✔ All artifacts successfully persisted:
      - Model: {model_path}
      - Scaler: {scaler_path}
      - Data: {x_train_path}, {x_test_path}, etc.

  ➡️  Next step: Deploy the model / run inference / perform EDA
""")
