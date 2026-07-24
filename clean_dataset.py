"""
clean_dataset.py — Standalone CSV cleaner utility
Saves a CLEANED COPY to data/processed/clean_data.csv
Does NOT overwrite the original raw CSV.
"""
import pandas as pd
import os


def clean_csv(
    file_path: str = "WA_Fn-UseC_-Telco-Customer-Churn.csv",
    output_path: str = "data/processed/clean_data.csv"
) -> None:
    if not os.path.exists(file_path):
        print(f"Error: Dataset file '{file_path}' not found.")
        return

    print(f"📂 Loading dataset '{file_path}'...")
    df = pd.read_csv(file_path, keep_default_na=False)

    replaced_count = 0
    for col in df.columns:
        if df[col].dtype == 'object':
            for bad_val in ["No internet service", "No phone service"]:
                count = (df[col] == bad_val).sum()
                if count > 0:
                    df[col] = df[col].replace(bad_val, "No")
                    print(f"  ✔ Replaced {count} '{bad_val}' → 'No' in '{col}'")
                    replaced_count += count

    # Save cleaned version to output path — NEVER overwrite the raw file
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"\n✅ Cleaned dataset saved to '{output_path}' ({replaced_count} total replacements)")
    print(f"   Original '{file_path}' was NOT modified.")


if __name__ == "__main__":
    clean_csv()
