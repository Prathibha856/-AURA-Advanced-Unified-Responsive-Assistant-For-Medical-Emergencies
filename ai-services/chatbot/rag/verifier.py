"""
rag/verifier.py - Post-Generation Clinical Grounding & Hallucination Verifier
"""

import re
from dataclasses import dataclass, field
from typing import List, Dict, Any, Tuple
import config


@dataclass
class VerificationResult:
    is_grounded: bool
    confidence: float
    unsupported_claims: List[str] = field(default_factory=list)
    safety_violations: List[str] = field(default_factory=list)
    should_regenerate: bool = False
    conservative_fallback: str = ""


# Diagnostic assertion phrases that violate safety guidelines
DIAGNOSTIC_ASSERTIONS = [
    r"\byou have\b",
    r"\byou are suffering from\b",
    r"\bi diagnose you\b",
    r"\bmy diagnosis is\b",
    r"\byour condition is definitively\b"
]

# Prescription / dosage patterns (e.g., "take 500 mg", "take 2 tablets")
PRESCRIPTION_PATTERNS = [
    r"\btake \d+\s*(?:mg|milligram|tablets?|pills?|capsules?|ml)\b",
    r"\bprescribe \d+\b",
    r"\bdose of \d+\s*(?:mg|ml|units)\b"
]


class GroundingVerifier:
    """
    Evaluates whether an LLM draft answer adheres to medical safety rules,
    avoids hallucinations, and is supported by the retrieved context.
    """

    def verify(
        self,
        query: str,
        context: str,
        draft_answer: str,
        passages: List[Dict[str, Any]]
    ) -> VerificationResult:
        if not draft_answer:
            return VerificationResult(
                is_grounded=False,
                confidence=0.0,
                safety_violations=["Empty generation"],
                should_regenerate=True
            )

        draft_lower = draft_answer.lower()
        context_lower = context.lower()

        violations: List[str] = []
        unsupported_claims: List[str] = []

        # 1. Safety Check: Disallowed Direct Diagnosis
        for pattern in DIAGNOSTIC_ASSERTIONS:
            if re.search(pattern, draft_lower):
                violations.append(f"Direct diagnosis pattern detected: '{pattern}'")

        # 2. Safety Check: Unsupported Medication / Dosage Advice
        for pattern in PRESCRIPTION_PATTERNS:
            match = re.search(pattern, draft_lower)
            if match:
                prescribed_snippet = match.group(0)
                # If this specific dosage doesn't exist in the verified context, flag it
                if prescribed_snippet not in context_lower:
                    violations.append(f"Unsupported specific medication/dosage instruction: '{prescribed_snippet}'")

        # 3. Evidence Grounding & Overlap Check
        # Extract meaningful noun/content words (length > 3, letters only)
        answer_words = set(re.findall(r"\b[a-zA-Z]{4,}\b", draft_lower))
        context_words = set(re.findall(r"\b[a-zA-Z]{4,}\b", context_lower))

        # Words to ignore for medical grounding overlap
        common_words = {
            "information", "medical", "doctor", "consult", "purposes", "healthcare",
            "professional", "please", "about", "these", "their", "there", "which",
            "include", "including", "always", "common", "people", "person", "provide",
            "condition", "symptoms", "causes", "treatment", "general", "evidence"
        }
        test_words = answer_words - common_words

        if test_words:
            overlap = test_words.intersection(context_words)
            grounding_ratio = len(overlap) / len(test_words)
        else:
            grounding_ratio = 1.0

        confidence = round(grounding_ratio, 2)

        # 4. Check for False Refusal
        # If the LLM refused saying "no information" but context clearly had answers
        false_refusal = False
        refusal_phrases = ["i don't have enough", "does not provide any information", "couldn't find enough"]
        if any(rp in draft_lower for rp in refusal_phrases):
            # Check if query condition words are actually covered in context
            query_content = set(re.findall(r"\b[a-zA-Z]{4,}\b", query.lower())) - common_words
            if query_content and query_content.issubset(context_words):
                false_refusal = True
                violations.append("False refusal: model claimed missing context despite relevant passages")

        # 5. Build conservative fallback answer in case of critical violation
        conservative_fallback = ""
        if passages:
            top_passage = passages[0]
            q = top_passage.get("question", "")
            a = top_passage.get("answer", "")
            category = top_passage.get("qtype", "Medical Information")
            conservative_fallback = (
                f"Based on verified {category} records from MedQuAD:\n\n"
                f"{a}\n\n"
                f"For informational purposes only. Consult a doctor for medical advice."
            )

        is_grounded = (len(violations) == 0) and (confidence >= 0.40) and not false_refusal
        should_regenerate = not is_grounded

        if config.RAG_DEBUG:
            print(f"[DEBUG VERIFIER] Grounded={is_grounded} | Confidence={confidence} | Violations={violations}")

        return VerificationResult(
            is_grounded=is_grounded,
            confidence=confidence,
            unsupported_claims=unsupported_claims,
            safety_violations=violations,
            should_regenerate=should_regenerate,
            conservative_fallback=conservative_fallback
        )


_verifier_instance = None


def get_grounding_verifier() -> GroundingVerifier:
    global _verifier_instance
    if _verifier_instance is None:
        _verifier_instance = GroundingVerifier()
    return _verifier_instance
