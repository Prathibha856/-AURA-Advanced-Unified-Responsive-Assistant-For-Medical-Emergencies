"""
embeddings.py - Medical Embedding Pipeline for AURA Chatbot

Handles:
1. Loading the MedQuAD dataset from a local JSON file (knowledge_base/medical_qa.json).
2. Combining Question and Answer pairs into a structured single text format.
3. Generating normalized medical embeddings using 'microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract'.
4. Saving structured embeddings, documents, and metadata into JSON for ChromaDB.
"""

import os
import json
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer

# Default model and file paths
EMBEDDING_MODEL_NAME = "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract"
DEFAULT_INPUT_FILEPATH = "knowledge_base/medical_qa.json"
DEFAULT_OUTPUT_FILEPATH = "knowledge_base/medquad_embeddings.json"


def _resolve_path(filepath: str) -> str:
    """
    Helper function to resolve relative paths against both the current
    working directory and the script's local directory.
    """
    if os.path.isabs(filepath):
        return os.path.normpath(filepath)
    if os.path.exists(filepath):
        return os.path.normpath(filepath)

    # Fallback: check relative to this file's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    alt_path = os.path.join(script_dir, filepath)
    if os.path.exists(alt_path):
        return os.path.normpath(alt_path)

    # If neither exists yet, return path relative to script_dir for write safety
    return os.path.normpath(alt_path)


