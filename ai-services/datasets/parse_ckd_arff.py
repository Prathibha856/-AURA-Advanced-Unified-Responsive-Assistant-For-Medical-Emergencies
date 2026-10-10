"""
datasets/parse_ckd_arff.py
Custom ARFF parser for UCI Chronic Kidney Disease dataset.
"""
import sys
from pathlib import Path
import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
SERVICES = HERE.parent

RAW_DIRS = [
    HERE / "raw" / "uci_ckd",
    HERE / "raw" / "uci_ckd" / "Chronic_Kidney_Disease",
    SERVICES / "datasets" / "raw" / "uci_ckd",
]

PROCESSED_OUT = HERE / "processed" / "ckd_clean.csv"
MODULE_DATA_OUT = SERVICES / "modules" / "cardio_kidney" / "data" / "ckd_clean.csv"


def parse_arff_file(path):
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()

    attributes = []
    data_start = None
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.lower().startswith("@attribute"):
            parts = stripped.split(None, 2)
            if len(parts) >= 2:
                attributes.append(parts[1].strip("'\""))
        elif stripped.lower() == "@data":
            data_start = i + 1
            break

    if data_start is None:
        raise ValueError(f"No @data section in {path}")

    rows = []
    for line in lines[data_start:]:
        s = line.strip()
        if not s or s.startswith("%"):
            continue
        parts = s.split("\t") if "\t" in s else s.split(",")
        rows.append([p.strip() for p in parts])

    if not rows:
        raise ValueError(f"No data rows in {path}")

    n_cols = len(attributes)
    cleaned_rows = []
    for r in rows:
        if len(r) < n_cols:
            r = r + [""] * (n_cols - len(r))
        elif len(r) > n_cols:
            r = r[:n_cols]
        cleaned_rows.append(r)

    return pd.DataFrame(cleaned_rows, columns=attributes)


def main():
    arff_files = []
    for d in RAW_DIRS:
        if d.exists():
            arff_files.extend(list(d.rglob("*.arff")))
    arff_files = list({str(f.resolve()): f for f in arff_files}.values())

    if not arff_files:
        print("No ARFF files found. Searched:")
        for d in RAW_DIRS:
            print(f"  {d}")
        sys.exit(1)

    print(f"Found {len(arff_files)} ARFF file(s): {[f.name for f in arff_files]}")

    dfs = []
    for arff_file in arff_files:
        print(f"Parsing: {arff_file.name}")
        try:
            df_parsed = parse_arff_file(arff_file)
            dfs.append(df_parsed)
            print(f"  Shape: {df_parsed.shape}")
        except Exception as e:
            print(f"  ERR: {e}")

    if not dfs:
        print("No files parsed successfully.")
        sys.exit(1)

    df = pd.concat(dfs, ignore_index=True).drop_duplicates()

    target_col = "class"
    if target_col not in df.columns:
        alt = [c for c in df.columns if c.lower() in ("class", "classification", "target")]
        if alt:
            target_col = alt[0]
        else:
            print(f"Target 'class' not found. Columns: {list(df.columns)}")
            sys.exit(0)

    print(f"Using target column: {target_col}")

    df = df.replace("?", np.nan).replace("", np.nan)

    raw_targets = df[target_col].astype(str).unique().tolist()
    print(f"  Raw target values (first 10): {raw_targets[:10]}")

    all_nan_cols = [c for c in df.columns if df[c].isna().all()]
    if all_nan_cols:
        print(f"  [NAN GUARD] Dropping 100% NaN columns: {all_nan_cols}")
        df = df.drop(columns=all_nan_cols)

    for col in df.columns:
        if col.lower() in ("class", "classification"):
            continue
        cleaned_col = df[col].astype(str).str.strip().str.lower()
        non_null = set(cleaned_col.loc[~cleaned_col.isin(["?", "", "nan", "none"])].unique())
        if non_null and non_null.issubset({"yes", "no"}):
            df[col] = cleaned_col.map({"yes": 1.0, "no": 0.0})

    for col in df.columns:
        if col.lower() not in ("class", "classification"):
            try:
                df[col] = pd.to_numeric(df[col])
            except (ValueError, TypeError):
                pass

    cleaned_target = (
        df[target_col]
        .astype(str)
        .str.strip()
        .str.lower()
        .str.replace("\t", "", regex=False)
        .str.replace("\n", "", regex=False)
        .str.replace("\r", "", regex=False)
        .str.replace(".", "", regex=False)
        .str.replace(" ", "", regex=False)
        .str.replace("'", "", regex=False)
        .str.replace('"', "", regex=False)
    )

    print(f"  Unique target values AFTER cleaning: {sorted(cleaned_target.unique())}")

    target_map = {"ckd": 1, "notckd": 0, "no": 0, "yes": 1}
    df[target_col] = cleaned_target.map(target_map)

    unmapped = df[target_col].isna().sum()
    if unmapped:
        print(f"  [WARN] Dropping {unmapped} rows with unmappable target")
        df = df.dropna(subset=[target_col])
    df[target_col] = df[target_col].astype(int)

    PROCESSED_OUT.parent.mkdir(parents=True, exist_ok=True)
    MODULE_DATA_OUT.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(PROCESSED_OUT, index=False)
    df.to_csv(MODULE_DATA_OUT, index=False)

    print(f"\n[OK] Saved CKD clean dataset to:")
    print(f"  1. {PROCESSED_OUT}")
    print(f"  2. {MODULE_DATA_OUT}")
    print(f"\nFinal Shape: {df.shape}")
    print(f"Target distribution:\n{df[target_col].value_counts()}")


if __name__ == "__main__":
    main()