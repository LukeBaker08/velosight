USER_PROMPT_TEMPLATE = """Task: {task}

Project scope:
- project_id: {project_id}
- audience: {audience}
- tone: {tone}

Constraints:
- Only use the Context Pack below.
- Output must be valid JSON matching the schema."""
