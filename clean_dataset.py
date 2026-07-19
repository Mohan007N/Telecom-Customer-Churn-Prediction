import pandas as pd
import os

def clean_csv(file_path="WA_Fn-UseC_-Telco-Customer-Churn.csv"):
    if not os.path.exists(file_path):
        print(f"Error: Dataset file '{file_path}' not found.")
        return
        
    print(f"📂 Loading dataset '{file_path}'...")
    # Load with keep_default_na=False to prevent empty strings or "NA" fields from turning into NaN
    df = pd.read_csv(file_path, keep_default_na=False)
    
    replaced_count = 0
    for col in df.columns:
        # Check columns with object (string) type
        if df[col].dtype == 'object':
            mask = df[col] == "No internet service"
            count = mask.sum()
            if count > 0:
                df[col] = df[col].replace("No internet service", "No")
                print(f"  ✔ Replaced {count} instances of 'No internet service' with 'No' in column '{col}'")
                replaced_count += count
                
    if replaced_count > 0:
        # Save keeping the original formatting
        df.to_csv(file_path, index=False)
        print(f"\n🎉 Successfully saved updated dataset to '{file_path}'!")
        print(f"Total replacements: {replaced_count}")
    else:
        print("\n✨ No instances of 'No internet service' found. Dataset is already clean.")

if __name__ == "__main__":
    clean_csv()
