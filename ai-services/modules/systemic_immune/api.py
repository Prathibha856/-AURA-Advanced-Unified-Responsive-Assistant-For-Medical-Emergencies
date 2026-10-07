"""
modules/systemic_immune/api.py

FastAPI router for Module 4 — Systemic & Immune.
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
router = APIRouter(prefix="/systemic", tags=["Systemic & Immune"])

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


class GenericRequest(BaseModel):
    model_config = {"extra": "allow"}


@router.get("/health")
def health():
    return {
        "module": "systemic_immune",
        "models_available": {
            "vitamin_d": (MODELS_DIR / "vitamin_d_model.pkl").exists(),
        },
    }


@router.post("/predict/vitamin_d")
def predict_vitamin_d(req: GenericRequest):
    return _predict("vitamin_d", req.model_dump())