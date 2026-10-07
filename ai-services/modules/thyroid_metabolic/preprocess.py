"""
modules/thyroid_metabolic/preprocess.py

Preprocessing for Module 2: Thyroid & Metabolic.
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
    path = DATA_DIR / "thyroid_clean.csv"
    if not path.exists():
        print(f"SKIP — {path} not found")
        return
    df = pd.read_csv(path)
    print(f"\n=== Thyroid ===")
    preprocess_pipeline(
        df,
        target_col="target",
        leaky_cols=["TSH"],  # only TSH defines the label

        model_name="thyroid",
        module_dir=MODULE_DIR,
    )


def process_diabetes_pima():
    path = DATA_DIR / "diabetes_pima_clean.csv"
    if not path.exists():
        print(f"SKIP — {path} not found")
        return
    df = pd.read_csv(path)
    print(f"\n=== Diabetes (Pima) ===")
    preprocess_pipeline(
        df,
        target_col="Outcome",
        model_name="diabetes_pima",
        module_dir=MODULE_DIR,
    )


def process_diabetes_brfss():
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
        print(f"Could not detect target. Columns: {list(df.columns)}")
        return
    print(f"Using target: {target}")
    preprocess_pipeline(
        df,
        target_col=target,
        model_name="diabetes_brfss",
        module_dir=MODULE_DIR,
    )


if __name__ == "__main__":
    process_thyroid()
    process_diabetes_pima()
    process_diabetes_brfss()
    print("\n[OK] Module 2 preprocessing done.")