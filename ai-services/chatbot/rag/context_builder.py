"""
rag/context_builder.py - Evidence Deduplication, Diversity, and Prompt Context Construction
"""

import re
from typing import List, Dict, Any, Tuple
import config


class ContextBuilder:
    """
    Cleans, deduplicates, enforces category diversity, and structures retrieved
    evidence passages into a high-density clinical context prompt.
    """

    @staticmethod
    def _normalize_text_for_hash(text: str) -> str:
        """Normalizes text for fuzzy deduplication."""
        return re.sub(r"\W+", "", text.lower())[:120]

    def build_context(
        self,
        passages: List[Dict[str, Any]],
        max_passages: int = config.RERANKER_TOP_K,
        max_chars: int = 4000
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Deduplicates passages, preserves category diversity, limits length,
        and formats clean evidence blocks.

        Returns:
            Tuple[str, List[Dict[str, Any]]]:
                (formatted_context_string, list_of_selected_passages)
        """
        if not passages:
            return "", []

        selected: List[Dict[str, Any]] = []
        seen_hashes = set()
        seen_answers = set()
        categories_count: Dict[str, int] = {}

        # 1. Deduplication and diversity filtering
        for item in passages:
            if len(selected) >= max_passages:
                break

            q = item.get("question", "").strip()
            a = item.get("answer", "").strip()
            qtype = str(item.get("qtype", "general")).lower()

            if not a:
                continue

            # Check question hash duplicate
            q_hash = self._normalize_text_for_hash(q)
            a_hash = self._normalize_text_for_hash(a)

            if q_hash in seen_hashes or a_hash in seen_answers:
                continue

            # Diversity heuristic: avoid more than 3 passages of the exact same category
            # unless we don't have enough candidates
            if categories_count.get(qtype, 0) >= 3 and len(selected) >= 3:
                continue

            seen_hashes.add(q_hash)
            seen_answers.add(a_hash)
            categories_count[qtype] = categories_count.get(qtype, 0) + 1
            selected.append(item)

        # If diversity was too strict and we have fewer than 3 passages, backfill
        if len(selected) < min(3, len(passages)):
            for item in passages:
                if len(selected) >= max_passages:
                    break
                if item not in selected:
                    selected.append(item)

        # 2. Build structured evidence string
        context_blocks = []
        current_len = 0

        for i, item in enumerate(selected, start=1):
            category = item.get("qtype", "general")
            source = item.get("source", "MedQuAD")
            q = item.get("question", "").strip()
            a = item.get("answer", "").strip()

            block = (
                f"EVIDENCE {i}\n"
                f"Category: {category}\n"
                f"Source: {source}\n"
                f"Question: {q}\n"
                f"Answer: {a}\n"
            )

            # Prevent exceeding context window
            if current_len + len(block) > max_chars and i > 2:
                break

            context_blocks.append(block)
            current_len += len(block)

        formatted_context = "\n".join(context_blocks).strip()
        return formatted_context, selected[:len(context_blocks)]


_context_builder_instance = None


def get_context_builder() -> ContextBuilder:
    global _context_builder_instance
    if _context_builder_instance is None:
        _context_builder_instance = ContextBuilder()
    return _context_builder_instance
