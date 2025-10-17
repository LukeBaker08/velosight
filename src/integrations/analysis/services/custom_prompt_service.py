# services/retrieval_min.py
import os, psycopg2, psycopg2.extras

def get_pg_conn():
    return psycopg2.connect(
        host=os.getenv("PGHOST"),
        port=os.getenv("PGPORT", "5432"),
        user=os.getenv("PGUSER"),
        password=os.getenv("PGPASSWORD"),
        dbname=os.getenv("PGDATABASE", "postgres"),
    )

def query_topk_project(conn, query_embedding, k=5):
    emb_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
    sql = """
      SELECT id, content, metadata, 1 - (embedding <=> %s::vector) AS score
      FROM public.project_vector
      ORDER BY embedding <=> %s::vector
      LIMIT %s;
    """
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql, [emb_str, emb_str, k])
        return cur.fetchall()
