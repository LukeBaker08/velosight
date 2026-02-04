# velosight/src/integrations/analysis/rag_service.py
# ---------------------------------------------
# FastAPI app for server-side retrieval-augmented generation.
# - Embeds query (384-dim, MiniLM L6 v2 to match your document_service)
# - Calls Supabase RPCs for 4 sources (project/context/sentiment/framework)
# - Assembles context with citations and budgets length
# - Calls LLM (Ollama) and validates JSON output

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from pydantic import RootModel, BaseModel, Field, ValidationError
from typing import List, Literal, Optional, Dict, Any

import os
import re
import asyncio
import httpx
import json

# -----------------------------
# Settings / Env
# -----------------------------

load_dotenv(dotenv_path=".env.local")

EMBED_DIM = 384
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://localhost:54321")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Missing SUPABASE_SERVICE_ROLE_KEY")

POSTGREST_RPC = f"{SUPABASE_URL}/rest/v1/rpc"
OLLAMA_BASE = os.getenv("OLLAMA_BASE", "http://localhost:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3")  # your chat model
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

# -----------------------------
# App & CORS
# -----------------------------

app = FastAPI(title="VeloSight RAG Service (single-file)", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Clients (shared/pooled)
# -----------------------------

rpc_headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}

rpc = httpx.AsyncClient(base_url=POSTGREST_RPC, headers=rpc_headers, timeout=20.0)
llm = httpx.AsyncClient(base_url=OLLAMA_BASE, timeout=None)

# Same embedder as your document_service.py → guarantees 384 dims
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# -----------------------------
# Schema (replace with YOUR real JSON schema)
# -----------------------------

class Risk(BaseModel):
    id: str
    statement: str
    rating: Literal["Low", "Medium", "High", "Extreme"]
    drivers: List[str] = []
    recommendations: List[str] = []
    citations: List[str] = []


class Output(RootModel[Dict[str, Any]]):
    pass

#class Output(BaseModel):
#    summary: str
#    risks: List[Risk]
#    assumptions: List[str] = []
#    citations: List[str] = []

# -----------------------------
# Helpers
# -----------------------------

UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", re.I)

def is_uuid(s: Optional[str]) -> bool:
    return bool(s and UUID_RE.match(s))

async def embed(text: str) -> List[float]:
    vec = embedder.encode([text])[0].tolist()
    if len(vec) != EMBED_DIM:
        raise ValueError(f"Embedding wrong dimension: {len(vec)} != {EMBED_DIM}")
    return vec

async def call_rpc(fn: str, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    r = await rpc.post(f"/{fn}", json=payload)
    r.raise_for_status()
    return r.json() or []

def pick_top_unique(chunks: List[Dict[str, Any]], limit: int) -> List[Dict[str, Any]]:
    seen_ids, seen_hash = set(), set()
    out: List[Dict[str, Any]] = []
    for c in sorted(chunks, key=lambda x: x.get("similarity", 0.0), reverse=True):
        text = (c.get("content") or "").strip().lower()[:200]
        cid = str(c.get("id"))
        if cid in seen_ids or text in seen_hash:
            continue
        seen_ids.add(cid); seen_hash.add(text)
        out.append(c)
        if len(out) >= limit: break
    return out

def assemble(buckets: Dict[str, List[Dict[str, Any]]], per_k: Dict[str, int], max_chars: int = 10000):
    chosen: List[Dict[str, Any]] = []
    for key in ("project", "context", "sentiment", "framework"):
        chosen += pick_top_unique(buckets.get(key, []), per_k.get(key, 0))

    lines = []
    for c in chosen:
        ref = f"#{c['source']}:{c['id']}"
        score = c.get("similarity", 0.0)
        lines.append(f"[{ref} | score={score:.3f}]\n{c.get('content','')}")
    text = "\n\n---\n\n".join(lines)
    if len(text) > max_chars:
        text = text[:max_chars]

    citations = { f"#{c['source']}:{c['id']}": {"score": c.get("similarity",0.0), "meta": c.get("metadata") or {}} for c in chosen }
    return {"context_text": text, "used": chosen, "citations": citations}

def system_instructions() -> str:
    return (
        "You are an assurance analyst for Australian Government digital programs. "
        "Follow DTA DCA and DoF Gateway principles. "
        "Return JSON only matching the schema. Use [#source:id] in 'citations'. "
        "No extra fields."
    )

def build_user_prompt(project_name: str, question: str, refs: List[str]) -> str:
    return (
        f"Task: Analyse risks for project '{project_name}'.\n"
        f"Question: {question}\n"
        f"Use only the context and cite using these refs: {', '.join(refs[:50])}\n"
        f"Return strictly JSON as per the schema. No text outside JSON."
    )

async def generate_llm(system: str, prompt: str, *, json_mode: bool = False) -> str:
    payload = {
        "model": LLM_MODEL,
        "system": system,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.2 if not json_mode else 0}
    }
    if json_mode:
        payload["format"] = "json"
    r = await llm.post("/api/generate", json=payload)
    r.raise_for_status()
    return r.json().get("response", "")

