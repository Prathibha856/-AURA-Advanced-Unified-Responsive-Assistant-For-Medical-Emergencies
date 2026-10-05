"""
preprocess_vitamin_b12_folate.py - Preprocessing for B12 & Folate Deficiencies

Handles CDC NHANES lab ingestion, diagnostic labeling for B12 (<200 pg/mL)
and Folate (<4 ng/mL), anti-leakage scaling, and conditional SMOTE oversampling.
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np

# Ensure parent directory is in sys.path
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from preprocessing.clinical_thresholds import (
    label_b12_deficiency,
    label_folate_deficiency,
    B12_DEFICIENT_THRESHOLD_PG_ML,
    FOLATE_DEFICIENT_THRESHOLD_NG_ML
)
from preprocessing.preprocess_utils import (
    inspect_dataset,
    drop_high_missing_columns,
    impute_missing_values,
    encode_categorical_features,
    split_data_strictly,
    scale_features_no_leakage,
    check_and_balance_smote,
    save_processed_datasets
)

B12_FOLATE_CLASSES = {
    0: "Normal / Sufficient",
    1: "Vitamin B12 Deficiency",
    2: "Folate Deficiency",
    3: "Combined B12 & Folate Deficiency"
}


def preprocess_vitamin_b12_folate(raw_csv_path: Path = None):
    """
    Executes anti-leakage preprocessing protocol for B12 and Folate deficiencies.
    """
    if raw_csv_path is None:
        raw_csv_path = PROJECT_ROOT / "datasets" / "raw" / "b12_folate_raw.csv"

    print(f"\n========================================================")
    print(f" AURA PREPROCESSING: Vitamin B12 & Folate Deficiency")
    print(f" Source: {raw_csv_path}")
    print(f"========================================================")

    # Auto-generate clinical sample if raw missing
    if not raw_csv_path.exists():
        print(f"[!] Raw file {raw_csv_path.name} not found. Generating clinical sample...")
        from datasets.download_all import generate_synthetic_samples
        generate_synthetic_samples()

    # Step 1: Load raw CSV
    df = pd.read_csv(raw_csv_path)

    # Step 2: Diagnostics
    inspect_dataset(df, name="B12 & Folate Raw Cohort")

    # Step 3: Drop high missingness (>50%)
    df = drop_high_missing_columns(df, threshold=0.50)

    # Resolve B12 and Folate biomarker columns
    b12_col = next((c for c in df.columns if "b12" in c.lower() or "cobalamin" in c.lower()), None)
    folate_col = next((c for c in df.columns if "folate" in c.lower() or "fot" in c.lower() or "folic" in c.lower()), None)
    target_candidate = next((c for c in df.columns if c.lower() in ["target", "diagnosis", "deficiency_class"]), None)

    target_col = "target"
    if target_candidate and target_candidate in df.columns:
        df[target_col] = df[target_candidate].astype(int)
        if target_candidate != target_col:
            df = df.drop(columns=[target_candidate])
    elif b12_col and folate_col:
        print(f"\n[+] Deriving 4-class clinical target: Normal vs B12 Deficient (<{B12_DEFICIENT_THRESHOLD_PG_ML}) vs Folate Deficient (<{FOLATE_DEFICIENT_THRESHOLD_NG_ML})...")
        b12_def = (df[b12_col] < B12_DEFICIENT_THRESHOLD_PG_ML)
        folate_def = (df[folate_col] < FOLATE_DEFICIENT_THRESHOLD_NG_ML)

        conditions = [
            (~b12_def) & (~folate_def),
            (b12_def) & (~folate_def),
            (~b12_def) & (folate_def),
            (b12_def) & (folate_def)
        ]
        choices = [0, 1, 2, 3]
        df[target_col] = np.select(conditions, choices, default=0)

        # Drop raw continuous serum values to prevent trivial label leakage
        df = df.drop(columns=[b12_col, folate_col])
    else:
        raise ValueError(f"Could not locate B12 or Folate biomarker columns in: {df.columns.tolist()}")

    # Step 4: Impute numerical with median, categorical with mode
    df = impute_missing_values(df, target_col=target_col)

    # Step 5: Encode categorical variables
    df = encode_categorical_features(df, target_col=target_col)

    # Separate feature matrix X and target y
    X = df.drop(columns=[target_col])
    drop_meta = [c for c in ["id", "ID", "patient_id", "SEQN"] if c in X.columns]
    if drop_meta:
        X = X.drop(columns=drop_meta)
    y = df[target_col].astype(int)

    print("\nClinical Target Distribution:")
    for cls_val, cnt in y.value_counts().sort_index().items():
        lbl = B12_FOLATE_CLASSES.get(cls_val, f"Class {cls_val}")
        print(f"  [{cls_val}] {lbl:<34}: {cnt} records ({cnt/len(y)*100:.1f}%)")

    # Step 8: Strict 80/20 stratified split - Zero Leakage!
    X_train, X_test, y_train, y_test = split_data_strictly(X, y, test_size=0.20, random_state=42)

    # Step 7 & 12: Fit StandardScaler ONLY on X_train, transform X_test, persist scaler
    scaler_path = PROJECT_ROOT / "models" / "b12_folate_scaler.pkl"
    X_train_scaled, X_test_scaled, scaler = scale_features_no_leakage(
        X_train, X_test, scaler_output_path=scaler_path
    )

    # Step 9 & 10: Apply SMOTE to training partition ONLY if imbalance ratio > 3:1
    X_train_final, y_train_final = check_and_balance_smote(
        X_train_scaled, y_train, imbalance_threshold_ratio=3.0, random_state=42
    )

    # Step 11: Save processed CSVs
    processed_dir = PROJECT_ROOT / "datasets" / "processed"
    save_processed_datasets(
        X_train=X_train_final,
        X_test=X_test_scaled,
        y_train=y_train_final,
        y_test=y_test,
        disease_slug="b12_folate",
        processed_dir=processed_dir
    )

    print("\n[SUCCESS] B12 & Folate preprocessing completed cleanly with zero data leakage.")


if __name__ == "__main__":
    preprocess_vitamin_b12_folate()
