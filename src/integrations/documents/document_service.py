# =============================================
# Document Management API (Velosight)
# ---------------------------------------------
# FastAPI service for project documents and framework materials.
# Handles uploads (file or pointer), downloads from Supabase Storage,
# vector embedding, metadata storage, and deletion endpoints.
# =============================================


# --- Storage Download Helper ---
def _normalize_path(path: str) -> str:
    """
    Normalize a storage path by removing leading slashes.
    """
    return (path or "").lstrip("/")


# --- Imports & Setup ---
# FastAPI: Web framework for API endpoints
# SentenceTransformer: Used for text embedding (vectorization)
# Supabase: Client for database and storage operations
# Logging: For request and error tracking

from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from supabase import create_client
from dotenv import load_dotenv
from typing import Optional
from fastapi import File
import os
import logging


# =============================
# LOAD ENV VARS
# =============================

load_dotenv(dotenv_path=".env.local")

SUPABASE_URL = os.getenv("SUPABASE_URL", "http://localhost:54321")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("❌ Missing SUPABASE_SERVICE_ROLE_KEY in local.env")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
model = SentenceTransformer("all-MiniLM-L6-v2")

app = FastAPI(title="Document Management API", version="0.3.0")

logger = logging.getLogger(__name__)

# =============================
# CORS CONFIG
# =============================

origins = [
    "http://localhost:8080",   # Vite dev server (your setup)
    "http://127.0.0.1:8080"
    # add your production frontend domain here later
    # "https://app.fidere.au"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # change to ["*"] if you want wide-open dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================
# HELPER: download from Supabase Storage
# =============================

def _download_from_storage(bucket: str, path: str, attempts: int = 4, delay: float = 0.25) -> bytes:
    """
    Robustly download a file from Supabase Storage, with retries and logging.
    """
    path = _normalize_path(path)
    last_err = None
    for i in range(attempts):
        try:
            logger.info(f"[STORAGE] attempt {i+1}/{attempts} download bucket='{bucket}' path='{path}'")
            data = supabase.storage.from_(bucket).download(path)
            return data
        except Exception as e:
            last_err = e
            time.sleep(delay)
    raise HTTPException(status_code=404, detail=f"Storage download failed: bucket='{bucket}', path='{path}', err={last_err}")

# =============================
# PROJECT DOCUMENTS
# =============================

@app.post("/documents/project/upload")
async def upload_project_document(
    file: UploadFile | None = File(None),
    project_id: str = Form(...),
    document_id: str = Form(...),
    category: str = Form(...),
    type: str = Form(...),
    uploader_id: str = Form(...),
    name: str = Form(...),
    file_path: str | None = Form(None),
    bucket: str | None = Form("documents"),
):
    logger.info(
        f"[REQ] /documents/project/upload "
        f"project_id={project_id} document_id={document_id} "
        f"category={category} type={type} uploader_id={uploader_id} "
        f"name={name} bucket={bucket} file_present={file is not None} file_path={file_path}"
    )

    if file is not None:
        raw = await file.read()
        pointer = None
        source_bucket = bucket or "documents"
    else:
        if not file_path:
            raise HTTPException(status_code=422, detail="Provide either file or file_path")
        source_bucket = bucket or "documents"
        raw = _download_from_storage(source_bucket, file_path)
        pointer = _normalize_path(file_path)

    text = raw.decode("utf-8", errors="ignore")
    emb = model.encode([text])[0].tolist()

    res = supabase.table("project_vector").insert({
        "content": text,
        "embedding": emb,
        "metadata": {
            "project_id": project_id,
            "document_id": document_id,
            "category": category,
            "type": type,
            "uploader_id": uploader_id,
            "name": name,
            "file_path": pointer,
            "bucket": source_bucket,
        }
    }).execute()

    mode = "file" if file is not None else "pointer"
    logger.info(f"[OK] mode={mode} inserted={len(res.data)} for document_id={document_id}")
    return {"status": "ok", "mode": mode, "inserted": len(res.data)}

class DeleteProjectBody(BaseModel):
    document_id: str

@app.delete("/documents/project/delete")
def delete_project_document(body: DeleteProjectBody):
    res = supabase.table("project_vector") \
        .delete() \
        .filter("metadata->>document_id", "eq", body.document_id) \
        .execute()
    return {"status": "ok", "deleted": len(res.data)}

# =============================
# FRAMEWORK MATERIALS
# =============================

@app.post("/documents/framework/upload")
async def upload_framework_document(
    file: UploadFile | None = File(None),
    document_id: str = Form(...),
    type: str = Form(...),
    uploader_id: str = Form(...),
    name: str = Form(...),
    file_path: str | None = Form(None),
    bucket: str | None = Form("materials"),  # framework default bucket remains different
):
    logger.info(
        f"[REQ] /documents/framework/upload "
        f"document_id={document_id} type={type} uploader_id={uploader_id} "
        f"name={name} bucket={bucket} file_present={file is not None} file_path={file_path}"
    )

    source_bucket = bucket or "materials"  # consistent calculation up front

    if file is not None:
        raw = await file.read()
        pointer = None
    else:
        if not file_path:
            raise HTTPException(status_code=422, detail="Provide either file or file_path")
        # normalize pointer consistently with project route
        normalized_path = _normalize_path(file_path)
        raw = _download_from_storage(source_bucket, normalized_path)
        pointer = normalized_path

    text = raw.decode("utf-8", errors="ignore")
    emb = model.encode([text])[0].tolist()

    res = supabase.table("framework_vector").insert({
        "content": text,
        "embedding": emb,
        "metadata": {
            # Framework-specific fields
            "document_id": document_id,
            "type": type,
            "uploader_id": uploader_id,
            "name": name,
            "file_path": pointer,
            "bucket": source_bucket,
        }
    }).execute()

    mode = "file" if file is not None else "pointer"
    logger.info(f"[OK] mode={mode} inserted={len(res.data)} for document_id={document_id}")

    # Keep payload intentionally different from project by including 'table'
    return {"status": "ok", "mode": mode, "table": "framework_vector", "inserted": len(res.data)}

class DeleteFrameworkBody(BaseModel):
    document_id: str

@app.delete("/documents/framework/delete")
def delete_framework_document(body: DeleteFrameworkBody):
    res = supabase.table("framework_vector") \
        .delete() \
        .filter("metadata->>document_id", "eq", body.document_id) \
        .execute()
    
    # payload still different from project (includes 'table')
    
    return {"status": "ok", "table": "framework_vector", "deleted": len(res.data)}