RAG_CONFIG = {
    "k": 6,                       # per-source k
    "max_context_chars": 9000,    # total budget to the LLM
    "weights": {
        "project": 1.0,
        "context": 0.9,
        "sentiment": 0.6,
        "framework": 0.85,
    },
    "min_score": 0.20,
}