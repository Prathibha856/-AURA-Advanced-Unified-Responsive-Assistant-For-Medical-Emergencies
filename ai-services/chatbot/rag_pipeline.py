"""
rag_pipeline.py - Retrieval-Augmented Generation & Clinical Triage Engine for AURA

Combines:
1. Fast Emergency Keyword Triage (chest pain, dyspnea, stroke, overdose, etc.)
2. Clinical Knowledge Base Retrieval from knowledge_base.json
3. Context assembly with clinical guidelines (WHO, ATA, CDC)
4. LLM synthesis (Ollama Gemma:2b with resilient fallback to deterministic clinical RAG)
"""

import os
import sys
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import requests

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

# Import emergency detection
try:
    from emergency_keywords import is_emergency, get_emergency_response
except ImportError:
    # Inline fallback if executed from different root
    EMERGENCY_WORDS = [
        "chest pain", "difficulty breathing", "unconscious", "stroke",
        "heart attack", "overdose", "severe bleeding", "emergency", "suicide"
    ]
    def is_emergency(q: str) -> bool:
        return any(w in q.lower() for w in EMERGENCY_WORDS)
    def get_emergency_response(q: str = "") -> Dict[str, Any]:
        return {
            "response": "🚨 CRITICAL: This sounds like a medical emergency. Call 112/108 immediately. Use AURA's SOS button.",
            "is_emergency": True,
            "sources": [],
            "helplines": ["112", "108", "911"]
        }

KB_PATH = CURRENT_DIR / "knowledge_base.json"
OLLAMA_URL = os.environ.get("AURA_OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.environ.get("AURA_OLLAMA_MODEL", "gemma:2b")


class MedicalRAGPipeline:
    """
    Orchestrates clinical triage, knowledge retrieval, and safe response generation.
    """
    def __init__(self, kb_path: Path = KB_PATH):
        self.kb_path = kb_path
        self.kb_data = self._load_knowledge_base()

    def _load_knowledge_base(self) -> Dict[str, Any]:
        if not self.kb_path.exists():
            return {"diseases": []}
        try:
            with open(self.kb_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[-] Warning: Failed to load knowledge_base.json: {e}")
            return {"diseases": []}

    def retrieve_relevant_contexts(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        """
        Retrieves matching disease entries based on query token relevance.
        """
        q_tokens = set(query.lower().replace("?", "").replace(",", "").split())
        scored_entries = []

        for disease in self.kb_data.get("diseases", []):
            score = 0
            # Match disease name
            d_name_tokens = set(disease.get("name", "").lower().split())
            score += len(q_tokens.intersection(d_name_tokens)) * 4

            # Match symptoms
            for s in disease.get("common_symptoms", []):
                s_tokens = set(s.lower().split())
                score += len(q_tokens.intersection(s_tokens)) * 2

            # Match thresholds & clinical notes
            thresh_str = str(disease.get("clinical_thresholds", {})).lower()
            if any(t in thresh_str for t in q_tokens if len(t) > 3):
                score += 2

            if score > 0:
                scored_entries.append((score, disease))

        scored_entries.sort(key=lambda x: x[0], reverse=True)
        return [entry[1] for entry in scored_entries[:top_k]]

    def query_ollama_llm(self, prompt: str) -> Optional[str]:
        """
        Sends prompt to local Ollama LLM endpoint if online.
        """
        try:
            payload = {
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.2,
                    "top_p": 0.9
                }
            }
            res = requests.post(OLLAMA_URL, json=payload, timeout=5)
            if res.status_code == 200:
                data = res.json()
                return data.get("response", "").strip()
        except Exception:
            pass  # Fall through gracefully to deterministic clinical synthesizer
        return None

    def synthesize_clinical_response(self, query: str, contexts: List[Dict[str, Any]]) -> str:
        """
        Synthesizes structured clinical answer from retrieved knowledge base contexts.
        """
        if not contexts:
            return (
                "I am here to assist with clinical risk awareness and guidance for thyroid "
                "disorders (Hypo/Hyperthyroidism) and nutritional deficiencies (Iron Deficiency "
                "Anemia, Vitamin B12, Folate, and Vitamin D). Please describe your symptoms or lab "
                "values (such as TSH, Hemoglobin, MCV, or 25(OH)D).\n\n"
                "⚠️ *Clinical Disclaimer: AURA provides informational triage guidance only and does not replace medical consultation.*"
            )

        lines = []
        for ctx in contexts:
            lines.append(f"### {ctx.get('name')} ({ctx.get('category')})")
            lines.append(f"**Clinical Definition:** {ctx.get('definition')}")
            
            # Diagnostic thresholds
            thresh = ctx.get("clinical_thresholds", {})
            src = thresh.get("source", "Standard Guidelines")
            t_details = [f"{k.upper()}: {v}" for k, v in thresh.items() if k not in ["source", "clinical_note"]]
            lines.append(f"**Diagnostic Reference ({src}):** {', '.join(t_details)}")
            
            # Symptoms
            symps = ctx.get("common_symptoms", [])[:4]
            lines.append(f"**Characteristic Symptoms:** {'; '.join(symps)}")
            
            # Management
            mgmt = ctx.get("clinical_management", [])[:2]
            lines.append(f"**Intervention Strategies:** {'; '.join(mgmt)}")
            
            # Red flags
            red = ctx.get("emergency_red_flags", [])
            if red:
                lines.append(f"⚠️ **Red Flags:** {red[0]}")
            lines.append("")

        lines.append("---")
        lines.append("*AURA Clinical Disclaimer: Model estimates and knowledge base summaries are for clinical decision support and patient education only.*")
        return "\n\n".join(lines)

    def process_query(self, user_query: str) -> Dict[str, Any]:
        """
        Main entry point for Chatbot inquiries.
        """
        # Step 1: Emergency Triage Check
        if is_emergency(user_query):
            return get_emergency_response(user_query)

        # Step 2: Context Retrieval
        matched_contexts = self.retrieve_relevant_contexts(user_query, top_k=2)

        # Step 3: LLM prompt assembly
        sources = [{"disease": c.get("name"), "icd10": c.get("icd10")} for c in matched_contexts]
        
        context_str = json.dumps(matched_contexts, indent=2)
        llm_prompt = (
            f"You are AURA, an expert clinical triage assistant. Answer the user's question accurately using ONLY the clinical evidence provided below.\n"
            f"Never claim to diagnose; always frame answers as clinical risk education.\n\n"
            f"CLINICAL EVIDENCE:\n{context_str}\n\n"
            f"USER QUERY: {user_query}\n\n"
            f"RESPONSE:"
        )

        llm_response = self.query_ollama_llm(llm_prompt)
        if not llm_response:
            llm_response = self.synthesize_clinical_response(user_query, matched_contexts)

        return {
            "response": llm_response,
            "is_emergency": False,
            "sources": sources
        }


# Global pipeline instance
rag_pipeline = MedicalRAGPipeline()


def chat_rag(question: str) -> Dict[str, Any]:
    """Exposed functional interface for API routers."""
    return rag_pipeline.process_query(question)


if __name__ == "__main__":
    test_queries = [
        "I have severe chest pain and cannot breathe",
        "What are the symptoms and TSH levels for hypothyroidism?",
        "My hemoglobin is 10.5 and MCV is 72, do I have anemia?"
    ]
    for q in test_queries:
        print(f"\n[QUERY] {q}")
        res = chat_rag(q)
        print(f"Emergency: {res['is_emergency']}")
        print(f"Response:\n{res['response'][:300]}...")
