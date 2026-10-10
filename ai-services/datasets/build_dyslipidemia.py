"""
datasets/build_dyslipidemia.py

Build dyslipidemia_clean.csv from NHANES trigly_l.xpt.
Target: dyslipidemia = 1 if (LDL > 130) OR (Triglycerides > 150) else 0
"""
import sys
from pathlib import Path
import pandas as pd
import numpy as np

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw" / "nhanes"
OUT = HERE / "processed"
OUT.mkdir(exist_ok=True, parents=True)
MODULE_OUT = HERE.parent / "modules" / "cardio_kidney" / "data"
MODULE_OUT.mkdir(exist_ok=True, parents=True)

# Load
df = pd.read_sas(RAW / "trigly_l.xpt", format="xport")
df.columns = [str(c) for c in df.columns]
print("Loaded:", df.shape)
print("Columns:", df.columns.tolist())

# Convert numerics
for c in ["LBXTLG", "LBDLDL", "LBDLDLM", "LBDLDLN", "LBDTRSI"]:
    if c in df.columns:
        df[c] = pd.to_numeric(df[c], errors="coerce")

# Binary target: dyslipidemia
# Target: high LDL only (keeps LBXTLG as a feature)
df["dyslipidemia"] = (df["LBDLDL"] > 130).astype(int)
print("\nTarget distribution (dyslipidemia):")
print(df["dyslipidemia"].value_counts())

# Keep useful columns only
keep_cols = ["SEQN", "LBXTLG", "LBDLDL", "LBDLDLM", "LBDLDLN", "LBDTRSI", "dyslipidemia"]
keep_cols = [c for c in keep_cols if c in df.columns]
df = df[keep_cols].copy()

# Drop rows where both LBXTLG and LBDLDL are NaN
df = df.dropna(subset=["LBXTLG", "LBDLDL"], how="all")

print("\nFinal shape:", df.shape)

df.to_csv(OUT / "dyslipidemia_clean.csv", index=False)
df.to_csv(MODULE_OUT / "dyslipidemia_clean.csv", index=False)

print("\n[OK] Saved:")
print("  " + str(OUT / "dyslipidemia_clean.csv"))
print("  " + str(MODULE_OUT / "dyslipidemia_clean.csv"))