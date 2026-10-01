"""
vector_store.py - ChromaDB Vector Store Integration for AURA Chatbot

Handles:
1. Initializing the persistent on-disk ChromaDB client.
2. Creating and managing the 'medical_knowledge' collection with cosine similarity.
3. Batch ingesting documents, PubMedBERT embeddings, and metadata.
4. Performing similarity queries to retrieve top-k context passages for RAG.
"""

import os
import json
from typing import List, Dict, Any, Optional
import chromadb

# Try to import tqdm for progress visualization, fallback gracefully if unavailable
try:
    from tqdm import tqdm
except ImportError:
    def tqdm(iterable, *args, **kwargs):
        return iterable

DEFAULT_PERSIST_DIRECTORY = "./chroma_db"
DEFAULT_COLLECTION_NAME = "medical_knowledge"
DEFAULT_EMBEDDINGS_FILEPATH = "knowledge_base/medquad_embeddings.json"


def _resolve_path(filepath: str) -> str:
    """
    Helper to resolve paths relative to both current working directory
    and the script's local directory.
    """
    if os.path.isabs(filepath):
        return os.path.normpath(filepath)
    if os.path.exists(filepath):
        return os.path.normpath(filepath)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    alt_path = os.path.join(script_dir, filepath)
    if os.path.exists(alt_path):
        return os.path.normpath(alt_path)

    return os.path.normpath(alt_path)


def get_chroma_client(persist_directory: str = DEFAULT_PERSIST_DIRECTORY) -> chromadb.ClientAPI:
    """
    Initializes and returns a persistent ChromaDB client for on-disk storage.

    Args:
        persist_directory (str): Local directory path where ChromaDB data will persist.

    Returns:
        chromadb.ClientAPI: Configured ChromaDB PersistentClient instance.
    """
    resolved_dir = _resolve_path(persist_directory)
    os.makedirs(resolved_dir, exist_ok=True)
    return chromadb.PersistentClient(path=resolved_dir)


def get_or_create_collection(
    client: chromadb.ClientAPI,
    name: str = DEFAULT_COLLECTION_NAME
):
    """
    Retrieves or creates a ChromaDB collection configured with cosine distance metric.

    Args:
        client (chromadb.ClientAPI): Active Chroma client.
        name (str): Name of the collection (default: "medical_knowledge").

    Returns:
        Collection: ChromaDB collection object.
    """
    return client.get_or_create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"}
    )


def add_documents_to_collection(
    collection,
    documents: List[str],
    embeddings: List[List[float]],
    metadatas: List[Dict[str, Any]],
    ids: List[str],
    batch_size: int = 500
) -> None:
    """
    Adds documents, embeddings, and metadata to the collection in batches of specified size.
    Handles batch-level errors gracefully to prevent full ingestion failure.

    Args:
        collection: Target ChromaDB collection.
        documents (List[str]): Original textual content of chunks.
        embeddings (List[List[float]]): Computed vector embeddings.
        metadatas (List[Dict[str, Any]]): Metadata objects associated with each chunk.
        ids (List[str]): Unique string IDs for each document.
        batch_size (int): Batch size for ingestion (default: 500).
    """
    # 1. Validate all input lengths match
    total_items = len(documents)
    if not (len(embeddings) == len(metadatas) == len(ids) == total_items):
        raise ValueError(
            f"Length mismatch: documents ({len(documents)}), embeddings ({len(embeddings)}), "
            f"metadatas ({len(metadatas)}), ids ({len(ids)})."
        )

    if total_items == 0:
        print("[WARNING] No items provided to add to collection.")
        return

    num_batches = (total_items + batch_size - 1) // batch_size
    print(f"[INFO] Ingesting {total_items} items into collection in {num_batches} batches (batch_size={batch_size})...")

    # 2. Process in batches with progress tracking
    batch_indices = list(range(0, total_items, batch_size))
    for batch_num, start_idx in enumerate(tqdm(batch_indices, desc="Ingesting Batches"), start=1):
        end_idx = min(start_idx + batch_size, total_items)

        batch_ids = ids[start_idx:end_idx]
        batch_docs = documents[start_idx:end_idx]
        batch_embs = embeddings[start_idx:end_idx]
        batch_metas = metadatas[start_idx:end_idx]

        try:
            collection.add(
                ids=batch_ids,
                documents=batch_docs,
                embeddings=batch_embs,
                metadatas=batch_metas
            )
            print(f"Batch {batch_num}/{num_batches} added ({len(batch_ids)} items)")
        except Exception as e:
            # Handle error per batch, log and continue
            print(f"[ERROR] Failed to add Batch {batch_num}/{num_batches} (items {start_idx} to {end_idx}): {e}")


def query_similar_chunks(
    collection,
    query_embedding: List[float],
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Queries the collection for the top-k most similar chunks matching the query embedding.

    Args:
        collection: Target ChromaDB collection.
        query_embedding (List[float]): Query embedding vector.
        top_k (int): Number of top results to return (default: 5).

    Returns:
        List[Dict[str, Any]]: Formatted list of result dictionaries:
            [{"document": doc, "metadata": meta, "distance": dist}, ...]
    """
    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )

        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        dists = results.get("distances", [[]])[0]

        return [
            {"document": doc, "metadata": meta, "distance": dist}
            for doc, meta, dist in zip(docs, metas, dists)
        ]
    except Exception as e:
        print(f"[ERROR] Query failed: {e}")
        return []


if __name__ == "__main__":
    print("=" * 60)
    print(" AURA Chatbot - ChromaDB Vector Store Ingestion")
    print("=" * 60)

    # 1. Load precomputed embeddings from JSON
    embeddings_file = _resolve_path(DEFAULT_EMBEDDINGS_FILEPATH)
    print(f"[INFO] Loading precomputed embeddings from: {embeddings_file}")

    if not os.path.exists(embeddings_file):
        print(f"[ERROR] Embeddings file not found: {embeddings_file}")
        print("[INFO] Please run 'embeddings.py' first to generate the embeddings JSON file.")
        exit(1)

    try:
        with open(embeddings_file, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"[ERROR] Failed to read JSON embeddings: {e}")
        exit(1)

    # 2. Extract arrays
    print(f"[INFO] Extracting payload fields from {len(data)} items...")
    ids = [str(item["id"]) for item in data]
    documents = [item["document"] for item in data]
    embeddings = [item["embedding"] for item in data]
    metadatas = [item["metadata"] for item in data]

    # 3. Initialize persistent client and collection
    persist_dir = "./chroma_db"
    print(f"[INFO] Initializing ChromaDB PersistentClient at {persist_dir}...")
    client = get_chroma_client(persist_directory=persist_dir)
    collection = get_or_create_collection(client, name="medical_knowledge")

    # 4. Ingest documents in batches of 500
    add_documents_to_collection(
        collection=collection,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids,
        batch_size=500
    )

    # 5. Output confirmation and verify collection count
    print(f"\nStored {len(ids)} documents in ChromaDB at ./chroma_db")
    print(f"Collection verification count: {collection.count()} documents")
