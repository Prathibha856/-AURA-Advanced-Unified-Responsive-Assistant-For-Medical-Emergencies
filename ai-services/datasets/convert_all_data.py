"""Convert all raw datasets in datasets/raw/ to clean CSVs in datasets/processed/"""
import os
from pathlib import Path
import pandas as pd

RAW = Path("datasets/raw")
PROC = Path("datasets/processed")
PROC.mkdir(exist_ok=True, parents=True)

# ---------------- 1. UCI Thyroid ----------------
print("[1/6] Merging UCI Thyroid...")
thyroid_folder = RAW / "uci_thyroid"
thyroid_files = ["allhypo.data","allhyper.data","allrep.data","sick.data"]
cols = ["age","sex","on_thyroxine","query_on_thyroxine","on_antithyroid_medication",
        "sick","pregnant","thyroid_surgery","query_hypothyroid","query_hyperthyroid",
        "lithium","goitre","tumor","hypopituitary","psych",
        "TSH","T3","TT4","T4U","FTI","TBG","target"]
dfs = []
for name in thyroid_files:
    f = thyroid_folder / name
    if f.exists():
        try:
            df = pd.read_csv(f, header=None, names=cols, na_values="?")
            dfs.append(df)
            print(f"  OK {name}: {df.shape}")
        except Exception as e:
            print(f"  ERR {name}: {e}")
    else:
        print(f"  SKIP missing {f}")
if dfs:
    thyroid = pd.concat(dfs, ignore_index=True)
    def map_target(x):
        s = str(x).lower()
        if "negative" in s or "normal" in s: return 0
        if "hyper" in s: return 2
        if "hypo" in s: return 1
        if "sick" in s: return 3
        return 0
    thyroid["target"] = thyroid["target"].apply(map_target)
    thyroid.to_csv(PROC / "thyroid_clean.csv", index=False)
    print(f"  -> thyroid_clean.csv: {thyroid.shape}")

# ---------------- 2. NHANES .xpt ----------------
print("\n[2/6] Converting NHANES .xpt files...")
nhanes_dfs = {}
for name in ["cbc_l","folate_l","glu_l","trigly_l","vid_l"]:
    f = RAW / "nhanes" / f"{name}.xpt"
    if not f.exists():
        print(f"  SKIP missing {f}")
        continue
    try:
        df = pd.read_sas(f, format="xport")
        df.columns = [str(c) for c in df.columns]
        nhanes_dfs[name] = df
        print(f"  OK {name}: {df.shape}")
    except Exception as e:
        print(f"  ERR {name}: {e}")

if "cbc_l" in nhanes_dfs and "SEQN" in nhanes_dfs["cbc_l"].columns:
    merged = nhanes_dfs["cbc_l"]
    for name in ["folate_l","vid_l","glu_l","trigly_l"]:
        if name in nhanes_dfs and "SEQN" in nhanes_dfs[name].columns:
            cols_to_use = [c for c in nhanes_dfs[name].columns if c not in merged.columns or c == "SEQN"]
            merged = merged.merge(nhanes_dfs[name][cols_to_use], on="SEQN", how="outer")
    merged.to_csv(PROC / "nhanes_merged.csv", index=False)
    print(f"  -> nhanes_merged.csv: {merged.shape}")
else:
    print("  Could not merge NHANES - CBC_L missing or no SEQN column")

# ---------------- 3. CKD ARFF ----------------
print("\n[3/6] Converting CKD ARFF...")
try:
    import scipy.io.arff as arff
    ckd_candidates = list((RAW / "uci_ckd").rglob("*.arff"))
    if ckd_candidates:
        ckd_path = ckd_candidates[0]
        data, meta = arff.loadarff(ckd_path)
        df = pd.DataFrame(data)
        for c in df.columns:
            if df[c].dtype == object:
                df[c] = df[c].apply(lambda x: x.decode() if isinstance(x, bytes) else x)
        df.to_csv(PROC / "ckd_clean.csv", index=False)
        print(f"  -> ckd_clean.csv: {df.shape}")
    else:
        print("  SKIP no .arff file found")
except Exception as e:
    print(f"  ERR {e}")

# ---------------- 4. Excel files ----------------
print("\n[4/6] Converting Excel files...")
for src_pattern, dst_name in [
    ("anemia/**/*.xlsx", "anemia_mendeley.csv"),
    ("cbc/**/*.xlsx", "cbc_clean.csv"),
]:
    xlsx_files = list(RAW.glob(src_pattern))
    for src in xlsx_files:
        try:
            df = pd.read_excel(src)
            out_name = dst_name if len(xlsx_files) == 1 else f"{Path(dst_name).stem}_{src.stem}.csv"
            df.to_csv(PROC / out_name, index=False)
            print(f"  OK {src.name} -> {out_name}: {df.shape}")
        except Exception as e:
            print(f"  ERR {src}: {e}")


# ---------------- 5. Ready CSVs ----------------
print("\n[5/6] Copying ready CSVs...")

# Liver needs explicit header (UCI ILPD has no header row)
liver_src = RAW / "uci_liver/liver_raw.csv"
if liver_src.exists():
    liver_cols = ["Age","Gender","Total_Bilirubin","Direct_Bilirubin",
                  "Alkaline_Phosphotase","Alamine_Aminotransferase",
                  "Aspartate_Aminotransferase","Total_Protiens","Albumin",
                  "Albumin_and_Globulin_Ratio","Dataset"]
    liver = pd.read_csv(liver_src, header=None, names=liver_cols)
    liver.to_csv(PROC / "liver_clean.csv", index=False)
    print(f"  OK liver_clean.csv: {liver.shape}")
else:
    print(f"  SKIP missing {liver_src}")

# The rest use existing headers
for src, dst in [
    ("heart_raw.csv", "heart_clean.csv"),
    ("diabetes_pima.csv", "diabetes_pima_clean.csv"),
    ("diabetes_brfss.csv", "diabetes_brfss_clean.csv"),
    ("vitamin_d_raw.csv", "vitamin_d_clean.csv"),
    ("vitamin_deficiency_raw.csv", "vitamin_deficiency_clean.csv"),
    ("gastro_raw.csv", "gastro_clean.csv"),
    ("anemia/anemia_kaggle.csv", "anemia_kaggle_clean.csv"),
]:
    src_path = RAW / src
    if src_path.exists():
        try:
            df = pd.read_csv(src_path)
            df.to_csv(PROC / dst, index=False)
            print(f"  OK {src} -> {dst}: {df.shape}")
        except Exception as e:
            print(f"  ERR {src}: {e}")
    else:
        print(f"  SKIP missing {src_path}")