"""
rag/pipeline.py - Production Medical RAG Orchestration Pipeline for AURA
"""

import time
from typing import Dict, Any, List, Optional
import config
from emergency_keywords import is_emergency, get_emergency_response
from rag.query_processor import QueryProcessor
from rag.hybrid_retriever import get_hybrid_retriever, HybridRetriever
from rag.reranker import get_reranker, CrossEncoderReranker
from rag.context_builder import get_context_builder, ContextBuilder
from rag.generator import get_generator, MedicalGenerator
from rag.verifier import get_grounding_verifier, GroundingVerifier


class MedicalRAGPipeline:
    """
    Unified production-grade RAG pipeline:
    Triage -> Query Analysis -> Dense+BM25 Hybrid -> RRF -> Cross-Encoder -> Context Builder -> Grounded Generation -> Verifier
    """

    def __init__(
        self,
        query_processor: Optional[QueryProcessor] = None,
        hybrid_retriever: Optional[HybridRetriever] = None,
        reranker: Optional[CrossEncoderReranker] = None,
        context_builder: Optional[ContextBuilder] = None,
        generator: Optional[MedicalGenerator] = None,
        verifier: Optional[GroundingVerifier] = None
    ):
        self.qp = query_processor or QueryProcessor()
        self.hybrid = hybrid_retriever or get_hybrid_retriever()
        self.reranker = reranker or get_reranker()
        self.builder = context_builder or get_context_builder()
        self.generator = generator or get_generator()
        self.verifier = verifier or get_grounding_verifier()

    def process_query(self, question: str) -> Dict[str, Any]:
        """
        Processes a clinical or user question through the complete verified RAG pipeline.
        Maintains strict backward compatibility with AURA /chat contract.
        """
        start_time = time.time()
        q_clean = question.strip()

        # ----------------------------------------------------
        # 1. Emergency Detection & Fast Triage (Phase 12)
        # ----------------------------------------------------
        if is_emergency(q_clean):
            if config.RAG_DEBUG:
                print(f"[TRIAGE] Emergency detected for query: '{q_clean}'")
            return get_emergency_response(q_clean)

        # ----------------------------------------------------
        # 2. Query Understanding & Entity Extraction (Phase 3)
        # ----------------------------------------------------
        processed = self.qp.process(q_clean)
        if config.RAG_DEBUG:
            print(f"[DEBUG RAG] Query: '{q_clean}' | Condition: '{processed.condition}' | Intents: {processed.intents}")

        # ----------------------------------------------------
        # 3. Hybrid Retrieval (Dense + BM25 + RRF) (Phase 4)
        # ----------------------------------------------------
        try:
            fused_candidates = self.hybrid.retrieve(
                processed,
                fused_limit=config.FUSED_CANDIDATES
            )
        except Exception as e:
            print(f"[ERROR] Hybrid retrieval failed: {e}")
            fused_candidates = []

        if not fused_candidates:
            return {
                "response": (
                    "I could not retrieve enough verified clinical evidence to answer this question reliably. "
                    "Please consult a qualified healthcare provider.\n\n"
                    "For informational purposes only. Consult a doctor for medical advice."
                ),
                "is_emergency": False,
                "sources": []
            }

        # ----------------------------------------------------
        # 4. Cross-Encoder Reranking (Phase 5)
        # ----------------------------------------------------
        try:
            ranked_passages = self.reranker.rerank(
                q_clean,
                fused_candidates,
                top_k=config.RERANKER_TOP_K
            )
        except Exception as e:
            print(f"[ERROR] Reranking failed: {e}. Falling back to fused candidates.")
            ranked_passages = fused_candidates[:config.RERANKER_TOP_K]

        # ----------------------------------------------------
        # 5. Context Builder & Deduplication (Phase 7)
        # ----------------------------------------------------
        context_str, final_passages = self.builder.build_context(
            ranked_passages,
            max_passages=config.RERANKER_TOP_K
        )

        # ----------------------------------------------------
        # 6. LLM Generation (Phases 8, 9, 10)
        # ----------------------------------------------------
        draft_answer = self.generator.generate(
            query=q_clean,
            context=context_str
        )

        # ----------------------------------------------------
        # 7. Post-Generation Grounding Verification (Phase 11)
        # ----------------------------------------------------
        final_answer = draft_answer
        verification_meta: Dict[str, Any] = {"grounded": True, "confidence": 1.0}

        if config.ENABLE_VERIFIER:
            attempts = 0
            while attempts < config.MAX_REGENERATION_ATTEMPTS:
                attempts += 1
                v_res = self.verifier.verify(
                    query=q_clean,
                    context=context_str,
                    draft_answer=final_answer,
                    passages=final_passages
                )
                verification_meta = {
                    "grounded": v_res.is_grounded,
                    "confidence": v_res.confidence,
                    "violations": v_res.safety_violations,
                    "attempts": attempts
                }

                if v_res.is_grounded:
                    break

                if config.RAG_DEBUG:
                    print(f"[DEBUG RAG] Verification failed (attempt {attempts}): {v_res.safety_violations}. Regenerating...")

                if attempts < config.MAX_REGENERATION_ATTEMPTS:
                    # Stricter regeneration with temperature 0.0
                    final_answer = self.generator.generate(
                        query=q_clean,
                        context=context_str,
                        temperature=0.0
                    )
                else:
                    # Final safety fallback: use conservative verified evidence excerpt
                    if v_res.safety_violations and v_res.conservative_fallback:
                        final_answer = v_res.conservative_fallback
                    break

        elapsed = time.time() - start_time
        if config.RAG_DEBUG:
            print(f"[DEBUG RAG] Total pipeline elapsed: {elapsed:.3f}s")

        # ----------------------------------------------------
        # 8. API Response Formatting (Phase 13)
        # ----------------------------------------------------
        sources = []
        for p in final_passages:
            distance = p.get("distance", 0.0)
            if not isinstance(distance, (int, float)):
                distance = 0.0
            sources.append({
                "source": p.get("source", "MedQuAD"),
                "qtype": p.get("qtype", "general"),
                "question": p.get("question", ""),
                "distance": round(float(distance), 3)
            })

        response_payload = {
            "response": final_answer,
            "is_emergency": False,
            "sources": sources
        }

        if config.RAG_DEBUG:
            response_payload["_debug"] = {
                "elapsed_seconds": round(elapsed, 3),
                "extracted_condition": processed.condition,
                "detected_intents": processed.intents,
                "verification": verification_meta
            }

        return response_payload


# Singleton instance
_pipeline_instance: Optional[MedicalRAGPipeline] = None


def get_pipeline() -> MedicalRAGPipeline:
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = MedicalRAGPipeline()
    return _pipeline_instance
