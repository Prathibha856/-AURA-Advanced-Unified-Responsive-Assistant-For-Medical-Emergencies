"""
modules/systemic_immune/preprocess.py

Preprocessing for Module 4: Systemic & Immune.
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
    """Vitamin D deficiency — binary from LBXVIDMS < 30 ng/mL."""
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

    leaky = [
        # Direct vitamin D measurements
        "LBXVIDMS", "LBXVIDMS.1", "LBXVIDMS.CCCCC",
        # Binned vitamin D derivatives
        "VD30TO50TO75", "VD30TO50TO75__REF75MORE",
        "VD25TO50TO75__REF75MORE", "VD25TO50TO75",
        "VD25TO50TO75TO100", "VD25TO50TO75TO100__REF75TO100",
        "VD25TO50TO75.CONT",
        # Derived flags
        "ONLY1FACTOR", "ONLY1FACTORS",
    ]
    leaky = [c for c in leaky if c in df.columns]

    preprocess_pipeline(
        df,
        target_col="vitamin_d_deficient",
        leaky_cols=leaky,
        drop_cols=[
            "SEQN",
            "MORTSTAT", "UCOD_LEADING", "DIABETES_DEATH", "HYPERTEN_DEATH",
            "PERMTH_INT", "PERMTH_EXM",
            "DMDMARTL.RCD", "BMXBMI.C", "INDFMPIR.C",
        ],
        model_name="vitamin_d",
        module_dir=MODULE_DIR,
    )


if __name__ == "__main__":
    process_vitamin_d()
    # process_inflammation()  # Disabled — synthetic dataset, no meaningful target
    print("\n[OK] Module 4 preprocessing done.")