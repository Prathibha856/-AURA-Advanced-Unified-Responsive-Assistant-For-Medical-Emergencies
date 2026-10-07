"""Fast BRFSS training — no 5-fold CV, smaller models, subsample."""
import sys
from pathlib import Path
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from xgboost import XGBClassifier
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

HERE = Path(__file__).resolve().parent
NAME = "diabetes_brfss"
data_dir = HERE / "data"
models_dir = HERE / "models"
reports_dir = HERE / "reports"
models_dir.mkdir(exist_ok=True, parents=True)
reports_dir.mkdir(exist_ok=True, parents=True)

print(f"Loading {NAME}...")
X_train = pd.read_csv(data_dir / f"{NAME}_X_train.csv").values
X_test = pd.read_csv(data_dir / f"{NAME}_X_test.csv").values
y_train = pd.read_csv(data_dir / f"{NAME}_y_train.csv").values.ravel()
y_test = pd.read_csv(data_dir / f"{NAME}_y_test.csv").values.ravel()

print(f"Train: X={X_train.shape}, Test: X={X_test.shape}")

if X_train.shape[0] > 100000:
    idx = np.random.RandomState(42).choice(X_train.shape[0], 100000, replace=False)
    X_train = X_train[idx]
    y_train = y_train[idx]
    print(f"Subsampled training to: {X_train.shape}")

rf = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1)
xgb = XGBClassifier(n_estimators=50, random_state=42, eval_metric="logloss",
                    verbosity=0, n_jobs=-1, tree_method="hist")
svc = SVC(probability=True, random_state=42)

clf = VotingClassifier(estimators=[("rf", rf), ("xgb", xgb), ("svc", svc)], voting="soft")

print("Training ensemble (no CV)...")
clf.fit(X_train, y_train)

print("Evaluating...")
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

print(f"Test Accuracy : {acc:.4f}")
print(f"Test F1       : {f1:.4f}")
print(f"Test ROC-AUC  : {auc:.4f}")
print(f"Confusion matrix:\n{cm}")

joblib.dump(clf, models_dir / f"{NAME}_model.pkl")

metrics = {
    "model": NAME,
    "test_accuracy": float(acc),
    "test_precision_weighted": float(prec),
    "test_recall_weighted": float(rec),
    "test_f1_weighted": float(f1),
    "test_roc_auc": float(auc),
    "confusion_matrix": cm.tolist(),
}
with open(reports_dir / f"{NAME}_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
plt.title(f"{NAME} Confusion Matrix")
plt.tight_layout()
plt.savefig(reports_dir / f"{NAME}_confusion_matrix.png", dpi=100)
plt.close()

print(f"[OK] Saved {NAME}_model.pkl")