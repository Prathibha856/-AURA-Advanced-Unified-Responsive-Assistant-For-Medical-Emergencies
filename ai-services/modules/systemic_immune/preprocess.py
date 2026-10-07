"""
modules/systemic_immune/preprocess.py
"""
import sys
from pathlib import Path
import pandas as pd
import numpy as np

HERE = Path(__file__).resolve().parent
SERVICES = HERE.parent.parent
sys.path.insert(0, str(SERVICES))

from modules.shared.preprocessing import preprocess_pipeline

DATA_DIR = HERE / "data"
MODULE_DIR = HERE


def process_vitamin_d():
    path = DATA_DIR / "vitamin_d_clean.csv"
    if not path.exists():
        print(f"SKIP - {path} not found")
        return
    df = pd.read_csv(path)
    print(f"\n=== Vitamin D ===")

    if "LBXVIDMS" not in df.columns:
        print("  ERROR: LBXVIDMS column not found")
        return

    vals = pd.to_numeric(df["LBXVIDMS"], errors="coerce")
    df["vitamin_d_deficient"] = (vals < 30).astype(int)
    print(f"  Target distribution:\n{df['vitamin_d_deficient'].value_counts()}")

    leaky = [c for c in df.columns
             if "LBXVIDMS" in c or c.startswith("VD") or "ONLY1FACTOR" in c]
    print(f"  Dropping {len(leaky)} leaky columns")

    preprocess_pipeline(
        df,
        target_col="vitamin_d_deficient",
        leaky_cols=leaky,
        drop_cols=["SEQN"],
        model_name="vitamin_d",
        module_dir=MODULE_DIR,
    )


def process_inflammation():
    path = DATA_DIR / "gastro_clean.csv"
    if not path.exists():
        print(f"SKIP - {path} not found")
        return
    df = pd.read_csv(path)
    print(f"\n=== Chronic Inflammation ===")

    if "CRP_ESR" not in df.columns:
        print("  ERROR: CRP_ESR column not found")
        return

    vals = df["CRP_ESR"]
    if vals.dtype == object:
        high_terms = ["high", "elevated", "abnormal", "positive"]
        df["inflammation"] = vals.astype(str).str.lower().apply(
            lambda x: 1 if any(t in x for t in high_terms) else 0
        )
    else:
        vals_num = pd.to_numeric(vals, errors="coerce")
        median = vals_num.median()
        df["inflammation"] = (vals_num > median).astype(int)

    print(f"  Target distribution:\n{df['inflammation'].value_counts()}")

    preprocess_pipeline(
        df,
        target_col="inflammation",
        leaky_cols=["CRP_ESR"],
        model_name="inflammation",
        module_dir=MODULE_DIR,
    )


if __name__ == "__main__":
    process_vitamin_d()
    process_inflammation()
    print("\n[OK] Module 4 preprocessing done.")
