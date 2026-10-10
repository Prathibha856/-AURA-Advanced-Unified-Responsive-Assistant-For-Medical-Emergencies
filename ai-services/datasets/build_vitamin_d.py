"""
datasets/build_vitamin_d.py
Build vitamin_d_binary.csv from NHANES vid_l.xpt.
"""
from pathlib import Path
import pandas as pd
import numpy as np

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw" / "nhanes"
OUT = HERE / "processed"
OUT.mkdir(exist_ok=True, parents=True)
MODULE_OUT = HERE.parent / "modules" / "systemic_immune" / "data"
MODULE_OUT.mkdir(exist_ok=True, parents=True)

df = pd.read_sas(RAW / "vid_l.xpt", format="xport")
df.columns = [str(c) for c in df.columns]
print("Shape:", df.shape)
print("Columns:", df.columns.tolist())

df["LBXVIDMS"] = pd.to_numeric(df["LBXVIDMS"], errors="coerce")
print("25(OH)D non-null:", df["LBXVIDMS"].notna().sum())
print("min=%.2f max=%.2f mean=%.2f" % (df["LBXVIDMS"].min(), df["LBXVIDMS"].max(), df["LBXVIDMS"].mean()))

df["vitamin_d_deficient"] = (df["LBXVIDMS"] < 20).astype(int)
df.loc[df["LBXVIDMS"].isna(), "vitamin_d_deficient"] = np.nan
df = df.dropna(subset=["vitamin_d_deficient"])

print("\nTarget distribution:")
print(df["vitamin_d_deficient"].value_counts())

keep = ["SEQN", "LBXVIDMS", "vitamin_d_deficient"]
keep = [c for c in keep if c in df.columns]
df = df[keep].copy()

df.to_csv(OUT / "vitamin_d_binary.csv", index=False)
df.to_csv(MODULE_OUT / "vitamin_d_binary.csv", index=False)

print("\n[OK] Saved vitamin_d_binary.csv")