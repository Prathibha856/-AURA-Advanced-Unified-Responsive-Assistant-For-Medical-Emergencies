"""
train_b12_folate.py - Training & Evaluation for Vitamin B12 & Folate Deficiencies

Trains a soft VotingClassifier ensemble (RandomForest + XGBoost + SVC) to estimate
the clinical risk of Vitamin B12 deficiency, Folate deficiency, and Combined deficiency.
"""

import sys
import json
from pathlib import Path
import joblib

# Ensure root directory is in sys.path
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from training.train_utils import (
    print_train_banner,
    load_processed_data,
    build_soft_voting_ensemble,
    run_5fold_cross_validation,
    evaluate_test_performance,
    plot_and_save_artifacts
)

DISEASE_SLUG = "b12_folate"
CLASS_NAMES = [
    "Sufficient",
    "B12 Deficient",
    "Folate Deficient",
    "Combined Deficient"
]


def train_b12_folate_model():
    print_train_banner("Training B12 & Folate Deficiency Soft Voting Classifier")
    processed_dir = PROJECT_ROOT / "datasets" / "processed"
    models_dir = PROJECT_ROOT / "models"
    reports_dir = PROJECT_ROOT / "evaluation" / "reports"
    plots_dir = PROJECT_ROOT / "evaluation" / "plots"

    for d in [models_dir, reports_dir, plots_dir]:
        d.mkdir(parents=True, exist_ok=True)

    # 1. Load preprocessed partitions
    try:
        X_train, X_test, y_train, y_test = load_processed_data(DISEASE_SLUG, processed_dir)
    except FileNotFoundError:
        print("[!] Processed data not found. Running preprocessing first...")
        from preprocessing.preprocess_vitamin_b12_folate import preprocess_vitamin_b12_folate
        preprocess_vitamin_b12_folate()
        X_train, X_test, y_train, y_test = load_processed_data(DISEASE_SLUG, processed_dir)

    # Determine number of active target classes
    unique_classes = sorted(y_train.unique().tolist())
    is_multiclass = len(unique_classes) > 2
    active_class_names = [CLASS_NAMES[i] for i in unique_classes] if max(unique_classes) < len(CLASS_NAMES) else [f"Class {i}" for i in unique_classes]

    # 2. Build Soft Voting Ensemble
    ensemble = build_soft_voting_ensemble(is_multiclass=is_multiclass, random_state=42)

    # 3. 5-Fold Stratified Cross-Validation on Training set
    cv_summary = run_5fold_cross_validation(ensemble, X_train, y_train, is_multiclass=is_multiclass)

    # 4. Train ensemble on full training set
    print("\n[*] Fitting Soft Voting Ensemble on complete training partition...")
    ensemble.fit(X_train, y_train)
    print("[+] Model fitting complete.")

    # 5. Evaluate on held-out test set
    metrics, y_pred, y_prob, cm = evaluate_test_performance(
        model=ensemble,
        X_test=X_test,
        y_test=y_test,
        class_names=active_class_names
    )
    metrics["cross_validation_5fold"] = cv_summary

    # 6. Save Model Artifact
    model_path = models_dir / f"{DISEASE_SLUG}_model.pkl"
    joblib.dump(ensemble, model_path)
    print(f"\n[+] Production model saved to: {model_path}")

    # 7. Save Metrics JSON Report
    report_path = reports_dir / f"{DISEASE_SLUG}_metrics.json"
    with open(report_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"[+] Evaluation report saved to: {report_path}")

    # 8. Generate and save diagnostic figures
    plot_and_save_artifacts(
        disease_slug=DISEASE_SLUG,
        cm=cm,
        y_test=y_test,
        y_prob=y_prob,
        class_names=active_class_names,
        fitted_model=ensemble,
        feature_names=X_train.columns.tolist(),
        plots_dir=plots_dir
    )

    print("\n[SUCCESS] B12 & Folate training & evaluation workflow completed.")
    return ensemble, metrics


if __name__ == "__main__":
    train_b12_folate_model()
