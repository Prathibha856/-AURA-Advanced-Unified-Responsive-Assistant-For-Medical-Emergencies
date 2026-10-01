from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uvicorn
from rag_agent import chat

# Pydantic Models
class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    is_emergency: bool
    sources: List[Dict[str, Any]]

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str

# FastAPI App
app = FastAPI(title="AURA Medical RAG Chatbot", version="1.0.0")

# CORS Configuration
ALLOWED_ORIGINS = [
    "http://localhost:8082",
    "http://localhost:5173",
    "http://localhost:5714",
    "http://127.0.0.1:8082",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5714",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoints
@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="UP", service="AURA-Chatbot-RAG", version="1.0.0")

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        result = chat(request.question)
        return ChatResponse(
            response=result.get("response", ""),
            is_emergency=result.get("is_emergency", False),
            sources=result.get("sources", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

# Main
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
