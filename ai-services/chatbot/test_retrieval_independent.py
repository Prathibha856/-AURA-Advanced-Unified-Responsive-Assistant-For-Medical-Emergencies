"""
Independent test for Hybrid Retrieval (Dense + BM25 + RRF)
"""

import sys
import os

# Add chatbot directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from rag.query_processor import QueryProcessor
from rag.hybrid_retriever import get_hybrid_retriever

def test_retrieval_queries():
    qp = QueryProcessor()
    hr = get_hybrid_retriever()

    test_queries = [
        "What are the symptoms of anemia?",
        "What causes diabetes?",
        "How is asthma treated?"
    ]

    print("=" * 70)
    print(" STAGE 2: INDEPENDENT HYBRID RETRIEVAL TEST")
    print("=" * 70)

    for q in test_queries:
        print(f"\n>> Testing Query: \"{q}\"")
        processed = qp.process(q)
        print(f"   Condition extracted: '{processed.condition}' | Intents: {processed.intents}")

        candidates = hr.retrieve(processed, fused_limit=10)
        print(f"   Retrieved candidates count: {len(candidates)}")

        assert len(candidates) > 0, f"No candidates returned for query: {q}"

        print("   Top 3 Candidates:")
        for idx, c in enumerate(candidates[:3], start=1):
            q_text = c.get("question", "")
            qtype = c.get("qtype", "")
            fused = c.get("fused_score", 0.0)
            dense_r = c.get("dense_rank", "N/A")
            bm25_r = c.get("bm25_rank", "N/A")
            print(f"     {idx}. [qtype: {qtype}] {q_text[:70]}... (Fused: {fused:.5f}, DenseRank: {dense_r}, BM25Rank: {bm25_r})")

        # Validation: check that the target condition is represented in the candidates
        condition_in_candidates = any(
            processed.condition.lower() in c.get("question", "").lower() or
            processed.condition.lower() in c.get("document", "").lower()
            for c in candidates
        )
        print(f"   Target condition '{processed.condition}' found in retrieved documents: {condition_in_candidates}")
        assert condition_in_candidates, f"Critical failure: condition '{processed.condition}' not found in top candidates!"

    print("\n[SUCCESS] Stage 2 independent hybrid retrieval tests passed!")


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    test_retrieval_queries()
