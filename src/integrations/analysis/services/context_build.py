from src.integrations.analysis.prompts.context_pack import CONTEXT_PACK_TEMPLATE

def build_context_pack(sections: dict[str, list[str]], json_schema: str) -> str:
    return CONTEXT_PACK_TEMPLATE.format(
        project_chunks="\n\n".join(sections.get("project", [])),
        context_chunks="\n\n".join(sections.get("context", [])),
        sentiment_chunks="\n\n".join(sections.get("sentiment", [])),
        framework_chunks="\n\n".join(sections.get("framework", [])),
        json_schema=json_schema,
    )
