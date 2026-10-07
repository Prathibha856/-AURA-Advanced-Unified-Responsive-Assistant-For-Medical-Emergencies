"""
modules/cardio_kidney/api.py
FastAPI router for Module 3 — Cardiovascular & Kidney.
"""
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

HERE = Path(__file__).resolve().parent
SERVICES = HERE.parent.parent
sys.path.insert(0, str(SERVICES))

MODELS_DIR = HERE / "models"

router = APIRouter(prefix="/cardio", tags=["Cardiovascular & Kidney"])

_loaded = {}


def _load(name):
    if name in _loaded:
        return _loaded[name]
    try:
        clf = joblib.load(MODELS_DIR / f"{name}_model.pkl")
        scaler = joblib.load(MODELS_DIR / f"{name}_scaler.pkl")
        imputer = joblib.load(MODELS_DIR / f"{name}_imputer.pkl")
        _loaded[name] = (clf, scaler, imputer)
        return _loaded[name]
    except Exception as e:
        raise HTTPException(500, f"Cannot load {name}: {e}")


def _predict(name, features):
    clf, scaler, imputer = _load(name)
    expected = list(getattr(scaler, "feature_names_in_", []) or features.keys())
    row = {c: float(features.get(c, 0.0)) for c in expected}
    X = pd.DataFrame([row]).replace([np.inf, -np.inf], np.nan)
    X = imputer.transform(X)
    X = scaler.transform(X)
    proba = clf.predict_proba(X)[0]
    pred = int(clf.predict(X)[0])
    classes = clf.classes_.tolist()
    if len(classes) == 2:
        risk_pct = round(float(proba[1]) * 100, 2)
        label = "Positive" if pred == 1 else "Negative"
    else:
        risk_pct = round(float(max(proba)) * 100, 2)
        label = f"Class {pred}"
    return {
        "model": name,
        "prediction": label,
        "class_index": pred,
        "risk_percentage": risk_pct,
        "class_probabilities": {str(c): round(float(p) * 100, 2) for c, p in zip(classes, proba)},
        "disclaimer": "Risk estimate only. Not a diagnosis. Consult a physician.",
    }


class LiverRequest(BaseModel):
    Age: float
    Gender: float = 1
    Total_Bilirubin: float
    Direct_Bilirubin: float
    Alkaline_Phosphotase: float
    Alamine_Aminotransferase: float
    Aspartate_Aminotransferase: float
    Total_Protiens: float
    Albumin: float
    Albumin_and_Globulin_Ratio: float


class HeartRequest(BaseModel):
    age: float
    sex: float
    trestbps: float
    chol: float
    fbs: float
    restecg: float
    thalach: float


@router.get("/health")
def health():
    return {
        "module": "cardio_kidney",
        "models_available": {
            "liver": (MODELS_DIR / "liver_model.pkl").exists(),
            "heart": (MODELS_DIR / "heart_model.pkl").exists(),
            "ckd": (MODELS_DIR / "ckd_model.pkl").exists(),
        },
    }


@router.post("/liver")
def predict_liver(req: LiverRequest):
    return _predict("liver", req.model_dump())


@router.post("/heart")
def predict_heart(req: HeartRequest):
    return _predict("heart", req.model_dump())


@router.post("/ckd")
def predict_ckd(req: dict):
    numeric = {k: float(v) for k, v in req.items() if isinstance(v, (int, float))}
    return _predict("ckd", numeric)