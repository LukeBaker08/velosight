from src.integrations.analysis.services.embedder import embed
from src.integrations.analysis.services.retrieval import query_knn_project_category, query_knn_framework
from src.integrations.analysis.services.merger import compact_snippets
from src.integrations.analysis.services.context_build import build_context_pack
from src.integrations.analysis.services.json_safety import ensure_valid_json
from src.integrations.analysis.prompts.system import SYSTEM_INSTRUCTIONS
from src.integrations.analysis.prompts.user import USER_PROMPT_TEMPLATE
from src.integrations.analysis.config.rag import RAG_CONFIG
from src.integrations.analysis.services.chat import chat_complete

def run_once(task: str, project_id: str, json_schema: str,
             audience: str = "senior officials", tone: str = "professional and concise"):
    q = embed(task)
    k = RAG_CONFIG["k"]

    batches = {
        "project":   query_knn_project_category(q, project_id, "project",   k),
        "context":   query_knn_project_category(q, project_id, "context",   k),
        "sentiment": query_knn_project_category(q, project_id, "sentiment", k),
        "framework": query_knn_framework(q, k),
    }

    sections = compact_snippets(
        batches,
        weights=RAG_CONFIG["weights"],
        min_score=RAG_CONFIG["min_score"],
        max_chars=RAG_CONFIG["max_context_chars"]
    )

    context_pack = build_context_pack(sections, json_schema)
    user = USER_PROMPT_TEMPLATE.format(task=task, project_id=project_id, audience=audience, tone=tone)

    messages = [
        {"role":"system","content": SYSTEM_INSTRUCTIONS},
        {"role":"user","content": user},
        {"role":"user","content": context_pack},
    ]

    raw = chat_complete(messages=messages, response_format={"type":"json_object"}, temperature=0.1, max_tokens=1200)
    return ensure_valid_json(raw)
