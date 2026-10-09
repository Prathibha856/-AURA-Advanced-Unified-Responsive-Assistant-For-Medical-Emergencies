"""
modules/systemic_immune/preprocess.py
Module 4: Systemic & Immune - Chronic Inflammation
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
    print("Columns: " + str(list(df.columns)))

    # Use Autoimmune_Disorders as the target (binary chronic inflammation marker)
    target = "Autoimmune_Disorders"
    if target not in df.columns:
        print("Target 'Autoimmune_Disorders' not found. Using H_Pylori_Status.")
        target = "H_Pylori_Status"
    if target not in df.columns:
        print("No suitable target found. Columns: " + str(list(df.columns)))
        return

    print("Using target: " + target)

    # These columns directly encode the target — drop as leakage
    leaky = []
    if target == "Autoimmune_Disorders":
        # Autoimmune_Disorders may correlate with genetics/family history
        leaky = ["Family_History", "Genetic_Markers"]
    elif target == "H_Pylori_Status":
        leaky = ["Stool_Culture", "Endoscopy_Result"]

    print("Leaky columns to drop: " + str(leaky))

    preprocess_pipeline(
        df,
        target_col=target,
        leaky_cols=leaky,
        model_name="inflammation",
        module_dir=MODULE_DIR,
    )


if __name__ == "__main__":
    process_inflammation()
    print("\n[OK] Module 4 preprocessing done.")