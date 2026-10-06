"""Preprocess Liver Disease dataset (UCI ILPD)."""
import os
from pathlib import Path
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from imblearn.over_sampling import SMOTE

# Absolute paths (work from anywhere)
BASE = Path(r"D:\AURA\-AURA-Advanced-Unified-Responsive-Assistant-For-Medical-Emergencies\ai-services")
RAW = BASE / "datasets" / "processed" / "liver_clean.csv"
PROC = BASE / "datasets" / "processed"
MODELS = BASE / "models"
PROC.mkdir(exist_ok=True, parents=True)
MODELS.mkdir(exist_ok=True, parents=True)

# Load
df = pd.read_csv(RAW)
print(f"Loaded {RAW.name}: {df.shape}")
print(f"Columns: {list(df.columns)}")
print(f"First 3 rows:\n{df.head(3)}\n")

# Detect target column
possible_targets = ["Dataset", "Diagnosis", "Target", "target", "Result",
                    "Outcome", "class", "Class", "Selector"]
target_col = next((c for c in df.columns if c in possible_targets), df.columns[-1])
print(f"Using target column: {target_col}")
print(f"Target distribution:\n{df[target_col].value_counts()}\n")

# Encode any non-numeric target
if df[target_col].dtype == object:
    df[target_col] = df[target_col].astype("category").cat.codes

y = df[target_col].astype(int)
X = df.drop(columns=[target_col])

# Force numeric X
X = X.apply(pd.to_numeric, errors="coerce")

# Split BEFORE fitting
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Impute - fit on train only
imputer = SimpleImputer(strategy="median")
X_train = imputer.fit_transform(X_train)
X_test = imputer.transform(X_test)

# Scale - fit on train only
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# SMOTE on train only
try:
    smote = SMOTE(random_state=42)
    X_train, y_train = smote.fit_resample(X_train, y_train)
    print(f"After SMOTE - X_train: {X_train.shape}")
except Exception as e:
    print(f"SMOTE skipped: {e}")

# Save
pd.DataFrame(X_train).to_csv(PROC / "liver_X_train.csv", index=False)
pd.DataFrame(X_test).to_csv(PROC / "liver_X_test.csv", index=False)
pd.Series(y_train).to_csv(PROC / "liver_y_train.csv", index=False)
pd.Series(y_test).to_csv(PROC / "liver_y_test.csv", index=False)
joblib.dump(scaler, MODELS / "liver_scaler.pkl")
joblib.dump(imputer, MODELS / "liver_imputer.pkl")

print(f"\n[OK] Saved liver_X_train.csv, liver_X_test.csv, liver_y_train.csv, liver_y_test.csv")
print(f"[OK] Saved liver_scaler.pkl, liver_imputer.pkl")
print(f"[OK] X_train shape: {X_train.shape}")
print(f"[OK] X_test shape: {X_test.shape}")