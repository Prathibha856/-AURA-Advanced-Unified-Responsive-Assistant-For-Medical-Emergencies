"""
rag/bm25_retriever.py - High-Performance BM25 Lexical Retrieval for Medical QA
"""

import os
import json
import pickle
import re
from typing import List, Dict, Any, Optional
import config

try:
    from rank_bm25 import BM25Okapi
except ImportError:
    # Lightweight pure-Python fallback for BM25Okapi
    import math

    class BM25Okapi:  # type: ignore
        def __init__(self, corpus, k1=1.5, b=0.75):
            self.corpus_size = len(corpus)
            self.avgdl = sum(len(x) for x in corpus) / (self.corpus_size or 1)
            self.corpus = corpus
            self.k1 = k1
            self.b = b
            self.doc_len = [len(x) for x in corpus]
            self.doc_freqs = []
            self.nd = {}
            for doc in corpus:
                df = {}
                for word in doc:
                    df[word] = df.get(word, 0) + 1
                self.doc_freqs.append(df)
                for word in df:
                    self.nd[word] = self.nd.get(word, 0) + 1
            self.idf = {}
            for word, freq in self.nd.items():
                self.idf[word] = math.log((self.corpus_size - freq + 0.5) / (freq + 0.5) + 1)

        def get_scores(self, query):
            scores = [0.0] * self.corpus_size
            for q in query:
                if q not in self.idf:
                    continue
                q_idf = self.idf[q]
                for idx, df in enumerate(self.doc_freqs):
                    if q not in df:
                        continue
                    freq = df[q]
                    numerator = freq * (self.k1 + 1)
                    denominator = freq + self.k1 * (1 - self.b + self.b * (self.doc_len[idx] / (self.avgdl or 1)))
                    scores[idx] += q_idf * (numerator / denominator)
            return scores


def tokenize_text(text: str) -> List[str]:
    """Tokenizes text into normalized words for lexical indexing."""
    words = re.findall(r"[a-zA-Z0-9\-]+", text.lower())
    return [w for w in words if len(w) > 1]


class BM25Retriever:
    """
    Manages the BM25 index over the entire medical QA dataset.
    Uses disk caching for rapid restarts.
    """

    def __init__(self, data_path: Optional[str] = None, cache_path: Optional[str] = None):
        self.data_path = data_path or config.KNOWLEDGE_BASE_JSON
        self.cache_path = cache_path or config.BM25_CACHE_FILE
        self.corpus_metadata: List[Dict[str, Any]] = []
        self.bm25: Optional[BM25Okapi] = None
        self._load_or_build_index()

    def _load_or_build_index(self):
        # 1. Try loading cached tokenized corpus
        if os.path.exists(self.cache_path):
            try:
                print(f"[INFO] Loading cached BM25 index from {self.cache_path}...")
                with open(self.cache_path, "rb") as f:
                    cache_data = pickle.load(f)
                    self.corpus_metadata = cache_data["metadata"]
                    tokenized_corpus = cache_data["tokenized_corpus"]
                    self.bm25 = BM25Okapi(tokenized_corpus)
                print(f"[INFO] BM25 index loaded successfully ({len(self.corpus_metadata)} documents).")
                return
            except Exception as e:
                print(f"[WARNING] Failed to load BM25 cache: {e}. Rebuilding index...")

        # 2. Build index from JSON dataset
        if not os.path.exists(self.data_path):
            print(f"[ERROR] Knowledge base file not found: {self.data_path}")
            return

        print(f"[INFO] Building BM25 index from {self.data_path}...")
        with open(self.data_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        tokenized_corpus = []
        self.corpus_metadata = []

        for idx, item in enumerate(data):
            question = item.get("question", "")
            answer = item.get("answer", "")
            qtype = item.get("qtype", "general")
            source = item.get("source", "MedQuAD")
            full_doc = f"Question: {question}\nAnswer: {answer}"

            # Tokenize question + answer (give question weight by duplicating)
            tokens = tokenize_text(question) * 2 + tokenize_text(answer)
            tokenized_corpus.append(tokens)

            self.corpus_metadata.append({
                "document_id": str(idx),
                "question": question,
                "answer": answer,
                "qtype": qtype,
                "source": source,
                "document": full_doc,
                "metadata": {
                    "qtype": qtype,
                    "source": source,
                    "question": question
                }
            })

        self.bm25 = BM25Okapi(tokenized_corpus)

        # 3. Cache tokenized corpus
        try:
            os.makedirs(os.path.dirname(self.cache_path), exist_ok=True)
            with open(self.cache_path, "wb") as f:
                pickle.dump({
                    "metadata": self.corpus_metadata,
                    "tokenized_corpus": tokenized_corpus
                }, f)
            print(f"[INFO] BM25 index cached to {self.cache_path}")
        except Exception as e:
            print(f"[WARNING] Could not save BM25 cache: {e}")

    def retrieve(self, query: str, top_k: int = config.BM25_TOP_K) -> List[Dict[str, Any]]:
        """
        Retrieves top_k documents using BM25 ranking.
        """
        if not self.bm25 or not self.corpus_metadata:
            return []

        tokens = tokenize_text(query)
        if not tokens:
            return []

        scores = self.bm25.get_scores(tokens)

        # Get top-k indices
        top_indices = sorted(
            range(len(scores)),
            key=lambda i: scores[i],
            reverse=True
        )[:top_k]

        results = []
        for idx in top_indices:
            score = float(scores[idx])
            if score <= 0.0:
                continue

            item = dict(self.corpus_metadata[idx])
            item["lexical_score"] = score
            results.append(item)

        return results


# Module-level singleton
_bm25_instance: Optional[BM25Retriever] = None


def get_bm25_retriever() -> BM25Retriever:
    global _bm25_instance
    if _bm25_instance is None:
        _bm25_instance = BM25Retriever()
    return _bm25_instance
