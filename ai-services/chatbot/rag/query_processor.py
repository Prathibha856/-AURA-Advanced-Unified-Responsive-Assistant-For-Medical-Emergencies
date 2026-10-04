"""
rag/query_processor.py - Clinical Query Understanding & Entity Extraction
"""

import re
from dataclasses import dataclass, field
from typing import List, Optional, Set, Dict

# Standard English stop words
STOP_WORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an",
    "and", "any", "are", "aren't", "as", "at", "be", "because", "been",
    "before", "being", "below", "between", "both", "but", "by", "can",
    "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does",
    "doesn't", "doing", "don't", "down", "during", "each", "few", "for",
    "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't",
    "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers",
    "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll",
    "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its",
    "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
    "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
    "ought", "our", "ours", "ourselves", "out", "over", "own", "same",
    "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't",
    "so", "some", "such", "than", "that", "that's", "the", "their", "theirs",
    "them", "themselves", "then", "there", "there's", "these", "they",
    "they'd", "they'll", "they're", "they've", "this", "those", "through",
    "to", "too", "under", "until", "up", "very", "was", "wasn't", "we",
    "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's",
    "when", "when's", "where", "where's", "which", "while", "who", "who's",
    "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you",
    "you'd", "you'll", "you're", "you've", "your", "yours", "yourself",
    "yourselves", "tell", "please", "know", "give"
}

# Mapping of clinical intent phrases to MedQuAD categories
INTENT_PATTERNS: Dict[str, List[str]] = {
    "symptoms": [
        "symptom", "symptoms", "signs", "sign", "presentation", "feel like",
        "manifestation", "manifestations", "how do i know if", "warning signs"
    ],
    "causes": [
        "cause", "causes", "caused by", "etiology", "why do", "why does",
        "reason for", "triggers", "trigger", "origin", "how do you get"
    ],
    "treatment": [
        "treatment", "treatments", "treat", "treated", "cure", "cures",
        "cured", "therapy", "therapies", "medication", "medications",
        "medicine", "medicines", "drugs", "management", "manage", "relieve",
        "remedy", "remedies", "surgery"
    ],
    "exams and tests": [
        "test", "tests", "testing", "exam", "exams", "examination",
        "diagnose", "diagnosis", "diagnostic", "screen", "screening",
        "blood test", "biopsy", "mri", "ct scan", "x-ray", "ultrasound"
    ],
    "prevention": [
        "prevent", "prevention", "preventing", "avoid", "avoiding",
        "reduce risk", "protective", "prophylaxis"
    ],
    "complications": [
        "complication", "complications", "consequences", "risks", "long term",
        "danger", "dangers", "lead to"
    ],
    "inheritance": [
        "inherit", "inheritance", "inherited", "genetic", "genetics",
        "hereditary", "passed down", "family history", "gene", "mutation"
    ],
    "susceptibility": [
        "susceptible", "susceptibility", "who gets", "who is at risk",
        "risk factors", "risk factor", "predisposed", "prone to"
    ],
    "information": [
        "what is", "what are", "define", "definition", "overview", "about",
        "explain", "tell me about"
    ],
    "outlook": [
        "prognosis", "outlook", "life expectancy", "survival rate", "recovery",
        "fatal", "curable"
    ]
}

# Generic words that commonly appear in query phrasing
QUERY_FILLER_WORDS: Set[str] = {
    "what", "which", "who", "when", "where", "why", "how", "are", "is",
    "the", "of", "a", "an", "in", "to", "for", "and", "do", "does", "can",
    "about", "with", "tell", "common", "usually", "often", "someone", "person"
}


@dataclass
class ProcessedQuery:
    original_query: str
    normalized_query: str
    condition: Optional[str] = None
    intents: List[str] = field(default_factory=list)
    symptoms_terms: List[str] = field(default_factory=list)
    causes_terms: List[str] = field(default_factory=list)
    treatment_terms: List[str] = field(default_factory=list)
    diagnostic_terms: List[str] = field(default_factory=list)
    prevention_terms: List[str] = field(default_factory=list)
    complications_terms: List[str] = field(default_factory=list)
    keywords: List[str] = field(default_factory=list)
    expanded_queries: List[str] = field(default_factory=list)


class QueryProcessor:
    """
    Analyzes patient/user queries to extract clinical intents, medical condition terms,
    and structured retrieval cues without destroying conversational phrasing.
    """

    @staticmethod
    def normalize_text(text: str) -> str:
        """Cleans and normalizes query text."""
        cleaned = re.sub(r"[^\w\s\-]", " ", text.lower())
        return re.sub(r"\s+", " ", cleaned).strip()

    def process(self, query: str) -> ProcessedQuery:
        norm_query = self.normalize_text(query)
        words = norm_query.split()

        # 1. Extract intents
        intents = []
        for category, patterns in INTENT_PATTERNS.items():
            for pat in patterns:
                # Word boundary check for phrase or single word
                if re.search(r"\b" + re.escape(pat) + r"\b", norm_query):
                    if category not in intents:
                        intents.append(category)
                    break

        if not intents:
            intents.append("information")

        # 2. Extract keywords (removing standard stop words)
        keywords = [
            w for w in words
            if len(w) > 2 and w not in STOP_WORDS
        ]
        # Preserve order while removing duplicates
        keywords = list(dict.fromkeys(keywords))

        # 3. Categorize specific clinical terms
        symptoms_terms = [w for w in keywords if any(p in w for p in ["symptom", "sign", "pain", "fever", "ache"])]
        causes_terms = [w for w in keywords if any(p in w for p in ["cause", "trigger", "etiol", "origin"])]
        treatment_terms = [w for w in keywords if any(p in w for p in ["treat", "cure", "drug", "med", "therap"])]
        diagnostic_terms = [w for w in keywords if any(p in w for p in ["test", "diagnos", "exam", "scan", "biopsy"])]
        prevention_terms = [w for w in keywords if any(p in w for p in ["prevent", "avoid"])]
        complications_terms = [w for w in keywords if any(p in w for p in ["complicat", "risk", "danger"])]

        # 4. Extract target condition / disease entity
        # By removing intent words and query fillers from keywords
        all_intent_tokens = set()
        for patterns in INTENT_PATTERNS.values():
            for pat in patterns:
                for token in pat.split():
                    all_intent_tokens.add(token)

        condition_tokens = [
            w for w in keywords
            if w not in all_intent_tokens and w not in QUERY_FILLER_WORDS
        ]

        condition = " ".join(condition_tokens) if condition_tokens else None

        # 5. Build expanded query variations for dual dense + lexical search
        expanded = [query]
        if condition:
            expanded.append(condition)
            for intent in intents[:2]:
                expanded.append(f"{condition} {intent}")

        return ProcessedQuery(
            original_query=query,
            normalized_query=norm_query,
            condition=condition,
            intents=intents,
            symptoms_terms=symptoms_terms,
            causes_terms=causes_terms,
            treatment_terms=treatment_terms,
            diagnostic_terms=diagnostic_terms,
            prevention_terms=prevention_terms,
            complications_terms=complications_terms,
            keywords=keywords,
            expanded_queries=list(dict.fromkeys(expanded))
        )
