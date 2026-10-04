"""
config.py - Centralized Configuration for AURA Medical RAG Service
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

# --- Ollama / LLM Configuration ---
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
LLM_MODEL = os.getenv("LLM_MODEL", "gemma:2b")
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.1"))
LLM_TOP_P = float(os.getenv("LLM_TOP_P", "0.9"))
LLM_TOP_K = int(os.getenv("LLM_TOP_K", "40"))
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "512"))
LLM_TIMEOUT = int(os.getenv("LLM_TIMEOUT", "120"))
LLM_CONTEXT_WINDOW = int(os.getenv("LLM_CONTEXT_WINDOW", "4096"))

# --- Embedding & Vector Store Configuration ---
EMBEDDING_MODEL_NAME = os.getenv(
    "EMBEDDING_MODEL_NAME",
    "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract"
)
CHROMA_PERSIST_DIR = os.getenv(
    "CHROMA_PERSIST_DIR",
    str(BASE_DIR / "chroma_db")
)
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "medical_knowledge")
KNOWLEDGE_BASE_JSON = os.getenv(
    "KNOWLEDGE_BASE_JSON",
    str(BASE_DIR / "knowledge_base" / "medical_qa.json")
)
BM25_CACHE_FILE = os.getenv(
    "BM25_CACHE_FILE",
    str(BASE_DIR / "knowledge_base" / "bm25_index.pkl")
)

# --- Retrieval Configuration ---
DENSE_TOP_K = int(os.getenv("DENSE_TOP_K", "25"))
BM25_TOP_K = int(os.getenv("BM25_TOP_K", "25"))
FUSED_CANDIDATES = int(os.getenv("FUSED_CANDIDATES", "40"))
RRF_K = int(os.getenv("RRF_K", "60"))

# --- Reranker Configuration ---
# ms-marco-MiniLM-L-6-v2 is ultra-light (~80MB), fast, and ideal for RTX 3050 6GB
RERANKER_MODEL = os.getenv("RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
RERANKER_TOP_K = int(os.getenv("RERANKER_TOP_K", "6"))
USE_RERANKER = os.getenv("USE_RERANKER", "true").lower() in ("true", "1", "yes")

# --- Grounding Verifier Configuration ---
ENABLE_VERIFIER = os.getenv("ENABLE_VERIFIER", "true").lower() in ("true", "1", "yes")
MAX_REGENERATION_ATTEMPTS = int(os.getenv("MAX_REGENERATION_ATTEMPTS", "2"))

# --- Debug & Observability ---
RAG_DEBUG = os.getenv("RAG_DEBUG", "false").lower() in ("true", "1", "yes")
