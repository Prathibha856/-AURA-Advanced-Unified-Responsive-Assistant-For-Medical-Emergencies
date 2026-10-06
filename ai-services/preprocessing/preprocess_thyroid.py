"""Anemia preprocessing with anti-leakage guard."""
import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from imblearn.over_sampling import SMOTE

RAW_PATH = "datasets/raw/anemia_raw.csv"
PROCESSED_DIR = "datasets/processed"
MODELS_DIR = "models"
TARGET_COL = "Diagnosis"
LEAKY_COLS = ["Hemoglobin", "MCV", "MCH", "MCHC"]  # all encode the label


def main():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    os.makedirs(MODELS_DIR, exist_ok=True)

    df = pd.read_csv(RAW_PATH)
    print(f"Loaded {RAW_PATH} - shape: {df.shape}")
    print(f"Target counts:\n{df[TARGET_COL].value_counts().sort_index()}\n")

    y = df[TARGET_COL].astype(int)
    present_leaky = [c for c in LEAKY_COLS if c in df.columns]
    X = df.drop(columns=[TARGET_COL] + present_leaky)
    print(f"[LEAKAGE GUARD] Dropped {present_leaky} from features.")
    print(f"Final features ({len(X.columns)}): {list(X.columns)}\n")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    imputer = SimpleImputer(strategy="median")
    X_train = imputer.fit_transform(X_train)
    X_test = imputer.transform(X_test)

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    smote = SMOTE(random_state=42)
    X_train, y_train = smote.fit_resample(X_train, y_train)

    print(f"After SMOTE - X_train: {X_train.shape}, X_test: {X_test.shape}")
    print(f"y_train: {pd.Series(y_train).value_counts().sort_index().to_dict()}")
    print(f"y_test:  {pd.Series(y_test).value_counts().sort_index().to_dict()}\n")

    pd.DataFrame(X_train).to_csv(f"{PROCESSED_DIR}/anemia_X_train.csv", index=False)
    pd.DataFrame(X_test).to_csv(f"{PROCESSED_DIR}/anemia_X_test.csv", index=False)
    pd.Series(y_train, name=TARGET_COL).to_csv(f"{PROCESSED_DIR}/anemia_y_train.csv", index=False)
    pd.Series(y_test, name=TARGET_COL).to_csv(f"{PROCESSED_DIR}/anemia_y_test.csv", index=False)
    joblib.dump(scaler, f"{MODELS_DIR}/anemia_scaler.pkl")
    joblib.dump(imputer, f"{MODELS_DIR}/anemia_imputer.pkl")
    print("[OK] Saved anemia artifacts.")


if __name__ == "__main__":
    main()