"""
models/embeddings.py - Singleton PubMedBERT Embedding Provider
"""

import threading
import torch
from sentence_transformers import SentenceTransformer
import config

_embedding_model_lock = threading.Lock()
_embedding_model_instance = None


def get_embedding_model() -> SentenceTransformer:
    """
    Returns the singleton SentenceTransformer instance.
    Loads PubMedBERT once on the best available device (CUDA or CPU).
    """
    global _embedding_model_instance
    if _embedding_model_instance is None:
        with _embedding_model_lock:
            if _embedding_model_instance is None:
                device = "cuda" if torch.cuda.is_available() else "cpu"
                print(f"[INFO] Initializing PubMedBERT on device: {device}")
                _embedding_model_instance = SentenceTransformer(
                    config.EMBEDDING_MODEL_NAME,
                    device=device
                )
    return _embedding_model_instance


def encode_query(query: str) -> list:
    """
    Encodes a user query into a normalized embedding vector.
    """
    model = get_embedding_model()
    embeddings = model.encode([query], normalize_embeddings=True)
    return embeddings[0].tolist()
