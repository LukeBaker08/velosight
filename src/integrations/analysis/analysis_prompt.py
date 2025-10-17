from fastapi import FastAPI
from src.integrations.analysis.api.llm import router as llm_router

app = FastAPI(title="VeloSight API")
app.include_router(llm_router, prefix="/api")