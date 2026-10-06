"""
evaluation/evaluate_retrieval.py - Quantitative Retrieval Evaluation Benchmark
Measures Recall@5, Recall@10, Recall@20, and MRR across 30+ multi-category medical queries.
"""

import sys
import os
import time
import json
from typing import List, Dict, Any

# Ensure chatbot root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from rag.query_processor import QueryProcessor
from rag.hybrid_retriever import get_hybrid_retriever
from rag.reranker import get_reranker

# Test benchmark dataset containing 32 clinical queries across 10 categories
EVALUATION_DATASET: List[Dict[str, Any]] = [
    # 1. Symptoms
    {"query": "What are the symptoms of anemia?", "condition": "anemia", "category": "symptoms"},
    {"query": "What signs indicate heart failure?", "condition": "heart failure", "category": "symptoms"},
    {"query": "How does pneumonia present in patients?", "condition": "pneumonia", "category": "symptoms"},
    {"query": "What are the common symptoms of asthma?", "condition": "asthma", "category": "symptoms"},

    # 2. Causes
    {"query": "What causes diabetes?", "condition": "diabetes", "category": "causes"},
    {"query": "What are the triggers for migraine headaches?", "condition": "migraine", "category": "causes"},
    {"query": "Why do gastric ulcers develop?", "condition": "ulcer", "category": "causes"},
    {"query": "What causes celiac disease?", "condition": "celiac", "category": "causes"},

    # 3. Treatment
    {"query": "How is asthma treated?", "condition": "asthma", "category": "treatment"},
    {"query": "What is the treatment for hypertension?", "condition": "hypertension", "category": "treatment"},
    {"query": "How do doctors manage osteoporosis?", "condition": "osteoporosis", "category": "treatment"},
    {"query": "What are the treatments for glaucoma?", "condition": "glaucoma", "category": "treatment"},

    # 4. Exams and Tests / Diagnosis
    {"query": "What tests are used to diagnose anemia?", "condition": "anemia", "category": "exams and tests"},
    {"query": "How is tuberculosis diagnosed?", "condition": "tuberculosis", "category": "exams and tests"},
    {"query": "What screening tests detect colorectal cancer?", "condition": "colorectal", "category": "exams and tests"},
    {"query": "How do clinicians test for cystic fibrosis?", "condition": "cystic fibrosis", "category": "exams and tests"},

    # 5. Prevention
    {"query": "How to prevent Lyme disease?", "condition": "lyme", "category": "prevention"},
    {"query": "Can stroke be prevented with lifestyle changes?", "condition": "stroke", "category": "prevention"},
    {"query": "How can people prevent kidney stones?", "condition": "kidney stones", "category": "prevention"},
    {"query": "How to prevent iron deficiency in children?", "condition": "iron deficiency", "category": "prevention"},

    # 6. Complications
    {"query": "What are the complications of diabetes?", "condition": "diabetes", "category": "complications"},
    {"query": "What long-term risks are associated with chronic kidney disease?", "condition": "kidney disease", "category": "complications"},
    {"query": "What are the complications of untreated hypertension?", "condition": "hypertension", "category": "complications"},

    # 7. Inheritance / Genetics
    {"query": "Is sickle cell disease inherited?", "condition": "sickle cell", "category": "inheritance"},
    {"query": "How is Huntington disease passed down through families?", "condition": "huntington", "category": "inheritance"},
    {"query": "What genetic changes cause Marfan syndrome?", "condition": "marfan", "category": "inheritance"},

    # 8. Susceptibility / Risk Factors
    {"query": "What are the risk factors for hypertension?", "condition": "hypertension", "category": "susceptibility"},
    {"query": "Who is at risk for Lymphocytic Choriomeningitis?", "condition": "lymphocytic choriomeningitis", "category": "susceptibility"},
    {"query": "Who is most vulnerable to osteoporosis?", "condition": "osteoporosis", "category": "susceptibility"},

    # 9. Prognosis / Outlook
    {"query": "What is the prognosis for multiple sclerosis?", "condition": "multiple sclerosis", "category": "outlook"},
    {"query": "What is the life expectancy for amyotrophic lateral sclerosis?", "condition": "amyotrophic lateral sclerosis", "category": "outlook"},

    # 10. General Information
    {"query": "What is iron deficiency anemia?", "condition": "anemia", "category": "information"},
    {"query": "Can you explain what Barrett esophagus is?", "condition": "barrett", "category": "information"}
]


def is_relevant(doc: Dict[str, Any], target_condition: str, target_category: str) -> bool:
    """Evaluates whether a candidate document is relevant to the query criteria."""
    question = doc.get("question", "").lower()
    answer = doc.get("answer", "").lower()
    qtype = doc.get("qtype", "").lower()

    # Condition terms check
    cond_words = [w for w in target_condition.lower().split() if len(w) > 2]
    cond_match = any(w in question or w in answer for w in cond_words)

    # Category match check (relaxed)
    cat_match = (
        target_category.lower() in qtype or
        any(w in question for w in target_category.split()) or
        any(w in answer for w in target_category.split())
    )

    return cond_match and cat_match


