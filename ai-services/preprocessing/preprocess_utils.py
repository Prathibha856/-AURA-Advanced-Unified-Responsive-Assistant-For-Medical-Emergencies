"""
preprocess_utils.py - Core Preprocessing & Anti-Leakage Utilities for AURA

Provides standardized functions to enforce data hygiene across all disease pipelines:
1. Schema & Missingness diagnostics.
2. Dropping high-missingness columns (>50%).
3. Median / Mode imputation.
4. Categorical encoding.
5. Strict anti-leakage train/test splitting (80/20 stratified).
6. Scaler fitting on train partition only.
7. Conditional SMOTE oversampling on training data only (threshold ratio > 3:1).
8. Processed partition export and scaler persistence.
"""

import sys
import os

# Ensure safe output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Tuple, Dict, Any, List
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from imblearn.over_sampling import SMOTE, RandomOverSampler


def print_section(title: str):
    """Utility to print clean formatted terminal sections."""
    print("\n" + "=" * 65)
    print(f" [PIPELINE] {title}")
    print("=" * 65)


def inspect_dataset(df: pd.DataFrame, name: str = "Dataset") -> Dict[str, Any]:
    """
    Step 2: Inspects and prints shape, dtypes, and missing-value counts.
    """
    print_section(f"Dataset Inspection: {name}")
    print(f"Shape: {df.shape[0]} rows, {df.shape[1]} columns\n")
    
    missing = df.isnull().sum()
    missing_pct = (missing / len(df)) * 100
    missing_df = pd.DataFrame({
        "DataType": df.dtypes,
        "MissingValues": missing,
        "MissingPercentage": missing_pct.round(2)
    })
    
    print("Columns & Missingness Summary:")
    print(missing_df.to_string())
    return {
        "rows": df.shape[0],
        "columns": df.shape[1],
        "missing_summary": missing_df
    }


def drop_high_missing_columns(df: pd.DataFrame, threshold: float = 0.50) -> pd.DataFrame:
    """
    Step 3: Drops columns exceeding the missing-value threshold (>50% missing).
    """
    missing_ratio = df.isnull().mean()
    drop_cols = missing_ratio[missing_ratio > threshold].index.tolist()
    if drop_cols:
        print(f"\n[!] Dropping {len(drop_cols)} columns with >{threshold*100:.0f}% missing values:")
        for col in drop_cols:
            print(f"    - {col} ({missing_ratio[col]*100:.1f}% missing)")
        df = df.drop(columns=drop_cols)
    else:
        print(f"\n[+] No columns exceeded the {threshold*100:.0f}% missingness cutoff.")
    return df


def impute_missing_values(df: pd.DataFrame, target_col: str = None) -> pd.DataFrame:
    """
    Step 4: Imputes numerical columns with MEDIAN, categorical columns with MODE.
    Target column (if present) is excluded from feature imputation.
    """
    df_imputed = df.copy()
    features = [c for c in df_imputed.columns if c != target_col]
    
    num_cols = df_imputed[features].select_dtypes(include=[np.number]).columns
    cat_cols = df_imputed[features].select_dtypes(exclude=[np.number]).columns
    
    for col in num_cols:
        if df_imputed[col].isnull().any():
            median_val = df_imputed[col].median()
            df_imputed[col] = df_imputed[col].fillna(median_val)
            
    for col in cat_cols:
        if df_imputed[col].isnull().any():
            mode_val = df_imputed[col].mode()[0] if not df_imputed[col].mode().empty else "Unknown"
            df_imputed[col] = df_imputed[col].fillna(mode_val)
            
    print(f"\n[+] Imputation complete: {len(num_cols)} numerical (median), {len(cat_cols)} categorical (mode).")
    return df_imputed


def encode_categorical_features(df: pd.DataFrame, target_col: str) -> pd.DataFrame:
    """
    Step 5: Encodes categorical features with One-Hot for <5 categories or
    LabelEncoder for >=5 categories.
    """
    df_encoded = df.copy()
    feature_cols = [c for c in df_encoded.columns if c != target_col]
    cat_cols = df_encoded[feature_cols].select_dtypes(exclude=[np.number]).columns.tolist()
    
    for col in cat_cols:
        n_unique = df_encoded[col].nunique()
        if n_unique <= 5:
            # One-Hot Encoding for small cardinalities
            dummies = pd.get_dummies(df_encoded[col], prefix=col, drop_first=True, dtype=int)
            df_encoded = pd.concat([df_encoded.drop(columns=[col]), dummies], axis=1)
        else:
            # Label Encoding for high cardinality
            le = LabelEncoder()
            df_encoded[col] = le.fit_transform(df_encoded[col].astype(str))
            
    return df_encoded


