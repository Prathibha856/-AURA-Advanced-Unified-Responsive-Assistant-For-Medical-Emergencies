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
    models = ["anemia_kaggle", "anemia_mendeley", "vitamin_deficiency"]
    results = []
    for name in models:
        r = train_one(name)
        if r:
            results.append(r)

    print("\n" + "=" * 60)
    print("MODULE 1 - BLOOD & NUTRITION SUMMARY")
    print("=" * 60)
    print("{:25} {:>8} {:>8} {:>8}".format("Model", "Acc", "F1", "AUC"))
    for r in results:
        print("{:25} {:>8.4f} {:>8.4f} {:>8.4f}".format(
            r["model"], r["test_accuracy"],
            r["test_f1_weighted"], r["test_roc_auc"]
        ))


if __name__ == "__main__":
    main()