def load_medquad_dataset(filepath: str = DEFAULT_INPUT_FILEPATH) -> List[Dict[str, Any]]:
    """
    Load knowledge_base/medical_qa.json and extract medical QA pairs.

    Args:
        filepath (str): Path to the medical QA JSON dataset.

    Returns:
        List[Dict[str, Any]]: List of dicts with standardized keys:
                              'question', 'answer', and 'qtype'.
    """
    resolved_path = _resolve_path(filepath)

    if not os.path.exists(resolved_path):
        print(f"[ERROR] File not found: {resolved_path}")
        print(f"[INFO] Please ensure '{filepath}' exists before generating embeddings.")
        return []

    try:
        with open(resolved_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        records: List[Dict[str, Any]] = []

        # Handle data if enclosed in an envelope dictionary
        if isinstance(data, dict):
            for key in ["data", "records", "questions", "qa_pairs"]:
                if key in data and isinstance(data[key], list):
                    data = data[key]
                    break
            else:
                data = list(data.values())

        if not isinstance(data, list):
            print(f"[ERROR] Unexpected JSON format in {resolved_path}. Expected a list of QA objects.")
            return []

        for item in data:
            if not isinstance(item, dict):
                continue

            # Standardize key names (supports lowercase and capitalized variants)
            question = (
                item.get("question")
                or item.get("Question")
                or item.get("prompt")
                or ""
            )
            answer = (
                item.get("answer")
                or item.get("Answer")
                or item.get("response")
                or ""
            )
            qtype = (
                item.get("qtype")
                or item.get("question_type")
                or item.get("type")
                or item.get("category")
                or "general"
            )

            # Retain non-empty questions or answers
            if str(question).strip() or str(answer).strip():
                records.append({
                    "question": str(question).strip(),
                    "answer": str(answer).strip(),
                    "qtype": str(qtype).strip()
                })

        print(f"[INFO] Successfully loaded {len(records)} QA records from {resolved_path}")
        return records

    except json.JSONDecodeError as jde:
        print(f"[ERROR] Failed to parse JSON in {resolved_path}: {jde}")
        return []
    except Exception as e:
        print(f"[ERROR] An unexpected error occurred while loading {resolved_path}: {e}")
        return []


def combine_qa_pairs(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    For each record, create a combined text:
        "Question: {question}\\nAnswer: {answer}"
    and pair it with metadata.

    Args:
        records (List[Dict[str, Any]]): List of standardized QA dicts.

    Returns:
        List[Dict[str, Any]]: List of dicts in format:
                              [{"text": ..., "metadata": {"qtype": ..., "source": "MedQuAD"}}]
    """
    combined: List[Dict[str, Any]] = []

    try:
        for record in records:
            question = record.get("question", "").strip()
            answer = record.get("answer", "").strip()
            qtype = record.get("qtype", "general")

            combined_text = f"Question: {question}\nAnswer: {answer}"
            metadata = {
                "qtype": qtype,
                "source": "MedQuAD"
            }

            combined.append({
                "text": combined_text,
                "metadata": metadata
            })

        print(f"[INFO] Combined {len(combined)} QA pairs into structured documents.")
        return combined

    except Exception as e:
        print(f"[ERROR] Failed to combine QA pairs: {e}")
        return []


def generate_embeddings(
    texts: List[str],
    model_name: str = EMBEDDING_MODEL_NAME,
    batch_size: int = 32
) -> List[List[float]]:
    """
    Load SentenceTransformer and encode texts in batches using normalized embeddings.

    Args:
        texts (List[str]): List of prepared document texts.
        model_name (str): SentenceTransformer model identifier (default: PubMedBERT).
        batch_size (int): Processing batch size for inference.

    Returns:
        List[List[float]]: List of embedding vectors as Python float lists.
    """
    if not texts:
        print("[WARNING] No texts provided for embedding generation.")
        return []

    try:
        print(f"[INFO] Loading SentenceTransformer model: '{model_name}'...")
        model = SentenceTransformer(model_name)

        print(f"[INFO] Generating embeddings for {len(texts)} texts (batch_size={batch_size}, normalize_embeddings=True)...")
        embeddings = model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=True,
            normalize_embeddings=True
        )

        # Convert numpy array to Python list of floats
        if hasattr(embeddings, "tolist"):
            embeddings = embeddings.tolist()

        return embeddings

    except Exception as e:
        print(f"[ERROR] Failed to generate embeddings with model '{model_name}': {e}")
        return []


def save_embeddings_to_json(
    embeddings: List[List[float]],
    documents: List[str],
    metadatas: List[Dict[str, Any]],
    output_filepath: str = DEFAULT_OUTPUT_FILEPATH
) -> None:
    """
    Structure payload as [{"id": idx, "document": doc, "embedding": emb, "metadata": meta}]
    and save to output JSON file.

    Args:
        embeddings (List[List[float]]): Computed vector embeddings.
        documents (List[str]): Formatted text documents.
        metadatas (List[Dict[str, Any]]): Metadata objects per document.
        output_filepath (str): Filepath where JSON output will be saved.
    """
    if not (len(embeddings) == len(documents) == len(metadatas)):
        print(
            f"[ERROR] Length mismatch: embeddings ({len(embeddings)}), "
            f"documents ({len(documents)}), metadatas ({len(metadatas)})."
        )
        return

    resolved_output = _resolve_path(output_filepath)

    try:
        # Ensure parent directory exists
        target_dir = os.path.dirname(os.path.abspath(resolved_output))
        os.makedirs(target_dir, exist_ok=True)

        total = len(documents)
        print(f"[INFO] Structuring payload for {total} items...")

        payload = [
            {
                "id": idx,
                "document": documents[idx],
                "embedding": embeddings[idx],
                "metadata": metadatas[idx]
            }
            for idx in range(total)
        ]

        print(f"[INFO] Writing JSON payload to {resolved_output}...")
        with open(resolved_output, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)

        print(f"[SUCCESS] Saved {len(payload)} embeddings to {resolved_output}")

    except Exception as e:
        print(f"[ERROR] Failed to save embeddings to JSON ({resolved_output}): {e}")


if __name__ == "__main__":
    print("=" * 60)
    print(" AURA Chatbot - MedQuAD Embeddings Generation Pipeline")
    print("=" * 60)

    # 1. Load MedQuAD from JSON
    records = load_medquad_dataset("knowledge_base/medical_qa.json")

    if not records:
        print("[NOTICE] No records found. Please ensure 'knowledge_base/medical_qa.json' is present.")
    else:
        # 2. Combine QA pairs
        combined_items = combine_qa_pairs(records)

        documents = [item["text"] for item in combined_items]
        metadatas = [item["metadata"] for item in combined_items]

        # 3. Generate embeddings
        embeddings = generate_embeddings(
            texts=documents,
            model_name=EMBEDDING_MODEL_NAME,
            batch_size=32
        )

        if embeddings:
            # 4. Save to JSON
            save_embeddings_to_json(
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas,
                output_filepath="knowledge_base/medquad_embeddings.json"
            )

            # 5. Print completion summary
            print(f"\nGenerated {len(embeddings)} embeddings for {len(documents)} documents")
        else:
            print("[ERROR] Embeddings generation failed or returned empty vectors.")
