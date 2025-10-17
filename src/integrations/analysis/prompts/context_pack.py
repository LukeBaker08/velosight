CONTEXT_PACK_TEMPLATE = """=== CONTEXT PACK START ===
[PROJECT]
{project_chunks}

[CONTEXT]
{context_chunks}

[SENTIMENT]
{sentiment_chunks}

[FRAMEWORK / BETTER PRACTICE]
{framework_chunks}
=== CONTEXT PACK END ===

JSON Schema (authoritative — must conform exactly):
{json_schema}
"""
