"""
api.py - Unified Production FastAPI Microservice for AURA

Exposes REST APIs for:
1. RAG-Powered Clinical Chatbot & Emergency Triage (/chat, /health)
2. Machine Learning Disease Risk Prediction (/predict/thyroid, /predict/anemia,
   /predict/vitamin_d, /predict/b12_folate, /predict/metabolic-panel)

Adheres strictly to medical risk-estimation framing (Decision Support, NOT diagnosis).
"""

import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from chatbot.rag_pipeline import chat_rag
from preprocessing.clinical_thresholds import THYROID_LABEL_NAMES

# Paths to serialized models and scalers
MODELS_DIR = PROJECT_ROOT / "models"

app = FastAPI(
    title="AURA Clinical Decision Support & Prediction API",
    description="Production ML Disease Prediction and RAG Chatbot Service for AURA Medical Emergencies",
    version="2.0.0"
)

# CORS Configuration
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:8082",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8082"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLINICAL_DISCLAIMER = (
    "AURA produces statistical clinical risk estimates for triage and decision support. "
    "Predictions do NOT constitute a definitive medical diagnosis. Consult a licensed clinician."
)

# In-memory Model Cache
MODEL_CACHE = {}


def get_model_and_scaler(disease_slug: str):
    """Loads and caches model, scaler, and optional imputer on demand."""
    if disease_slug not in MODEL_CACHE:
        model_file = MODELS_DIR / f"{disease_slug}_model.pkl"
        scaler_file = MODELS_DIR / f"{disease_slug}_scaler.pkl"
        imputer_file = MODELS_DIR / f"{disease_slug}_imputer.pkl"
        
        if not model_file.exists() or not scaler_file.exists():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Model artifacts for '{disease_slug}' are not yet trained. Run training pipeline first."
            )
        model = joblib.load(model_file)
        scaler = joblib.load(scaler_file)
        imputer = joblib.load(imputer_file) if imputer_file.exists() else None
        MODEL_CACHE[disease_slug] = (model, scaler, imputer)
        
    return MODEL_CACHE[disease_slug]


# ==============================================================================
# Pydantic Schemas: Chatbot
# ==============================================================================
class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Patient query or clinical description")
    user_id: Optional[str] = Field(None, description="Optional user or session identifier")


class ChatResponse(BaseModel):
    response: str
    is_emergency: bool
    sources: List[Dict[str, Any]]
    disclaimer: str = CLINICAL_DISCLAIMER


# ==============================================================================
# Pydantic Schemas: Disease Prediction
# ==============================================================================
class ThyroidPredictRequest(BaseModel):
    age: float = Field(..., ge=1, le=120, description="Age in years")
    sex: int = Field(..., ge=0, le=1, description="Biological sex (0=Female, 1=Male)")
    on_thyroxine: int = Field(0, ge=0, le=1, description="1 if currently taking levothyroxine")
    query_hypothyroid: int = Field(0, ge=0, le=1, description="1 if clinical suspicion of hypothyroidism")
    query_hyperthyroid: int = Field(0, ge=0, le=1, description="1 if clinical suspicion of hyperthyroidism")
    sick: int = Field(0, ge=0, le=1, description="1 if acute non-thyroidal illness present")
    pregnant: int = Field(0, ge=0, le=1, description="1 if currently pregnant")
    goitre: int = Field(0, ge=0, le=1, description="1 if palpable goitre detected")
    T3: float = Field(..., ge=0.1, le=20.0, description="Serum Total T3 (nmol/L)")
    TT4: float = Field(..., ge=5.0, le=500.0, description="Serum Total T4 (nmol/L)")
    TSH: Optional[float] = Field(None, ge=0.001, le=200.0, description="Serum TSH (mIU/L) - Optional reference")
    FT4: Optional[float] = Field(None, ge=0.01, le=15.0, description="Serum Free T4 (ng/dL) - Optional reference")


class AnemiaPredictRequest(BaseModel):
    gender: int = Field(..., ge=0, le=1, description="0=Female, 1=Male")
    hemoglobin: float = Field(..., ge=3.0, le=25.0, description="Hemoglobin (g/dL)")
    mch: float = Field(..., ge=10.0, le=50.0, description="Mean Corpuscular Hemoglobin (pg)")
    mchc: float = Field(..., ge=15.0, le=45.0, description="MCHC (g/dL)")
    mcv: float = Field(..., ge=40.0, le=140.0, description="Mean Corpuscular Volume (fL)")