def split_data_strictly(
    X: pd.DataFrame,
    y: pd.Series,
    test_size: float = 0.20,
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Step 8: Splits dataset 80/20 with stratify=y and random_state=42.
    Ensures zero leakage across partitions.
    """
    print_section("Train / Test Stratified Split (80/20)")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        stratify=y,
        random_state=random_state
    )
    print(f"X_train: {X_train.shape} | y_train: {y_train.shape}")
    print(f"X_test : {X_test.shape}  | y_test : {y_test.shape}")
    return X_train, X_test, y_train, y_test


def scale_features_no_leakage(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    scaler_output_path: Path
) -> Tuple[pd.DataFrame, pd.DataFrame, StandardScaler]:
    """
    Step 7 & 12: Fits StandardScaler STRICTLY on X_train only.
    Transforms X_test without refitting to prevent data leakage.
    Saves fitted scaler to models/<disease>_scaler.pkl.
    """
    print_section("Anti-Leakage Feature Scaling (StandardScaler)")
    scaler = StandardScaler()
    
    # Fit scaler ONLY on train data
    X_train_scaled = scaler.fit_transform(X_train)
    # Transform test data using train parameters
    X_test_scaled = scaler.transform(X_test)
    
    # Preserve original column names
    X_train_df = pd.DataFrame(X_train_scaled, columns=X_train.columns, index=X_train.index)
    X_test_df = pd.DataFrame(X_test_scaled, columns=X_test.columns, index=X_test.index)
    
    scaler_output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(scaler, scaler_output_path)
    print(f"[✓] Fitted scaler persisted to: {scaler_output_path}")
    print(f"[✓] Scaling confirmed: Fit on train (n={len(X_train)}), transformed test (n={len(X_test)}).")
    
    return X_train_df, X_test_df, scaler


def check_and_balance_smote(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    imbalance_threshold_ratio: float = 3.0,
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Steps 9 & 10: Calculates class imbalance ratio.
    If majority / minority > 3:1, applies SMOTE strictly to the TRAINING set.
    Never touches or modifies the test set.
    """
    print_section("Class Imbalance Analysis & SMOTE Balancing")
    class_counts = y_train.value_counts().sort_index()
    print("Training set class balance BEFORE:")
    for cls, count in class_counts.items():
        print(f"  Class {cls}: {count} ({count/len(y_train)*100:.1f}%)")
        
    majority_count = class_counts.max()
    minority_count = class_counts.min()
    ratio = majority_count / max(1, minority_count)
    print(f"Class imbalance ratio (Majority : Minority) = {ratio:.2f} : 1")
    
    if ratio > imbalance_threshold_ratio:
        print(f"[!] Ratio exceeds {imbalance_threshold_ratio}:1. Applying SMOTE to TRAINING partition...")
        # If minority class has very few samples (e.g. < 6), adjust k_neighbors or use RandomOverSampler
        min_k = min(5, minority_count - 1)
        if min_k >= 1:
            smote = SMOTE(k_neighbors=min_k, random_state=random_state)
            X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
        else:
            ros = RandomOverSampler(random_state=random_state)
            X_train_res, y_train_res = ros.fit_resample(X_train, y_train)
            
        print("Training set class balance AFTER SMOTE:")
        new_counts = pd.Series(y_train_res).value_counts().sort_index()
        for cls, count in new_counts.items():
            print(f"  Class {cls}: {count} ({count/len(y_train_res)*100:.1f}%)")
        return pd.DataFrame(X_train_res, columns=X_train.columns), pd.Series(y_train_res, name=y_train.name)
    else:
        print("[✓] Class balance is within acceptable tolerance. SMOTE not required.")
        return X_train, y_train


def save_processed_datasets(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series,
    disease_slug: str,
    processed_dir: Path
):
    """
    Step 11: Saves X_train, X_test, y_train, y_test to datasets/processed/<disease>_*.csv
    """
    processed_dir.mkdir(parents=True, exist_ok=True)
    
    x_train_path = processed_dir / f"{disease_slug}_X_train.csv"
    x_test_path = processed_dir / f"{disease_slug}_X_test.csv"
    y_train_path = processed_dir / f"{disease_slug}_y_train.csv"
    y_test_path = processed_dir / f"{disease_slug}_y_test.csv"
    
    X_train.to_csv(x_train_path, index=False)
    X_test.to_csv(x_test_path, index=False)
    pd.DataFrame(y_train).to_csv(y_train_path, index=False)
    pd.DataFrame(y_test).to_csv(y_test_path, index=False)
    
    print_section(f"Processed Partitions Saved: {disease_slug}")
    print(f"  [+] {x_train_path.name} ({X_train.shape})")
    print(f"  [+] {x_test_path.name} ({X_test.shape})")
    print(f"  [+] {y_train_path.name} ({y_train.shape})")
    print(f"  [+] {y_test_path.name} ({y_test.shape})")
