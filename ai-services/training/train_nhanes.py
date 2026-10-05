"""Train B12, Folate, and Vitamin D deficiency models from NHANES merged data."""
import json
from pathlib import Path
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                              f1_score, roc_auc_score, confusion_matrix)
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

BASE = Path(r"D:\AURA\-AURA-Advanced-Unified-Responsive-Assistant-For-Medical-Emergencies\ai-services")
PROC = BASE / "datasets" / "processed"
MODELS = BASE / "models"
PLOTS = BASE / "evaluation" / "plots"
REPORTS = BASE / "evaluation" / "reports"

df = pd.read_csv(PROC / "nhanes_merged.csv")
print(f"NHANES merged: {df.shape}")
print(f"Columns: {list(df.columns)[:20]}...")


def make_binary_label(df, biomarker_col, threshold, op, name):
    """Create binary label from a continuous biomarker."""
    if biomarker_col not in df.columns:
        print(f"  {biomarker_col} not found, skipping")
        return None
    vals = pd.to_numeric(df[biomarker_col], errors="coerce")
    if op == "below":
        y = (vals < threshold).astype(int)
    else:
        y = (vals > threshold).astype(int)
    # Drop rows with NaN target
    valid = ~vals.isna()
    return y[valid], valid


def train_one(df, y, mask, biomarker_col, model_name):
    print(f"\n{'='*60}")
    print(f"Training: {model_name}")
    print(f"{'='*60}")
    y = y.reset_index(drop=True)
    df_sub = df[mask].reset_index(drop=True)

    # Features: drop the biomarker (leakage) and other target-derived cols
    drop_cols = [biomarker_col]
    X = df_sub.drop(columns=[c for c in drop_cols if c in df_sub.columns])
    X = X.select_dtypes(include=[np.number])
    X = X.replace([np.inf, -np.inf], np.nan)

    print(f"Target distribution:\n{y.value_counts()}")
    print(f"Features: {X.shape[1]}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    imputer = SimpleImputer(strategy="median")
    X_train = imputer.fit_transform(X_train)
    X_test = imputer.transform(X_test)

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    counts = pd.Series(y_train).value_counts()
    if len(counts) > 1 and counts.max() / counts.min() > 3:
        try:
            X_train, y_train = SMOTE(random_state=42).fit_resample(X_train, y_train)
            print(f"SMOTE applied: {X_train.shape}")
        except Exception as e:
            print(f"SMOTE skipped: {e}")

    rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    xgb = XGBClassifier(n_estimators=100, random_state=42, eval_metric="logloss",
                        verbosity=0, n_jobs=-1)
    svc = SVC(probability=True, random_state=42)
    clf = VotingClassifier(estimators=[("rf", rf), ("xgb", xgb), ("svc", svc)],
                           voting="soft")

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(clf, X_train, y_train, cv=cv, scoring="accuracy")
    print(f"CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    try:
        auc = roc_auc_score(y_test, y_proba[:, 1])
    except Exception:
        auc = 0.0

    print(f"Test Accuracy: {acc:.4f} | F1: {f1:.4f} | AUC: {auc:.4f}")
    cm = confusion_matrix(y_test, y_pred)
    print(f"Confusion matrix:\n{cm}")

    joblib.dump(clf, MODELS / f"{model_name}_model.pkl")
    joblib.dump(scaler, MODELS / f"{model_name}_scaler.pkl")
    joblib.dump(imputer, MODELS / f"{model_name}_imputer.pkl")

    metrics = {
        "model": model_name, "target_column": biomarker_col,
        "n_features": X.shape[1], "n_train": int(X_train.shape[0]),
        "n_test": int(X_test.shape[0]),
        "cv_accuracy_mean": float(cv_scores.mean()),
        "test_accuracy": float(acc), "test_precision_weighted": float(prec),
        "test_recall_weighted": float(rec), "test_f1_weighted": float(f1),
        "test_roc_auc": float(auc), "confusion_matrix": cm.tolist(),
    }
    with open(REPORTS / f"{model_name}_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
    plt.title(f"{model_name.title()} Confusion Matrix")
    plt.tight_layout()
    plt.savefig(PLOTS / f"{model_name}_confusion_matrix.png", dpi=100)
    plt.close()

    print(f"[OK] Saved {model_name}_model.pkl")
    return metrics


# --- Run 3 NHANES models ---
results = []

# B12 deficiency: serum B12 < 200 pg/mL
r = make_binary_label(df, "LBXB12", 200, "below", "b12")
if r:
    y, mask = r
    m = train_one(df, y, mask, "LBXB12", "b12_deficiency")
    if m: results.append(m)

# Folate deficiency: serum folate < 4 ng/mL
r = make_binary_label(df, "LBDFOT", 4, "below", "folate")
if r:
    y, mask = r
    m = train_one(df, y, mask, "LBDFOT", "folate_deficiency")
    if m: results.append(m)

# Vitamin D deficiency: 25(OH)D < 20 ng/mL
r = make_binary_label(df, "LBXVIDMS", 20, "below", "vitamin_d")
if r:
    y, mask = r
    m = train_one(df, y, mask, "LBXVIDMS", "vitamin_d_deficiency")
    if m: results.append(m)

# Summary
print(f"\n{'='*60}")
print("NHANES SUMMARY")
print(f"{'='*60}")
print(f"{'Model':25} {'Acc':>8} {'F1':>8} {'AUC':>8}")
for r in results:
    print(f"{r['model']:25} {r['test_accuracy']:>8.4f} {r['test_f1_weighted']:>8.4f} {r['test_roc_auc']:>8.4f}")