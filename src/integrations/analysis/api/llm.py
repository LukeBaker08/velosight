from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.pipeline_min import run_once

router = APIRouter()

class LLMRequest(BaseModel):
    task: str
    project_id: str
    json_schema: str
    audience: str | None = "senior officials"
    tone: str | None = "professional and concise"

@router.post("/llm/answer")
def llm_answer(req: LLMRequest):
    try:
        return run_once(req.task, req.project_id, req.json_schema, req.audience, req.tone)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
