"""
rag_agent.py - Retrieval-Augmented Generation (RAG) Orchestrator for AURA Chatbot

Orchestrates:
1. Emergency detection via keyword matching.
2. Context retrieval from ChromaDB vector store using PubMedBERT embeddings.
3. Prompt assembly with clinical ground-truth guardrails.
4. Answer generation using local LLM (Gemma:2b via Ollama API).
5. Delivery of structured clinical guidance and source attribution.
"""

import os
import sys
import json
from typing import List, Dict, Any
import requests
from sentence_transformers import SentenceTransformer

from vector_store import get_chroma_client, get_or_create_collection, query_similar_chunks
from emergency_keywords import is_emergency, get_emergency_response

# ─────────────────────────────────────────────────────────────────────────────
# Global Configuration & Model Initialization
# ─────────────────────────────────────────────────────────────────────────────
OLLAMA_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "gemma:2b"

# Load embedding model ONCE at module level for high-throughput inference
print("[INFO] Loading PubMedBERT embedding model...")
EMBEDDING_MODEL = SentenceTransformer("microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract")


def retrieve(query: str, k: int = 5) -> List[Dict[str, Any]]:
    """
    Encodes the user query using PubMedBERT and retrieves the top-k most relevant
    medical chunks from the ChromaDB vector store.
    Filters ChromaDB results by qtype (symptoms, treatment) and applies
    relevance post-filtering based on query clinical keywords.

    Args:
        query (str): The patient or clinical inquiry.
        k (int): Number of nearest neighbor documents to return (default: 5).

    Returns:
        List[Dict[str, Any]]: Retrieved chunks containing document, metadata, and distance.
    """
    # 1. Generate query embedding
    embedding = EMBEDDING_MODEL.encode([query], normalize_embeddings=True)[0].tolist()

    # 2. Get ChromaDB client + collection
    client = get_chroma_client()
    collection = get_or_create_collection(client)

    # 3. Retrieve top candidates with qtype filter (symptoms, treatment)
    candidate_k = max(20, k)
    try:
        results = collection.query(
            query_embeddings=[embedding],
            n_results=candidate_k,
            where={"qtype": {"$in": ["symptoms", "treatment"]}},
            include=["documents", "metadatas", "distances"]
        )
    except Exception as e:
        print(f"[WARNING] Filtered query failed: {e}. Falling back to unfiltered query.")
        results = collection.query(
            query_embeddings=[embedding],
            n_results=candidate_k,
            include=["documents", "metadatas", "distances"]
        )

    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    dists = results.get("distances", [[]])[0]

    candidates = [
        {"document": doc, "metadata": meta, "distance": dist}
        for doc, meta, dist in zip(docs, metas, dists)
    ]

    if not candidates:
        return []

    # 4. Post-filter / rank: prioritize candidates containing query keywords (e.g. "anemia", "symptom", "treatment")
    stop_words = {
        "what", "are", "the", "of", "a", "an", "in", "is", "for", "to",
        "and", "do", "does", "did", "i", "have", "has", "how", "can", "tell", "me", "about"
    }
    generic_terms = {
        "symptom", "symptoms", "treatment", "treatments", "diagnosis",
        "sign", "signs", "cause", "causes", "prevention", "prevent"
    }
    all_query_words = [
        w.lower().strip("?,.!:;\"'")
        for w in query.split()
        if len(w) > 2 and w.lower().strip("?,.!:;\"'") not in stop_words
    ]
    # Specific condition/subject keywords (e.g., "anemia") take highest precedence
    subject_keywords = [w for w in all_query_words if w not in generic_terms]
    priority_keywords = subject_keywords if subject_keywords else all_query_words

    title_matched = []
    body_matched = []
    other_candidates = []

    for item in candidates:
        doc_lower = item["document"].lower()
        question_part = doc_lower.split("answer:")[0] if "answer:" in doc_lower else doc_lower

        if any(kw in question_part for kw in priority_keywords):
            title_matched.append(item)
        elif any(kw in doc_lower for kw in priority_keywords):
            body_matched.append(item)
        else:
            other_candidates.append(item)

    # Return top-k prioritized chunks
    filtered = title_matched + body_matched + other_candidates
    return filtered[:k]


def generate_answer(query: str, chunks: List[Dict[str, Any]], model_name: str = DEFAULT_MODEL) -> str:
    """
    Constructs a grounded clinical prompt using retrieved context and invokes
    the local Ollama LLM (Gemma:2b) to synthesize a medically safe response.

    Args:
        query (str): User question.
        chunks (List[Dict[str, Any]]): Retrieved context chunks from vector store.
        model_name (str): Ollama model tag (default: 'gemma:2b').

    Returns:
        str: Generated clinical response.
    """
    if not chunks:
        return "I don't have enough information. Please consult a doctor."

    # Build context from top chunks
    context = "\n\n".join([c["document"] for c in chunks[:5]])

    # Build medical guardrail prompt
    prompt = f"""You are AURA, a medical information assistant.
Answer ONLY from the context below.
If unsure, say: "I don't have enough information. Please consult a doctor."
Never diagnose. Say "risk" instead of "you have".
Cite sources like [Source: MedQuAD].
End with: "For informational purposes only. Consult a doctor."

Context:
{context}

Question: {query}

Answer:"""

    # POST to Ollama API
    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": model_name, "prompt": prompt, "stream": False},
            timeout=180
        )
        response.raise_for_status()
        return response.json().get("response", "").strip()
    except Exception as e:
        print(f"[ERROR] Ollama call failed: {e}")
        return "Chatbot service unavailable. Please try again later."


def chat(question: str) -> Dict[str, Any]:
    """
    Main entry point for AURA Chatbot:
    1. Checks for emergency keywords (returns immediate helpline guidance if matched).
    2. Retrieves top-k evidence chunks from ChromaDB.
    3. Synthesizes response via local Gemma LLM.
    4. Returns structured payload for API / UI integration.

    Args:
        question (str): User inquiry.

    Returns:
        Dict[str, Any]: Structured dictionary with response, is_emergency flag, and sources.
    """
    # Step 1: Emergency triage check
    if is_emergency(question):
        return get_emergency_response(question)

    # Step 2: Retrieve relevant clinical chunks
    chunks = retrieve(question, k=5)

    # Step 3: Synthesize answer with LLM
    answer = generate_answer(question, chunks)

    # Step 4: Return structured payload
    return {
        "response": answer,
        "is_emergency": False,
        "sources": [
            {
                "source": c["metadata"].get("source", "MedQuAD"),
                "distance": round(c["distance"], 3) if isinstance(c.get("distance"), (int, float)) else 0.0
            }
            for c in chunks
        ]
    }


if __name__ == "__main__":
    # Ensure Windows console encoding handles UTF-8 emoji cleanly
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    print("Testing RAG agent...")

    print("\n--- Test 1: Normal question ---")
    result = chat("What are the symptoms of anemia?")
    print(json.dumps(result, indent=2, ensure_ascii=False))

    print("\n--- Test 2: Emergency question ---")
    result = chat("I have severe chest pain")
    print(json.dumps(result, indent=2, ensure_ascii=False))
