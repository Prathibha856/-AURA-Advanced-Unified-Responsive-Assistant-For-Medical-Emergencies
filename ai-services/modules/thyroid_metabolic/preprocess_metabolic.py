"""
modules/thyroid_metabolic/preprocess_metabolic.py
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


def main():
    path = DATA_DIR / "metabolic_syndrome_clean.csv"
    if not path.exists():
        print("SKIP - " + str(path) + " not found")
        return
    df = pd.read_csv(path)
    print("\n=== Metabolic Syndrome ===")
    print("Columns: " + str(list(df.columns)))

    preprocess_pipeline(
        df,
        target_col="metabolic_syndrome",
        leaky_cols=["LBXTLG", "LBXGLU", "LBDLDL"],
        drop_cols=["SEQN"],
        model_name="metabolic_syndrome",
        module_dir=MODULE_DIR,
    )


if __name__ == "__main__":
    main()