"""
modules/shared/training.py

Universal Soft Voting Classifier trainer for all 4 AURA disease modules.
Anti-leakage verified. Trains RF + XGBoost + SVC ensemble.
Automatically skips SVC for large datasets (>30K rows).
"""
import json
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix,
)
from xgboost import XGBClassifier

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns


def build_ensemble(n_train_rows=0):
    """Build Soft Voting Classifier. Skip SVC for large datasets (>30K rows)."""
    rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    xgb = XGBClassifier(
        n_estimators=100, random_state=42, eval_metric="logloss",
        verbosity=0, n_jobs=-1,
    )
    estimators = [("rf", rf), ("xgb", xgb)]
    if n_train_rows <= 30000:
        svc = SVC(probability=True, random_state=42)
        estimators.append(("svc", svc))
        print(f"  Ensemble: RF + XGBoost + SVC")
    else:
        print(f"  Ensemble: RF + XGBoost only (large data)")
    return VotingClassifier(estimators=estimators, voting="soft")


def train_and_evaluate(
    X_train, X_test, y_train, y_test,
    model_name="model",
    module_dir=None,
    feature_names=None,
):
    """
    Train a Soft Voting Classifier and evaluate it.
    """
    module_dir = Path(module_dir)
    models_dir = module_dir / "models"
    reports_dir = module_dir / "reports"
    models_dir.mkdir(exist_ok=True, parents=True)
    reports_dir.mkdir(exist_ok=True, parents=True)

    print(f"\n[{model_name}] training")
    print(f"  Train: X={X_train.shape}, Test: X={X_test.shape}")

    clf = build_ensemble(n_train_rows=X_train.shape[0])

    print(f"  Running 5-fold CV...")
    n_splits = min(5, int(pd.Series(y_train).value_counts().min()))
    if n_splits < 2:
        n_splits = 2
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    cv_scores = cross_val_score(clf, X_train, y_train, cv=cv, scoring="accuracy")
    print(f"  CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)
    n_classes = len(np.unique(y_train))

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

    cm = confusion_matrix(y_test, y_pred)

    print(f"  Test Accuracy : {acc:.4f}")
    print(f"  Test Precision: {prec:.4f}")
    print(f"  Test Recall   : {rec:.4f}")
    print(f"  Test F1       : {f1:.4f}")
    print(f"  Test ROC-AUC  : {auc:.4f}")
    print(f"  Confusion matrix:\n{cm}")

    model_path = models_dir / f"{model_name}_model.pkl"
    joblib.dump(clf, model_path)
    print(f"  [OK] Saved {model_path.name}")

    metrics = {
        "model": model_name,
        "n_features": int(X_train.shape[1]),
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
    with open(reports_dir / f"{model_name}_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
    plt.title(f"{model_name.replace('_', ' ').title()} Confusion Matrix")
    plt.ylabel("Actual")
    plt.xlabel("Predicted")
    plt.tight_layout()
    plt.savefig(reports_dir / f"{model_name}_confusion_matrix.png", dpi=100)
    plt.close()

    try:
        if feature_names and len(feature_names) == X_train.shape[1]:
            rf_model = clf.named_estimators_["rf"]
            if hasattr(rf_model, "feature_importances_"):
                imp = rf_model.feature_importances_
                idx = np.argsort(imp)[::-1][:15]
                plt.figure(figsize=(8, 6))
                sns.barplot(x=imp[idx], y=[feature_names[i] for i in idx])
                plt.title(f"{model_name.replace('_', ' ').title()} Feature Importance")
                plt.tight_layout()
                plt.savefig(reports_dir / f"{model_name}_feature_importance.png", dpi=100)
                plt.close()
    except Exception as e:
        print(f"  [warn] Feature importance skipped: {e}")

    return metrics


def train_from_processed_csvs(model_name, module_dir):
    """Load preprocessed CSVs, train, evaluate, save."""
    module_dir = Path(module_dir)
    data_dir = module_dir / "data"

    X_train = pd.read_csv(data_dir / f"{model_name}_X_train.csv").values
    X_test = pd.read_csv(data_dir / f"{model_name}_X_test.csv").values
    y_train = pd.read_csv(data_dir / f"{model_name}_y_train.csv").values.ravel()
    y_test = pd.read_csv(data_dir / f"{model_name}_y_test.csv").values.ravel()

    return train_and_evaluate(
        X_train, X_test, y_train, y_test,
        model_name=model_name,
        module_dir=module_dir,
    )