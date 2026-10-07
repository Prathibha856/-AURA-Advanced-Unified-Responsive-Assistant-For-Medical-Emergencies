"""
modules/cardio_kidney/preprocess.py

Preprocessing for Module 3: Cardiovascular & Kidney.
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


def process_liver():
    path = DATA_DIR / "liver_clean.csv"
    if not path.exists():
        print(f"SKIP — {path} not found")
        return
    df = pd.read_csv(path)
    print(f"\n=== Liver ===")
    preprocess_pipeline(
        df,
        target_col="Dataset",
        model_name="liver",
        module_dir=MODULE_DIR,
    )


def process_heart():
    path = DATA_DIR / "heart_clean.csv"
    if not path.exists():
        print(f"SKIP — {path} not found")
        return
    df = pd.read_csv(path)
    print(f"\n=== Heart ===")
    preprocess_pipeline(
        df,
        target_col="target",
        leaky_cols=["cp", "thal", "slope", "ca", "exang", "oldpeak"],
        model_name="heart",
        module_dir=MODULE_DIR,
    )


def process_ckd():
    path = DATA_DIR / "ckd_clean.csv"
    if not path.exists():
        print(f"SKIP — {path} not found (ARFF parse may have failed)")
        return
    df = pd.read_csv(path)
    print(f"\n=== CKD ===")
    print(f"Columns: {list(df.columns)}")
    possible_targets = ["class", "classification", "Target", "target"]
    target = next((c for c in df.columns if c in possible_targets), df.columns[-1])
    print(f"Using target: {target}")
    preprocess_pipeline(
        df,
        target_col=target,
        leaky_cols=["sc", "bu", "bgr", "rbcc", "wbcc"],
        model_name="ckd",
        module_dir=MODULE_DIR,
    )


if __name__ == "__main__":
    process_liver()
    process_heart()
    process_ckd()
    print("\n[OK] Module 3 preprocessing done.")