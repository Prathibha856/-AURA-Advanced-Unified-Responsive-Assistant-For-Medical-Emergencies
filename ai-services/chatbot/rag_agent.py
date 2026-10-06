"""
rag_agent.py - Orchestration Facade for AURA Medical RAG Assistant
Maintains strict backward compatibility with main.py and external consumers
while delegating to the production-grade modular RAG pipeline.
"""

import sys
import json
from typing import List, Dict, Any

from emergency_keywords import is_emergency, get_emergency_response
from rag.pipeline import get_pipeline, MedicalRAGPipeline
from rag.hybrid_retriever import get_hybrid_retriever
from rag.reranker import get_reranker
from rag.generator import get_generator
from rag.context_builder import get_context_builder


def retrieve(query: str, k: int = 6) -> List[Dict[str, Any]]:
    """
    Backward-compatible retrieval interface:
    Executes hybrid retrieval (Dense PubMedBERT + Lexical BM25) and cross-encoder reranking.
    """
    pipeline = get_pipeline()
    processed = pipeline.qp.process(query)
    candidates = pipeline.hybrid.retrieve(processed, fused_limit=30)
    reranked = pipeline.reranker.rerank(query, candidates, top_k=k)
    return reranked


def generate_answer(query: str, chunks: List[Dict[str, Any]], model_name: str = "") -> str:
    """
    Backward-compatible answer generation interface:
    Builds structured clinical evidence context and prompts the LLM provider.
    """
    builder = get_context_builder()
    generator = get_generator()
    context_str, _ = builder.build_context(chunks)
    return generator.generate(query=query, context=context_str)


def chat(question: str) -> Dict[str, Any]:
    """
    Primary entrypoint called by FastAPI POST /chat:
    Full pipeline execution (Emergency Triage -> Hybrid Search -> RRF -> Cross-Encoder -> Grounded Generation -> Verifier).
    """
    pipeline = get_pipeline()
    return pipeline.process_query(question)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    print("Testing AURA RAG Agent (Refactored Pipeline)...")
    test_q = "What are the symptoms of anemia?"
    print(f"\nQuery: {test_q}")
    res = chat(test_q)
    print("\nResult:")
    print(json.dumps(res, indent=2, ensure_ascii=False))