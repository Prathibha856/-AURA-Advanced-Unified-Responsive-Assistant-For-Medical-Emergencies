"""
rag/hybrid_retriever.py - Reciprocal Rank Fusion (RRF) Hybrid Retriever
"""

from typing import List, Dict, Any, Optional
import config
from rag.query_processor import ProcessedQuery, QueryProcessor
from rag.dense_retriever import get_dense_retriever, DenseRetriever
from rag.bm25_retriever import get_bm25_retriever, BM25Retriever


class HybridRetriever:
    """
    Orchestrates dense semantic search + BM25 lexical search, combining candidate
    lists via Reciprocal Rank Fusion (RRF) to generate a robust candidate set.
    """

    def __init__(
        self,
        dense_retriever: Optional[DenseRetriever] = None,
        bm25_retriever: Optional[BM25Retriever] = None,
        query_processor: Optional[QueryProcessor] = None
    ):
        self.dense = dense_retriever or get_dense_retriever()
        self.bm25 = bm25_retriever or get_bm25_retriever()
        self.query_processor = query_processor or QueryProcessor()

    def retrieve(
        self,
        query_or_processed: Any,
        fused_limit: int = config.FUSED_CANDIDATES
    ) -> List[Dict[str, Any]]:
        """
        Executes hybrid retrieval:
        1. Query processing / expansion
        2. Parallel / sequential retrieval: Dense (top 25) and BM25 (top 25)
        3. Reciprocal Rank Fusion (RRF)
        4. Returns top 30-50 diverse candidates with all scores preserved.
        """
        if isinstance(query_or_processed, ProcessedQuery):
            processed = query_or_processed
        else:
            processed = self.query_processor.process(str(query_or_processed))

        query_str = processed.original_query

        # Retrieve dense candidates
        dense_candidates = self.dense.retrieve(query_str, top_k=config.DENSE_TOP_K)

        # Retrieve BM25 candidates
        # We query with the original query, and if a condition is detected, we also query with condition
        bm25_candidates = self.bm25.retrieve(query_str, top_k=config.BM25_TOP_K)

        if processed.condition and len(bm25_candidates) < config.BM25_TOP_K:
            extra_bm25 = self.bm25.retrieve(processed.condition, top_k=config.BM25_TOP_K // 2)
            # Combine without duplicates
            seen_ids = {c["document_id"] for c in bm25_candidates}
            for c in extra_bm25:
                if c["document_id"] not in seen_ids:
                    bm25_candidates.append(c)
                    seen_ids.add(c["document_id"])

        # Compute Reciprocal Rank Fusion (RRF)
        # RRF formula: Score(d) = sum( 1 / (RRF_K + rank) )
        rrf_k = config.RRF_K
        candidates_by_id: Dict[str, Dict[str, Any]] = {}
        rrf_scores: Dict[str, float] = {}

        # 1. Score dense candidates
        for rank, item in enumerate(dense_candidates, start=1):
            doc_id = item["document_id"]
            if doc_id not in candidates_by_id:
                candidates_by_id[doc_id] = dict(item)
                candidates_by_id[doc_id]["lexical_score"] = 0.0

            candidates_by_id[doc_id]["semantic_score"] = item.get("semantic_score", 0.0)
            candidates_by_id[doc_id]["dense_rank"] = rank
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (rrf_k + rank))

        # 2. Score BM25 candidates
        # If specific medical condition is extracted, slightly boost lexical weight
        bm25_weight = 1.2 if processed.condition else 1.0

        for rank, item in enumerate(bm25_candidates, start=1):
            doc_id = item["document_id"]
            if doc_id not in candidates_by_id:
                candidates_by_id[doc_id] = dict(item)
                candidates_by_id[doc_id]["semantic_score"] = 0.0
                candidates_by_id[doc_id]["distance"] = 1.0

            candidates_by_id[doc_id]["lexical_score"] = item.get("lexical_score", 0.0)
            candidates_by_id[doc_id]["bm25_rank"] = rank
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + bm25_weight * (1.0 / (rrf_k + rank))

        # 3. Compile fused items
        fused_items = []
        for doc_id, item in candidates_by_id.items():
            item["fused_score"] = rrf_scores[doc_id]
            fused_items.append(item)

        # 4. Sort by fused score descending
        fused_items.sort(key=lambda x: x["fused_score"], reverse=True)

        selected = fused_items[:fused_limit]

        if config.RAG_DEBUG:
            print(f"[DEBUG RRF] Retrieved {len(dense_candidates)} dense, {len(bm25_candidates)} BM25. Fused candidates: {len(selected)}")
            for i, c in enumerate(selected[:5], start=1):
                print(f"  {i}. ID={c['document_id']} Q={c.get('question', '')[:50]}... Fused={c['fused_score']:.5f} DenseRank={c.get('dense_rank', '-')} BM25Rank={c.get('bm25_rank', '-')}")

        return selected


_hybrid_instance: Optional[HybridRetriever] = None


def get_hybrid_retriever() -> HybridRetriever:
    global _hybrid_instance
    if _hybrid_instance is None:
        _hybrid_instance = HybridRetriever()
    return _hybrid_instance
