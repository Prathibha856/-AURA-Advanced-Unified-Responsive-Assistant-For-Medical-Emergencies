"""
modules/blood_nutrition/preprocess.py
Module 1: Blood & Nutrition
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
    path = DATA_DIR / "anemia_kaggle_clean.csv"
    if not path.exists():
        print("SKIP - " + str(path))
        return
    df = pd.read_csv(path)
    print("\n=== Anemia (Kaggle) ===")
    preprocess_pipeline(
        df,
        target_col="Result",
        leaky_cols=["Hemoglobin", "MCV", "MCH", "MCHC"],
        model_name="anemia_kaggle",
        module_dir=MODULE_DIR,
    )


def process_anemia_mendeley():
    path = DATA_DIR / "anemia_mendeley.csv"
    if not path.exists():
        print("SKIP - " + str(path))
        return
    df = pd.read_csv(path)
    print("\n=== Anemia (Mendeley) ===")
    preprocess_pipeline(
        df,
        target_col="Decision_Class",
        leaky_cols=["Hb", "RBC", "PCV", "MCV", "MCH", "MCHC"],
        model_name="anemia_mendeley",
        module_dir=MODULE_DIR,
    )


def process_vitamin_deficiency():
    path = DATA_DIR / "vitamin_deficiency_clean.csv"
    if not path.exists():
        print("SKIP - " + str(path))
        return
    df = pd.read_csv(path)
    print("\n=== Vitamin Deficiency ===")
    preprocess_pipeline(
        df,
        target_col="disease_diagnosis",
        model_name="vitamin_deficiency",
        module_dir=MODULE_DIR,
    )


if __name__ == "__main__":
    process_anemia_kaggle()
    process_anemia_mendeley()
    process_vitamin_deficiency()
    print("\n[OK] Module 1 preprocessing done.")