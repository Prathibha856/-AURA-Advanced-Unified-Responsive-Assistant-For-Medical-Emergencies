"""
train_utils.py - Modular Model Training, Evaluation, and Diagnostic Plotting for AURA

Provides the standardized ensemble architecture (Random Forest + XGBoost + SVC Soft Voting),
comprehensive multi-metric clinical evaluation, 5-fold cross validation, and plotting utilities.
"""

import sys
import json
from pathlib import Path
from typing import Dict, Any, List, Tuple
import joblib

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Non-interactive headless backend for production servers
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.svm import SVC
from xgboost import XGBClassifier
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
    roc_curve,
    auc
)
from sklearn.preprocessing import label_binarize


def print_train_banner(title: str):
    print("\n" + "=" * 70)
    print(f" [AURA ML TRAINING] {title}")
    print("=" * 70)


def load_processed_data(
    disease_slug: str,
    processed_dir: Path
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Loads preprocessed train and test partitions for the given disease.
    """
    x_train_path = processed_dir / f"{disease_slug}_X_train.csv"
    x_test_path = processed_dir / f"{disease_slug}_X_test.csv"
    y_train_path = processed_dir / f"{disease_slug}_y_train.csv"
    y_test_path = processed_dir / f"{disease_slug}_y_test.csv"

    for p in [x_train_path, x_test_path, y_train_path, y_test_path]:
        if not p.exists():
            raise FileNotFoundError(f"Missing processed file: {p}. Run preprocessing first!")

    X_train = pd.read_csv(x_train_path)
    X_test = pd.read_csv(x_test_path)
    y_train = pd.read_csv(y_train_path).iloc[:, 0]
    y_test = pd.read_csv(y_test_path).iloc[:, 0]

    print(f"[+] Loaded processed dataset: {disease_slug}")
    print(f"    Train: X={X_train.shape}, y={y_train.shape}")
    print(f"    Test : X={X_test.shape}, y={y_test.shape}")
    return X_train, X_test, y_train, y_test


def build_soft_voting_ensemble(
    is_multiclass: bool = False,
    random_state: int = 42
) -> VotingClassifier:
    """
    Builds the production AURA VotingClassifier combining:
    1. RandomForestClassifier(n_estimators=100, random_state=42)
    2. XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss')
    3. SVC(probability=True, random_state=42)
    With soft probability voting.
    """
    objective = "multi:softprob" if is_multiclass else "binary:logistic"

    rf = RandomForestClassifier(
        n_estimators=100,
        random_state=random_state,
        n_jobs=-1
    )
    xgb = XGBClassifier(
        n_estimators=100,
        random_state=random_state,
        eval_metric="mlogloss" if is_multiclass else "logloss",
        objective=objective,
        n_jobs=-1
    )
    svc = SVC(
        probability=True,
        random_state=random_state
    )

    ensemble = VotingClassifier(
        estimators=[
            ("random_forest", rf),
            ("xgboost", xgb),
            ("svc", svc)
        ],
        voting="soft"
    )
    return ensemble


def run_5fold_cross_validation(
    model: Any,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    is_multiclass: bool = False
) -> Dict[str, Any]:
    """
    Runs 5-fold stratified cross-validation on the training set.
    """
    print("\n[*] Executing 5-Fold Stratified Cross-Validation on Training Partition...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    scoring = {
        "accuracy": "accuracy",
        "precision": "precision_weighted" if is_multiclass else "precision",
        "recall": "recall_weighted" if is_multiclass else "recall",
        "f1": "f1_weighted" if is_multiclass else "f1"
    }

    scores = cross_validate(model, X_train, y_train, cv=cv, scoring=scoring, n_jobs=-1)
    
    cv_summary = {
        "cv_accuracy_mean": float(np.mean(scores["test_accuracy"])),
        "cv_accuracy_std": float(np.std(scores["test_accuracy"])),
        "cv_precision_mean": float(np.mean(scores["test_precision"])),
        "cv_precision_std": float(np.std(scores["test_precision"])),
        "cv_recall_mean": float(np.mean(scores["test_recall"])),
        "cv_recall_std": float(np.std(scores["test_recall"])),
        "cv_f1_mean": float(np.mean(scores["test_f1"])),
        "cv_f1_std": float(np.std(scores["test_f1"]))
    }

    print(f"    5-Fold CV Accuracy:  {cv_summary['cv_accuracy_mean']:.4f} (+/- {cv_summary['cv_accuracy_std']:.4f})")
    print(f"    5-Fold CV Precision: {cv_summary['cv_precision_mean']:.4f} (+/- {cv_summary['cv_precision_std']:.4f})")
    print(f"    5-Fold CV Recall:    {cv_summary['cv_recall_mean']:.4f} (+/- {cv_summary['cv_recall_std']:.4f})")
    print(f"    5-Fold CV F1-Score:  {cv_summary['cv_f1_mean']:.4f} (+/- {cv_summary['cv_f1_std']:.4f})")
    return cv_summary


def evaluate_test_performance(
    model: Any,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    class_names: List[str]
) -> Tuple[Dict[str, Any], np.ndarray, np.ndarray, np.ndarray]:
    """
    Evaluates test set across accuracy, precision, recall, F1, ROC-AUC, and confusion matrix.
    Never relies on accuracy alone!
    """
    print("\n[*] Evaluating Ensemble Performance on Held-Out Test Set...")
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)

    n_classes = len(class_names)
    is_multiclass = n_classes > 2

    # Calculate metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec_macro = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
    prec_weighted = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
    rec_macro = float(recall_score(y_test, y_pred, average="macro", zero_division=0))
    rec_weighted = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
    f1_macro = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
    f1_weighted = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

    # ROC-AUC computation
    roc_auc_val: float = 0.0
    roc_auc_per_class: Dict[str, float] = {}
    
    if is_multiclass:
        try:
            roc_auc_val = float(roc_auc_score(y_test, y_prob, multi_class="ovr", average="macro"))
            y_test_bin = label_binarize(y_test, classes=list(range(n_classes)))
            for i, c_name in enumerate(class_names):
                try:
                    score_c = roc_auc_score(y_test_bin[:, i], y_prob[:, i])
                    roc_auc_per_class[c_name] = float(score_c)
                except Exception:
                    roc_auc_per_class[c_name] = 0.0
        except Exception as e:
            print(f"[!] ROC-AUC calculation notice: {e}")
            roc_auc_val = 0.0
    else:
        try:
            roc_auc_val = float(roc_auc_score(y_test, y_prob[:, 1]))
            roc_auc_per_class[class_names[1]] = roc_auc_val
        except Exception as e:
            print(f"[!] ROC-AUC calculation notice: {e}")
            roc_auc_val = 0.0

    cm = confusion_matrix(y_test, y_pred)
    report_dict = classification_report(y_test, y_pred, target_names=class_names, output_dict=True, zero_division=0)

    print("\n" + "-" * 55)
    print(" HELD-OUT TEST SET EVALUATION METRICS")
    print("-" * 55)
    print(f"  Accuracy:           {acc:.4f}")
    print(f"  Precision (Macro):  {prec_macro:.4f} | Weighted: {prec_weighted:.4f}")
    print(f"  Recall (Macro):     {rec_macro:.4f} | Weighted: {rec_weighted:.4f}")
    print(f"  F1-Score (Macro):   {f1_macro:.4f} | Weighted: {f1_weighted:.4f}")
    print(f"  ROC-AUC (OvR):      {roc_auc_val:.4f}")
    print("-" * 55)

    print("\nConfusion Matrix:")
    print(cm)

    metrics = {
        "accuracy": acc,
        "precision_macro": prec_macro,
        "precision_weighted": prec_weighted,
        "recall_macro": rec_macro,
        "recall_weighted": rec_weighted,
        "f1_macro": f1_macro,
        "f1_weighted": f1_weighted,
        "roc_auc": roc_auc_val,
        "roc_auc_per_class": roc_auc_per_class,
        "confusion_matrix": cm.tolist(),
        "classification_report": report_dict
    }

    return metrics, y_pred, y_prob, cm


def plot_and_save_artifacts(
    disease_slug: str,
    cm: np.ndarray,
    y_test: pd.Series,
    y_prob: np.ndarray,
    class_names: List[str],
    fitted_model: VotingClassifier,
    feature_names: List[str],
    plots_dir: Path
):
    """
    Generates and saves the 3 required diagnostic figures:
    1. Confusion Matrix Heatmap -> evaluation/plots/<disease>_confusion_matrix.png
    2. ROC Curve Plot           -> evaluation/plots/<disease>_roc_curve.png
    3. Feature Importance Chart -> evaluation/plots/<disease>_feature_importance.png
    """
    plots_dir.mkdir(parents=True, exist_ok=True)
    sns.set_theme(style="whitegrid")

    # 1. Confusion Matrix Heatmap
    plt.figure(figsize=(7, 6))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=class_names, yticklabels=class_names
    )
    plt.title(f"Confusion Matrix: {disease_slug.replace('_', ' ').title()}", fontsize=13, fontweight="bold")
    plt.xlabel("Predicted Clinical Class", fontsize=11)
    plt.ylabel("Ground Truth Clinical Label", fontsize=11)
    plt.tight_layout()
    cm_path = plots_dir / f"{disease_slug}_confusion_matrix.png"
    plt.savefig(cm_path, dpi=300)
    plt.close()
    print(f"[+] Saved Confusion Matrix: {cm_path.name}")

    # 2. ROC Curves (Binary or Multi-class OvR)
    plt.figure(figsize=(8, 6))
    n_classes = len(class_names)
    
    if n_classes == 2:
        fpr, tpr, _ = roc_curve(y_test, y_prob[:, 1])
        roc_score = auc(fpr, tpr)
        plt.plot(fpr, tpr, color="darkorange", lw=2, label=f"ROC curve (AUC = {roc_score:.3f})")
    else:
        y_test_bin = label_binarize(y_test, classes=list(range(n_classes)))
        colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]
        for i, c_name in enumerate(class_names):
            try:
                fpr, tpr, _ = roc_curve(y_test_bin[:, i], y_prob[:, i])
                roc_score = auc(fpr, tpr)
                color = colors[i % len(colors)]
                plt.plot(fpr, tpr, color=color, lw=2, label=f"{c_name} (AUC = {roc_score:.3f})")
            except Exception:
                continue

    plt.plot([0, 1], [0, 1], color="navy", lw=1.5, linestyle="--", label="Random Chance (0.50)")
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel("False Positive Rate (1 - Specificity)", fontsize=11)
    plt.ylabel("True Positive Rate (Sensitivity / Recall)", fontsize=11)
    plt.title(f"ROC Curves (OvR): {disease_slug.replace('_', ' ').title()}", fontsize=13, fontweight="bold")
    plt.legend(loc="lower right", fontsize=9)
    plt.tight_layout()
    roc_path = plots_dir / f"{disease_slug}_roc_curve.png"
    plt.savefig(roc_path, dpi=300)
    plt.close()
    print(f"[+] Saved ROC Curves: {roc_path.name}")

    # 3. Feature Importance Bar Chart
    # Extracted from Random Forest or XGBoost estimators within the voting ensemble
    plt.figure(figsize=(9, 6))
    importances = None
    for name, est in fitted_model.named_estimators_.items():
        if hasattr(est, "feature_importances_"):
            importances = est.feature_importances_
            source_estimator = name
            break

    if importances is not None:
        feat_df = pd.DataFrame({
            "Feature": feature_names,
            "Importance": importances
        }).sort_values(by="Importance", ascending=False).head(15)

        sns.barplot(data=feat_df, x="Importance", y="Feature", palette="viridis")
        plt.title(f"Top Predictor Importance ({source_estimator}): {disease_slug.replace('_', ' ').title()}", fontsize=13, fontweight="bold")
        plt.xlabel("Feature Importance Weight", fontsize=11)
        plt.ylabel("Clinical Predictor", fontsize=11)
        plt.tight_layout()
        feat_path = plots_dir / f"{disease_slug}_feature_importance.png"
        plt.savefig(feat_path, dpi=300)
        plt.close()
        print(f"[+] Saved Feature Importance: {feat_path.name}")
    else:
        print("[!] Feature importance unavailable for estimators.")
