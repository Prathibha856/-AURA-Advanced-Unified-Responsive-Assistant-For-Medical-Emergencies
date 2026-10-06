"""
predict_api.py - AURA Disease Risk Prediction API (port 8001)

Companion service to the RAG chatbot (main.py on port 8000).
Exposes ML prediction endpoints for 5 conditions with anti-leakage verified models.
"""
import sys
from pathlib import Path
from typing import Dict, Any
import joblib
import numpy as np
import pandas as pd
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
MODELS_DIR = PROJECT_ROOT / "models"

app = FastAPI(
    title="AURA Disease Risk Prediction API",
    description="ML-based disease risk estimation for AURA medical emergencies",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_loaded = {}


def _load(name):
    if name in _loaded:
        return _loaded[name]
    try:
        clf = joblib.load(MODELS_DIR / f"{name}_model.pkl")
        scaler = joblib.load(MODELS_DIR / f"{name}_scaler.pkl")
        imp_path = MODELS_DIR / f"{name}_imputer.pkl"
        imputer = joblib.load(imp_path) if imp_path.exists() else None
        _loaded[name] = (clf, scaler, imputer)
        return _loaded[name]
    except Exception as e:
        raise HTTPException(500, f"Cannot load {name}: {e}")


def _predict(model_name, features):
    clf, scaler, imputer = _load(model_name)
    # Determine expected feature order
    expected = list(getattr(scaler, "feature_names_in_", []) or features.keys())
    row = {c: float(features.get(c, 0.0)) for c in expected}
    X = pd.DataFrame([row]).replace([np.inf, -np.inf], np.nan)
    if imputer is not None:
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
        "model": model_name,
        "prediction": label,
        "class_index": pred,
        "risk_percentage": risk_pct,
        "class_probabilities": {str(c): round(float(p)*100, 2) for c, p in zip(classes, proba)},
        "disclaimer": "Risk estimate only. Not a diagnosis. Consult a physician."
    }


# ---------- Schemas ----------
class LiverReq(BaseModel):
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


class DiabetesReq(BaseModel):
    Pregnancies: float
    Glucose: float
    BloodPressure: float
    SkinThickness: float
    Insulin: float
    BMI: float
    DiabetesPedigreeFunction: float
    Age: float


class HeartReq(BaseModel):
    age: float
    sex: float
    trestbps: float
    chol: float
    fbs: float
    restecg: float
    thalach: float
    oldpeak: float
    ca: float
    thal: float


class AnemiaReq(BaseModel):
    Gender: float


class GenericReq(BaseModel):
    model_config = {"extra": "allow"}


# ---------- Endpoints ----------
@app.get("/health")
def health():
    models = ["liver", "diabetes", "heart", "anemia", "vitamin_deficiency"]
    return {"status": "UP", "available_models": {m: (MODELS_DIR / f"{m}_model.pkl").exists() for m in models}}


@app.post("/predict/liver")
def p_liver(r: LiverReq):
    return _predict("liver", r.model_dump())


@app.post("/predict/diabetes")
def p_diabetes(r: DiabetesReq):
    return _predict("diabetes", r.model_dump())


@app.post("/predict/heart")
def p_heart(r: HeartReq):
    return _predict("heart", r.model_dump())


@app.post("/predict/anemia")
def p_anemia(r: AnemiaReq):
    return _predict("anemia", r.model_dump())


@app.post("/predict/vitamin_deficiency")
def p_vitdef(r: GenericReq):
    return _predict("vitamin_deficiency", r.model_dump())


if __name__ == "__main__":
    uvicorn.run("predict_api:app", host="0.0.0.0", port=8001, reload=True)