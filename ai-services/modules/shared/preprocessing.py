"""
modules/shared/preprocessing.py

Universal preprocessing utilities for all 4 AURA disease modules.
Anti-leakage: split BEFORE fit, drop label-defining columns.
Now saves feature names alongside models for interpretability.
"""
import sys
import json
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from imblearn.over_sampling import SMOTE


def encode_target(y):
    if y.dtype == object:
        le = LabelEncoder()
        return pd.Series(le.fit_transform(y.astype(str))), le
    return pd.Series(y).astype(int), None


def preprocess_pipeline(
    df,
    target_col,
    leaky_cols=None,
    drop_cols=None,
    model_name="model",
    module_dir=None,
    test_size=0.2,
    random_state=42,
    apply_smote=True,
):
    module_dir = Path(module_dir) if module_dir else Path(__file__).resolve().parent.parent
    models_dir = module_dir / "models"
    data_dir = module_dir / "data"
    models_dir.mkdir(exist_ok=True, parents=True)
    data_dir.mkdir(exist_ok=True, parents=True)

    print(f"\n[{model_name}] preprocessing")
    print(f"  Input shape: {df.shape}")

    if target_col not in df.columns:
        raise ValueError(f"Target '{target_col}' not in columns: {list(df.columns)}")

    y, _ = encode_target(df[target_col])
    X = df.drop(columns=[target_col])

    leaky_cols = leaky_cols or []
    present_leaky = [c for c in leaky_cols if c in X.columns]
    if present_leaky:
        X = X.drop(columns=present_leaky)
        print(f"  [LEAKAGE GUARD] Dropped: {present_leaky}")

    drop_cols = drop_cols or []
    present_drop = [c for c in drop_cols if c in X.columns]
    if present_drop:
        X = X.drop(columns=present_drop)
        print(f"  [META] Dropped: {present_drop}")

    X = X.select_dtypes(include=[np.number])
    X = X.replace([np.inf, -np.inf], np.nan)
    print(f"  Features: {X.shape[1]}")

    feature_names = list(X.columns)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    imputer = SimpleImputer(strategy="median")
    X_train = imputer.fit_transform(X_train)
    X_test = imputer.transform(X_test)

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    counts = pd.Series(y_train).value_counts()
    ratio = counts.max() / counts.min() if len(counts) > 1 else 1
    if apply_smote and ratio > 3:
        try:
            X_train, y_train = SMOTE(random_state=random_state).fit_resample(X_train, y_train)
            print(f"  SMOTE applied (ratio {ratio:.2f}): {X_train.shape}")
        except Exception as e:
            print(f"  SMOTE skipped: {e}")
    else:
        print(f"  No SMOTE needed (ratio {ratio:.2f})")

    print(f"  X_train: {X_train.shape}, X_test: {X_test.shape}")

    # Save splits WITH feature names as headers (so model is interpretable)
    pd.DataFrame(X_train, columns=feature_names).to_csv(
        data_dir / f"{model_name}_X_train.csv", index=False
    )
    pd.DataFrame(X_test, columns=feature_names).to_csv(
        data_dir / f"{model_name}_X_test.csv", index=False
    )
    pd.Series(y_train).to_csv(data_dir / f"{model_name}_y_train.csv", index=False)
    pd.Series(y_test).to_csv(data_dir / f"{model_name}_y_test.csv", index=False)

    # Save preprocessors
    joblib.dump(scaler, models_dir / f"{model_name}_scaler.pkl")
    joblib.dump(imputer, models_dir / f"{model_name}_imputer.pkl")

    # Save feature names JSON — for interpretability
    with open(models_dir / f"{model_name}_features.json", "w") as f:
        json.dump(feature_names, f, indent=2)

    print(f"  [OK] Saved {model_name} splits + scaler + imputer + features.json")
    print(f"  Features ({len(feature_names)}): {feature_names}")

    return {
        "X_train_shape": X_train.shape,
        "X_test_shape": X_test.shape,
        "n_features": X.shape[1],
        "feature_names": feature_names,
    }


def load_processed(model_name, module_dir):
    data_dir = Path(module_dir) / "data"
    X_train = pd.read_csv(data_dir / f"{model_name}_X_train.csv").values
    X_test = pd.read_csv(data_dir / f"{model_name}_X_test.csv").values
    y_train = pd.read_csv(data_dir / f"{model_name}_y_train.csv").values.ravel()
    y_test = pd.read_csv(data_dir / f"{model_name}_y_test.csv").values.ravel()
    return X_train, X_test, y_train, y_test