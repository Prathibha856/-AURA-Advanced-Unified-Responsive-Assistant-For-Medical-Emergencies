"""
modules/blood_nutrition/preprocess.py

Preprocessing for Module 1: Blood & Nutritional Disorders.
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


def process_anemia_kaggle():
    """
    Preprocess Kaggle Anemia dataset.

    LEAKAGE REMOVAL:
    Hemoglobin, MCV, MCH, and MCHC directly define clinical anemia diagnoses
    (World Health Organization criteria define anemia directly by hemoglobin cutoffs).
    Including these CBC indices in the feature matrix results in near-perfect artificial
    accuracy (target leakage). Therefore, Hemoglobin, MCV, MCH, and MCHC are removed
    as leaky features.
    """
    path = DATA_DIR / "anemia_kaggle_clean.csv"
    if not path.exists():
        print(f"SKIP — {path} not found")
        return
    df = pd.read_csv(path)
    print(f"\n=== Anemia (Kaggle) ===")

    target_col = "Result"
    if target_col not in df.columns:
        print(f"Target '{target_col}' not found. Columns: {list(df.columns)}")
        return

    # Drop any column that is 100% NaN before imputation
    nan_cols = [c for c in df.columns if df[c].isna().all()]
    if nan_cols:
        print(f"  [NAN GUARD] Dropping 100% NaN columns before imputation: {nan_cols}")
        df = df.drop(columns=nan_cols)

    # Leaky features: CBC parameters defining the target
    leaky_cols = ["Hemoglobin", "MCV", "MCH", "MCHC"]

    result = preprocess_pipeline(
        df,
        target_col=target_col,
        leaky_cols=leaky_cols,
        model_name="anemia_kaggle",
        module_dir=MODULE_DIR,
    )
    if result:
        print(f"  Final feature list ({result['n_features']} features): {result['feature_names']}")
        if result["n_features"] <= 1:
            print("  [LIMITATION] Only 1 feature remains — expected low accuracy")


def process_anemia_mendeley():
    """
    Preprocess Mendeley Anemia dataset.

    LEAKAGE REMOVAL:
    Hb (Hemoglobin), RBC, PCV (Hematocrit), MCV, MCH, and MCHC are direct diagnostic
    determinants of anemia. Leaving these haematological markers creates data leakage
    where models classify based on the diagnostic definition itself rather than non-invasive
    or routine demographic/symptomatic risk factors. Following strict anti-leakage protocol,
    these laboratory indices are excluded.
    """
    path = DATA_DIR / "anemia_mendeley.csv"
    if not path.exists():
        print(f"SKIP — {path} not found")
        return
    df = pd.read_csv(path)
    print(f"\n=== Anemia (Mendeley) ===")
    print(f"Columns: {list(df.columns)}")
    possible_targets = ["Diagnosis", "diagnosis", "Result", "result", "target", "Decision_Class"]
    target = next((c for c in df.columns if c in possible_targets), df.columns[-1])
    if target not in df.columns:
        print(f"Target not found. Columns: {list(df.columns)}")
        return
    print(f"Using target: {target}")

    # Drop any column that is 100% NaN before imputation
    nan_cols = [c for c in df.columns if df[c].isna().all()]
    if nan_cols:
        print(f"  [NAN GUARD] Dropping 100% NaN columns before imputation: {nan_cols}")
        df = df.drop(columns=nan_cols)

    # Leaky features defining the label
    leaky_cols = ["Hb", "RBC", "PCV", "MCV", "MCH", "MCHC"]

    result = preprocess_pipeline(
        df,
        target_col=target,
        leaky_cols=leaky_cols,
        model_name="anemia_mendeley",
        module_dir=MODULE_DIR,
    )
    if result:
        print(f"  Final feature list ({result['n_features']} features): {result['feature_names']}")
        if result["n_features"] <= 1:
            print("  [LIMITATION] Only 1 feature remains — expected low accuracy")


def process_vitamin_deficiency():
    """Preprocess Vitamin Deficiency multi-class dataset."""
    path = DATA_DIR / "vitamin_deficiency_clean.csv"
    if not path.exists():
        print(f"SKIP — {path} not found")
        return
    df = pd.read_csv(path)
    print(f"\n=== Vitamin Deficiency (multi-class) ===")

    target_col = "disease_diagnosis"
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
        model_name="vitamin_deficiency",
        module_dir=MODULE_DIR,
    )
    if result:
        print(f"  Final feature list ({result['n_features']} features): {result['feature_names']}")


def main():
    """Run preprocessing for all Module 1 datasets."""
    process_anemia_kaggle()
    process_anemia_mendeley()
    process_vitamin_deficiency()
    print("\n[OK] Module 1 preprocessing done.")


if __name__ == "__main__":
    main()