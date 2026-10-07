"""
modules/unified_api.py

Unified FastAPI service that mounts all 4 AURA disease prediction modules.
Runs on port 8001 (companion to chatbot on 8000).
"""
import sys
from pathlib import Path
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

HERE = Path(__file__).resolve().parent
SERVICES = HERE.parent
sys.path.insert(0, str(SERVICES))

from modules.blood_nutrition.api import router as blood_router
from modules.thyroid_metabolic.api import router as thyroid_router
from modules.cardio_kidney.api import router as cardio_router
from modules.systemic_immune.api import router as systemic_router

app = FastAPI(
    title="AURA Disease Prediction API",
    description="4-module clinical disease risk estimation service",
    version="4.0.0",
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
app.include_router(systemic_router)


@app.get("/")
def root():
    return {
        "service": "AURA Disease Prediction API",
        "version": "4.0.0",
        "modules": [
            "blood_nutrition",
            "thyroid_metabolic",
            "cardio_kidney",
            "systemic_immune",
        ],
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "UP"}


if __name__ == "__main__":
    uvicorn.run("unified_api:app", host="0.0.0.0", port=8001, reload=False)