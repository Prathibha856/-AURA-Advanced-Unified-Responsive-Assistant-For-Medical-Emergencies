"""
Independent test for Stage 5 & Stage 6: End-to-end generation, verification, and triage
"""

import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from rag.pipeline import get_pipeline

def test_pipeline():
    pipeline = get_pipeline()

    print("=" * 70)
    print(" STAGES 5 & 6: END-TO-END GENERATION & VERIFICATION TEST")
    print("=" * 70)

    # Test 1: Anemia symptoms (the original failing query)
    print("\n>> TEST 1: 'What are the symptoms of anemia?'")
    res1 = pipeline.process_query("What are the symptoms of anemia?")

    print("\nRESPONSE:")
    print(res1["response"])
    print(f"\nIs Emergency: {res1['is_emergency']}")
    print(f"Sources ({len(res1['sources'])}):")
    for s in res1["sources"][:3]:
        print(f"  - [{s['qtype']}] {s['question'][:60]}... (dist: {s['distance']})")

    assert res1["is_emergency"] is False
    assert len(res1["sources"]) > 0
    # Must NOT have false refusal
    assert "does not provide any information" not in res1["response"].lower(), "Model gave false refusal!"
    # Must contain actual symptoms or anemia discussion
    assert any(term in res1["response"].lower() for term in ["fatigue", "weakness", "breath", "pale", "headache", "symptom", "anemia"]), "Response lacks symptom information!"
    assert "for informational purposes only" in res1["response"].lower(), "Missing clinical disclaimer!"

    # Test 2: Causes of diabetes
    print("\n" + "=" * 70)
    print(">> TEST 2: 'What causes diabetes?'")
    res2 = pipeline.process_query("What causes diabetes?")
    print("\nRESPONSE:")
    print(res2["response"])
    print(f"\nIs Emergency: {res2['is_emergency']}")
    assert "diabetes" in res2["response"].lower()
    assert any(w in res2["response"].lower() for w in ["insulin", "cause", "body", "pancreas", "sugar", "glucose"])

    # Test 3: Emergency fast triage
    print("\n" + "=" * 70)
    print(">> TEST 3: 'I have severe chest pain and difficulty breathing'")
    res3 = pipeline.process_query("I have severe chest pain and difficulty breathing")
    print("\nRESPONSE:")
    print(res3["response"])
    print(f"\nIs Emergency: {res3['is_emergency']}")
    assert res3["is_emergency"] is True
    assert "emergency" in res3["response"].lower() or "112" in res3["response"]

    print("\n[SUCCESS] Stages 5 & 6 generation, verification, and triage tests passed!")


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    test_pipeline()
