"""
rag/dense_retriever.py - Dense Semantic Retrieval using PubMedBERT & ChromaDB
"""

import re
from typing import List, Dict, Any, Optional
import config
from models.embeddings import encode_query
from vector_store import get_chroma_client, get_or_create_collection


class DenseRetriever:
    """
    Manages dense embedding retrieval from ChromaDB using PubMedBERT.
    Retrieves broad semantic candidates without restrictive category filtering.
    """

    def __init__(self):
        self.client = get_chroma_client(persist_directory=config.CHROMA_PERSIST_DIR)
        self.collection = get_or_create_collection(
            self.client,
            name=config.COLLECTION_NAME
        )

    def retrieve(self, query: str, top_k: int = config.DENSE_TOP_K) -> List[Dict[str, Any]]:
        """
        Embeds the query and queries ChromaDB for top_k semantic candidates.
        """
        try:
            query_emb = encode_query(query)

            results = self.collection.query(
                query_embeddings=[query_emb],
                n_results=top_k,
                include=["documents", "metadatas", "distances"]
            )
        except Exception as e:
            print(f"[ERROR] Dense ChromaDB retrieval failed: {e}")
            return []

        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        dists = results.get("distances", [[]])[0]
        ids = results.get("ids", [[]])[0]

        candidates = []
        for i, (doc, meta, dist) in enumerate(zip(docs, metas, dists)):
            if not doc:
                continue

            doc_id = ids[i] if i < len(ids) else str(i)
            meta = meta or {}

            # Parse Question and Answer from document text if needed
            doc_str = str(doc)
            question = ""
            answer = ""
            if "Question:" in doc_str and "Answer:" in doc_str:
                parts = doc_str.split("Answer:", 1)
                question = parts[0].replace("Question:", "").strip()
                answer = parts[1].strip()
            elif "answer:" in doc_str.lower():
                parts = re.split(r"answer:", doc_str, maxsplit=1, flags=re.IGNORECASE)
                question = parts[0].replace("Question:", "").strip()
                answer = parts[1].strip()
            else:
                answer = doc_str

            distance = float(dist) if dist is not None else 1.0
            # Higher is better: 1 / (1 + distance)
            semantic_score = 1.0 / (1.0 + max(0.0, distance))

            candidates.append({
                "document_id": doc_id,
                "document": doc_str,
                "question": question,
                "answer": answer,
                "qtype": meta.get("qtype", "general"),
                "source": meta.get("source", "MedQuAD"),
                "metadata": meta,
                "distance": distance,
                "semantic_score": semantic_score
            })

        return candidates


# Module-level singleton
_dense_instance: Optional[DenseRetriever] = None


def get_dense_retriever() -> DenseRetriever:
    global _dense_instance
    if _dense_instance is None:
        _dense_instance = DenseRetriever()
    return _dense_instance
