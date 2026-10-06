"""
Independent test for Stage 4: Cross-Encoder Reranking and Fallback
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from rag.query_processor import QueryProcessor
from rag.hybrid_retriever import get_hybrid_retriever
from rag.reranker import get_reranker, CrossEncoderReranker

def test_reranking():
    qp = QueryProcessor()
    hr = get_hybrid_retriever()
    reranker = get_reranker()

    print("=" * 70)
    print(" STAGE 4: INDEPENDENT RERANKING TEST")
    print("=" * 70)

    query = "What are the symptoms and causes of anemia?"
    print(f"\n>> Query: \"{query}\"")

    processed = qp.process(query)
    candidates = hr.retrieve(processed, fused_limit=30)
    print(f"   Hybrid retrieved {len(candidates)} candidates.")

    top_passages = reranker.rerank(query, candidates, top_k=6)
    print(f"   Reranked down to {len(top_passages)} passages.")

    assert len(top_passages) == 6, f"Expected 6 passages, got {len(top_passages)}"

    print("\n   Top Reranked Passages:")
    for idx, p in enumerate(top_passages, start=1):
        q = p.get("question", "")
        qtype = p.get("qtype", "")
        r_score = p.get("reranker_score", 0.0)
        f_score = p.get("fused_score", 0.0)
        print(f"     {idx}. [Score: {r_score:.4f} | QType: {qtype}] {q[:75]}...")

    # Verify that the top passages directly address anemia and symptoms/causes
    relevant_passages = [
        p for p in top_passages
        if "anemia" in p.get("question", "").lower() or "anemia" in p.get("answer", "").lower()
    ]
    print(f"\n   Passages mentioning anemia: {len(relevant_passages)} of {len(top_passages)}")
    assert len(relevant_passages) >= 4, "Reranker failed to prioritize relevant anemia passages!"

    # Test Graceful Fallback (e.g. when model is disabled/None)
    print("\n>> Testing Graceful Fallback Mode (model = None)...")
    fallback_reranker = CrossEncoderReranker.__new__(CrossEncoderReranker)
    fallback_reranker.model = None
    fallback_reranker.model_name = "mock-disabled"

    fallback_results = fallback_reranker.rerank(query, candidates, top_k=5)
    assert len(fallback_results) == 5, "Fallback failed to return top_k candidates"
    assert "reranker_score" in fallback_results[0], "Fallback missing reranker_score key"
    print("   Fallback successfully returned fused candidates with reranker_score assigned.")

    print("\n[SUCCESS] Stage 4 independent reranker tests passed!")


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    test_reranking()
