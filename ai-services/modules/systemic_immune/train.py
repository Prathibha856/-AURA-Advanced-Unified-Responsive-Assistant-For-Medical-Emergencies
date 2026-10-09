"""
modules/systemic_immune/train.py
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SERVICES = HERE.parent.parent
sys.path.insert(0, str(SERVICES))

from modules.shared.training import train_from_processed_csvs

MODULE_DIR = HERE


def train_one(name):
    try:
        return train_from_processed_csvs(name, MODULE_DIR)
    except Exception as e:
        print("FAILED " + name + ": " + str(e))
        return None


def main():
    models = ["inflammation"]
    results = []
    for name in models:
        r = train_one(name)
        if r:
            results.append(r)

    print("\n" + "=" * 60)
    print("MODULE 4 - SYSTEMIC & IMMUNE SUMMARY")
    print("=" * 60)
    print(f"{'Model':25} {'Acc':>8} {'F1':>8} {'AUC':>8}")
    for r in results:
        print(f"{r['model']:25} {r['test_accuracy']:>8.4f} {r['test_f1_weighted']:>8.4f} {r['test_roc_auc']:>8.4f}")


if __name__ == "__main__":
    main()