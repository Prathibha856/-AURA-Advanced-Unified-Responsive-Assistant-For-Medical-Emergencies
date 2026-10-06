import os, pandas as pd, joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from imblearn.over_sampling import SMOTE

RAW="datasets/raw/anemia_raw.csv"; P="datasets/processed"; M="models"
TARGET="Diagnosis"; LEAKY=["Hemoglobin","MCV","MCH","MCHC"]

def main():
    os.makedirs(P,exist_ok=True); os.makedirs(M,exist_ok=True)
    df=pd.read_csv(RAW); print("shape:",df.shape)
    y=df[TARGET].astype(int)
    present=[c for c in LEAKY if c in df.columns]
    X=df.drop(columns=[TARGET]+present)
    print("[GUARD] Dropped:",present); print("Features:",list(X.columns))
    Xtr,Xte,ytr,yte=train_test_split(X,y,test_size=0.2,random_state=42,stratify=y)
    imp=SimpleImputer(strategy="median"); Xtr=imp.fit_transform(Xtr); Xte=imp.transform(Xte)
    sc=StandardScaler(); Xtr=sc.fit_transform(Xtr); Xte=sc.transform(Xte)
    Xtr,ytr=SMOTE(random_state=42).fit_resample(Xtr,ytr)
    print("X_train:",Xtr.shape,"X_test:",Xte.shape)
    pd.DataFrame(Xtr).to_csv(f"{P}/anemia_X_train.csv",index=False)
    pd.DataFrame(Xte).to_csv(f"{P}/anemia_X_test.csv",index=False)
    pd.Series(ytr).to_csv(f"{P}/anemia_y_train.csv",index=False)
    pd.Series(yte).to_csv(f"{P}/anemia_y_test.csv",index=False)
    joblib.dump(sc,f"{M}/anemia_scaler.pkl"); joblib.dump(imp,f"{M}/anemia_imputer.pkl")
    print("[OK] saved")

if __name__=="__main__": main()
