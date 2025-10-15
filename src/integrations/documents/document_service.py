from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from supabase import create_client
from dotenv import load_dotenv
from typing import Optional
from fastapi import File
import os




###temp logging


import logging, time, os
logger = logging.getLogger("rag")
logging.basicConfig(level=logging.INFO)

def _normalize_path(path: str) -> str:
    return (path or "").lstrip("/")

def _download_from_storage(bucket: str, path: str, attempts: int = 4, delay: float = 0.25) -> bytes:
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
    # raise with explicit context
    raise HTTPException(status_code=404, detail=f"Storage download failed: bucket='{bucket}', path='{path}', err={last_err}")


#####-----




# =============================
# Load env vars
# =============================

load_dotenv(dotenv_path=".env.local")

SUPABASE_URL = os.getenv("SUPABASE_URL", "http://localhost:54321")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("❌ Missing SUPABASE_SERVICE_ROLE_KEY in local.env")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
model = SentenceTransformer("all-MiniLM-L6-v2")

app = FastAPI(title="Document Management API", version="0.3.0")

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


# --- helper: download from Supabase Storage ---
def _download_from_storage(bucket: str, path: str) -> bytes:
    """
    Download bytes from Supabase Storage (private or public bucket).
    supabase-py v2: storage.from_(bucket).download(path) -> bytes
    """
    if not bucket or not path:
        raise HTTPException(status_code=400, detail="Missing bucket or file_path")
    try:
        data = supabase.storage.from_(bucket).download(path)
        return data  # bytes
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Storage download failed: {e}")



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
        filename = file.filename
        pointer = None
        source_bucket = bucket or "documents"
    else:
        if not file_path:
            raise HTTPException(status_code=422, detail="Provide either file or file_path")
        source_bucket = bucket or "documents"
        # 👇 this will log each attempt and the exact bucket/key
        raw = _download_from_storage(source_bucket, file_path)
        filename = os.path.basename(_normalize_path(file_path))
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
            "filename": filename,
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
    file: Optional[UploadFile] = File(None),
    document_id: str = Form(...),
    type: str = Form(...),
    uploader_id: str = Form(...),
    title: str = Form(...),
    file_path: Optional[str] = Form(None),   # NEW
    bucket: Optional[str] = Form("materials")
):
    if file is not None:
        raw = await file.read()
        filename = file.filename
        pointer = None
        source_bucket = bucket or "materials"
    else:
        if not file_path:
            raise HTTPException(status_code=422, detail="Provide either file or file_path")
        raw = _download_from_storage(bucket or "materials", file_path)
        filename = os.path.basename(file_path)
        pointer = file_path
        source_bucket = bucket or "materials"

    text = raw.decode("utf-8", errors="ignore")
    emb = model.encode([text])[0].tolist()

    res = supabase.table("framework_materia_data").insert({
        "content": text,
        "embedding": emb,
        "metadata": {
            "document_id": document_id,
            "type": type,
            "uploader_id": uploader_id,
            "title": title,
            "filename": filename,
            "file_path": pointer,
            "bucket": source_bucket,
        }
    }).execute()

    mode = "file" if file is not None else "pointer"
    return {"status": "ok", "mode": mode, "table": "framework_materia_data", "inserted": len(res.data)}

class DeleteFrameworkBody(BaseModel):
    document_id: str

@app.delete("/documents/framework/delete")
def delete_framework_document(body: DeleteFrameworkBody):
    res = supabase.table("framework_materia_data") \
        .delete() \
        .filter("metadata->>document_id", "eq", body.document_id) \
        .execute()
    return {"status": "ok", "deleted": len(res.data)}
