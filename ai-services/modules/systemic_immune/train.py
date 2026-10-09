"""
modules/systemic_immune/train.py - Fast (RF + XGB only, 3-fold CV)
"""
import sys
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
SERVICES = HERE.parent.parent
sys.path.insert(0, str(SERVICES))

import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                              f1_score, roc_auc_score, confusion_matrix)
from xgboost import XGBClassifier

DATA_DIR = HERE / "data"
MODELS_DIR = HERE / "models"
REPORTS_DIR = HERE / "reports"

X_train = pd.read_csv(DATA_DIR / "inflammation_X_train.csv").values
X_test = pd.read_csv(DATA_DIR / "inflammation_X_test.csv").values
y_train = pd.read_csv(DATA_DIR / "inflammation_y_train.csv").values.ravel()
y_test = pd.read_csv(DATA_DIR / "inflammation_y_test.csv").values.ravel()

print("")
print("[inflammation] FAST training")
print(f"  Train: X={X_train.shape}, Test: X={X_test.shape}")

rf = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1)
xgb = XGBClassifier(n_estimators=50, random_state=42, eval_metric="logloss",
                    verbosity=0, n_jobs=-1)
clf = VotingClassifier(estimators=[("rf", rf), ("xgb", xgb)], voting="soft")

print("  Running 3-fold CV...")
cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
cv_scores = cross_val_score(clf, X_train, y_train, cv=cv, scoring="accuracy")
print(f"  CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

print("  Fitting on full train...")
clf.fit(X_train, y_train)
y_pred = clf.predict(X_test)
y_proba = clf.predict_proba(X_test)

acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

try:
    if len(np.unique(y_train)) == 2:
        auc = roc_auc_score(y_test, y_proba[:, 1])
    else:
        auc = roc_auc_score(y_test, y_proba, multi_class="ovr", average="weighted")
except Exception:
    auc = 0.0

cm = confusion_matrix(y_test, y_pred)

print(f"  Test Accuracy : {acc:.4f}")
print(f"  Test F1       : {f1:.4f}")
print(f"  Test ROC-AUC  : {auc:.4f}")

joblib.dump(clf, MODELS_DIR / "inflammation_model.pkl")

metrics = {
    "model": "inflammation",
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
with open(REPORTS_DIR / "inflammation_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

print("  [OK] Saved inflammation_model.pkl + metrics")