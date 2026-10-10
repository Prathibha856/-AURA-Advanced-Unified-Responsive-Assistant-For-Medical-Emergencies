"""
datasets/merge_uci_thyroid.py

Merge UCI Thyroid .data files into a single thyroid_clean.csv.
Maps target labels to 4 classes:
  0 = Normal
  1 = Hypothyroid
  2 = Hyperthyroid
  3 = Subclinical
"""
from pathlib import Path
import pandas as pd

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw" / "uci_thyroid"
OUT = HERE / "processed"
OUT.mkdir(exist_ok=True, parents=True)

COLS = [
    "age", "sex", "on_thyroxine", "query_on_thyroxine", "on_antithyroid_medication",
    "sick", "pregnant", "thyroid_surgery", "query_hypothyroid", "query_hyperthyroid",
    "lithium", "goitre", "tumor", "hypopituitary", "psych",
    "TSH", "T3", "TT4", "T4U", "FTI", "TBG", "target",
]

def map_target(x):
    s = str(x).lower()
    if "negative" in s or "normal" in s:
        return 0
    if "hyper" in s:
        return 2
    if "hypo" in s:
        return 1
    if "sick" in s:
        return 3
    return 0


def main():
    files = ["allhypo.data", "allhyper.data", "allrep.data", "sick.data"]
    dfs = []
    for fname in files:
        p = RAW / fname
        if not p.exists():
            print(f"SKIP {fname} — not found at {p}")
            continue
        try:
            df = pd.read_csv(p, header=None, names=COLS, na_values="?")
            dfs.append(df)
            print(f"OK {fname}: {df.shape}")
        except Exception as e:
            print(f"ERR {fname}: {e}")

    if not dfs:
        print("No thyroid files found. Check the folder:")
        print(f"  {RAW}")
        print("Expected: allhypo.data, allhyper.data, allrep.data, sick.data")
        return

    merged = pd.concat(dfs, ignore_index=True)
    merged["target"] = merged["target"].apply(map_target)
    print(f"\nMerged shape: {merged.shape}")
    print(f"Target distribution:\n{merged['target'].value_counts().sort_index()}")

    out_path = OUT / "thyroid_clean.csv"
    merged.to_csv(out_path, index=False)
    print(f"\n[OK] Saved {out_path}")


if __name__ == "__main__":
    main()