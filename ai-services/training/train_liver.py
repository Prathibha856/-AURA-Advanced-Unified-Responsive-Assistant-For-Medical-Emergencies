"""Universal training script - preprocess + train + evaluate for any disease."""
import sys
import json
from pathlib import Path
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
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
for d in [MODELS, PLOTS, REPORTS]:
    d.mkdir(exist_ok=True, parents=True)


def train_one(csv_name, target_col, model_name):
    print(f"\n{'='*60}")
    print(f"Training: {model_name}")
    print(f"{'='*60}")
    df = pd.read_csv(PROC / csv_name)
    print(f"Loaded {csv_name}: {df.shape}")
    print(f"Target: {target_col}")

    if target_col not in df.columns:
        print(f"  ERROR: {target_col} not found. Columns: {list(df.columns)}")
        return None

    # Encode target if categorical
    y = df[target_col]
    if y.dtype == object:
        y = LabelEncoder().fit_transform(y.astype(str))
    y = pd.Series(y).astype(int)

    X = df.drop(columns=[target_col])
    # Drop non-numeric columns
    X = X.select_dtypes(include=[np.number])

    print(f"Features: {X.shape[1]}")
    print(f"Target distribution:\n{y.value_counts()}")

    # Handle NaN / inf
    X = X.replace([np.inf, -np.inf], np.nan)

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Impute + Scale on train only
    imputer = SimpleImputer(strategy="median")
    X_train = imputer.fit_transform(X_train)
    X_test = imputer.transform(X_test)

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    # SMOTE if needed
    counts = pd.Series(y_train).value_counts()
    if len(counts) > 1 and counts.max() / counts.min() > 3:
        try:
            X_train, y_train = SMOTE(random_state=42).fit_resample(X_train, y_train)
            print(f"SMOTE applied: {X_train.shape}")
        except Exception as e:
            print(f"SMOTE skipped: {e}")

    # Voting Classifier
    rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    xgb = XGBClassifier(n_estimators=100, random_state=42, eval_metric="logloss",
                        verbosity=0, n_jobs=-1)
    svc = SVC(probability=True, random_state=42)
    clf = VotingClassifier(estimators=[("rf", rf), ("xgb", xgb), ("svc", svc)],
                           voting="soft")

    # CV
    n_classes = len(np.unique(y_train))
    n_splits = min(5, counts.min()) if counts.min() >= 2 else 2
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    cv_scores = cross_val_score(clf, X_train, y_train, cv=cv, scoring="accuracy")
    print(f"CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

    # Train
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    try:
        if n_classes == 2:
            auc = roc_auc_score(y_test, y_proba[:, 1])
        else:
            auc = roc_auc_score(y_test, y_proba, multi_class="ovr", average="weighted")
    except Exception:
        auc = 0.0

    print(f"Test Accuracy : {acc:.4f}")
    print(f"Test Precision: {prec:.4f}")
    print(f"Test Recall   : {rec:.4f}")
    print(f"Test F1       : {f1:.4f}")
    print(f"Test ROC-AUC  : {auc:.4f}")

    cm = confusion_matrix(y_test, y_pred)
    print(f"Confusion matrix:\n{cm}")

    # Save
    joblib.dump(clf, MODELS / f"{model_name}_model.pkl")
    joblib.dump(scaler, MODELS / f"{model_name}_scaler.pkl")
    joblib.dump(imputer, MODELS / f"{model_name}_imputer.pkl")

    metrics = {
        "model": model_name,
        "source_csv": csv_name,
        "target_column": target_col,
        "n_features": X.shape[1],
        "n_train": int(X_train.shape[0]),
        "n_test": int(X_test.shape[0]),
        "cv_accuracy_mean": float(cv_scores.mean()),
        "cv_accuracy_std": float(cv_scores.std()),
        "test_accuracy": float(acc),
        "test_precision_weighted": float(prec),
        "test_recall_weighted": float(rec),
        "test_f1_weighted": float(f1),
        "test_roc_auc": float(auc),
        "confusion_matrix": cm.tolist(),
    }
    with open(REPORTS / f"{model_name}_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    # Confusion matrix plot
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
    plt.title(f"{model_name.title()} Confusion Matrix")
    plt.ylabel("Actual")
    plt.xlabel("Predicted")
    plt.tight_layout()
    plt.savefig(PLOTS / f"{model_name}_confusion_matrix.png", dpi=100)
    plt.close()

    print(f"[OK] Saved {model_name}_model.pkl, metrics, plot")
    return metrics


if __name__ == "__main__":
    # Format: (csv_filename, target_column_name, output_model_name)
    JOBS = [
        ("diabetes_pima_clean.csv", "Outcome", "diabetes"),
        ("heart_clean.csv", "target", "heart"),
        ("anemia_kaggle_clean.csv", "Result", "anemia"),
        ("vitamin_d_clean.csv", "LBXVIDMS", "vitamin_d"),
        ("vitamin_deficiency_clean.csv", None, "vitamin_deficiency"),
        ("ckd_clean.csv", "class", "ckd"),
    ]

    results = []
    for csv_file, target, name in JOBS:
        try:
            r = train_one(csv_file, target, name)
            if r:
                results.append(r)
        except Exception as e:
            print(f"FAILED {name}: {e}")

    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"{'Model':20} {'Acc':>8} {'F1':>8} {'AUC':>8}")
    for r in results:
        print(f"{r['model']:20} {r['test_accuracy']:>8.4f} {r['test_f1_weighted']:>8.4f} {r['test_roc_auc']:>8.4f}")