class VitaminDPredictRequest(BaseModel):
    age: float = Field(..., ge=1, le=120, description="Age in years")
    gender: int = Field(..., ge=1, le=2, description="1=Male, 2=Female")
    bmi: float = Field(..., ge=12.0, le=65.0, description="Body Mass Index (kg/m²)")
    sun_exposure_hours: float = Field(..., ge=0.0, le=16.0, description="Average daily sunlight exposure in hours")
    takes_supplement: int = Field(..., ge=0, le=1, description="1 if taking Vitamin D supplements")


class B12FolatePredictRequest(BaseModel):
    age: float = Field(..., ge=1, le=120, description="Age in years")
    gender: int = Field(..., ge=1, le=2, description="1=Male, 2=Female")
    diet_type: int = Field(..., ge=0, le=2, description="Diet type: 0=Vegan, 1=Vegetarian, 2=Omnivore")
    mcv: float = Field(..., ge=40.0, le=140.0, description="Mean Corpuscular Volume (fL)")
    hemoglobin: float = Field(..., ge=4.0, le=24.0, description="Hemoglobin (g/dL)")


class PredictionResponse(BaseModel):
    condition: str
    risk_level: str  # "Low", "Moderate", "High"
    predicted_class: int
    predicted_label: str
    class_probabilities: Dict[str, float]
    clinical_guidance: str
    disclaimer: str = CLINICAL_DISCLAIMER


