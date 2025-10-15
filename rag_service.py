# rag_service.py
from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from supabase import create_client
from dotenv import load_dotenv
import os, requests

# Load variables from .env.local (project root)
load_dotenv(dotenv_path=".env.local")

# Supabase configs
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://localhost:54321")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("❌ Missing SUPABASE_SERVICE_ROLE_KEY in local.env")

# LLM config
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")

# Init clients
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
model = SentenceTransformer("all-MiniLM-L6-v2")

app = FastAPI(title="VeloSight RAG API", version="0.1.0")

# CORS so your frontend (Vite @5173) can call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Body for query requests
class QueryBody(BaseModel):
    question: str
    match_count: int | None = 3


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload_file(file: UploadFile, metadata: str = Form("{}")):
    # Limit to text files for now
    if not file.filename.lower().endswith((".txt", ".md")):
        raise HTTPException(status_code=400, detail="Only .txt/.md supported")

    text = (await file.read()).decode("utf-8", errors="ignore")
    emb = model.encode([text])[0].tolist()

    res = supabase.table("project_vector").insert({
        "content": text,
        "embedding": emb,
        "metadata": metadata
    }).execute()

    return {
        "status": "ok",
        "filename": file.filename,
        "inserted": len(res.data),
    }


@app.post("/query")
def query(body: QueryBody):
    q_emb = model.encode([body.question])[0].tolist()

    # Vector search from project_vector table
    docs = supabase.rpc(
        "match_project_vectors",
        {"query_embedding": q_emb, "match_count": body.match_count or 3}
    ).execute()

    context = "\n\n".join([d["content"] for d in (docs.data or [])])

    # Call Ollama LLM
    payload = {
        "model": "llama3",
        "prompt": f"Use the context below to answer.\n\nCONTEXT:\n{context}\n\nQUESTION: {body.question}\nANSWER:",
        "stream": False
    }

    r = requests.post(OLLAMA_URL, json=payload, timeout=120)
    r.raise_for_status()
    out = r.json()

    return {
        "matches": docs.data or [],
        "answer": out.get("response", "")
    }
