"""
modules/thyroid_metabolic/preprocess.py

Preprocessing for Module 2: Thyroid & Metabolic Disorders.
"""
import sys
from pathlib import Path
import pandas as pd

HERE = Path(__file__).resolve().parent
SERVICES = HERE.parent.parent
sys.path.insert(0, str(SERVICES))

from modules.shared.preprocessing import preprocess_pipeline

DATA_DIR = HERE / "data"
MODULE_DIR = HERE


def process_thyroid():
    """
    Preprocess Thyroid disease dataset.
    
    LEAKAGE REMOVAL:
    TSH is the primary diagnostic determinant that directly defines hyper/hypothyroidism.
    Including TSH creates artificial diagnostic target leakage. Only TSH is removed
    as leaky.
    
    NAN GUARD:
    Columns with 100% NaN values (specifically FTI) are dropped before imputation to prevent
    imputer feature dimension mismatches.
    """
    path = DATA_DIR / "thyroid_clean.csv"
    if not path.exists():
        print(f"SKIP — {path} not found")
        return
    df = pd.read_csv(path)
    print(f"\n=== Thyroid ===")

    target_col = "target"
    if target_col not in df.columns:
        print(f"Target '{target_col}' not found. Columns: {list(df.columns)}")
        return

    # Drop any column that is 100% NaN before calling preprocess_pipeline (specifically FTI)
    nan_cols = [c for c in df.columns if df[c].isna().all()]
    if nan_cols:
        print(f"  [NAN GUARD] Dropping 100% NaN columns before imputation: {nan_cols}")
        df = df.drop(columns=nan_cols)

    # Drop ONLY TSH as leaky feature
    leaky_cols = ["TSH"]

    result = preprocess_pipeline(
        df,
        target_col=target_col,
        leaky_cols=leaky_cols,
        model_name="thyroid",
        module_dir=MODULE_DIR,
    )
    if result:
        print(f"  Final feature list ({result['n_features']} features): {result['feature_names']}")


def process_diabetes_pima():
    """Preprocess PIMA Indian Diabetes dataset."""
    path = DATA_DIR / "diabetes_pima_clean.csv"
    if not path.exists():
        print(f"SKIP — {path} not found")
        return
    df = pd.read_csv(path)
    print(f"\n=== Diabetes (Pima) ===")

    target_col = "Outcome"
    if target_col not in df.columns:
        print(f"Target '{target_col}' not found. Columns: {list(df.columns)}")
        return

    # Drop any column that is 100% NaN before imputation
    nan_cols = [c for c in df.columns if df[c].isna().all()]
    if nan_cols:
        print(f"  [NAN GUARD] Dropping 100% NaN columns before imputation: {nan_cols}")
        df = df.drop(columns=nan_cols)

    result = preprocess_pipeline(
        df,
        target_col=target_col,
        model_name="diabetes_pima",
        module_dir=MODULE_DIR,
    )
    if result:
        print(f"  Final feature list ({result['n_features']} features): {result['feature_names']}")


def process_diabetes_brfss():
    """Preprocess BRFSS Diabetes dataset."""
    path = DATA_DIR / "diabetes_brfss_clean.csv"
    if not path.exists():
        print(f"SKIP — {path} not found")
        return
    df = pd.read_csv(path)
    print(f"\n=== Diabetes (BRFSS) ===")
    print(f"Columns: {list(df.columns)}")
    possible_targets = ["Diabetes_012", "Diabetes_binary", "diabetes", "target"]
    target = next((c for c in df.columns if c in possible_targets), None)
    if target is None:
        print(f"Target not found. Columns: {list(df.columns)}")
        return
    print(f"Using target: {target}")

    # Drop any column that is 100% NaN before imputation
    nan_cols = [c for c in df.columns if df[c].isna().all()]
    if nan_cols:
        print(f"  [NAN GUARD] Dropping 100% NaN columns before imputation: {nan_cols}")
        df = df.drop(columns=nan_cols)

    result = preprocess_pipeline(
        df,
        target_col=target,
        model_name="diabetes_brfss",
        module_dir=MODULE_DIR,
    )
    if result:
        print(f"  Final feature list ({result['n_features']} features): {result['feature_names']}")


def main():
    """Run preprocessing for all Module 2 datasets."""
    process_thyroid()
    process_diabetes_pima()
    process_diabetes_brfss()
    print("\n[OK] Module 2 preprocessing done.")


if __name__ == "__main__":
    main()