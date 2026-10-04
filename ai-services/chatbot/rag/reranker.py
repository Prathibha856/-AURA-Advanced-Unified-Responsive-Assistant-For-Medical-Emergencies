"""
rag/reranker.py - Lightweight Cross-Encoder Reranker with Graceful Fallback
"""

import threading
from typing import List, Dict, Any, Optional
import torch
import config

_reranker_instance = None
_reranker_lock = threading.Lock()
_reranker_failed = False


class CrossEncoderReranker:
    """
    Reranks hybrid retrieval candidates using a lightweight cross-encoder model.
    Falls back gracefully to RRF fused score ordering if the model is disabled or unavailable.
    """

    def __init__(self, model_name: str = config.RERANKER_MODEL):
        self.model_name = model_name
        self.model = None
        self._load_model()

    def _load_model(self):
        global _reranker_failed
        if not config.USE_RERANKER:
            print("[INFO] Cross-encoder reranker is disabled via configuration.")
            return

        try:
            from sentence_transformers import CrossEncoder

            device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"[INFO] Initializing CrossEncoder ({self.model_name}) on device: {device}...")
            self.model = CrossEncoder(self.model_name, device=device, max_length=512)
            print("[INFO] CrossEncoder reranker loaded successfully.")
        except Exception as e:
            print(f"[WARNING] Failed to load CrossEncoder '{self.model_name}': {e}. Falling back to hybrid RRF ranking.")
            self.model = None
            _reranker_failed = True

    def rerank(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = config.RERANKER_TOP_K
    ) -> List[Dict[str, Any]]:
        """
        Reranks candidate documents against the query.
        Returns top_k items with `reranker_score` added.
        """
        if not candidates:
            return []

        # If model is unavailable or disabled, fallback to fused_score
        if self.model is None:
            sorted_candidates = sorted(
                candidates,
                key=lambda x: x.get("fused_score", 0.0),
                reverse=True
            )
            for c in sorted_candidates:
                c["reranker_score"] = float(c.get("fused_score", 0.0))
            return sorted_candidates[:top_k]

        try:
            # Prepare pairs: [query, passage]
            # Passage uses question + answer
            pairs = []
            for item in candidates:
                q = item.get("question", "").strip()
                a = item.get("answer", "").strip()
                if q and a:
                    passage = f"Question: {q}\nAnswer: {a}"
                else:
                    passage = item.get("document", "").strip()
                pairs.append([query, passage[:1000]])  # Truncate passage to avoid token overflow

            scores = self.model.predict(pairs)

            # Assign reranker scores
            for i, score in enumerate(scores):
                candidates[i]["reranker_score"] = float(score)

            # Sort descending by cross-encoder score
            reranked = sorted(
                candidates,
                key=lambda x: x["reranker_score"],
                reverse=True
            )

            if config.RAG_DEBUG:
                print(f"[DEBUG RERANK] Reranked {len(candidates)} candidates down to top {top_k}:")
                for idx, c in enumerate(reranked[:top_k], start=1):
                    print(f"  {idx}. [Score: {c['reranker_score']:.4f}] {c.get('question', '')[:60]}... (qtype: {c.get('qtype')})")

            return reranked[:top_k]

        except Exception as e:
            print(f"[WARNING] Reranking execution failed: {e}. Falling back to fused scores.")
            sorted_candidates = sorted(
                candidates,
                key=lambda x: x.get("fused_score", 0.0),
                reverse=True
            )
            for c in sorted_candidates:
                c["reranker_score"] = float(c.get("fused_score", 0.0))
            return sorted_candidates[:top_k]


def get_reranker() -> CrossEncoderReranker:
    global _reranker_instance
    if _reranker_instance is None:
        with _reranker_lock:
            if _reranker_instance is None:
                _reranker_instance = CrossEncoderReranker()
    return _reranker_instance
