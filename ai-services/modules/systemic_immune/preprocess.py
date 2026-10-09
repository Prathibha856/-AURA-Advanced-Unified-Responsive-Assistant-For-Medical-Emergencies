"""
modules/systemic_immune/preprocess.py
Module 4: Systemic & Immune
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
    possible_targets = ["target", "Target", "Diagnosis", "diagnosis", "Class", "class", "Disease_Class"]
    target = next((c for c in df.columns if c in possible_targets), df.columns[-1])
    print("Using target: " + target)
    preprocess_pipeline(
        df,
        target_col=target,
        model_name="inflammation",
        module_dir=MODULE_DIR,
    )


if __name__ == "__main__":
    process_inflammation()
    print("\n[OK] Module 4 preprocessing done.")