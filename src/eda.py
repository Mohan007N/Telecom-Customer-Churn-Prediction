"""
=============================================================
Exploratory Data Analysis (EDA) Module
=============================================================
Author: Machine Learning Engineer
Description: Computes summary statistics and generates visualizations
             of churn factors, saving figures to reports/plots/.
=============================================================
"""

import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def perform_eda(df: pd.DataFrame, output_dir: str = "reports/plots") -> None:
    """
    Computes statistical summaries and generates informative plots,
    exporting them to the specified directory.
    
    Parameters:
    -----------
    df : pd.DataFrame
        Cleaned dataset.
    output_dir : str
        Directory where generated plots will be saved.
    """
    print("\n=========================================")
    print("📊 [EDA] Performing Exploratory Analysis...")
    print("=========================================")
    
    # Ensure plot directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Summary Statistics
    print("  🔍 Numerical Summary Statistics:")
    print(df.describe().T.to_string())
    print("\n  🔍 Categorical Summary Statistics:")
    print(df.describe(include=['O']).T.to_string())
    
    # Set plotting style
    sns.set_theme(style="whitegrid", palette="muted")
    
    # 2. Churn Distribution Plot
    plt.figure(figsize=(6, 5))
    ax = sns.countplot(x="Churn", data=df, hue="Churn", legend=False)
    plt.title("Customer Churn Distribution", fontsize=14, fontweight="bold", pad=15)
    plt.xlabel("Churn Status", fontsize=12)
    plt.ylabel("Customer Count", fontsize=12)
    
    # Add count annotations
    for p in ax.patches:
        ax.annotate(f'{int(p.get_height())}', 
                    (p.get_x() + p.get_width() / 2., p.get_height()), 
                    ha='center', va='baseline', fontsize=11, fontweight='semibold',
                    xytext=(0, 5), textcoords='offset points')
                    
    churn_dist_path = os.path.join(output_dir, "churn_distribution.png")
    plt.tight_layout()
    plt.savefig(churn_dist_path, dpi=150)
    plt.close()
    print(f"  ✔ Saved churn distribution plot to '{churn_dist_path}'")
    
    # 3. Monthly Charges vs Churn (Numerical Feature Check)
    plt.figure(figsize=(8, 5))
    sns.histplot(data=df, x="MonthlyCharges", hue="Churn", multiple="stack", kde=True, bins=30)
    plt.title("Monthly Charges Distribution by Churn", fontsize=14, fontweight="bold", pad=15)
    plt.xlabel("Monthly Charges ($)", fontsize=12)
    plt.ylabel("Count", fontsize=12)
    
    charges_dist_path = os.path.join(output_dir, "monthly_charges_vs_churn.png")
    plt.tight_layout()
    plt.savefig(charges_dist_path, dpi=150)
    plt.close()
    print(f"  ✔ Saved Monthly Charges comparison to '{charges_dist_path}'")

    # 4. Tenure vs Churn Boxplot
    plt.figure(figsize=(8, 5))
    sns.boxplot(x="Churn", y="tenure", data=df, hue="Churn", legend=False)
    plt.title("Customer Tenure by Churn Status", fontsize=14, fontweight="bold", pad=15)
    plt.xlabel("Churn Status", fontsize=12)
    plt.ylabel("Tenure (Months)", fontsize=12)
    
    tenure_box_path = os.path.join(output_dir, "tenure_vs_churn.png")
    plt.tight_layout()
    plt.savefig(tenure_box_path, dpi=150)
    plt.close()
    print(f"  ✔ Saved Tenure vs Churn boxplot to '{tenure_box_path}'")
    
    # 5. Correlation Heatmap (only numerical features)
    numerical_cols = df.select_dtypes(include=['int64', 'float64']).copy()
    # Map Churn to 0/1 for correlation analysis
    if "Churn" in df.columns and df["Churn"].dtype == 'O':
        numerical_cols["Churn"] = df["Churn"].map({"No": 0, "Yes": 1})
        
    plt.figure(figsize=(8, 6))
    corr_matrix = numerical_cols.corr()
    sns.heatmap(corr_matrix, annot=True, cmap="coolwarm", fmt=".2f", linewidths=0.5, square=True)
    plt.title("Correlation Analysis Matrix", fontsize=14, fontweight="bold", pad=15)
    
    corr_path = os.path.join(output_dir, "correlation_heatmap.png")
    plt.tight_layout()
    plt.savefig(corr_path, dpi=150)
    plt.close()
    print(f"  ✔ Saved correlation heatmap to '{corr_path}'")