# ==============================================================================
# Endpoints
# ==============================================================================
@app.get("/health")
def health():
    """Health check endpoint showing active services and model status."""
    return {
        "status": "UP",
        "service": "AURA-Disease-Prediction-ML",
        "version": "2.0.0",
        "supported_diseases": [
            "Hypothyroidism",
            "Hyperthyroidism",
            "Subclinical Thyroid Dysfunction",
            "Iron Deficiency Anemia",
            "Vitamin B12 Deficiency",
            "Folate Deficiency",
            "Vitamin D Deficiency"
        ]
    }


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    """Chatbot inquiry with emergency triage and clinical knowledge retrieval."""
    try:
        result = chat_rag(request.question)
        return ChatResponse(
            response=result.get("response", ""),
            is_emergency=result.get("is_emergency", False),
            sources=result.get("sources", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing error: {str(e)}")


@app.post("/predict/thyroid", response_model=PredictionResponse)
def predict_thyroid(req: ThyroidPredictRequest):
    """Predicts thyroid disorder risk: Hypo, Hyper, Subclinical, or Normal."""
    model, scaler, imputer = get_model_and_scaler("thyroid")
    
    input_data = pd.DataFrame([{
        "age": req.age,
        "sex": req.sex,
        "on_thyroxine": req.on_thyroxine,
        "query_hypothyroid": req.query_hypothyroid,
        "query_hyperthyroid": req.query_hyperthyroid,
        "sick": req.sick,
        "pregnant": req.pregnant,
        "goitre": req.goitre,
        "T3": req.T3,
        "TT4": req.TT4
    }])

    if imputer is not None:
        input_data = pd.DataFrame(imputer.transform(input_data), columns=input_data.columns)

    scaled_features = pd.DataFrame(scaler.transform(input_data.values), columns=input_data.columns)
    pred_class = int(model.predict(scaled_features)[0])
    probabilities = model.predict_proba(scaled_features)[0]

    label = THYROID_LABEL_NAMES.get(pred_class, f"Class {pred_class}")
    prob_dict = {THYROID_LABEL_NAMES.get(i, f"Class {i}"): float(round(p, 4)) for i, p in enumerate(probabilities)}
    max_risk_prob = float(np.max(probabilities[1:])) if len(probabilities) > 1 else probabilities[0]

    risk_level = "Low"
    if max_risk_prob > 0.65:
        risk_level = "High"
    elif max_risk_prob > 0.35:
        risk_level = "Moderate"

    guidance = "Thyroid profile suggests normal function." if pred_class == 0 else f"Biochemical indicators suggest risk of {label}. Corroborate with repeat serum TSH and Free T4 panel."

    return PredictionResponse(
        condition="Thyroid Dysfunction",
        risk_level=risk_level,
        predicted_class=pred_class,
        predicted_label=label,
        class_probabilities=prob_dict,
        clinical_guidance=guidance
    )


@app.post("/predict/anemia", response_model=PredictionResponse)
def predict_anemia(req: AnemiaPredictRequest):
    """Predicts risk of Iron Deficiency Anemia (IDA) from hematology panel."""
    model, scaler, *_ = get_model_and_scaler("anemia")

    input_data = pd.DataFrame([{
        "Gender": req.gender,
        "MCH": req.mch,
        "MCHC": req.mchc
    }])

    scaled_features = pd.DataFrame(scaler.transform(input_data), columns=input_data.columns)
    pred_class = int(model.predict(scaled_features)[0])
    probabilities = model.predict_proba(scaled_features)[0]

    prob_anemia = float(probabilities[1])
    risk_level = "High" if prob_anemia > 0.60 else ("Moderate" if prob_anemia > 0.30 else "Low")
    label = "Iron Deficiency Anemia" if pred_class == 1 else "Healthy / Non-Anemic"

    guidance = (
        f"CBC parameters indicate elevated probability ({prob_anemia*100:.1f}%) of microcytic hypochromic anemia. "
        "Recommend serum ferritin and iron saturation testing."
        if pred_class == 1 else
        "Hematology parameters are within normal physiological bounds."
    )

    return PredictionResponse(
        condition="Iron Deficiency Anemia",
        risk_level=risk_level,
        predicted_class=pred_class,
        predicted_label=label,
        class_probabilities={"Healthy": float(round(probabilities[0], 4)), "Iron Deficiency Anemia": float(round(prob_anemia, 4))},
        clinical_guidance=guidance
    )


@app.post("/predict/vitamin_d", response_model=PredictionResponse)
def predict_vitamin_d(req: VitaminDPredictRequest):
    """Estimates clinical probability of Vitamin D deficiency [< 20 ng/mL]."""
    model, scaler, *_ = get_model_and_scaler("vitamin_d")

    input_data = pd.DataFrame([{
        "RIDAGEYR": req.age,
        "RIAGENDR": req.gender,
        "BMXBMI": req.bmi,
        "sun_exposure_hours": req.sun_exposure_hours,
        "takes_supplement": req.takes_supplement
    }])

    scaled_features = pd.DataFrame(scaler.transform(input_data), columns=input_data.columns)
    pred_class = int(model.predict(scaled_features)[0])
    probabilities = model.predict_proba(scaled_features)[0]

    prob_def = float(probabilities[1])
    risk_level = "High" if prob_def > 0.60 else ("Moderate" if prob_def > 0.35 else "Low")
    label = "Vitamin D Deficient" if pred_class == 1 else "Sufficient / Normal"

    guidance = (
        f"Estimated probability of 25(OH)D < 20 ng/mL is {prob_def*100:.1f}%. "
        "Consider 25-hydroxyvitamin D total serum test and outdoor sun exposure optimization."
        if pred_class == 1 else
        "Sufficient Vitamin D status estimated from biometric parameters."
    )

    return PredictionResponse(
        condition="Vitamin D Deficiency",
        risk_level=risk_level,
        predicted_class=pred_class,
        predicted_label=label,
        class_probabilities={"Sufficient": float(round(probabilities[0], 4)), "Vitamin D Deficient": float(round(prob_def, 4))},
        clinical_guidance=guidance
    )


@app.post("/predict/b12_folate", response_model=PredictionResponse)
def predict_b12_folate(req: B12FolatePredictRequest):
    """Estimates risk of Vitamin B12 and Folate deficiencies."""
    model, scaler, *_ = get_model_and_scaler("b12_folate")

    input_data = pd.DataFrame([{
        "RIDAGEYR": req.age,
        "RIAGENDR": req.gender,
        "diet_type": req.diet_type,
        "LBXMCV": req.mcv,
        "LBXHGB": req.hemoglobin
    }])

    labels_map = {
        0: "Sufficient",
        1: "Vitamin B12 Deficiency",
        2: "Folate Deficiency",
        3: "Combined Deficiency"
    }

    scaled_features = pd.DataFrame(scaler.transform(input_data), columns=input_data.columns)
    pred_class = int(model.predict(scaled_features)[0])
    probabilities = model.predict_proba(scaled_features)[0]

    label = labels_map.get(pred_class, f"Class {pred_class}")
    prob_dict = {labels_map.get(i, f"Class {i}"): float(round(p, 4)) for i, p in enumerate(probabilities)}
    deficiency_prob = float(np.sum(probabilities[1:])) if len(probabilities) > 1 else probabilities[0]

    risk_level = "High" if deficiency_prob > 0.60 else ("Moderate" if deficiency_prob > 0.35 else "Low")

    guidance = (
        f"Clinical indicators suggest elevated probability of {label}. "
        "Recommend serum B12, serum folate, and peripheral blood smear review."
        if pred_class > 0 else
        "Nutritional cobalamin and folate parameters appear sufficient."
    )

    return PredictionResponse(
        condition="Vitamin B12 & Folate Deficiency",
        risk_level=risk_level,
        predicted_class=pred_class,
        predicted_label=label,
        class_probabilities=prob_dict,
        clinical_guidance=guidance
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
