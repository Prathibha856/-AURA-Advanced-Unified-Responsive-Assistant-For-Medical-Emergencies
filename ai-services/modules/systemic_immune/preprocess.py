"""
modules/systemic_immune/preprocess.py

Chronic Inflammation: binary target from CRP_ESR > 5 mg/L threshold.
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


def process_inflammation():
    path = DATA_DIR / "gastro_clean.csv"
    if not path.exists():
        print("SKIP - " + str(path) + " not found")
        return
    df = pd.read_csv(path)
    print("\n=== Chronic Inflammation ===")

    if "CRP_ESR" not in df.columns:
        print("CRP_ESR column missing. Cannot process.")
        return

    crp = pd.to_numeric(df["CRP_ESR"], errors="coerce")
    print("CRP_ESR stats: min=%.2f, max=%.2f, mean=%.2f" % (crp.min(), crp.max(), crp.mean()))

    df["elevated_inflammation"] = (crp > 5).astype(int)
    df = df.dropna(subset=["elevated_inflammation"])

    print("Target distribution:")
    print(df["elevated_inflammation"].value_counts())

    preprocess_pipeline(
        df,
        target_col="elevated_inflammation",
        leaky_cols=["CRP_ESR"],
        model_name="inflammation",
        module_dir=MODULE_DIR,
    )


if __name__ == "__main__":
    process_inflammation()
    print("\n[OK] Module 4 preprocessing done.")