"""
chatbot/predict_api.py

AURA Disease Risk Prediction API (unified).
Port 8001. Mounts 3 module routers:
- /blood     -> blood_nutrition
- /thyroid   -> thyroid_metabolic
- /cardio    -> cardio_kidney
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SERVICES = HERE.parent
sys.path.insert(0, str(SERVICES))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from modules.blood_nutrition.api import router as blood_router
from modules.thyroid_metabolic.api import router as thyroid_router
from modules.cardio_kidney.api import router as cardio_router

app = FastAPI(
    title="AURA Disease Risk Prediction API",
    description="ML-based disease risk estimation across 3 clinical modules",
    version="3.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(blood_router)
app.include_router(thyroid_router)
app.include_router(cardio_router)


@app.get("/")
def root():
    return {
        "service": "AURA Disease Risk Prediction API",
        "version": "3.1.0",
        "modules": {
            "blood_nutrition": "/blood/health",
            "thyroid_metabolic": "/thyroid/health",
            "cardio_kidney": "/cardio/health",
        },
        "docs": "/docs",
    }


@app.get("/health")
def global_health():
    return {
        "status": "UP",
        "modules": {
            "blood": "/blood/health",
            "thyroid": "/thyroid/health",
            "cardio": "/cardio/health",
        },
    }


if __name__ == "__main__":
    uvicorn.run("predict_api:app", host="0.0.0.0", port=8001, reload=True)