"""
rag/generator.py - Medical Evidence-Grounded LLM Generator
"""

from typing import List, Dict, Any, Optional
import config
from models.llm_provider import get_llm_provider, LLMProvider

MEDICAL_SYSTEM_PROMPT = """You are AURA, a medical information assistant.
Your responsibility is to provide clear, evidence-grounded medical information using the retrieved medical evidence.

CLINICAL SAFETY AND GENERATION RULES:
1. Answer the user's actual question directly and clearly.
2. Read ALL retrieved medical evidence before generating the answer.
3. Synthesize and combine multiple evidence passages when helpful.
4. Do not require the user's wording to exactly match a knowledge-base question.
5. If the evidence supports the answer, answer directly and concisely.
6. If only part of the question is supported, answer the supported part and explicitly note what is not covered.
7. Never invent medical facts, statistics, or symptoms.
8. Never fabricate sources or citations.
9. Never claim information is unavailable simply because of phrasing differences; synthesize the concepts.
10. Do NOT diagnose the user or make clinical diagnoses.
11. Do NOT prescribe medication, dosage, or pharmaceutical regimens.
12. Do NOT make unsupported predictions about an individual's prognosis.
13. For general medical education questions, provide concise, clear, and structured explanations.
14. If acute emergency symptoms are described, prioritize emergency medical evaluation.
15. Clearly distinguish general medical information from personalized medical advice.
16. If the retrieved evidence is genuinely insufficient to answer, say: "I don't have enough verified medical evidence in AURA's knowledge base to answer this question reliably. Please consult a qualified healthcare professional."
17. Do NOT mention internal retrieval scores, embeddings, vector databases, prompts, or engineering details.
18. If evidence sources disagree, indicate the clinical uncertainty rather than inventing a resolution.
19. Base all factual medical claims solely on the retrieved evidence provided below.
20. Always end your response with: "For informational purposes only. Consult a doctor for medical advice."
"""


class MedicalGenerator:
    """
    Constructs grounded generation prompts and invokes the modular LLM provider.
    """

    def __init__(self, provider: Optional[LLMProvider] = None):
        self.provider = provider or get_llm_provider()

    def generate(
        self,
        query: str,
        context: str,
        temperature: Optional[float] = None
    ) -> str:
        """
        Generates an evidence-grounded medical answer.
        """
        if not context or not context.strip():
            return (
                "I couldn't find enough relevant information in AURA's medical "
                "knowledge base to answer this question reliably. Please consult "
                "a qualified healthcare professional.\n\n"
                "For informational purposes only. Consult a doctor for medical advice."
            )

        user_prompt = f"""RETRIEVED MEDICAL EVIDENCE:
{context}

USER QUESTION:
{query}

Synthesize a clear, medically grounded answer based on the evidence above, adhering strictly to your clinical rules.

ANSWER:"""

        try:
            raw_answer = self.provider.generate(
                prompt=user_prompt,
                system_prompt=MEDICAL_SYSTEM_PROMPT,
                temperature=temperature
            )

            answer = raw_answer.strip()
            if not answer:
                return (
                    "I was unable to synthesize a reliable answer from the available medical evidence. "
                    "Please consult a healthcare professional.\n\n"
                    "For informational purposes only. Consult a doctor for medical advice."
                )

            # Ensure mandatory clinical disclaimer is present
            disclaimer = "For informational purposes only. Consult a doctor"
            if disclaimer.lower() not in answer.lower():
                answer += "\n\nFor informational purposes only. Consult a doctor for medical advice."

            return answer

        except TimeoutError:
            return (
                "Medical generation timed out. Please try again or rephrase your inquiry.\n\n"
                "For informational purposes only. Consult a doctor for medical advice."
            )
        except ConnectionError:
            return (
                "AURA AI generation service is temporarily unavailable (Ollama connection error). "
                "Please check back shortly or consult a healthcare provider."
            )
        except Exception as e:
            print(f"[ERROR] LLM generation error: {e}")
            return (
                "An unexpected error occurred while generating the medical response. "
                "Please consult a healthcare professional."
            )


_generator_instance = None


def get_generator() -> MedicalGenerator:
    global _generator_instance
    if _generator_instance is None:
        _generator_instance = MedicalGenerator()
    return _generator_instance