def run_retrieval_evaluation():
    qp = QueryProcessor()
    hr = get_hybrid_retriever()
    reranker = get_reranker()

    print("=" * 80)
    print(f" AURA RETRIEVAL EVALUATION BENCHMARK ({len(EVALUATION_DATASET)} Medical Queries)")
    print("=" * 80)

    total_queries = len(EVALUATION_DATASET)
    hybrid_hits_at_5 = 0
    hybrid_hits_at_10 = 0
    hybrid_hits_at_20 = 0
    hybrid_rr_sum = 0.0

    rerank_hits_at_5 = 0
    rerank_rr_sum = 0.0

    detailed_results = []

    for i, item in enumerate(EVALUATION_DATASET, start=1):
        q = item["query"]
        cond = item["condition"]
        cat = item["category"]

        processed = qp.process(q)
        fused_candidates = hr.retrieve(processed, fused_limit=30)
        reranked_candidates = reranker.rerank(q, fused_candidates, top_k=6)

        # 1. Evaluate Hybrid RRF retrieval
        hybrid_rank = None
        for rank, c in enumerate(fused_candidates[:20], start=1):
            if is_relevant(c, cond, cat):
                hybrid_rank = rank
                break

        if hybrid_rank is not None:
            if hybrid_rank <= 5:
                hybrid_hits_at_5 += 1
            if hybrid_rank <= 10:
                hybrid_hits_at_10 += 1
            if hybrid_rank <= 20:
                hybrid_hits_at_20 += 1
            hybrid_rr_sum += 1.0 / hybrid_rank

        # 2. Evaluate Reranker top-5
        rerank_rank = None
        for rank, c in enumerate(reranked_candidates[:5], start=1):
            if is_relevant(c, cond, cat):
                rerank_rank = rank
                break

        if rerank_rank is not None:
            rerank_hits_at_5 += 1
            rerank_rr_sum += 1.0 / rerank_rank

        h_status = f"Rank {hybrid_rank}" if hybrid_rank else "Miss"
        r_status = f"Rank {rerank_rank}" if rerank_rank else "Miss"

        print(f"[{i:02d}/{total_queries:02d}] {q[:50]:<50} | Hybrid: {h_status:<8} | Rerank: {r_status}")

        detailed_results.append({
            "query": q,
            "condition": cond,
            "category": cat,
            "hybrid_rank": hybrid_rank,
            "rerank_rank": rerank_rank,
            "top_retrieved": [c.get("question", "")[:60] for c in reranked_candidates[:3]]
        })

    # Metrics computation
    hybrid_recall_5 = (hybrid_hits_at_5 / total_queries) * 100.0
    hybrid_recall_10 = (hybrid_hits_at_10 / total_queries) * 100.0
    hybrid_recall_20 = (hybrid_hits_at_20 / total_queries) * 100.0
    hybrid_mrr = hybrid_rr_sum / total_queries

    rerank_recall_5 = (rerank_hits_at_5 / total_queries) * 100.0
    rerank_mrr = rerank_rr_sum / total_queries

    print("\n" + "=" * 80)
    print(" RETRIEVAL EVALUATION RESULTS")
    print("=" * 80)
    print(f"Total Evaluated Queries: {total_queries}")
    print("\n--- HYBRID RETRIEVAL (Dense + BM25 + RRF) ---")
    print(f"Recall@5:  {hybrid_recall_5:.1f}% ({hybrid_hits_at_5}/{total_queries})")
    print(f"Recall@10: {hybrid_recall_10:.1f}% ({hybrid_hits_at_10}/{total_queries})")
    print(f"Recall@20: {hybrid_recall_20:.1f}% ({hybrid_hits_at_20}/{total_queries})")
    print(f"MRR:       {hybrid_mrr:.4f}")

    print("\n--- CROSS-ENCODER RERANKER (Top-5) ---")
    print(f"Recall@5:  {rerank_recall_5:.1f}% ({rerank_hits_at_5}/{total_queries})")
    print(f"MRR:       {rerank_mrr:.4f}")
    print("=" * 80)

    # Save benchmark report to JSON
    report_file = os.path.join(os.path.dirname(__file__), "retrieval_benchmark_results.json")
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_queries": total_queries,
            "metrics": {
                "hybrid_recall_at_5": round(hybrid_recall_5, 2),
                "hybrid_recall_at_10": round(hybrid_recall_10, 2),
                "hybrid_recall_at_20": round(hybrid_recall_20, 2),
                "hybrid_mrr": round(hybrid_mrr, 4),
                "rerank_recall_at_5": round(rerank_recall_5, 2),
                "rerank_mrr": round(rerank_mrr, 4)
            },
            "detailed_results": detailed_results
        }, f, indent=2)

    print(f"\n[INFO] Detailed benchmark report saved to {report_file}")
    return hybrid_recall_20, rerank_recall_5


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    run_retrieval_evaluation()
