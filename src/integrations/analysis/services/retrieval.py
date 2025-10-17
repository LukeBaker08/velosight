
from typing import List, Dict, Any
from src.integrations.analysis.services.db import get_pg_conn, DictCursor

def _emb_str(vec: List[float]) -> str:
    return "[" + ",".join(f"{x:.6f}" for x in vec) + "]"

def query_knn_project_category(query_embedding: List[float], project_id: str, category: str, k: int = 6):
    emb = _emb_str(query_embedding)
    sql = """
      SELECT id, content, metadata, 1 - (embedding <=> %s::vector) AS score
      FROM public.project_vector
      WHERE (metadata->>'project_id') = %s
        AND (metadata->>'category') = %s
      ORDER BY embedding <=> %s::vector
      LIMIT %s;
    """
    with get_pg_conn() as conn, conn.cursor(cursor_factory=DictCursor) as cur:
        cur.execute(sql, [emb, project_id, category, emb, k])
        return cur.fetchall()

def query_knn_framework(query_embedding: List[float], k: int = 6, type_filter: str | None = None):
    emb = _emb_str(query_embedding)
    where = ""
    params = [emb, emb]
    if type_filter:
        where = "WHERE (metadata->>'type') = %s"
        params.append(type_filter)
    sql = f"""
      SELECT id, content, metadata, 1 - (embedding <=> %s::vector) AS score
      FROM public.framework_materials
      {where}
      ORDER BY embedding <=> %s::vector
      LIMIT {k};
    """
    with get_pg_conn() as conn, conn.cursor(cursor_factory=DictCursor) as cur:
        cur.execute(sql, params)
        return cur.fetchall()
