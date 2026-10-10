"""
modules/cardio_kidney/preprocess.py
Module 3: Cardiovascular & Kidney
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
        print("SKIP - " + str(path) + " not found")
        return
    df = pd.read_csv(path)
    print("\n=== Liver ===")
    preprocess_pipeline(
        df,
        target_col="Dataset",
        model_name="liver",
        module_dir=MODULE_DIR,
    )


def process_heart():
    path = DATA_DIR / "heart_clean.csv"
    if not path.exists():
        print("SKIP - " + str(path) + " not found")
        return
    df = pd.read_csv(path)
    print("\n=== Heart ===")
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
        print("SKIP - " + str(path) + " not found")
        return
    df = pd.read_csv(path)
    print("\n=== CKD ===")
    preprocess_pipeline(
        df,
        target_col="class",
        leaky_cols=["sc", "bu", "bgr", "rbcc", "wbcc"],
        model_name="ckd",
        module_dir=MODULE_DIR,
    )


def process_dyslipidemia():
    path = DATA_DIR / "dyslipidemia_clean.csv"
    if not path.exists():
        print("SKIP - " + str(path) + " not found")
        return
    df = pd.read_csv(path)
    print("\n=== Dyslipidemia ===")
    preprocess_pipeline(
        df,
        target_col="dyslipidemia",
        leaky_cols=["LBDLDL", "LBDLDLM", "LBDLDLN", "LBDLDLSI", "LBDLDMSI", "LBDLDNSI"],
        drop_cols=["SEQN"],
        model_name="dyslipidemia",
        module_dir=MODULE_DIR,
    )


if __name__ == "__main__":
    process_liver()
    process_heart()
    process_ckd()
    process_dyslipidemia()
    print("\n[OK] Module 3 preprocessing done.")