_MD_FENCE_RE = re.compile(r"^\s*```(?:json)?\s*|\s*```\s*$", re.MULTILINE)

def strip_md_fences(s: str) -> str:
    return _MD_FENCE_RE.sub("", s)

def extract_first_json(s: str) -> str:
    """Return the first balanced JSON object/array substring (or original if none)."""
    s = strip_md_fences(s).strip()
    start_obj, start_arr = s.find("{"), s.find("[")
    starts = [i for i in (start_obj, start_arr) if i != -1]
    if not starts:
        return s
    i = min(starts)
    stack, in_str, esc = [], False, False
    for k, ch in enumerate(s[i:], start=i):
        if in_str:
            if esc: esc = False
            elif ch == "\\": esc = True
            elif ch == '"': in_str = False
            continue
        if ch == '"': in_str = True
        elif ch in "{[": stack.append(ch)
        elif ch in "}]":
            if not stack: break
            open_ch = stack.pop()
            if not stack:
                candidate = s[i:k+1]
                try:
                    json.loads(candidate)
                    return candidate
                except Exception:
                    pass
    return s[i:]

# -----------------------------
# API: analyse
# -----------------------------

async def run_analysis(
    *,
    project_id: Optional[str],
    content: str,
    analysis_type: Optional[str],
    gateway_type: Optional[str],
    session: Optional[str],
    per_source_k: Optional[Dict[str, int]] = None,
    max_chars: int = 10000,
    system_override: Optional[str] = None,
):
    # 1) Embed
    qvec = await embed(content)
    pid = project_id if is_uuid(project_id) else None
    args_common = {"query_embedding": qvec}
    k = per_source_k or {"project":5,"context":3,"sentiment":2,"framework":5}

    # 2) Retrieve (4 RPCs in parallel)
    p = call_rpc("match_project_chunks",   {**args_common, "match_count": k.get("project",5),   "category_filter": "project",  "project_id": pid})
    c = call_rpc("match_project_chunks",   {**args_common, "match_count": k.get("context",3),   "category_filter": "context",  "project_id": pid})
    s = call_rpc("match_project_chunks",   {**args_common, "match_count": k.get("sentiment",2), "category_filter": "sentiment","project_id": pid})
    f = call_rpc("match_framework_chunks", {**args_common, "match_count": k.get("framework",5), "material_filter": None})

    proj, ctx, sent, frm = await asyncio.gather(p, c, s, f)

    def shape(rows, source):
        return [
            {"id": r["id"], "content": r["content"], "metadata": r.get("metadata") or {}, "similarity": r["similarity"], "source": source}
            for r in (rows or [])
        ]
    buckets = {
        "project": shape(proj, "project"),
        "context": shape(ctx, "context"),
        "sentiment": shape(sent, "sentiment"),
        "framework": shape(frm, "framework"),
    }

    # 3) Assemble
    asm = assemble(buckets, k, max_chars)

    # 4) Prompt + LLM (JSON mode) + validate/repair
    system = system_override or system_instructions()
    refs = list(asm["citations"].keys())
    user_prompt = build_user_prompt(
        project_name=str(project_id or ""),
        question=str(content or ""),
        refs=refs
    )
    prompt = f"[CONTEXT]\n{asm['context_text']}\n\n[INSTRUCTIONS]\n{user_prompt}"

    raw = await generate_llm(system, prompt, json_mode=True)
    raw_json_used = None
    try:
        clean  = extract_first_json(raw)
        out    = Output.model_validate_json(clean)
        result = out.root if hasattr(out, "root") else out.model_dump()
        raw_json_used = clean
    except Exception:
        repair = "Return VALID JSON ONLY. No explanations or text outside JSON. Output must be a single JSON object."
        raw2   = await generate_llm(system, repair + "\n\n" + raw, json_mode=True)
        clean2 = extract_first_json(raw2)
        out    = Output.model_validate_json(clean2)
        result = out.root if hasattr(out, "root") else out.model_dump()
        raw_json_used = clean2

    return {
        "meta": {
            "session": session,
            "analysisType": analysis_type,
            "gatewayType": gateway_type,
            "project_id": project_id
        },
        "output": result,
        "usedChunks": asm["used"],
        "rawText": raw_json_used
    }

# -----------------------------
# API: health
# -----------------------------

@app.get("/health")
async def health():
    return {"status": "ok"}

class AnalysePostBody(BaseModel):
    session: Optional[str] = None
    analysisType: Optional[str] = None
    gatewayType: Optional[str] = None
    project_id: Optional[str] = None
    content: str
    perSourceK: Optional[Dict[str, int]] = None
    maxChars: Optional[int] = 10000
    system: Optional[str] = None

@app.post("/analyse")  # alias
async def analyse_post(body: AnalysePostBody):
    return await run_analysis(
        project_id      = body.project_id,
        content         = body.content,
        analysis_type   = body.analysisType,
        gateway_type    = body.gatewayType,
        session         = body.session,
        per_source_k    = body.perSourceK,
        max_chars       = body.maxChars or 10000,
        system_override = body.system
    )