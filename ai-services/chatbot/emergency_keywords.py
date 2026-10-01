"""
emergency_keywords.py - Critical Condition Detection & Fast Triage for AURA Chatbot

Identifies acute, life-threatening symptoms and phrases requiring immediate
emergency escalation rather than normal RAG generation.
"""

from typing import List, Dict, Any

# Primary list of emergency keywords and acute medical phrases
EMERGENCY_KEYWORDS: List[str] = [
    "chest pain",
    "overdose",
    "suicide",
    "suicidal",
    "difficulty breathing",
    "can't breathe",
    "not breathing",
    "severe bleeding",
    "bleeding heavily",
    "heart attack",
    "stroke",
    "unconscious",
    "seizure",
    "severe pain",
    "poisoning",
    "burn",
    "fracture",
    "emergency"
]


def is_emergency(question: str) -> bool:
    """
    Evaluates whether the user's input contains critical emergency keywords
    warranting immediate dispatch or SOS escalation.

    Args:
        question (str): The raw inquiry or symptom description entered by the user.

    Returns:
        bool: True if any emergency keyword is found as a substring, False otherwise.
    """
    if not question:
        return False

    normalized_question = question.lower().strip()
    return any(keyword in normalized_question for keyword in EMERGENCY_KEYWORDS)


def get_emergency_response(question: str = "") -> Dict[str, Any]:
    """
    Returns an immediate emergency guidance payload with national helpline numbers
    and instructions to trigger AURA SOS telemetry.

    Args:
        question (str, optional): The user's input inquiry.

    Returns:
        Dict[str, Any]: Structured emergency response dictionary.
    """
    return {
        "response": "🚨 CRITICAL: This sounds like an emergency. Call 112/108 immediately. Use AURA's SOS button.",
        "is_emergency": True,
        "sources": [],
        "helplines": ["112", "108", "911"]
    }


if __name__ == "__main__":
    import sys
    # Ensure Windows console encoding handles UTF-8 emoji output cleanly
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    print("=" * 60)
    print(" AURA Chatbot - Emergency Keywords Triage Test")
    print("=" * 60)

    test_queries = [
        "I am having severe chest pain on my left side",
        "What are the symptoms of high blood pressure?",
        "Help, my friend is unconscious and not breathing",
        "How can I manage diabetes with diet?",
        "I took an overdose of pills"
    ]

    for q in test_queries:
        emergency_status = is_emergency(q)
        print(f"\nQuery: \"{q}\"")
        print(f"Is Emergency: {emergency_status}")
        if emergency_status:
            print(f"Response: {get_emergency_response(q)['response']}")
